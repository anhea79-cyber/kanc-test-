const { test } = require('node:test');
const assert = require('node:assert/strict');
const { projects, selectProjects, summarize, availableYears, formatWon } = require('../projects.js');
test('전체 과제 집계: 8건, 13억원, 진행 3건 / 종료 5건', () => {
  assert.deepEqual(summarize(selectProjects(projects, 'all')), { total: 8, budget: 1300000000, active: 3, closed: 5 });
});
test('연도별 필터와 연구비 합계', () => {
  for (const [year, expected] of [ ['2026', { total: 3, budget: 650000000, active: 2, closed: 1 }], ['2025', { total: 3, budget: 440000000, active: 1, closed: 2 }], ['2024', { total: 2, budget: 210000000, active: 0, closed: 2 }] ]) {
    const selected = selectProjects(projects, year);
    assert.ok(selected.every(p => String(p.year) === year));
    assert.deepEqual(summarize(selected), expected);
  }
});
test('데이터 없는 연도와 빈 데이터', () => {
  assert.deepEqual(summarize(selectProjects(projects, '2030')), { total: 0, budget: 0, active: 0, closed: 0 });
  assert.deepEqual(availableYears([]), []);
});
test('연도는 중복 없이 최신 순서, 원화 표시', () => {
  assert.deepEqual(availableYears(projects), [2026, 2025, 2024]);
  assert.equal(formatWon(1300000000), '1,300,000,000원');
  assert.equal(formatWon(0), '0원');
});
test('가상 데이터 식별자, 상태, 연구비, 기간 검증', () => {
  assert.equal(new Set(projects.map(p => p.id)).size, projects.length);
  for (const p of projects) {
    assert.ok(['진행', '종료'].includes(p.status));
    assert.ok(Number.isSafeInteger(p.budget) && p.budget >= 0);
    assert.ok(p.start <= p.end);
  }
});
test('서버 HTML·JS·CSS 응답과 미등록 경로 차단', async () => {
  const server = require('../server.cjs');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [url, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/projects.js', 'text/javascript'], ['/styles.css', 'text/css']]) {
      const response = await fetch(base + url);
      assert.equal(response.status, 200);
      assert.ok(response.headers.get('content-type').startsWith(type));
      assert.ok((await response.text()).length > 0);
    }
    assert.equal((await fetch(base + '/package.json')).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
