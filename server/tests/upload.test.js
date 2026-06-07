import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { createApp, resetDB, req, getToken } from "./setup.js";

describe("upload", () => {
  let app;

  beforeEach(() => {
    resetDB();
    app = createApp();
  });

  it("POST /api/upload without auth returns 401", async () => {
    const res = await req(app, "POST", "/api/upload", {
      body: {},
    });
    assert.strictEqual(res.status, 401);
  });

  it("POST /api/upload/base64 without auth returns 401", async () => {
    const res = await req(app, "POST", "/api/upload/base64", {
      body: { data: "data:image/jpeg;base64,abc123" },
    });
    assert.strictEqual(res.status, 401);
  });

  it("POST /api/upload/remove-bg without auth returns 401", async () => {
    const res = await req(app, "POST", "/api/upload/remove-bg", {
      body: { data: "data:image/png;base64,abc123" },
    });
    assert.strictEqual(res.status, 401);
  });

  it("POST /api/upload/base64 with auth saves image and returns URL", async () => {
    const { token } = await getToken(app);

    const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD";
    const res = await req(app, "POST", "/api/upload/base64", {
      body: { data: base64Image, name: "test-image" },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.url);
    assert.ok(res.body.url.includes("test-image.jpg"));
  });
});
