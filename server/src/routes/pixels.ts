import { Router, Request, Response } from "express";

const router = Router();

interface RegisterPixelBody {
    id: string;
    who: string;
    messageId: string;
}

/**
 * POST /api/pixel
 * Registers a new tracking pixel. Logs the received parameters to the console.
 */
router.post("/pixels", (req: Request<{}, {}, RegisterPixelBody>, res: Response) => {
    const { id, who, messageId } = req.body;

    console.log("[SGT] Tracking pixel registered:");
    console.log("  id:        ", id);
    console.log("  who:       ", who);
    console.log("  messageId: ", messageId);

    res.status(201).json({ ok: true });
});

export default router;
