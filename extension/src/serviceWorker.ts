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

/**
 * Background service worker.
 * Handles API calls on behalf of the content script so that the fetch
 * originates from the extension origin rather than the Gmail page context.
 */
chrome.runtime.onMessage.addListener(
    (message: RegisterPixelMessage, _sender, sendResponse: (r: RegisterPixelResponse) => void) => {
        if (message.action !== "register-pixel") return false;

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

        // Return true to keep the message channel open for the async response.
        return true;
    },
);
