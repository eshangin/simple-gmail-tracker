import md5 from "blueimp-md5";

/**
 * Encapsulates the sender identity used for tracking.
 * The hash is computed once and reused wherever a `who` token is needed.
 */
export class Who {
    readonly userEmailHash: string;

    constructor(userEmail: string) {
        this.userEmailHash = md5(userEmail.toLowerCase().trim());
    }
}
