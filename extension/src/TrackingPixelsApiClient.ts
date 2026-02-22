/**
 * Client for the tracking pixel server API.
 */
export class TrackingPixelsApiClient {
    constructor(private readonly baseUrl: string) {}

    /**
     * Registers a tracking pixel with the server.
     * Sends id, who, and messageId via POST.
     */
    async register(id: string, who: string, messageId: string): Promise<void> {
        const url = `${this.baseUrl}/api/pixels`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, who, messageId }),
        });

        if (!response.ok) {
            throw new Error(`[SGT] Failed to register tracking pixel: ${response.status} ${response.statusText}`);
        }
    }
}
