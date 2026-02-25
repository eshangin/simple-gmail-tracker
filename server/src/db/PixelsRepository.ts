import db from "./database";

export interface PixelRecord {
    id: string;
    who: string;
    threadId: string;
    createdAt: string;
}

db.exec(`
    CREATE TABLE IF NOT EXISTS Pixels (
        id        TEXT    PRIMARY KEY,
        who       TEXT    NOT NULL,
        threadId  TEXT    NOT NULL,
        createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    )
`);

export class PixelsRepository {
    insert(pixel: Omit<PixelRecord, "createdAt">): void {
        const stmt = db.prepare(`
            INSERT INTO Pixels (id, who, threadId)
            VALUES (@id, @who, @threadId)
        `);
        // Ensure we pass a shape matching the INSERT parameters
        stmt.run({ id: pixel.id, who: pixel.who, threadId: pixel.threadId });
    }

    findById(id: string): PixelRecord | undefined {
        const stmt = db.prepare(`SELECT * FROM Pixels WHERE id = ?`);
        return stmt.get(id) as PixelRecord | undefined;
    }

    findByIdAndWho(id: string, who: string): PixelRecord | undefined {
        const stmt = db.prepare(`SELECT * FROM Pixels WHERE id = ? AND who = ?`);
        return stmt.get(id, who) as PixelRecord | undefined;
    }

    findByThreadIdsAndWho(threadIds: string[], who: string): PixelRecord[] {
        if (threadIds.length === 0) return [];
        const placeholders = threadIds.map(() => "?").join(", ");
        const stmt = db.prepare(
            `SELECT * FROM Pixels WHERE who = ? AND threadId IN (${placeholders})`
        );
        return stmt.all(who, ...threadIds) as PixelRecord[];
    }
}
