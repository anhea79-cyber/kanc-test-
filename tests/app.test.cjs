// DOM 어댑터를 사용한 앱 흐름 검증. 실제 브라우저 시각 검증을 대신하지 않습니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../core.js');
const samples = require('../data.js');
function boot(storage) {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', textContent: '', hidden: false, listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, focus() {}, querySelectorAll() { return []; }, showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(id);
  };
  const fields = {};
  const keys = ['id','title','department','lead','role','start','end','status','progress','budget','memo'];
  keys.forEach(k => { fields[k] = { value: '' }; });
  node('project-form').elements = { namedItem: key => fields[key] };
  node('project-form').reset = () => keys.forEach(key => { fields[key].value = ({ role: '주관', status: '기획', progress: '0', budget: '0' })[key] || ''; });
  const document = { getElementById: node, addEventListener() {}, hidden: false };
  const context = { document, window: { KANCCore: C, KANCSamples: samples, localStorage: storage, confirm: () => true }, setTimeout: () => 1, clearTimeout() {}, FormData: class { constructor() { this.entries = keys.map(key => [key, String(fields[key].value)]); } [Symbol.iterator]() { return this.entries[Symbol.iterator](); } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  const trigger = (id, type, event = {}) => node(id).listeners[type](event);
  return { node, fields, trigger };
}
function memory() { let raw = null; return { getItem: () => raw, setItem: (_, value) => { raw = value; } }; }
test('첫 화면·검색·필터·빈 결과를 렌더링한다', () => {
  const app = boot(memory());
  assert.equal(app.node('result-count').textContent, '12건');
  assert.ok(app.node('project-rows').innerHTML.includes('GaN 전력반도체'));
  app.node('search').value = 'GaN'; app.trigger('search', 'input');
  assert.equal(app.node('result-count').textContent, '1건');
  app.node('status-filter').value = '종료'; app.trigger('status-filter', 'change');
  assert.equal(app.node('empty').hidden, false); assert.equal(app.node('export').disabled, true);
  app.trigger('clear', 'click'); assert.equal(app.node('result-count').textContent, '12건');
});
test('목록에서 종료 처리하면 100%로 저장되고 앱 재시작 후에도 유지된다', () => {
  const storage = memory(); const app = boot(storage);
  const target = { dataset: { status: 'KANC-DEMO-001' }, value: '종료', closest() { return this; } };
  app.trigger('project-rows', 'change', { target });
  const saved = JSON.parse(storage.getItem()).projects.find(p => p.id === target.dataset.status);
  assert.equal(saved.status, '종료'); assert.equal(saved.progress, 100);
  const reloaded = boot(storage);
  assert.match(reloaded.node('project-rows').innerHTML, /status-종료/);
});
test('과제 등록·날짜 오류 거부·메모 수정·초기화를 수행한다', () => {
  const storage = memory(); const app = boot(storage);
  app.trigger('add-project', 'click'); assert.equal(app.node('editor').open, true);
  Object.entries({ title:'가상 신규과제', id:'DEMO-NEW', department:'실습팀', lead:'가상담당자', start:'2026-01-01', end:'2025-12-31', budget:'100', progress:'10' }).forEach(([k,v]) => { app.fields[k].value = v; });
  app.trigger('project-form', 'submit', { preventDefault() {} });
  assert.equal(app.node('form-error').hidden, false); assert.equal(storage.getItem(), null);
  app.fields.end.value = '2027-12-31'; app.trigger('project-form', 'submit', { preventDefault() {} });
  assert.equal(JSON.parse(storage.getItem()).projects.length, 13);
  const target = { dataset: { edit: 'DEMO-NEW' }, closest() { return this; } };
  app.trigger('project-rows', 'click', { target });
  app.fields.memo.value = '<script>가상 메모</script>'; app.trigger('project-form', 'submit', { preventDefault() {} });
  assert.equal(JSON.parse(storage.getItem()).projects.find(p=>p.id==='DEMO-NEW').memo, '<script>가상 메모</script>');
  app.trigger('reset', 'click'); assert.equal(JSON.parse(storage.getItem()).projects.length, 12);
});
test('저장 차단 환경에서도 앱은 동작하고 실패를 표시한다', () => {
  const app = boot({ getItem: () => { throw Error(); }, setItem: () => { throw Error(); } });
  assert.equal(app.node('result-count').textContent, '12건');
  app.trigger('reset', 'click');
  assert.equal(app.node('storage-warning').hidden, false);
  assert.match(app.node('storage-warning').textContent, /저장에 실패/);
});
