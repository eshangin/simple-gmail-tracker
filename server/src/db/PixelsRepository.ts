import Database from "better-sqlite3";
import path from "path";

export interface PixelRecord {
    id: string;
    who: string;
    messageId: string;
    threadId: string;
    createdAt: string;
}

export class PixelsRepository {
    private db: Database.Database;

    constructor(dbPath?: string) {
        const resolvedPath = dbPath ?? path.resolve(__dirname, "../../data/tracker.db");
        this.db = new Database(resolvedPath);
        this.initialize();
    }

    private initialize(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS Pixels (
                id        TEXT    PRIMARY KEY,
                who       TEXT    NOT NULL,
                messageId TEXT    NOT NULL,
                threadId  TEXT    NOT NULL,
                createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        `);
    }

    insert(pixel: Omit<PixelRecord, "createdAt">): void {
        const stmt = this.db.prepare(`
            INSERT INTO Pixels (id, who, messageId, threadId)
            VALUES (@id, @who, @messageId, @threadId)
        `);
        stmt.run(pixel);
    }

    findById(id: string): PixelRecord | undefined {
        const stmt = this.db.prepare(`SELECT * FROM Pixels WHERE id = ?`);
        return stmt.get(id) as PixelRecord | undefined;
    }

    findByThreadIds(threadIds: string[]): PixelRecord[] {
        if (threadIds.length === 0) return [];
        const placeholders = threadIds.map(() => "?").join(", ");
        const stmt = this.db.prepare(
            `SELECT * FROM Pixels WHERE threadId IN (${placeholders})`
        );
        return stmt.all(...threadIds) as PixelRecord[];
    }
}
