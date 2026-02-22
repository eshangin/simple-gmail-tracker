import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/ping
 * Health check — returns pong and the current server timestamp.
 */
router.get("/ping", (_req: Request, res: Response) => {
    res.json({ message: "pong", timestamp: new Date().toISOString() });
});

export default router;
