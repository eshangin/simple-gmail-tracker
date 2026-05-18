import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export function createTempDbPath(): string {
    return path.join(os.tmpdir(), `simple-gmail-tracker-${randomUUID()}.db`);
}

export function loadDbModules() {
    const databaseModule = require("../src/db/database") as typeof import("../src/db/database");
    const pixelsModule = require("../src/db/PixelsRepository") as typeof import("../src/db/PixelsRepository");
    const readingsModule = require("../src/db/ReadingsRepository") as typeof import("../src/db/ReadingsRepository");
    const readingEventsModule = require("../src/events/readingEvents") as typeof import("../src/events/readingEvents");

    return {
        db: databaseModule.default,
        PixelsRepository: pixelsModule.PixelsRepository,
        ReadingsRepository: readingsModule.ReadingsRepository,
        readingEvents: readingEventsModule.readingEvents
    };
}

export function removeTempDb(dbPath: string): void {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
}