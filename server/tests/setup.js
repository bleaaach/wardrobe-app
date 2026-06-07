process.env.JWT_SECRET = "test-secret";

import path from "node:path";
const TEST_DB_PATH = path.join(process.cwd(), "tests", "test.db");
process.env.TEST_DB_PATH = TEST_DB_PATH;

import fs from "node:fs";
import http from "node:http";

const { createApp } = await import("../src/index.js");
const { closeDB } = await import("../src/db.js");

export { createApp };

export function resetDB() {
  closeDB();
  for (const ext of ["", "-shm", "-wal"]) {
    const p = TEST_DB_PATH + ext;
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
}

export async function req(app, method, path, { body, headers = {} } = {}) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const options = {
    hostname: "127.0.0.1",
    port,
    path,
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  const data = body ? JSON.stringify(body) : undefined;
  if (data) {
    options.headers["Content-Length"] = Buffer.byteLength(data);
  }

  const result = await new Promise((resolve, reject) => {
    const request = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(responseData),
            headers: res.headers,
          });
        } catch {
          resolve({ status: res.statusCode, body: responseData, headers: res.headers });
        }
      });
    });
    request.on("error", reject);
    if (data) request.write(data);
    request.end();
  });

  server.close();
  return result;
}

export async function getToken(app) {
  const res = await req(app, "POST", "/api/auth/register", {
    body: { username: "testuser", password: "testpass" },
  });
  if (res.status !== 200) {
    throw new Error(`Failed to register test user: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, userId: res.body.userId };
}
