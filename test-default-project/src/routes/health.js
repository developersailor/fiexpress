import express from 'express';
import { HealthController } from '../health/health.controller';

const router = express.Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 checks:
 *                   type: object
 *       503:
 *         description: Application is unhealthy
 */
router.get('/', healthController.getHealth);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Check if application is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *       503:
 *         description: Application is not ready
 */
router.get('/ready', healthController.getReadiness);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Check if application is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 */
router.get('/live', healthController.getLiveness);

export default router;