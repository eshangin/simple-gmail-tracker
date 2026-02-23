import { EventEmitter } from "events";

export interface ReadingEvent {
    threadId: string;
    who: string;
    firstReading: boolean;
}

/**
 * Singleton in-process event bus.
 * ReadingsRepository emits "reading" here; the SSE route subscribes to it.
 */
class ReadingEventEmitter extends EventEmitter {
    emitReading(event: ReadingEvent): void {
        this.emit("reading", event);
    }

    onReading(listener: (event: ReadingEvent) => void): this {
        return this.on("reading", listener);
    }

    offReading(listener: (event: ReadingEvent) => void): this {
        return this.off("reading", listener);
    }
}

export const readingEvents = new ReadingEventEmitter();
