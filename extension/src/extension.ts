import type { Gmail } from "gmail-js";
import { TrackingPixelInjector } from "./TrackingPixelInjector";
import { TrackingPixelsApiClient } from "./TrackingPixelsApiClient";
import { SentFolderBadger } from "./SentFolderBadger";

// loader-code: wait until gmailjs has finished loading, before triggering actual extension-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

// actual extension-code
function startExtension(gmail: Gmail): void {
    console.log("[SGT] Extension loading...");
    window.gmail = gmail;

    gmail.observe.on("load", () => {
        const userEmail: string = gmail.get.user_email();
        console.log("[SGT] Loaded for:", userEmail);

        const apiClient = new TrackingPixelsApiClient(__ENV__.TRACKER_BASE_URL);
        const injector = new TrackingPixelInjector(userEmail, apiClient);
        new SentFolderBadger(gmail);

        // Hook into every compose window (new email, reply, forward).
        gmail.observe.on("compose", (compose) => {
            const sendButton = compose.dom("send_button")[0];
            if (!sendButton) {
                console.warn("[SGT] Send button not found in compose window.");
                return;
            }

            // Use capture phase so our handler fires BEFORE Gmail's bubble-phase
            // click handler reads the body and constructs the XHR payload.
            sendButton.addEventListener("click", async () => {
                await injector.inject(compose);
            }, { capture: true });
        });
    });
}
