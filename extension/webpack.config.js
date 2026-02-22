const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = (env, argv) => ({
    mode: argv.mode ?? "production",
    devtool: "source-map",
    entry: {
        gmailJsLoader: "./src/gmailJsLoader.ts",
        extension: "./src/extension.ts",
        extensionInjector: "./src/extensionInjector.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        // type-checking is handled separately by `npm run typecheck`
                        transpileOnly: true,
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "icons", to: "icons" },
            ],
        }),
    ],
});
