import express from "express";
import cors from "cors";
import { initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import uploadRoutes from "./routes/upload.js";
import aiRoutes from "./routes/ai.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/sync", syncRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/ai", aiRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  initDB();

  return app;
}

// Only start server when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, "0.0.0.0", () => {
    // Wardrobe sync server is running
  });
}
