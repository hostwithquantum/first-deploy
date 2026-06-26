"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { spawn } = require("node:child_process");

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

function waitFor(url, tries = 50) {
  return new Promise((resolve, reject) => {
    const tick = () => {
      get(url)
        .then(resolve)
        .catch(() => {
          if (--tries <= 0) return reject(new Error("server never came up"));
          setTimeout(tick, 100);
        });
    };
    tick();
  });
}

test("renders the env var into the page", async () => {
  const port = 3999;
  const child = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: String(port), RUNWAY_APP: "hello-test" },
    cwd: __dirname,
  });

  try {
    const base = `http://localhost:${port}`;
    await waitFor(base + "/");

    const res = await get(base + "/");
    assert.strictEqual(res.status, 200);
    assert.match(res.body, /hello-test/);
    assert.doesNotMatch(res.body, /__APP_CONFIG__/);

    const missing = await get(base + "/nope");
    assert.strictEqual(missing.status, 404);

    const alpine = await get(base + "/static/alpine.min.js");
    assert.strictEqual(alpine.status, 200);
    assert.match(alpine.body, /Alpine/);
  } finally {
    child.kill();
  }
});
