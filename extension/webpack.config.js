const path = require("path");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

/** @type {import('webpack').Configuration} */
module.exports = (env, argv) => {
    const isDev = argv.mode === "development";

    // Load env config from env/env.dev.json (dev) or env/env.build.json (production).
    // In dev mode, env/env.local.json (gitignored) can override any value from env.dev.json.
    // Values are injected into the bundle at build time via DefinePlugin.
    const envFile = isDev ? "env.dev.json" : "env.build.json";
    const envConfig = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "env", envFile), "utf-8")
    );

    if (isDev) {
        const localEnvPath = path.resolve(__dirname, "env", "env.local.json");
        if (fs.existsSync(localEnvPath)) {
            const localEnv = JSON.parse(fs.readFileSync(localEnvPath, "utf-8"));
            Object.assign(envConfig, localEnv);
            console.log("[webpack] Loaded env overrides from env/env.local.json");
        }
    }

    return {
        // "production" or "development" — passed via --mode flag in package.json scripts.
        // Controls webpack's built-in optimizations (e.g. scope hoisting).
        // Defaults to "production" if not specified.
        mode: argv.mode ?? "production",

        // Generate source maps in development only so you can debug original
        // TypeScript sources in Chrome DevTools. Disabled in production to
        // avoid exposing source code in the published extension.
        devtool: isDev ? "source-map" : false,

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
                    {
                        from: "manifest.json",
                        to: "manifest.json",
                        transform(content) {
                            // Derive a host-permission pattern from TRACKER_BASE_URL.
                            // e.g. "https://api.example.com" → "https://api.example.com/*"
                            const trackerOrigin = new URL(envConfig.TRACKER_BASE_URL).origin;
                            return content
                                .toString()
                                .replace(/"__TRACKER_HOST_PERMISSION__"[^\n]*/g, `"${trackerOrigin}/*"`);
                        },
                    },
                    { from: "icons", to: "icons" },
                ],
            }),
            // Inject env values from env/env.dev.json or env/env.build.json into the bundle
            // at build time. Accessible in TypeScript as __ENV__.TRACKER_BASE_URL etc.
            new webpack.DefinePlugin({
                __ENV__: JSON.stringify(envConfig),
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
    };
};
