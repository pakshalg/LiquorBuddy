import { Router } from 'express';
import { prisma } from '../index';
import { getDistanceMiles } from '../services/distance';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stores?lat=&lng=&radius=&q=
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = '10', q } = req.query;

    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: String(q) } } : {}),
      },
      include: {
        inventory: { select: { id: true } },
        _count: { select: { inventory: true } },
      },
    });

    let results = stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zip: store.zip,
      phone: store.phone,
      lat: store.lat,
      lng: store.lng,
      imageUrl: store.imageUrl,
      description: store.description,
      hours: store.hours,
      rating: store.rating,
      reviewCount: store.reviewCount,
      productCount: store._count.inventory,
      distance: null as number | null,
    }));

    if (lat && lng) {
      const userLat = parseFloat(String(lat));
      const userLng = parseFloat(String(lng));
      const maxRadius = parseFloat(String(radius));

      results = results
        .map((s) => ({
          ...s,
          distance: getDistanceMiles(userLat, userLng, s.lat, s.lng),
        }))
        .filter((s) => s.distance! <= maxRadius)
        .sort((a, b) => a.distance! - b.distance!);
    }

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stores/:id
router.get('/:id', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { inventory: true, orders: true } },
      },
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    return res.json(store);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stores — admin only
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, address, city, state, zip, phone, lat, lng, imageUrl, description, hours } = req.body;
    const store = await prisma.store.create({
      data: { name, address, city, state, zip, phone, lat, lng, imageUrl, description, hours },
    });
    return res.status(201).json(store);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/stores/:id — admin only
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(store);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
