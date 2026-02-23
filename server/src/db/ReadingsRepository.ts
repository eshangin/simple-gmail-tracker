import { randomUUID } from "crypto";
import db from "./database";
import { PixelsRepository } from "./PixelsRepository";

export interface ReadingRecord {
    id: string;
    pixelId: string;
    threadId: string;
    who: string;
    createdAt: string;
}

db.exec(`
    CREATE TABLE IF NOT EXISTS Readings (
        id        TEXT    PRIMARY KEY,
        pixelId   TEXT    NOT NULL,
        threadId  TEXT    NOT NULL,
        who       TEXT    NOT NULL,
        createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    )
`);

const pixelsRepository = new PixelsRepository();

export class ReadingsRepository {
    /**
     * Looks up the Pixel by pixelId + who to resolve the threadId,
     * then inserts a new Reading. Returns the new record, or null
     * if no matching Pixel was found.
     */
    insertFromPixelHit(pixelId: string, who: string): ReadingRecord | null {
        const pixel = pixelsRepository.findByIdAndWho(pixelId, who);
        if (!pixel) {
            console.log(`[SGT] No pixel found for id=${pixelId} who=${who} — reading not saved.`);
            return null;
        }

        const id = randomUUID();
        const stmt = db.prepare(`
            INSERT INTO Readings (id, pixelId, threadId, who)
            VALUES (@id, @pixelId, @threadId, @who)
        `);
        stmt.run({ id, pixelId, threadId: pixel.threadId, who });

        return { id, pixelId, threadId: pixel.threadId, who, createdAt: new Date().toISOString() };
    }
}
