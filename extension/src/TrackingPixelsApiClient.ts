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
     * Registers a tracking pixel with the server.
     * Fires a "sgt:register-pixel" CustomEvent that the content script
     * picks up, forwards to the service worker, and responds to via
     * a "sgt:register-pixel-response" CustomEvent.
     */
    register(id: string, who: string, messageId: string): Promise<void> {
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
                    detail: { reqId, baseUrl: this.baseUrl, id, who, messageId },
                }),
            );
        });
    }
}
