interface RegisterPixelMessage {
    action: "register-pixel";
    baseUrl: string;
    id: string;
    who: string;
    messageId: string;
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

/**
 * Background service worker.
 * Handles API calls on behalf of the content script so that the fetch
 * originates from the extension origin rather than the Gmail page context.
 */
chrome.runtime.onMessage.addListener(
    (message: IncomingMessage, _sender, sendResponse: (r: RegisterPixelResponse | GetPixelsByMessagesResponse) => void) => {
        if (message.action === "register-pixel") {
            const { baseUrl, id, who, messageId } = message;
            const url = `${baseUrl}/api/pixels`;

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, who, messageId }),
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
