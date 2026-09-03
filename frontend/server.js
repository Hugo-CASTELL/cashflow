import compression from "compression";
import express from "express";
import http from "node:http";
import https from "node:https";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequestHandler } from "@react-router/express";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const apiUrl = process.env.API_URL || "http://localhost:3000";

const buildPath = path.resolve(__dirname, "build/server/index.js");
const build = await import(pathToFileURL(buildPath).href);

function proxyApi(req, res) {
  const target = new URL(req.url, apiUrl);
  const transport = target.protocol === "https:" ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers["connection"];

  const proxyReq = transport.request(
    target,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (error) => {
    console.error("[api-proxy]", error.message);
    if (!res.headersSent) {
      res.statusCode = 502;
    }
    res.end("Bad Gateway");
  });

  req.pipe(proxyReq);
}

const app = express();
app.disable("x-powered-by");
app.use(compression());
app.use(morgan("tiny"));

// Browser calls use /api/*; SSR uses API_URL directly.
app.use("/api", proxyApi);

app.use(
  "/assets",
  express.static(path.join(build.assetsBuildDirectory, "assets"), {
    immutable: true,
    maxAge: "1y",
  })
);
app.use(express.static(build.assetsBuildDirectory));
app.use(express.static("public", { maxAge: "1h" }));

app.all(
  "/{*splat}",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  })
);

app.listen(port, () => {
  console.log(`[frontend] http://localhost:${port}`);
  console.log(`[frontend] proxying /api -> ${apiUrl}`);
});
