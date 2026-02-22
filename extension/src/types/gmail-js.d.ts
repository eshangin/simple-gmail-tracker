declare module "gmail-js" {
    interface GmailCompose {
        [key: string]: unknown;
    }

    interface GmailDomEmail {
        [key: string]: unknown;
    }

    interface GmailEmailData {
        [key: string]: unknown;
    }

    interface GmailObserve {
        on(event: "load", callback: () => void): void;
        on(event: "view_email", callback: (domEmail: GmailDomEmail) => void): void;
        on(event: "compose", callback: (compose: GmailCompose) => void): void;
    }

    interface GmailGet {
        user_email(): string;
    }

    interface GmailNewGet {
        email_data(domEmail: GmailDomEmail): GmailEmailData;
    }

    interface GmailNew {
        get: GmailNewGet;
    }

    export interface Gmail {
        observe: GmailObserve;
        get: GmailGet;
        new: GmailNew;
    }

    export class Gmail {
        constructor($: JQueryStatic);
    }

    export default Gmail;
}

interface Window {
    _gmailjs?: import("gmail-js").Gmail;
    gmail?: import("gmail-js").Gmail;
}
