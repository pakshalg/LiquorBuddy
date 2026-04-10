import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products?category=&q=
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: String(q), mode: 'insensitive' } } : {}),
        ...(category ? { category: { slug: String(category) } } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products — admin only
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, brand, description, size, abv, type, country, categoryId } = req.body;
    if (!name || !brand || !size || !categoryId) {
      return res.status(400).json({ error: 'name, brand, size, and categoryId are required' });
    }
    const product = await prisma.product.create({
      data: { name, brand, description, size, abv, type, country, categoryId },
      include: { category: true },
    });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
