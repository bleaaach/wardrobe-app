import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB } from "./setup.js";

describe("db", () => {
  beforeEach(() => {
    resetDB();
    createApp();
  });

  it("initDB creates all required tables", async () => {
    const { getDB } = await import("../src/db.js");
    const db = getDB();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r) => r.name);
    assert.ok(tables.includes("users"));
    assert.ok(tables.includes("clothing"));
    assert.ok(tables.includes("outfits"));
    assert.ok(tables.includes("daily_logs"));
    assert.ok(tables.includes("sync_log"));
  });
});
