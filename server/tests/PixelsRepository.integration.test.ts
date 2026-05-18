import { createTempDbPath, loadDbModules, removeTempDb } from "./db.test-utils";

describe("PixelsRepository integration", () => {
    let dbPath: string;
    let db: { close(): void };
    let PixelsRepository: typeof import("../src/db/PixelsRepository").PixelsRepository;

    beforeEach(() => {
        dbPath = createTempDbPath();
        process.env.SGT_DB_PATH = dbPath;
        jest.resetModules();

        const modules = loadDbModules();
        db = modules.db;
        PixelsRepository = modules.PixelsRepository;
    });

    afterEach(() => {
        db.close();
        removeTempDb(dbPath);
        delete process.env.SGT_DB_PATH;
    });

    it("inserts and finds pixels by id and who", () => {
        // Arrange
        const repository = new PixelsRepository();

        // Act
        repository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });

        // Assert
        expect(repository.findById("pixel-1")).toMatchObject({
            id: "pixel-1",
            who: "alice@example.com",
            threadId: "thread-1"
        });
        expect(repository.findByIdAndWho("pixel-1", "alice@example.com")).toMatchObject({
            id: "pixel-1",
            who: "alice@example.com",
            threadId: "thread-1"
        });
        expect(repository.findByIdAndWho("pixel-1", "bob@example.com")).toBeUndefined();
    });

    it("finds pixels by thread ids and who", () => {
        // Arrange
        const repository = new PixelsRepository();
        repository.insert({ id: "pixel-1", who: "alice@example.com", threadId: "thread-1" });
        repository.insert({ id: "pixel-2", who: "alice@example.com", threadId: "thread-2" });
        repository.insert({ id: "pixel-3", who: "bob@example.com", threadId: "thread-1" });

        // Assert
        expect(repository.findByThreadIdsAndWho(["thread-1", "thread-2"], "alice@example.com")).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "pixel-1", threadId: "thread-1", who: "alice@example.com" }),
                expect.objectContaining({ id: "pixel-2", threadId: "thread-2", who: "alice@example.com" })
            ])
        );
        expect(repository.findByThreadIdsAndWho([], "alice@example.com")).toEqual([]);
        expect(repository.findByThreadIdsAndWho(["thread-1"], "carol@example.com")).toEqual([]);
    });
});