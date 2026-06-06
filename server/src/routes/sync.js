import { Router } from "express";
import { getDB } from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

const TABLES = ["clothing", "outfits", "daily_logs"];

// Pull changes from server (since timestamp)
router.post("/pull", (req, res) => {
  const db = getDB();
  const { lastSynced } = req.body;
  const since = lastSynced || "1970-01-01T00:00:00.000Z";

  const changes = {};
  for (const table of TABLES) {
    const rows = db.prepare(
      `SELECT * FROM ${table} WHERE user_id = ? AND updated_at > ? AND deleted = 0 ORDER BY updated_at`
    ).all(req.userId, since);
    if (rows.length > 0) changes[table] = rows;
  }

  // Also get soft-deleted records
  for (const table of TABLES) {
    const deleted = db.prepare(
      `SELECT id FROM ${table} WHERE user_id = ? AND updated_at > ? AND deleted = 1`
    ).all(req.userId, since);
    if (deleted.length > 0) changes[`${table}_deleted`] = deleted.map((r) => r.id);
  }

  res.json({
    serverTime: new Date().toISOString(),
    changes,
  });
});

// Push changes to server
router.post("/push", (req, res) => {
  const db = getDB();
  const { changes } = req.body;
  if (!changes || !Array.isArray(changes)) return res.status(400).json({ error: "无效数据" });

  const results = [];
  for (const change of changes) {
    const { table, action, data } = change;
    if (!TABLES.includes(table)) continue;

    try {
      if (action === "insert" || action === "update") {
        const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND user_id = ?`).get(data.id, req.userId);
        if (existing) {
          // Update
          const fields = Object.keys(data).filter((k) => k !== "id" && k !== "user_id");
          const sets = fields.map((f) => `${f} = ?`).join(", ");
          const vals = fields.map((f) => data[f]);
          db.prepare(`UPDATE ${table} SET ${sets}, updated_at = ? WHERE id = ? AND user_id = ?`).run(...vals, new Date().toISOString(), data.id, req.userId);
          results.push({ id: data.id, action: "updated" });
        } else {
          // Insert
          const fields = Object.keys(data);
          const placeholders = fields.map(() => "?").join(", ");
          const vals = fields.map((f) => data[f]);
          db.prepare(`INSERT OR REPLACE INTO ${table} (${fields.join(", ")}, user_id) VALUES (${placeholders}, ?)`).run(...vals, req.userId);
          results.push({ id: data.id, action: "inserted" });
        }
      } else if (action === "delete") {
        db.prepare(`UPDATE ${table} SET deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?`).run(new Date().toISOString(), data.id, req.userId);
        results.push({ id: data.id, action: "deleted" });
      }
    } catch (e) {
      console.error(`Sync error on ${table}:`, e.message);
      results.push({ id: data.id, action: "error", error: e.message });
    }
  }

  res.json({
    serverTime: new Date().toISOString(),
    results,
  });
});

export default router;
