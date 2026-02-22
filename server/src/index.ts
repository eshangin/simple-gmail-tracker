import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import express from "express";
import pingRouter from "./routes/ping";
import pixelsRouter from "./routes/pixels";

interface ServerEnv {
    BASE_URL: string;
    PORT: number;
    USE_SSL: boolean;
}

const envDir = path.join(process.cwd(), "env");
const env: ServerEnv = JSON.parse(fs.readFileSync(path.join(envDir, "env.dev.json"), "utf-8"));

const localEnvPath = path.join(envDir, "env.local.json");
if (fs.existsSync(localEnvPath)) {
    const localEnv = JSON.parse(fs.readFileSync(localEnvPath, "utf-8")) as Partial<ServerEnv>;
    Object.assign(env, localEnv);
    console.log("[SGT] Loaded env overrides from env/env.local.json");
}

const { BASE_URL, PORT, USE_SSL } = env;

const app = express();

app.use(express.json());

app.use("/api", pingRouter);
app.use("/api", pixelsRouter);

if (USE_SSL) {
    const sslOptions = {
        cert: fs.readFileSync("certs/localhost.pem"),
        key: fs.readFileSync("certs/localhost-key.pem"),
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`[SGT] Server running at ${BASE_URL} (HTTPS)`);
    });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log(`[SGT] Server running at ${BASE_URL} (HTTP)`);
    });
}
