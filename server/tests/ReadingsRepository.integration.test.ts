import { createTempDbPath, loadDbModules, removeTempDb } from "./db.test-utils";

describe("ReadingsRepository integration", () => {
    let dbPath: string;
    let db: {
        close(): void;
        prepare(sql: string): {
            run(...params: unknown[]): unknown;
        };
    };
    let PixelsRepository: typeof import("../src/db/PixelsRepository").PixelsRepository;
    let ReadingsRepository: typeof import("../src/db/ReadingsRepository").ReadingsRepository;
    let readingEvents: typeof import("../src/events/readingEvents").readingEvents;

    beforeEach(() => {
        dbPath = createTempDbPath();
        process.env.SGT_DB_PATH = dbPath;
        jest.resetModules();

        const modules = loadDbModules();
        db = modules.db;
        PixelsRepository = modules.PixelsRepository;
        ReadingsRepository = modules.ReadingsRepository;
        readingEvents = modules.readingEvents;
        readingEvents.removeAllListeners();
    });

    afterEach(() => {
        readingEvents.removeAllListeners();
        db.close();
        removeTempDb(dbPath);
        delete process.env.SGT_DB_PATH;
    });

    it("returns null when the pixel cannot be found", () => {
        // Arrange
        const repository = new ReadingsRepository();

        // Act & Assert
        expect(repository.insertFromPixelHit("missing-pixel", "alice@example.com")).toBeNull();
    });

    it("returns null when the pixel is too fresh", () => {
        // Arrange
        const pixelsRepository = new PixelsRepository();
        const repository = new ReadingsRepository();
        pixelsRepository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });

        // Act & Assert
        expect(repository.insertFromPixelHit("pixel-1", "alice@example.com")).toBeNull();
    });

    it("inserts a reading and emits firstReading for the first hit", () => {
        // Arrange
        const pixelsRepository = new PixelsRepository();
        const repository = new ReadingsRepository();
        const listener = jest.fn();
        pixelsRepository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });
        db.prepare("UPDATE Pixels SET createdAt = datetime('now', '-2 seconds') WHERE id = ?").run("pixel-1");
        readingEvents.onReading(listener);

        // Act
        const record = repository.insertFromPixelHit("pixel-1", "alice@example.com");

        // Assert
        expect(record).toMatchObject({
            pixelId: "pixel-1",
            threadId: "thread-1",
            who: "alice@example.com"
        });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
            threadId: "thread-1",
            who: "alice@example.com",
            firstReading: true
        });
    });

    it("emits firstReading=false after a prior reading for the same thread and who", () => {
        // Arrange
        const pixelsRepository = new PixelsRepository();
        const repository = new ReadingsRepository();
        const listener = jest.fn();
        pixelsRepository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });
        pixelsRepository.insert({ id: "pixel-2", who: "alice@example.com", threadId: "thread-1" });
        db.prepare("UPDATE Pixels SET createdAt = datetime('now', '-2 seconds') WHERE id IN (?, ?)").run("pixel-1", "pixel-2");
        readingEvents.onReading(listener);

        // Act
        repository.insertFromPixelHit("pixel-1", "alice@example.com");
        repository.insertFromPixelHit("pixel-2", "alice@example.com");

        // Assert
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener.mock.calls[0][0]).toEqual({
            threadId: "thread-1",
            who: "alice@example.com",
            firstReading: true
        });
        expect(listener.mock.calls[1][0]).toEqual({
            threadId: "thread-1",
            who: "alice@example.com",
            firstReading: false
        });
    });

    it("reports reading presence by thread id", () => {
        // Arrange
        const pixelsRepository = new PixelsRepository();
        const repository = new ReadingsRepository();
        pixelsRepository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });
        pixelsRepository.insert({ id: "pixel-2", who: "alice@example.com", threadId: "thread-2" });
        db.prepare("UPDATE Pixels SET createdAt = datetime('now', '-2 seconds') WHERE id IN (?, ?)").run("pixel-1", "pixel-2");
        repository.insertFromPixelHit("pixel-1", "alice@example.com");

        // Assert
        expect(repository.hasReadingsByThreadIds(["thread-1", "thread-2", "thread-3"], "alice@example.com")).toEqual(
            new Map([
                ["thread-1", true],
                ["thread-2", false],
                ["thread-3", false]
            ])
        );
        expect(repository.hasReadingsByThreadIds([], "alice@example.com")).toEqual(new Map());
    });
});