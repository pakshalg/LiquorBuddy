import { Router } from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/inventory/store/:storeId?category=&inStock=&q=
router.get('/store/:storeId', async (req, res) => {
  try {
    const { category, inStock, q } = req.query;

    const inventory = await prisma.storeInventory.findMany({
      where: {
        storeId: req.params.storeId,
        ...(inStock === 'true' ? { inStock: true } : {}),
        ...(inStock === 'false' ? { inStock: false } : {}),
        product: {
          isActive: true,
          ...(q ? { name: { contains: String(q) } } : {}),
          ...(category ? { category: { slug: String(category) } } : {}),
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: [{ featured: 'desc' }, { product: { name: 'asc' } }],
    });

    return res.json(inventory);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory/:id — single inventory item
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.storeInventory.findUnique({
      where: { id: req.params.id },
      include: { product: { include: { category: true } }, store: true },
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory — add product to store
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { storeId, productId, quantity, price, featured } = req.body;
    const item = await prisma.storeInventory.create({
      data: {
        storeId,
        productId,
        quantity,
        price,
        featured: featured ?? false,
        inStock: quantity > 0,
      },
      include: { product: { include: { category: true } } },
    });

    io.to(`store:${storeId}`).emit('inventory:update', item);

    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/inventory/:id — update stock level
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { quantity, price, featured } = req.body;

    const updates: Record<string, unknown> = {};
    if (quantity !== undefined) {
      updates.quantity = quantity;
      updates.inStock = quantity > 0;
    }
    if (price !== undefined) updates.price = price;
    if (featured !== undefined) updates.featured = featured;

    const item = await prisma.storeInventory.update({
      where: { id: req.params.id },
      data: updates,
      include: { product: { include: { category: true } }, store: true },
    });

    // Emit real-time update to all clients watching this store
    io.to(`store:${item.storeId}`).emit('inventory:update', item);

    // If back in stock, notify users with alerts
    if (updates.inStock === true) {
      const alerts = await prisma.inventoryAlert.findMany({
        where: { productId: item.productId, type: 'back_in_stock', notified: false },
        include: { user: true },
      });
      for (const alert of alerts) {
        io.to(`user:${alert.userId}`).emit('alert:back_in_stock', {
          product: item.product,
          store: item.store,
        });
        await prisma.inventoryAlert.update({ where: { id: alert.id }, data: { notified: true } });
      }
    }

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.storeInventory.delete({ where: { id: req.params.id } });
    io.to(`store:${item.storeId}`).emit('inventory:removed', { id: item.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
