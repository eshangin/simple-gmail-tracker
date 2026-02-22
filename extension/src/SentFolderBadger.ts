import type { Gmail } from "gmail-js";

const BADGE_CLASS = "sgt-tracked-badge";
const POLL_INTERVAL_MS = 500;

/**
 * Adds a visual checkmark badge to every row in the Sent folder.
 * Polls visible rows every 500 ms and badges any that are missing one.
 */
export class SentFolderBadger {
    constructor(private readonly gmail: Gmail) {
        this.scheduleNextPoll();
    }

    private scheduleNextPoll(): void {
        setTimeout(() => {
            try {
                this.applyBadges();
            } catch (err) {
                console.error("[SGT] SentFolderBadger error:", err);
            } finally {
                this.scheduleNextPoll();
            }
        }, POLL_INTERVAL_MS);
    }

    // -------------------------------------------------------------------------
    // Badge rendering
    // -------------------------------------------------------------------------

    private applyBadges(): void {
        if (this.gmail.get.current_page() !== "sent") return;

        for (const row of this.gmail.dom.visible_messages()) {
            this.badgeRow(row.$el[0]);
        }
    }

    private badgeRow(el: HTMLElement): void {
        if (!el || el.querySelector(`.${BADGE_CLASS}`)) return; // already badged

        const COLORS = ["#32ae6c", "#d4d4d4"];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

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
