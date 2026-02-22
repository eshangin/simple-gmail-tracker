// Re-export the upstream ambient Gmail class as a named module export.
// The full type definitions come from gmail-js/src/gmail.d.ts (resolved
// automatically via the package's "types" field).
declare module "gmail-js" {
    export { Gmail };
}

interface Window {
    _gmailjs?: Gmail;
    gmail?: Gmail;
}
