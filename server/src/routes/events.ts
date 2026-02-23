import { Router, Request, Response } from "express";
import { readingEvents, ReadingEvent } from "../events/readingEvents";

const router = Router();

/**
 * GET /api/events
 * Server-Sent Events stream. Pushes a "reading" event to the client
 * whenever a new Reading is recorded, so the extension can update its
 * UI in real time without polling.
 *
 * Caching is disabled; the connection is kept alive until the client
 * disconnects.
 */
router.get("/events", (req: Request, res: Response) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in Nginx proxies
    });
    res.flushHeaders();

    // Send an initial comment so the client knows the connection is open.
    res.write(": connected\n\n");

    const listener = (event: ReadingEvent): void => {
        res.write(`event: reading\ndata: ${JSON.stringify(event)}\n\n`);
    };

    readingEvents.onReading(listener);

    req.on("close", () => {
        readingEvents.offReading(listener);
    });
});

export default router;
