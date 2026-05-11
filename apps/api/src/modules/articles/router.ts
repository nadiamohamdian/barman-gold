import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, message: 'Articles router working' });
});

export default router;
