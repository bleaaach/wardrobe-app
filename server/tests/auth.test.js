import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB, req } from "./setup.js";
import jwt from "jsonwebtoken";

describe("auth", () => {
  let app;

  beforeEach(() => {
    resetDB();
    app = createApp();
  });

  it("POST /api/auth/register success", async () => {
    const res = await req(app, "POST", "/api/auth/register", {
      body: { username: "alice", password: "secret123" },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.userId);
    assert.strictEqual(res.body.username, "alice");
  });

  it("POST /api/auth/register duplicate returns 409", async () => {
    await req(app, "POST", "/api/auth/register", {
      body: { username: "alice", password: "secret123" },
    });
    const res = await req(app, "POST", "/api/auth/register", {
      body: { username: "alice", password: "secret123" },
    });
    assert.strictEqual(res.status, 409);
    assert.ok(res.body.error);
  });

  it("POST /api/auth/login success", async () => {
    await req(app, "POST", "/api/auth/register", {
      body: { username: "bob", password: "password" },
    });
    const res = await req(app, "POST", "/api/auth/login", {
      body: { username: "bob", password: "password" },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.userId);
  });

  it("POST /api/auth/login wrong password returns 401", async () => {
    await req(app, "POST", "/api/auth/register", {
      body: { username: "bob", password: "password" },
    });
    const res = await req(app, "POST", "/api/auth/login", {
      body: { username: "bob", password: "wrong" },
    });
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error);
  });

  it("authMiddleware no token returns 401", async () => {
    const res = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
    });
    assert.strictEqual(res.status, 401);
  });

  it("authMiddleware bad token returns 401", async () => {
    const res = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: "Bearer invalidtoken" },
    });
    assert.strictEqual(res.status, 401);
  });

  it("authMiddleware expired token returns 401", async () => {
    const expiredToken = jwt.sign(
      { userId: "fake", username: "fake" },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" }
    );
    const res = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(res.status, 401);
  });
});
