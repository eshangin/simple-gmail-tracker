import https from "https";
import fs from "fs";
import express from "express";
import pingRouter from "./routes/ping";
import pixelsRouter from "./routes/pixels";

const BASE_URL = "https://localhost:3000";
const PORT = 3000;

const app = express();

app.use(express.json());

app.use("/api", pingRouter);
app.use("/api", pixelsRouter);

const sslOptions = {
    cert: fs.readFileSync("certs/localhost.pem"),
    key: fs.readFileSync("certs/localhost-key.pem"),
};

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`[SGT] Server running at ${BASE_URL}`);
});
