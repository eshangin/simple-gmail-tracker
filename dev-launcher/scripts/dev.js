#!/usr/bin/env node
/**
 * Dev orchestrator.
 *
 * 1. Opens an ngrok tunnel on the server port.
 *    Reads the auth token from the NGROK_AUTHTOKEN environment variable.
 * 2. Writes the public URL into both env.local.json files so the server
 *    and the extension webpack build share the same base URL.
 * 3. Spawns the server and the extension webpack watch concurrently.
 *
 * Stop everything with Ctrl-C.
 */

const ngrok = require("@ngrok/ngrok");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const LAUNCHER_DIR = path.join(__dirname, "..");
const SERVER_DIR = path.join(ROOT, "server");
const EXTENSION_DIR = path.join(ROOT, "extension");
const SERVER_ENV_PATH = path.join(SERVER_DIR, "env", "env.local.json");
const EXTENSION_ENV_PATH = path.join(EXTENSION_DIR, "env", "env.local.json");
const ROOT_ENV_PATH = path.join(LAUNCHER_DIR, "env", "env.local.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Spawn a child process and prefix every output line with [label]. */
function spawnPrefixed(label, cmd, args, opts = {}) {
    const child = spawn(cmd, args, { ...opts, stdio: ["inherit", "pipe", "pipe"] });

    function prefix(stream, line) {
        stream.write(`${label} ${line}\n`);
    }

    child.stdout.on("data", (chunk) =>
        chunk.toString().split(/\r?\n/).filter(Boolean).forEach((l) => prefix(process.stdout, l)),
    );
    child.stderr.on("data", (chunk) =>
        chunk.toString().split(/\r?\n/).filter(Boolean).forEach((l) => prefix(process.stderr, l)),
    );

    child.on("exit", (code) => {
        if (code !== 0 && code !== null) {
            console.error(`${label} exited with code ${code}`);
        }
    });

    return child;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    if (!fs.existsSync(ROOT_ENV_PATH)) {
        console.error(`[dev] Missing env/env.local.json. Copy env/env.local.json.example and fill in your token.`);
        process.exit(1);
    }

    const rootEnv = JSON.parse(fs.readFileSync(ROOT_ENV_PATH, "utf-8"));
    const authtoken = rootEnv.NGROK_AUTHTOKEN;
    const serverPort = rootEnv.NGROK_ADDR ?? 3000;
    const domain = rootEnv.NGROK_DOMAIN ?? undefined;

    if (!authtoken) {
        console.error("[dev] NGROK_AUTHTOKEN is not set in env/env.local.json.");
        console.error("[dev] Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken");
        process.exit(1);
    }

    console.log(`[dev] Opening ngrok tunnel on port ${serverPort}${domain ? ` (domain: ${domain})` : ""}...`);

    const forwardConfig = { addr: serverPort, authtoken };
    if (domain) forwardConfig.domain = domain;

    const listener = await ngrok.forward(forwardConfig);
    const publicUrl = listener.url();

    console.log(`[dev] Tunnel URL: ${publicUrl}`);

    // Write server env — disable local SSL since ngrok handles TLS.
    fs.writeFileSync(
        SERVER_ENV_PATH,
        JSON.stringify({ BASE_URL: publicUrl, USE_SSL: false }, null, 4),
    );
    console.log(`[dev] Wrote ${path.relative(ROOT, SERVER_ENV_PATH)}`);

    // Write extension env — baked into the webpack bundle at startup.
    fs.writeFileSync(
        EXTENSION_ENV_PATH,
        JSON.stringify({ TRACKER_BASE_URL: publicUrl }, null, 4),
    );
    console.log(`[dev] Wrote ${path.relative(ROOT, EXTENSION_ENV_PATH)}`);

    // Spawn both dev processes.
    const serverProc = spawnPrefixed("[server]", "npm", ["run", "dev"], {
        cwd: SERVER_DIR,
        shell: true,
    });

    const extensionProc = spawnPrefixed("[ext]   ", "npm", ["run", "dev"], {
        cwd: EXTENSION_DIR,
        shell: true,
    });

    // Graceful shutdown on Ctrl-C.
    async function shutdown() {
        console.log("\n[dev] Shutting down...");
        serverProc.kill();
        extensionProc.kill();
        await ngrok.disconnect();
        process.exit(0);
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((err) => {
    console.error("[dev] Fatal error:", err);
    process.exit(1);
});
