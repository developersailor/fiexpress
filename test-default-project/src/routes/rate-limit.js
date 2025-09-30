import express from 'express';
import { basicRateLimit, authRateLimit, apiRateLimit } from '../middleware/rate-limit.middleware';

const router = express.Router();

/**
 * @swagger
 * /rate-limit/status:
 *   get:
 *     summary: Get rate limit status
 *     tags: [Rate Limit]
 *     responses:
 *       200:
 *         description: Rate limit status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: active
 *                 limits:
 *                   type: object
 *                   properties:
 *                     basic:
 *                       type: object
 *                     auth:
 *                       type: object
 *                     api:
 *                       type: object
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    limits: {
      basic: {
        windowMs: 15 * 60 * 1000,
        max: 100
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      api: {
        windowMs: 1 * 60 * 1000,
        max: 60
      }
    }
  });
});

// Apply rate limiting to all routes
router.use(basicRateLimit);

export default router;