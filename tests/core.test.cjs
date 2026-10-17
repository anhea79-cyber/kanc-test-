const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
const samples = require('../data.js');
const json = require('../data/sample-projects.json');
const today = '2026-10-17';
test('가상 데이터 12건이 유효하고 JSON 파일과 일치한다', () => {
  assert.deepEqual(samples, json);
  assert.equal(samples.length, 12);
  assert.equal(C.cleanProjects(samples).rejected, 0);
  samples.forEach(p => assert.equal(C.validate(p), ''));
});
test('전체 현황은 전체기간 연구비와 상태별 건수를 정확히 집계한다', () => {
  assert.deepEqual(C.summarize(samples, today), { total: 12, active: 7, completed: 2, planned: 2, paused: 1, budget: 13800, attention: 3 });
});
test('검색은 과제명·번호·책임자·부서와 공백·대소문자를 처리한다', () => {
  assert.equal(C.filterProjects(samples, { query: '  gan  ' })[0].id, 'KANC-DEMO-001');
  assert.equal(C.filterProjects(samples, { query: 'demo-003' }).length, 1);
  assert.equal(C.filterProjects(samples, { query: '가상연구자 C' }).length, 1);
  assert.equal(C.filterProjects(samples, { query: '교육협력팀' }).length, 2);
});
test('연도는 다년도 과제의 시작~종료 범위를 포함한다', () => {
  const rows = C.filterProjects(samples, { year: '2027', status: '진행' });
  assert.deepEqual(rows.map(p => p.id).sort(), ['KANC-DEMO-001', 'KANC-DEMO-003', 'KANC-DEMO-004']);
  assert.equal(C.filterProjects(samples, { year: '2024' }).length, 0);
});
test('검색과 부서·상태 필터는 동시에 적용되고 원본 순서를 변경하지 않는다', () => {
  const before = C.clone(samples);
  assert.equal(C.filterProjects(samples, { query: '공정', department: '화합물공정팀', status: '진행' }).length, 1);
  assert.deepEqual(samples, before);
});
test('연구비 내림차순과 종료일 정렬이 동작한다', () => {
  assert.equal(C.filterProjects(samples, { sort: 'budget' })[0].budget, 3200);
  assert.equal(C.filterProjects(samples)[0].id, 'KANC-DEMO-012');
});
test('검색 결과가 없으면 모든 현황은 0이다', () => {
  const s = C.summarize(C.filterProjects(samples, { query: '존재하지않는과제' }), today);
  assert.equal(s.total, 0); assert.equal(s.budget, 0); assert.equal(s.attention, 0);
});
test('일정 점검은 진행·보류 중 기간 경과와 30일 이내만 센다', () => {
  const p = { ...samples[0], end: '2026-11-16' };
  assert.equal(C.deadline(p, today), '종료 D-30');
  assert.equal(C.deadline({ ...p, end: '2026-11-17' }, today), '');
  assert.equal(C.deadline({ ...p, end: today }, today), '오늘 종료');
  assert.equal(C.deadline({ ...p, end: '2026-10-16' }, today), '기간 경과');
  for (const status of ['기획', '종료']) assert.equal(C.deadline({ ...p, status, end: '2025-01-01' }, today), '');
});
test('서울 날짜는 UTC 자정 전에도 한국 자정을 반영한다', () => {
  assert.equal(C.seoulToday(new Date('2026-10-17T15:01:00Z')), '2026-10-18');
});
test('음수 연구비·범위 밖 진행률·역전 기간·불가능한 날짜를 거부한다', () => {
  for (const patch of [{ budget: -1 }, { budget: 1.5 }, { progress: 101 }, { progress: NaN }, { start: '2027-01-01', end: '2026-01-01' }, { start: '2026-02-30' }, { title: '   ' }, { role: '기타' }, { status: '임의' }, { id: '<script>' }]) assert.notEqual(C.validate({ ...samples[0], ...patch }), '');
  assert.equal(C.validDate('2024-02-29'), true);
  assert.equal(C.validDate('2026-02-29'), false);
});
test('오류 및 중복 행은 집계에서 제외한다', () => {
  const { projects, rejected } = C.cleanProjects([samples[0], { ...samples[1], budget: -1 }, samples[0], null]);
  assert.equal(rejected, 3); assert.equal(projects.length, 1);
  assert.equal(C.summarize(projects, today).budget, 2400);
});
test('저장 후 다시 읽어도 수정 내용이 유지되고 원본 가상 데이터는 보존된다', () => {
  let raw = null; const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const rows = C.load(storage, samples).projects;
  rows[0].status = '종료'; rows[0].progress = 100;
  assert.equal(C.save(storage, rows), true);
  assert.equal(C.load(storage, samples).projects[0].status, '종료');
  assert.equal(samples[0].status, '진행');
});
test('잘못된 저장 데이터 및 저장 차단은 오류 안내를 제공한다', () => {
  const raw = '{broken';
  const storage = { getItem: () => raw, setItem: () => { throw Error('denied'); } };
  const loaded = C.load(storage, samples);
  assert.equal(loaded.projects.length, 12); assert.ok(loaded.message);
  assert.equal(C.save(storage, samples), false);
  assert.equal(C.load({ getItem: () => { throw Error('denied'); } }, samples).projects.length, 12);
});
test('저장 목록 일부 오류는 유효한 행을 유지하고 빈 목록도 유지한다', () => {
  const storage = { getItem: () => JSON.stringify({ version: 1, projects: [samples[0], null] }) };
  assert.equal(C.load(storage, samples).projects.length, 1);
  assert.match(C.load(storage, samples).message, /1건/);
  assert.equal(C.load({ getItem: () => '{"version":1,"projects":[]}' }, samples).projects.length, 0);
});
test('출력 시 HTML과 CSV 수식·쉼표·줄바꿈을 안전하게 처리한다', () => {
  assert.equal(C.escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  const output = C.csv([{ ...samples[0], title: '=1+1', memo: '쉼표, "인용"\n줄바꿈' }]);
  assert.ok(output.startsWith('\uFEFF'));
  assert.ok(output.includes('"\'=1+1"'));
  assert.ok(output.includes('"쉼표, ""인용""\n줄바꿈"'));
});
