import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const calls = [];
const api = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, async (...args) => {
  calls.push({ method, args });
  return { status: 200, headers: {}, data: { id: 'result' } };
}]));
globalThis.contractApi = api;
async function moduleFrom(path, replacement) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  source = source.replace(/import .*? from ['"].*?['"];?/, replacement);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const group = await moduleFrom('../src/services/groupService.js', 'const api = globalThis.contractApi;');
const eligibility = await moduleFrom('../src/services/eligibilityService.js', 'const api = globalThis.contractApi;');
const documents = await moduleFrom('../src/services/documentService.js', 'const api = globalThis.contractApi;');
const scheduling = await moduleFrom('../src/services/schedulingService.js', 'const api = globalThis.contractApi;');

test('Booking, cancellation and pre-meeting questions use the BE DTO fields', async () => {
  await scheduling.bookSlot('S1', 'G1');
  assert.deepEqual(calls.pop(), { method: 'post', args: ['/slots/S1/book', { groupId: 'G1' }] });
  await scheduling.cancelBooking('B1', 'Schedule conflict');
  assert.deepEqual(calls.pop(), { method: 'delete', args: ['/bookings/B1', { data: { reason: 'Schedule conflict' } }] });
  await scheduling.submitTopicQuestion('T1', 'How should we implement this?');
  assert.deepEqual(calls.pop().args, ['/topics/T1/questions', { questionText: 'How should we implement this?' }]);
});

test('Invite and leader decisions use the documented request contracts', async () => {
  await group.inviteToGroup('G1', { studentCode: 'SE170001' });
  assert.deepEqual(calls.pop(), { method: 'post', args: ['/groups/G1/invites', { studentCode: 'SE170001' }] });
  await group.requestLeaveGroup('G1', { reason: 'Study abroad' });
  assert.deepEqual(calls.pop().args, ['/groups/G1/leave-requests', { reason: 'Study abroad' }]);
  await group.approveLeaveRequest('R1', { newLeaderUserId: 'U2' });
  assert.deepEqual(calls.pop().args, ['/leave-requests/R1/approve', { newLeaderUserId: 'U2' }]);
  await group.approveLeaveRequest('R1');
  assert.deepEqual(calls.pop().args, ['/leave-requests/R1/approve', {}]);
  await group.getLeaveRequests({ status: 'PENDING', leaderOnly: true });
  assert.deepEqual(calls.pop().args, ['/leave-requests', { params: { status: 'PENDING', leaderOnly: true } }]);
  await group.replaceGroupLeader('G1', { userId: 'U2' });
  assert.deepEqual(calls.pop(), { method: 'put', args: ['/groups/G1/leader', { userId: 'U2' }] });
});

test('Approving an application returns the pending invite, including a reused invite', async context => {
  const invite = { id: 'I1', type: 'INVITE', status: 'PENDING', sourceApplicationId: 'A1' };
  const requests = [];
  context.mock.method(api, 'post', async (...args) => {
    requests.push(args);
    return { data: invite };
  });
  assert.equal(await group.approveApplication('A1'), invite);
  assert.equal(await group.approveApplication('A1'), invite);
  assert.deepEqual(requests, [['/applications/A1/approve'], ['/applications/A1/approve']]);
});

test('Import and document uploads retain FormData and let the browser set the boundary', async () => {
  const data = new FormData(); data.append('file', new Blob(['email,name']), 'students.csv');
  await eligibility.importEligibilityFile(data);
  let request = calls.pop();
  assert.equal(request.args[0], '/eligibility/import/file');
  assert.equal(request.args[1], data);
  assert.equal(request.args[2].headers['Content-Type'], undefined);
  await eligibility.getImportedStudents({ eligible: false, q: 'SE17', page: 2, size: 20 });
  assert.deepEqual(calls.pop().args, ['/eligibility/students', { params: { eligible: false, q: 'SE17', page: 2, size: 20 } }]);
  await documents.uploadDocument('G1', data);
  request = calls.pop();
  assert.equal(request.args[0], '/groups/G1/documents');
  assert.equal(request.args[1], data);
  assert.equal(request.args[2].headers['Content-Type'], undefined);
  await documents.submitDocumentLink('G1', { title: 'Demo', fileUrl: 'https://example.com/demo', fileType: 'LINK' });
  assert.equal(calls.pop().args[1].fileUrl, 'https://example.com/demo');
  await documents.downloadDocument('D1');
  assert.deepEqual(calls.pop().args, ['/documents/D1/file', { responseType: 'blob' }]);
});

globalThis.exportResponse = null;
const { downloadGroupsReport } = await moduleFrom('../src/utils/downloadGroupsReport.js', 'const exportGroupsExcel = async () => { if (globalThis.exportResponse instanceof Error) throw globalThis.exportResponse; return globalThis.exportResponse; };');
const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

test('Excel export only saves a successful XLSX and uses the server filename', async context => {
  let clicked = 0, removed = 0, revoked = 0, link;
  context.mock.method(URL, 'createObjectURL', () => 'blob:test');
  context.mock.method(URL, 'revokeObjectURL', () => { revoked++; });
  context.mock.method(globalThis, 'setTimeout', callback => { callback(); return 0; });
  globalThis.document = { createElement: () => link = { click() { clicked++; }, remove() { removed++; } }, body: { appendChild() {} } };
  globalThis.exportResponse = { status: 200, headers: { 'content-type': xlsx, 'content-disposition': 'attachment; filename="BE_report.xlsx"' }, data: new Blob(['PK workbook'], { type: xlsx }) };
  await downloadGroupsReport('Fall2026');
  assert.equal(link.download, 'BE_report.xlsx');
  assert.equal(clicked, 1); assert.equal(removed, 1); assert.equal(revoked, 1);
  globalThis.exportResponse.headers['content-disposition'] = "attachment; filename*=UTF-8''Vietnam%20report.xlsx";
  await downloadGroupsReport('');
  assert.equal(link.download, 'Vietnam report.xlsx');
  globalThis.exportResponse.headers['content-disposition'] = '';
  await downloadGroupsReport('Fall2026');
  assert.match(link.download, /^Danh_sach_ghep_nhom_Fall2026_\d{8}_\d{6}\.xlsx$/);
  for (const [status, type] of [[200, 'application/json'], [201, xlsx], [200, 'text/html']]) {
    globalThis.exportResponse = { status, headers: { 'content-type': type }, data: new Blob(['{"message":"Export failed"}']) };
    await assert.rejects(downloadGroupsReport('Fall2026'), /Export failed/);
  }
  assert.equal(clicked, 3);
  for (const status of [401, 403, 404, 405, 501]) {
    const error = new Error('Request failed'); error.response = { status };
    globalThis.exportResponse = error;
    await assert.rejects(downloadGroupsReport('Fall2026'));
  }
  const error = new Error('Request failed'); error.response = { status: 400, data: new Blob(['{"message":"Invalid semester"}'], { type: 'application/json' }) };
  globalThis.exportResponse = error;
  await assert.rejects(downloadGroupsReport('invalid'), /Invalid semester/);
  delete globalThis.document;
});

test('Export service retains status and headers; omitting semester requests all semesters', async () => {
  const response = await group.exportGroupsExcel(undefined);
  assert.equal(response.status, 200);
  assert.deepEqual(calls.pop().args, ['/reports/export', { params: { semester: undefined }, responseType: 'blob' }]);
});
