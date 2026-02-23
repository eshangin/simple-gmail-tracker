interface RegisterPixelMessage {
    action: "register-pixel";
    baseUrl: string;
    id: string;
    who: string;
    messageId: string;
    threadId: string;
}

interface RegisterPixelResponse {
    success: boolean;
    error?: string;
}

interface GetPixelsByMessagesMessage {
    action: "get-pixels-by-messages";
    baseUrl: string;
    threadIds: string[];
    who: string;
}

interface GetPixelsByMessagesResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

type IncomingMessage = RegisterPixelMessage | GetPixelsByMessagesMessage;

// ---------------------------------------------------------------------------
// SSE — reading events
// ---------------------------------------------------------------------------

/**
 * Opens a streaming fetch connection to GET /api/events and parses SSE events.
 * When a "reading" event arrives it is forwarded to every open Gmail tab via
 * chrome.tabs.sendMessage so the content script can update the UI in real time.
 * Automatically reconnects with a 3-second delay on any error or stream end.
 */
function connectToReadingEvents(): void {
    const url = `${__ENV__.TRACKER_BASE_URL}/api/events`;

    fetch(url)
        .then((response) => {
            if (!response.body) {
                throw new Error("No response body");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            function read(): void {
                reader
                    .read()
                    .then(({ done, value }) => {
                        if (done) {
                            console.warn("[SGT] SSE stream ended — reconnecting...");
                            setTimeout(connectToReadingEvents, 3000);
                            return;
                        }

                        buffer += decoder.decode(value, { stream: true });

                        // SSE events are separated by a blank line (\n\n).
                        const blocks = buffer.split("\n\n");
                        buffer = blocks.pop() ?? "";

                        for (const block of blocks) {
                            let eventName = "message";
                            let data = "";
                            for (const line of block.split("\n")) {
                                if (line.startsWith("event: ")) eventName = line.slice(7);
                                else if (line.startsWith("data: ")) data = line.slice(6);
                            }

                            if (eventName === "reading" && data) {
                                try {
                                    const parsed = JSON.parse(data) as { threadId: string; who: string };
                                    chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
                                        for (const tab of tabs) {
                                            if (tab.id != null) {
                                                chrome.tabs.sendMessage(tab.id, {
                                                    action: "reading-registered",
                                                    threadId: parsed.threadId,
                                                    who: parsed.who,
                                                }).catch(() => { /* tab may not have content script yet */ });
                                            }
                                        }
                                    });
                                } catch (e) {
                                    console.error("[SGT] Failed to parse SSE reading event:", e);
                                }
                            }
                        }

                        read();
                    })
                    .catch(() => {
                        setTimeout(connectToReadingEvents, 3000);
                    });
            }

            read();
        })
        .catch(() => {
            console.warn("[SGT] SSE connection failed — retrying in 3s...");
            setTimeout(connectToReadingEvents, 3000);
        });
}

connectToReadingEvents();

/**
 * Background service worker.
 * Handles API calls on behalf of the content script so that the fetch
 * originates from the extension origin rather than the Gmail page context.
 */
chrome.runtime.onMessage.addListener(
    (message: IncomingMessage, _sender, sendResponse: (r: RegisterPixelResponse | GetPixelsByMessagesResponse) => void) => {
        if (message.action === "register-pixel") {
            const { baseUrl, id, who, messageId, threadId } = message;
            const url = `${baseUrl}/api/pixels`;

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, who, messageId, threadId }),
            })
                .then((response) => {
                    if (!response.ok) {
                        sendResponse({ success: false, error: `${response.status} ${response.statusText}` });
                    } else {
                        sendResponse({ success: true });
                    }
                })
                .catch((err: unknown) => {
                    sendResponse({ success: false, error: String(err) });
                });

            return true;
        }

        if (message.action === "get-pixels-by-messages") {
            const { baseUrl, threadIds, who } = message;
            const url = `${baseUrl}/api/pixels/by-messages`;

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadIds, who }),
            })
                .then(async (response) => {
                    if (!response.ok) {
                        sendResponse({ success: false, error: `${response.status} ${response.statusText}` });
                    } else {
                        const data: unknown = await response.json();
                        sendResponse({ success: true, data });
                    }
                })
                .catch((err: unknown) => {
                    sendResponse({ success: false, error: String(err) });
                });

            return true;
        }

        return false;
    },
);
