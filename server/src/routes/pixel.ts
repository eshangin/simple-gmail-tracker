import { Router, Request, Response } from "express";
import { ReadingsRepository } from "../db/ReadingsRepository";

const router = Router();
const readingsRepo = new ReadingsRepository();

/**
 * Minimal 1×1 transparent GIF (43 bytes).
 * Pre-built as a Buffer to avoid allocating on every request.
 */
const TRANSPARENT_GIF = Buffer.from(
    "47494638396101000100800000ffffff00000021f90400000000002c00000000010001000002024401003b",
    "hex",
);

/**
 * GET /pixel
 * Returns a 1×1 transparent GIF tracking pixel.
 * Caching is disabled so every open registers a hit on the server.
 */
router.get("/pixel", (req: Request, res: Response) => {
    const { id, who } = req.query as { id?: string; who?: string };

    console.log("[SGT] Tracking pixel hit:");
    console.log("  id:  ", id ?? "(missing)");
    console.log("  who: ", who ?? "(missing)");

    if (id && who) {
        readingsRepo.insertFromPixelHit(id, who);
    }

    res.set({
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
    });

    res.status(200).end(TRANSPARENT_GIF);
});

export default router;
