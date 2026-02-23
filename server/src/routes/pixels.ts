import { Router, Request, Response } from "express";

const router = Router();

interface RegisterPixelBody {
    id: string;
    who: string;
    messageId: string;
    threadId: string;
}

interface ByMessagesBody {
    threadIds: string[];
    who: string;
}

/**
 * POST /api/pixels
 * Registers a new tracking pixel. Logs the received parameters to the console.
 */
router.post("/pixels", (req: Request<{}, {}, RegisterPixelBody>, res: Response) => {
    const { id, who, messageId, threadId } = req.body;

    console.log("[SGT] Tracking pixel registered:");
    console.log("  id:        ", id);
    console.log("  who:       ", who);
    console.log("  messageId: ", messageId);
    console.log("  threadId:  ", threadId);

    res.status(201).json({ ok: true });
});

/**
 * POST /api/pixels/by-messages
 * Returns tracking status for each provided thread ID.
 * `read` is currently randomised as a placeholder.
 */
router.post("/pixels/by-messages", (req: Request<{}, {}, ByMessagesBody>, res: Response) => {
    const { threadIds } = req.body;

    const result = (threadIds ?? []).map((threadId) => ({
        threadId,
        read: Math.random() < 0.5,
    }));

    res.status(200).json(result);
});

export default router;
