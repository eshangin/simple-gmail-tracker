import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.SGT_DB_PATH ?? path.resolve(__dirname, "../../data/tracker.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

export default db;
