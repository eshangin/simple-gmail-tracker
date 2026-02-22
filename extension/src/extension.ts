import type { Gmail } from "gmail-js";
import md5 from "blueimp-md5";

// loader-code: wait until gmailjs has finished loading, before triggering actual extension-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

/**
 * Builds the tracking pixel URL with a unique ID and hashed sender email.
 * @param userEmail - The Gmail user's email address.
 * @returns Full tracking pixel URL with encoded query parameters.
 */
function buildTrackingPixelUrl(userEmail: string): string {
    const id = crypto.randomUUID();
    const who = md5(userEmail.toLowerCase().trim());

    const params = new URLSearchParams({ id, who });

    return `${__ENV__.TRACKER_BASE_URL}/pixel?${params.toString()}`;
}

/**
 * Injects a 1x1 invisible tracking pixel into the compose window body.
 * Called just before the user sends an email.
 */
function injectTrackingPixel(compose: GmailDomCompose, userEmail: string): void {
    const pixelUrl = buildTrackingPixelUrl(userEmail);
    const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="">`;

    const currentBody = compose.body();
    compose.body(currentBody + pixelHtml);

    console.log("[SGT] Tracking pixel injected:", pixelUrl);
}

// actual extension-code
function startExtension(gmail: Gmail): void {
    console.log("[SGT] Extension loading...");
    window.gmail = gmail;

    gmail.observe.on("load", () => {
        const userEmail: string = gmail.get.user_email();
        console.log("[SGT] Loaded for:", userEmail);

        // Hook into every compose window (new email, reply, forward).
        gmail.observe.on("compose", (compose) => {
            // Listen for click on the send button and inject the tracking pixel
            // into the email body just before Gmail sends the request.
            compose.dom("send_button").on("click", () => {
                injectTrackingPixel(compose, userEmail);
            });
        });
    });
}
