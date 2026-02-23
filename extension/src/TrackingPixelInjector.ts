import { TrackingPixelsApiClient } from "./TrackingPixelsApiClient";
import { Who } from "./Who";

/**
 * Handles building and injecting the tracking pixel into outgoing emails.
 */
export class TrackingPixelInjector {
    constructor(
        private readonly who: Who,
        private readonly apiClient: TrackingPixelsApiClient,
    ) {}

    /**
     * Builds the tracking pixel URL from the given id and hashed sender email.
     * @returns Full tracking pixel URL with encoded query parameters.
     */
    private buildUrl(id: string, who: string): string {
        const params = new URLSearchParams({ id, who });
        return `${__ENV__.TRACKER_BASE_URL}/pixel?${params.toString()}`;
    }

    /**
     * Registers the tracking pixel with the server, then injects a 1x1 invisible
     * tracking pixel into the compose window body.
     * Called just before the user sends an email.
     */
    async inject(compose: GmailDomCompose): Promise<void> {
        const id = crypto.randomUUID();
        const messageId = compose.email_id();

        await this.apiClient.register(id, this.who.userEmailHash, messageId);

        const pixelUrl = this.buildUrl(id, this.who.userEmailHash);
        const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="">`;

        const currentBody = compose.body();
        compose.body(currentBody + pixelHtml);

        console.log("[SGT] Tracking pixel injected:", pixelUrl);
    }
}
