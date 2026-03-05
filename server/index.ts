import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    limit: "10mb",
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "10mb",
  }),
);

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${time} [${source}] ${message}`);
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: unknown;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJsonResponse = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} ${duration}ms`;

      if (capturedJsonResponse !== undefined) {
        try {
          const pretty = JSON.stringify(capturedJsonResponse, null, 2);
          logLine += `\n${pretty}`;
        } catch {
          logLine += " [response not JSON-serializable]";
        }
      }

      log(logLine, "api");
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("[ERROR]", err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    } catch (err) {
      console.error("Failed to initialize Vite dev server:", err);
    }
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(
    {
      port: PORT,
      host: "0.0.0.0",
    },
    () => {
      log(`Server listening on http://0.0.0.0:${PORT}`, "express");
    },
  );
})();
