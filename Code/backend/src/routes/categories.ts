import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/categories
router.get('/', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
