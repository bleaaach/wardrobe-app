import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB, req, getToken } from "./setup.js";

describe("sync", () => {
  let app;

  beforeEach(() => {
    resetDB();
    app = createApp();
  });

  it("POST /api/sync/pull returns incremental data filtered by lastSynced", async () => {
    const { token } = await getToken(app);

    await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c1",
              categoryId: "top",
              name: "Shirt",
              imageUri: "http://example.com/shirt.jpg",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.changes.clothing);
    assert.strictEqual(res.body.changes.clothing.length, 1);
    assert.strictEqual(res.body.changes.clothing[0].id, "c1");

    const res2 = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: new Date(Date.now() + 86400000).toISOString() },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(Object.keys(res2.body.changes).length, 0);
  });

  it("POST /api/sync/push insert/update/delete actions", async () => {
    const { token } = await getToken(app);

    const res1 = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c2",
              categoryId: "bottom",
              name: "Pants",
              imageUri: "http://example.com/pants.jpg",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.results[0].action, "inserted");

    const res2 = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "update",
            data: {
              id: "c2",
              name: "Jeans",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.results[0].action, "updated");

    const res3 = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "delete",
            data: { id: "c2" },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res3.status, 200);
    assert.strictEqual(res3.body.results[0].action, "deleted");
  });

  it("unknown table name is skipped", async () => {
    const { token } = await getToken(app);

    const res = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "malicious_table",
            action: "insert",
            data: { id: "x1" },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.results.length, 0);
  });

  it("fields outside whitelist are ignored", async () => {
    const { token } = await getToken(app);

    const res = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c3",
              categoryId: "shoes",
              name: "Sneakers",
              imageUri: "http://example.com/shoes.jpg",
              hackerField: "should be ignored",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.results[0].action, "inserted");

    const pull = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: `Bearer ${token}` },
    });
    const record = pull.body.changes.clothing.find((c) => c.id === "c3");
    assert.ok(record);
    assert.strictEqual(record.name, "Sneakers");
    assert.strictEqual(record.hacker_field, undefined);
  });

  it("malicious SQL injection payload is rejected or harmless", async () => {
    const { token } = await getToken(app);

    const res = await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c4",
              categoryId: "top",
              name: "'; DROP TABLE users; --",
              imageUri: "http://example.com/x.jpg",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.results[0].action, "inserted");

    const { getDB } = await import("../src/db.js");
    const db = getDB();
    const users = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get();
    assert.ok(users);
  });
});
