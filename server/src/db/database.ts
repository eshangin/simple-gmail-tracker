import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, "tracker.db"));

export default db;
