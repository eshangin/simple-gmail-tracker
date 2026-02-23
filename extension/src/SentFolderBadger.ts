import type { Gmail } from "gmail-js";
import type { MessageReadStatus, TrackingPixelsApiClient } from "./TrackingPixelsApiClient";
import type { Who } from "./Who";

const BADGE_CLASS = "sgt-tracked-badge";
const POLL_INTERVAL_MS = 500;

/**
 * Adds a visual checkmark badge to every row in the Sent folder.
 * Polls visible rows every 500 ms; for any un-badged rows it first
 * queries POST /api/pixels/by-messages so the server can report their
 * tracking status, then renders the badge.
 */
export class SentFolderBadger {
    constructor(
        private readonly gmail: Gmail,
        private readonly who: Who,
        private readonly apiClient: TrackingPixelsApiClient,
    ) {
        this.scheduleNextPoll();
        this.listenForReadingEvents();
    }

    /**
     * Listens for real-time "sgt:reading-registered" events dispatched by the
     * content script (extensionInjector) when the server pushes an SSE notification.
     * Removes the existing badge on the matching row so the next poll cycle
     * re-queries the server and re-renders it with the updated (read) status.
     */
    private listenForReadingEvents(): void {
        window.addEventListener("sgt:reading-registered", (event: Event) => {
            const { threadId } = (event as CustomEvent<{ threadId: string; who: string }>).detail;

            const rows = this.gmail.dom.visible_messages();
            for (const row of rows) {
                if (row.thread_id !== threadId) continue;
                const el = row.$el[0];
                if (!el) continue;
                const badge = el.querySelector("." + BADGE_CLASS);
                if (badge) badge.remove();
            }
        });
    }

    private scheduleNextPoll(): void {
        setTimeout(async () => {
            try {
                await this.applyBadges();
            } catch (err) {
                console.error("[SGT] SentFolderBadger error:", err);
            }
            this.scheduleNextPoll();
        }, POLL_INTERVAL_MS);
    }

    // -------------------------------------------------------------------------
    // Badge rendering
    // -------------------------------------------------------------------------

    private async applyBadges(): Promise<void> {
        if (this.gmail.get.current_page() !== "sent") return;

        const rows = this.gmail.dom.visible_messages();
        const unbadged = rows.filter((row) => {
            const el = row.$el[0];
            return el && !el.querySelector(`.${BADGE_CLASS}`);
        });

        if (unbadged.length === 0) return;

        const threadIds = unbadged.map((row) => row.thread_id);

        let readByThreadId = new Map<string, boolean>();
        try {
            const statuses = await this.apiClient.getByMessages(threadIds, this.who.userEmailHash);
            readByThreadId = new Map(statuses.map((s: MessageReadStatus) => [s.threadId, s.read]));
        } catch (err) {
            console.warn("[SGT] getByMessages failed:", err);
        }

        for (const row of unbadged) {
            const read = readByThreadId.get(row.thread_id) ?? false;
            this.badgeRow(row.$el[0], read);
        }
    }

    private badgeRow(el: HTMLElement, read: boolean): void {
        if (!el || el.querySelector(`.${BADGE_CLASS}`)) return; // already badged

        const color = read ? "#32ae6c" : "#d4d4d4";

        const badge = document.createElement("span");
        badge.className = BADGE_CLASS;
        badge.title = "Tracking pixel sent";
        badge.textContent = "✓";
        badge.style.cssText =
            `display:inline-block;` +
            `color:${color};` +
            "font-size:16px;" +
            "font-weight:bold;" +
            "padding-right:10px;" +
            "vertical-align:middle;" +
            "pointer-events:none;";

        // Find the TD containing the TO addresses (identified by a child with [email] attribute)
        // and insert our badge TD immediately before it.
        const toCell = el.querySelector<HTMLElement>("td:has([email])");
        if (toCell?.parentElement) {
            const td = document.createElement("td");
            td.appendChild(badge);
            toCell.parentElement.insertBefore(td, toCell);
        } else {
            el.prepend(badge);
        }
    }
}
