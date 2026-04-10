import { Router } from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const TAX_RATE = 0.0875;
const DELIVERY_FEE = 4.99;

// POST /api/orders — create an order
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { storeId, items, address, notes } = req.body;
    // items: [{ inventoryId, quantity }]

    if (!storeId || !items?.length) {
      return res.status(400).json({ error: 'storeId and items are required' });
    }

    // Fetch inventory for all items in one query
    const inventoryIds: string[] = items.map((i: { inventoryId: string }) => i.inventoryId);
    const inventoryItems = await prisma.storeInventory.findMany({
      where: { id: { in: inventoryIds }, storeId },
      include: { product: true },
    });

    if (inventoryItems.length !== items.length) {
      return res.status(400).json({ error: 'Some items are not available at this store' });
    }

    // Check stock
    const outOfStock = inventoryItems.filter((inv) => !inv.inStock || inv.quantity === 0);
    if (outOfStock.length) {
      return res.status(400).json({
        error: 'Some items are out of stock',
        items: outOfStock.map((i) => i.product.name),
      });
    }

    // Calculate totals
    const invMap = new Map(inventoryItems.map((i) => [i.id, i]));
    const orderItemsData = items.map((i: { inventoryId: string; quantity: number }) => {
      const inv = invMap.get(i.inventoryId)!;
      return { productId: inv.productId, quantity: i.quantity, price: inv.price };
    });

    const subtotal = orderItemsData.reduce(
      (sum: number, i: { quantity: number; price: number }) => sum + i.quantity * i.price,
      0
    );
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax + DELIVERY_FEE).toFixed(2));

    // Create order + decrement inventory in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.userId!,
          storeId,
          subtotal,
          tax,
          deliveryFee: DELIVERY_FEE,
          total,
          address,
          notes,
          items: { create: orderItemsData },
        },
        include: {
          items: { include: { product: true } },
          store: true,
          user: { select: { name: true, email: true } },
        },
      });

      // Decrement inventory
      for (const item of items as { inventoryId: string; quantity: number }[]) {
        const inv = invMap.get(item.inventoryId)!;
        const newQty = Math.max(0, inv.quantity - item.quantity);
        await tx.storeInventory.update({
          where: { id: item.inventoryId },
          data: { quantity: newQty, inStock: newQty > 0 },
        });
      }

      return newOrder;
    });

    // Notify store via socket
    io.to(`store:${storeId}`).emit('order:new', order);

    return res.status(201).json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders — user's orders (admin: ?all=true returns all orders)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.userRole === 'admin' || req.userRole === 'store_owner';
    const fetchAll = isAdmin && req.query.all === 'true';

    const orders = await prisma.order.findMany({
      where: fetchAll ? {} : { userId: req.userId },
      include: {
        items: { include: { product: true } },
        store: { select: { id: true, name: true, address: true } },
        ...(fetchAll ? { user: { select: { id: true, name: true, email: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        store: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.userId && req.userRole === 'customer') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status — admin/store only
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { id: true } } },
    });
    io.to(`user:${order.user.id}`).emit('order:status', { orderId: order.id, status });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
