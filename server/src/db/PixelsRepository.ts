import db from "./database";

export interface PixelRecord {
    id: string;
    who: string;
    messageId: string;
    threadId: string;
    createdAt: string;
}

db.exec(`
    CREATE TABLE IF NOT EXISTS Pixels (
        id        TEXT    PRIMARY KEY,
        who       TEXT    NOT NULL,
        messageId TEXT    NOT NULL,
        threadId  TEXT    NOT NULL,
        createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    )
`);

export class PixelsRepository {
    insert(pixel: Omit<PixelRecord, "createdAt">): void {
        const stmt = db.prepare(`
            INSERT INTO Pixels (id, who, messageId, threadId)
            VALUES (@id, @who, @messageId, @threadId)
        `);
        stmt.run(pixel);
    }

    findById(id: string): PixelRecord | undefined {
        const stmt = db.prepare(`SELECT * FROM Pixels WHERE id = ?`);
        return stmt.get(id) as PixelRecord | undefined;
    }

    findByIdAndWho(id: string, who: string): PixelRecord | undefined {
        const stmt = db.prepare(`SELECT * FROM Pixels WHERE id = ? AND who = ?`);
        return stmt.get(id, who) as PixelRecord | undefined;
    }

    findByThreadIds(threadIds: string[]): PixelRecord[] {
        if (threadIds.length === 0) return [];
        const placeholders = threadIds.map(() => "?").join(", ");
        const stmt = db.prepare(
            `SELECT * FROM Pixels WHERE threadId IN (${placeholders})`
        );
        return stmt.all(...threadIds) as PixelRecord[];
    }
}
