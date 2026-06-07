import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB, req } from "./setup.js";

describe("health", () => {
  let app;

  beforeEach(() => {
    resetDB();
    app = createApp();
  });

  it("GET /api/health returns { status: ok } without auth", async () => {
    const res = await req(app, "GET", "/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
  });
});
