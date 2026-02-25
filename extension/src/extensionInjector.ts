function addScript(src: string): void {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = chrome.runtime.getURL(src);
    (document.body || document.head || document.documentElement).appendChild(script);
}

// Bridge: relay register-pixel requests from the page-context script to the
// service worker (which has network access), then return the response.
window.addEventListener("sgt:get-pixels-by-messages", (event: Event) => {
    const { reqId, baseUrl, threadIds, who } =
        (event as CustomEvent<{ reqId: string; baseUrl: string; threadIds: string[]; who: string }>).detail;

    chrome.runtime.sendMessage(
        { action: "get-pixels-by-messages", baseUrl, threadIds, who },
        (response: { success: boolean; data?: unknown; error?: string }) => {
            window.dispatchEvent(
                new CustomEvent("sgt:get-pixels-by-messages-response", {
                    detail: { reqId, ...(response ?? { success: false, error: "No response from service worker" }) },
                }),
            );
        },
    );
});

window.addEventListener("sgt:register-pixel", (event: Event) => {
    const { reqId, baseUrl, id, who, threadId } =
        (event as CustomEvent<{ reqId: string; baseUrl: string; id: string; who: string; threadId: string }>).detail;

    chrome.runtime.sendMessage(
        { action: "register-pixel", baseUrl, id, who, threadId },
        (response: { success: boolean; error?: string }) => {
            window.dispatchEvent(
                new CustomEvent("sgt:register-pixel-response", {
                    detail: { reqId, ...(response ?? { success: false, error: "No response from service worker" }) },
                }),
            );
        },
    );
});

addScript("gmailJsLoader.js");
addScript("extension.js");

// Forward "reading-registered" messages from the service worker to the
// Gmail page context as a CustomEvent so SentFolderBadger can react.
chrome.runtime.onMessage.addListener((message: { action: string; threadId?: string; who?: string }) => {
    if (message.action === "reading-registered" && message.threadId) {
        window.dispatchEvent(
            new CustomEvent("sgt:reading-registered", {
                detail: { threadId: message.threadId, who: message.who },
            }),
        );
    }
});
