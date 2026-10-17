(function (root) {
  'use strict';
  const STATUSES = ['기획', '진행', '보류', '종료'];
  const STORAGE_KEY = 'kanc-research-practice-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  function validDate(value) {
    if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$|^2100-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validate(project) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) return '과제 형식이 올바르지 않습니다.';
    for (const [key, label, max] of [['id', '과제번호', 40], ['title', '과제명', 120], ['department', '부서', 40], ['lead', '연구책임자', 40]]) {
      if (typeof project[key] !== 'string' || !project[key].trim() || project[key].length > max) return `${label}을(를) ${max}자 이내로 입력하세요.`;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(project.id)) return '과제번호는 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.';
    if (!STATUSES.includes(project.status)) return '과제 상태를 확인하세요.';
    if (!['주관', '참여'].includes(project.role)) return '기관 역할을 확인하세요.';
    if (!validDate(project.start) || !validDate(project.end)) return '수행기간을 올바른 날짜로 입력하세요.';
    if (project.start > project.end) return '종료일은 시작일보다 빠를 수 없습니다.';
    if (!Number.isInteger(project.progress) || project.progress < 0 || project.progress > 100) return '진행률은 0~100 사이의 정수로 입력하세요.';
    if (!Number.isSafeInteger(project.budget) || project.budget < 0 || project.budget > 1000000000) return '연구비는 0~1,000,000,000백만원 사이의 정수로 입력하세요.';
    if (typeof project.memo !== 'string' || project.memo.length > 1000) return '진행 메모는 1,000자 이내로 입력하세요.';
    return '';
  }
  function cleanProjects(rows) {
    if (!Array.isArray(rows)) throw new Error('저장 데이터가 과제 목록 형식이 아닙니다.');
    const ids = new Set();
    const projects = [];
    let rejected = 0;
    for (const row of rows) {
      if (validate(row) || ids.has(row.id)) { rejected++; continue; }
      ids.add(row.id);
      projects.push(clone(row));
    }
    return { projects, rejected };
  }
  function load(storage, samples) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) return { projects: clone(samples), message: '' };
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1) throw new Error('지원하지 않는 저장 형식');
      const result = cleanProjects(parsed.projects);
      return { projects: result.projects, message: result.rejected ? `저장 데이터 중 오류·중복 ${result.rejected}건을 목록과 집계에서 제외했습니다. 원본 저장값은 초기화하거나 저장하기 전까지 유지됩니다.` : '' };
    } catch (_) {
      return { projects: clone(samples), message: '저장 데이터를 읽을 수 없어 가상 데이터로 표시합니다. 기존 저장값은 아직 덮어쓰지 않았습니다. 브라우저 저장 설정을 확인하거나 가상 데이터로 초기화하세요.' };
    }
  }
  function save(storage, projects) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, projects }));
      return true;
    } catch (_) { return false; }
  }
  function filterProjects(projects, filters = {}) {
    const query = (filters.query || '').trim().toLocaleLowerCase('ko-KR');
    const year = filters.year ? Number(filters.year) : null;
    const result = projects.filter(p => {
      const searchable = [p.id, p.title, p.department, p.lead].join(' ').toLocaleLowerCase('ko-KR');
      return (!query || searchable.includes(query)) && (!filters.status || p.status === filters.status) && (!filters.department || p.department === filters.department) && (!year || Number(p.start.slice(0, 4)) <= year && Number(p.end.slice(0, 4)) >= year);
    });
    return result.sort((a, b) => {
      const primary = filters.sort === 'title' ? a.title.localeCompare(b.title, 'ko') : filters.sort === 'budget' ? b.budget - a.budget : a.end.localeCompare(b.end);
      return primary || a.id.localeCompare(b.id);
    });
  }
  function seoulToday(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function deadline(project, today) {
    if (!['진행', '보류'].includes(project.status)) return '';
    const days = Math.round((Date.parse(project.end + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
    if (days < 0) return '기간 경과';
    if (days === 0) return '오늘 종료';
    return days <= 30 ? `종료 D-${days}` : '';
  }
  function summarize(projects, today) {
    return { total: projects.length, active: projects.filter(p => p.status === '진행').length, completed: projects.filter(p => p.status === '종료').length, planned: projects.filter(p => p.status === '기획').length, paused: projects.filter(p => p.status === '보류').length, budget: projects.reduce((sum, p) => sum + p.budget, 0), attention: projects.filter(p => deadline(p, today)).length };
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function csv(projects) {
    const safeCell = value => {
      let text = String(value);
      // 스프레드시트에서 사용자 입력을 수식으로 실행하지 않도록 처리합니다.
      if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const keys = ['id', 'title', 'department', 'lead', 'role', 'start', 'end', 'status', 'progress', 'budget', 'memo'];
    const header = ['과제번호', '과제명', '부서', '책임자', '기관역할', '시작일', '종료일', '상태', '진행률(%)', '연구비(백만원/전체기간)', '진행메모'];
    return '\uFEFF' + [header, ...projects.map(p => keys.map(key => p[key]))].map(row => row.map(safeCell).join(',')).join('\r\n');
  }
  const api = { STATUSES, STORAGE_KEY, clone, validDate, validate, cleanProjects, load, save, filterProjects, seoulToday, deadline, summarize, escapeHTML, csv };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KANCCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
