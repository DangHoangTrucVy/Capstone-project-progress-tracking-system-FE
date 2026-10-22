import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
const source = await readFile(new URL("../src/services/formationService.js", import.meta.url), "utf8");
const requests = [];
globalThis.cleanupApi = { request: async request => { requests.push(request); return { data: {} }; } };
const moduleSource = source.replace('import api from "./api";', "const api = globalThis.cleanupApi;");
const { operations, call, allRows } = await import("data:text/javascript;base64," + Buffer.from(moduleSource).toString("base64"));
test("Every frontend operation exists on the running backend, with the same method", async () => {
  const response = await fetch(process.env.OPENAPI_URL || "http://localhost:8081/v3/api-docs");
  assert.equal(response.status, 200);
  const { paths, components } = await response.json();
  assert.ok(components.schemas.SubjectRequest.properties.requestTtlMinutes);
  assert.equal(components.schemas.SubjectRequest.properties.requestTtlHours, undefined);
  assert.ok(components.schemas.SubjectResponse.properties.minDeadlineNoticeMinutes);
  for (const [name, [method, path]] of Object.entries(operations)) {
    assert.ok(paths["/api/v1" + path]?.[method], name + ": " + method + " " + path);
  }
  for (const path of ["/api/v1/auth/register", "/api/v1/auth/campuses",
    "/api/v1/registrations", "/api/v1/reports/summary", "/api/v1/eligibility/import/file"]) {
    assert.equal(paths[path], undefined, path);
  }
});
test("Uploads leave multipart boundary to the browser, Excel requests a blob", async () => {
  await call("importPreview", {path:{semester:"FA26"},file:new Blob(["MSSV"],{type:"text/csv"})});
  assert.ok(requests.at(-1).data instanceof FormData);
  assert.equal(requests.at(-1).headers["Content-Type"], undefined);
  await call("export", {path:{semester:"FA26"}});
  assert.equal(requests.at(-1).responseType, "blob");
});
test("Missing route parameters fail before sending a request", async () => {
  const count = requests.length;
  await assert.rejects(call("group"), /Missing parameter: groupId/);
  assert.equal(requests.length, count);
});
test("Paginated lists load every page rather than silently truncating accounts or groups", async () => {
  const original = globalThis.cleanupApi.request;
  let page = 0;
  globalThis.cleanupApi.request = async request => {
    assert.equal(request.params.page, page);
    return {data:{content:[{id:page}],totalPages:2,last:page++ === 1}};
  };
  try {
    assert.deepEqual(await allRows("students",{semester:"FA26"}),[{id:0},{id:1}]);
  } finally { globalThis.cleanupApi.request = original; }
});
test("Old workflow API paths are absent from frontend source", async () => {
  async function scan(dir) {
    for (const entry of await readdir(dir,{withFileTypes:true})) {
      const child = new URL(entry.name + (entry.isDirectory()?"/":""),dir);
      if (entry.isDirectory()) await scan(child);
      else if (/\.(js|jsx)$/.test(entry.name)) {
        const text = await readFile(child,"utf8");
        for (const pattern of [/\/auth\/register/, /\/auth\/campuses/, /\/registrations/,
          /\/eligibility\/(?:import|me|ineligible|students)/, /\/reports\/(?:summary|export)/,
          /\/slots(?:[/"'`])/, /\/bookings/, /\/topics\/.*\/questions/,
          /\/documents/, /\/roster\/(?:submit|review)/, /\/me\/(?:applications|invites|formation-window)/]) {
          assert.doesNotMatch(text,pattern,child.pathname);
        }
      }
    }
  }
  await scan(new URL("../src/",import.meta.url));
});
