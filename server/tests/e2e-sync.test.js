import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB, req, getToken } from "./setup.js";

describe("e2e sync", () => {
  let app;

  beforeEach(() => {
    resetDB();
    app = createApp();
  });

  it("full loop: register -> push clothing + outfit -> pull -> assert data matches", async () => {
    const { token } = await getToken(app);

    await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c5",
              categoryId: "top",
              name: "T-Shirt",
              imageUri: "http://example.com/tshirt.jpg",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "outfits",
            action: "insert",
            data: {
              id: "o1",
              name: "Casual",
              clothingIds: '["c5"]',
              notes: "Everyday look",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const pull = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(pull.status, 200);
    assert.ok(pull.body.changes.clothing);
    assert.strictEqual(pull.body.changes.clothing.length, 1);
    assert.strictEqual(pull.body.changes.clothing[0].id, "c5");
    assert.strictEqual(pull.body.changes.clothing[0].name, "T-Shirt");

    assert.ok(pull.body.changes.outfits);
    assert.strictEqual(pull.body.changes.outfits.length, 1);
    assert.strictEqual(pull.body.changes.outfits[0].id, "o1");
    assert.strictEqual(pull.body.changes.outfits[0].name, "Casual");
  });

  it("push soft-delete -> pull returns *_deleted array", async () => {
    const { token } = await getToken(app);

    await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "insert",
            data: {
              id: "c6",
              categoryId: "bottom",
              name: "Shorts",
              imageUri: "http://example.com/shorts.jpg",
            },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    await req(app, "POST", "/api/sync/push", {
      body: {
        changes: [
          {
            table: "clothing",
            action: "delete",
            data: { id: "c6" },
          },
        ],
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const pull = await req(app, "POST", "/api/sync/pull", {
      body: { lastSynced: "1970-01-01T00:00:00.000Z" },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(pull.status, 200);
    assert.ok(pull.body.changes.clothing_deleted);
    assert.strictEqual(pull.body.changes.clothing_deleted.length, 1);
    assert.strictEqual(pull.body.changes.clothing_deleted[0], "c6");
    assert.strictEqual((pull.body.changes.clothing || []).length, 0);
  });
});
