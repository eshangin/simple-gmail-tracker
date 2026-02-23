/**
 * Client for the tracking pixel server API.
 * Delegates the actual HTTP request to the extension's service worker
 * via a CustomEvent bridge, because this code runs in the Gmail page
 * context (injected <script>) where chrome.runtime is unavailable.
 * The content script (extensionInjector) relays the message to the
 * service worker and dispatches a response event back.
 */
export class TrackingPixelsApiClient {
    constructor(private readonly baseUrl: string) {}

    /**
     * Fetches tracking status for a list of thread IDs from the server.
     * Fires a "sgt:get-pixels-by-messages" CustomEvent.
     * The server is expected to return tracking data for each thread;
     * the raw response body is resolved as the promise value.
     */
    getByMessages(threadIds: string[], who: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const reqId = crypto.randomUUID();

            const handler = (event: Event): void => {
                const detail = (event as CustomEvent<{ reqId: string; success: boolean; data?: unknown; error?: string }>).detail;
                if (detail.reqId !== reqId) return;
                window.removeEventListener("sgt:get-pixels-by-messages-response", handler);
                if (detail.success) {
                    resolve(detail.data);
                } else {
                    reject(new Error(`[SGT] Failed to get pixels by messages: ${detail.error}`));
                }
            };

            window.addEventListener("sgt:get-pixels-by-messages-response", handler);

            window.dispatchEvent(
                new CustomEvent("sgt:get-pixels-by-messages", {
                    detail: { reqId, baseUrl: this.baseUrl, threadIds, who },
                }),
            );
        });
    }

    /**
     * Registers a tracking pixel with the server.
     * Fires a "sgt:register-pixel" CustomEvent that the content script
     * picks up, forwards to the service worker, and responds to via
     * a "sgt:register-pixel-response" CustomEvent.
     */
    register(id: string, who: string, messageId: string, threadId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const reqId = crypto.randomUUID();

            const handler = (event: Event): void => {
                const detail = (event as CustomEvent<{ reqId: string; success: boolean; error?: string }>).detail;
                if (detail.reqId !== reqId) return;
                window.removeEventListener("sgt:register-pixel-response", handler);
                if (detail.success) {
                    resolve();
                } else {
                    reject(new Error(`[SGT] Failed to register tracking pixel: ${detail.error}`));
                }
            };

            window.addEventListener("sgt:register-pixel-response", handler);

            window.dispatchEvent(
                new CustomEvent("sgt:register-pixel", {
                    detail: { reqId, baseUrl: this.baseUrl, id, who, messageId, threadId },
                }),
            );
        });
    }
}
