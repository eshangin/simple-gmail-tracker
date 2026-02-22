import md5 from "blueimp-md5";

/**
 * Handles building and injecting the tracking pixel into outgoing emails.
 */
export class TrackingPixelInjector {
    constructor(private readonly userEmail: string) {}

    /**
     * Builds the tracking pixel URL with a unique ID and hashed sender email.
     * @returns Full tracking pixel URL with encoded query parameters.
     */
    private buildUrl(): string {
        const id = crypto.randomUUID();
        const who = md5(this.userEmail.toLowerCase().trim());

        const params = new URLSearchParams({ id, who });

        return `${__ENV__.TRACKER_BASE_URL}/pixel?${params.toString()}`;
    }

    /**
     * Injects a 1x1 invisible tracking pixel into the compose window body.
     * Called just before the user sends an email.
     */
    inject(compose: GmailDomCompose): void {
        const pixelUrl = this.buildUrl();
        const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="">`;

        const currentBody = compose.body();
        compose.body(currentBody + pixelHtml);

        console.log("[SGT] Tracking pixel injected:", pixelUrl);
    }
}
