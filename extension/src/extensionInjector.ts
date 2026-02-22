function addScript(src: string): void {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = chrome.runtime.getURL(src);
    (document.body || document.head || document.documentElement).appendChild(script);
}

// Bridge: relay register-pixel requests from the page-context script to the
// service worker (which has network access), then return the response.
window.addEventListener("sgt:register-pixel", (event: Event) => {
    const { reqId, baseUrl, id, who, messageId } =
        (event as CustomEvent<{ reqId: string; baseUrl: string; id: string; who: string; messageId: string }>).detail;

    chrome.runtime.sendMessage(
        { action: "register-pixel", baseUrl, id, who, messageId },
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
