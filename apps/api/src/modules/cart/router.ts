import { Router } from 'express';

const router = Router();

// GET /v1/cart/mini - Mini cart data for header
router.get('/mini', async (req, res) => {
  try {
    // For now, return stub data with sample items
    // Later this will be connected to real cart sessions and Redis
    res.json({
      count: 2,
      subtotal: 6300000,
      currency: "تومان",
      items: [
        {
          id: "1",
          title: "دستبند طلا",
          variant: "وزن: 3.5 گرم",
          price: 2500000,
          quantity: 1,
          thumbnail: "/images/products/download.jpg"
        },
        {
          id: "2", 
          title: "گردنبند طلا",
          variant: "وزن: 5.2 گرم",
          price: 3800000,
          quantity: 1,
          thumbnail: "/images/products/download.jpg"
        }
      ]
    });
  } catch (error) {
    req.log.error(error, 'Error fetching cart mini data');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/cart - Full cart data
router.get('/', async (req, res) => {
  try {
    res.json({
      count: 2,
      subtotal: 6300000,
      shipping: 0,
      total: 6300000,
      currency: "تومان",
      items: [
        {
          id: "1",
          title: "دستبند طلا",
          variant: "وزن: 3.5 گرم",
          price: 2500000,
          quantity: 1,
          thumbnail: "/images/products/download.jpg",
          available: true
        },
        {
          id: "2",
          title: "گردنبند طلا", 
          variant: "وزن: 5.2 گرم",
          price: 3800000,
          quantity: 1,
          thumbnail: "/images/products/download.jpg",
          available: true
        }
      ]
    });
  } catch (error) {
    req.log.error(error, 'Error fetching cart data');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


