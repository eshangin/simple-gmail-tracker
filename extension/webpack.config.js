const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = (env, argv) => ({
    // "production" or "development" — passed via --mode flag in package.json scripts.
    // Controls webpack's built-in optimizations (e.g. scope hoisting).
    // Defaults to "production" if not specified.
    mode: argv.mode ?? "production",

    // Generate source maps in development only so you can debug original
    // TypeScript sources in Chrome DevTools. Disabled in production to
    // avoid exposing source code in the published extension.
    devtool: argv.mode === "development" ? "source-map" : false,

    // Each entry point becomes a separate output bundle.
    // - gmailJsLoader: initializes gmail.js as early as possible (run_at: document_start)
    // - extension:     main extension logic, waits for gmail.js to be ready
    // - extensionInjector: content script that injects the two bundles above into the page
    entry: {
        gmailJsLoader: "./src/gmailJsLoader.ts",
        extension: "./src/extension.ts",
        extensionInjector: "./src/extensionInjector.ts",
    },

    output: {
        // All built files go into dist/, which is the folder loaded as the unpacked extension.
        path: path.resolve(__dirname, "dist"),
        // Each bundle is named after its entry key, e.g. extension.js, gmailJsLoader.js.
        filename: "[name].js",
        // Wipe dist/ before each build to avoid stale files from previous builds.
        clean: true,
    },

    resolve: {
        // Allow imports without file extensions for both TypeScript and JavaScript files.
        extensions: [".ts", ".js"],
    },

    module: {
        rules: [
            {
                // Run all .ts files through ts-loader to transpile TypeScript to JavaScript.
                // Full type checking is enabled — build errors will appear for type mistakes.
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        // Copy static assets into dist/ so the folder is a self-contained
        // loadable extension (Chrome reads manifest.json from the extension root).
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "icons", to: "icons" },
            ],
        }),
    ],

    optimization: {
        // Keep output files human-readable. Useful for inspecting what webpack
        // bundled and for debugging without source maps.
        minimize: false,
        minimizer: [
            new TerserPlugin({
                // Don't extract license comments into separate .js.LICENSE.txt files.
                // Those files are unnecessary for a browser extension.
                extractComments: false,
            }),
        ],
    },

    performance: {
        // Suppress webpack's bundle size warnings. Those warnings are designed
        // for web apps where large bundles affect page load time — not relevant
        // for browser extensions.
        hints: false,
    },
});
