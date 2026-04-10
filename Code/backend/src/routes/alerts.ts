import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/alerts — user's active alerts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await prisma.inventoryAlert.findMany({
      where: { userId: req.userId! },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/alerts — subscribe to back-in-stock / new arrival alerts
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, type = 'back_in_stock' } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const alert = await prisma.inventoryAlert.upsert({
      where: { userId_productId_type: { userId: req.userId!, productId, type } },
      create: { userId: req.userId!, productId, type },
      update: { notified: false }, // re-subscribe if previously notified
      include: { product: true },
    });
    return res.status(201).json(alert);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const alert = await prisma.inventoryAlert.findUnique({ where: { id: req.params.id } });
    if (!alert || alert.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
    await prisma.inventoryAlert.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
