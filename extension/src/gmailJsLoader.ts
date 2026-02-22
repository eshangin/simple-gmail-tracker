// gmail.js needs to be loaded as early as possible to be able to intercept
// embedded email-data in the gmail HTML!
//
// To do that we:
// - just load it
// - make sure it's initialized
// - and do nothing else!
//
// Let the "big" extension bundle load separately!

import { Gmail as GmailFactory } from "gmail-js";
import $ from "jquery";

if ("trustedTypes" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trustedHTMLpolicy = (window as any).trustedTypes.createPolicy("default", {
        createHTML: (to_escape: string) => to_escape,
    });

    $.extend({
        htmlPrefilter: (html: string) => trustedHTMLpolicy.createHTML(html)
    });
}

// don't mess up too bad if we have several gmail.js-based
// extensions loaded at the same time!
window._gmailjs = window._gmailjs || new GmailFactory($);
