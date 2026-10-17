(function () {
  'use strict';
  const C = window.KANCCore;
  const $ = id => document.getElementById(id);
  const num = value => value.toLocaleString('ko-KR');
  const esc = C.escapeHTML;
  // localStorage 프로퍼티 접근 자체가 차단된 브라우저도 처리합니다.
  const storage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
  const loaded = C.load(storage, window.KANCSamples);
  let projects = loaded.projects;
  let visible = [];
  let editingId = null;
  let toastTimer;
  let today = C.seoulToday();
  const form = $('project-form');
  const dialog = $('editor');
  function warn(message) {
    $('storage-warning').textContent = message;
    $('storage-warning').hidden = !message;
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
  }
  function persist(message) {
    const saved = C.save(storage, projects);
    warn(saved ? '' : '브라우저 저장에 실패했습니다. 현재 화면에만 반영되며 새로고침하면 변경 내용이 사라질 수 있습니다. CSV를 내려받아 보관하세요.');
    toast(saved ? message : '화면에 반영했습니다. 저장 실패 안내를 확인하세요.');
  }
  function rebuildOptions() {
    const departments = [...new Set(projects.map(p => p.department))].sort((a, b) => a.localeCompare(b, 'ko'));
    const years = new Set();
    projects.forEach(p => { for (let year = Number(p.start.slice(0, 4)); year <= Number(p.end.slice(0, 4)); year++) years.add(year); });
    for (const [id, values, label] of [['department-filter', departments, '전체 부서'], ['year-filter', [...years].sort((a, b) => b - a), '전체 연도']]) {
      const previous = $(id).value;
      $(id).innerHTML = `<option value="">${label}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}${id === 'year-filter' ? '년' : ''}</option>`).join('');
      $(id).value = values.map(String).includes(previous) ? previous : '';
    }
    $('departments').innerHTML = departments.map(value => `<option value="${esc(value)}"></option>`).join('');
  }
  function render() {
    today = C.seoulToday();
    $('today').textContent = today.replace(/-/g, '. ');
    visible = C.filterProjects(projects, { query: $('search').value, status: $('status-filter').value, department: $('department-filter').value, year: $('year-filter').value, sort: $('sort').value });
    const s = C.summarize(visible, today);
    const cards = [
      ['전체 과제', num(s.total), '건', `기획 ${s.planned} · 보류 ${s.paused} 포함`],
      ['진행 중', num(s.active), '건', '현재 수행 중인 연구과제'],
      ['종료', num(s.completed), '건', '상태가 종료인 연구과제'],
      ['총 연구비', (s.budget / 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 }), '억원', `${num(s.budget)}백만원 · 기획·종료 포함`],
      ['일정 점검', num(s.attention), '건', '30일 이내 종료·기간 경과']
    ];
    $('stats').innerHTML = cards.map(([label, value, unit, sub]) => `<article class="stat"><span class="stat-label">${label}</span><div class="stat-value">${value}<small>${unit}</small></div><span class="stat-sub">${sub}</span></article>`).join('');
    $('result-count').textContent = `${visible.length}건`;
    $('list-summary').textContent = `전체 ${projects.length}건 중 ${visible.length}건 표시`;
    $('project-rows').innerHTML = visible.map(p => {
      const alert = C.deadline(p, today);
      return `<tr><td><button type="button" class="project-title" data-edit="${esc(p.id)}">${esc(p.title)}</button><span class="meta"><span class="role">${esc(p.role)}</span>${esc(p.id)}</span></td><td>${esc(p.department)}<span class="meta">${esc(p.lead)}</span></td><td class="date-cell">${esc(p.start.replace(/-/g, '.'))}<br>~ ${esc(p.end.replace(/-/g, '.'))}${alert ? `<span class="meta deadline">${esc(alert)}</span>` : ''}</td><td><select class="status-select status-${p.status}" data-status="${esc(p.id)}" aria-label="${esc(p.title)} 상태">${C.STATUSES.map(status => `<option${status === p.status ? ' selected' : ''}>${status}</option>`).join('')}</select></td><td><div class="progress"><span>${p.progress}%</span><progress max="100" value="${p.progress}" aria-label="${esc(p.title)} 진행률 ${p.progress}%"></progress></div></td><td class="number">${num(p.budget)}</td></tr>`;
    }).join('');
    $('empty').hidden = visible.length > 0;
    $('export').disabled = visible.length === 0;
  }
  function clearFilters() {
    ['search', 'status-filter', 'department-filter', 'year-filter'].forEach(id => { $(id).value = ''; });
    $('sort').value = 'end';
    render();
  }
  function openEditor(id = null) {
    editingId = id;
    form.reset();
    $('form-error').hidden = true;
    const existing = id ? projects.find(p => p.id === id) : null;
    $('editor-title').textContent = existing ? '과제 상세 / 수정' : '과제 등록';
    form.elements.namedItem('id').readOnly = Boolean(existing);
    if (existing) Object.entries(existing).forEach(([key, value]) => { const field = form.elements.namedItem(key); if (field) field.value = value; });
    else {
      let index = 1;
      while (projects.some(p => p.id === `DEMO-${today.replace(/-/g, '')}-${index}`)) index++;
      form.elements.namedItem('id').value = `DEMO-${today.replace(/-/g, '')}-${index}`;
      form.elements.namedItem('start').value = today;
      form.elements.namedItem('end').value = today;
    }
    dialog.showModal();
  }
  function updateStatus(id, status) {
    const p = projects.find(p => p.id === id);
    if (!p || !C.STATUSES.includes(status)) return;
    p.status = status;
    // 종료 선택 시 100%로 맞추고, 다른 상태로 되돌릴 때는 사용자가 진척도를 수정합니다.
    if (status === '종료') p.progress = 100;
    persist('과제 상태를 변경했습니다.');
    render();
    const element = Array.from($('project-rows').querySelectorAll('[data-status]')).find(el => el.dataset.status === id);
    if (element) element.focus();
    else $('status-filter').focus();
  }
  $('status-filter').innerHTML += C.STATUSES.map(status => `<option>${status}</option>`).join('');
  ['search', 'status-filter', 'department-filter', 'year-filter', 'sort'].forEach(id => $(id).addEventListener(id === 'search' ? 'input' : 'change', render));
  ['clear', 'empty-clear'].forEach(id => $(id).addEventListener('click', clearFilters));
  $('add-project').addEventListener('click', () => openEditor());
  ['close-editor', 'cancel-editor'].forEach(id => $(id).addEventListener('click', () => dialog.close()));
  $('project-rows').addEventListener('click', event => {
    const target = event.target.closest('[data-edit]');
    if (target) openEditor(target.dataset.edit);
  });
  $('project-rows').addEventListener('change', event => {
    const target = event.target.closest('[data-status]');
    if (target) updateStatus(target.dataset.status, target.value);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const project = Object.fromEntries(new FormData(form));
    ['id', 'title', 'department', 'lead', 'memo'].forEach(key => { project[key] = project[key].trim(); });
    project.progress = project.progress === '' ? NaN : Number(project.progress);
    project.budget = project.budget === '' ? NaN : Number(project.budget);
    if (project.status === '종료') project.progress = 100;
    const error = C.validate(project) || (!editingId && projects.some(p => p.id === project.id) ? '이미 등록된 과제번호입니다.' : '');
    $('form-error').textContent = error;
    $('form-error').hidden = !error;
    if (error) return;
    if (editingId) projects = projects.map(p => p.id === editingId ? project : p);
    else projects.push(project);
    rebuildOptions();
    persist(editingId ? '과제를 수정했습니다.' : '과제를 등록했습니다. 필터 조건에 따라 목록에서 숨겨질 수 있습니다.');
    dialog.close();
    render();
  });
  $('export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([C.csv(visible)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `KANC_가상과제_${today}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`현재 검색 결과 ${visible.length}건을 내려받았습니다.`);
  });
  $('reset').addEventListener('click', () => {
    if (!window.confirm('현재 브라우저에서 수정·등록한 내용을 지우고 가상 과제 12건으로 초기화할까요? 필요하면 먼저 CSV를 내려받으세요.')) return;
    projects = C.clone(window.KANCSamples);
    rebuildOptions();
    clearFilters();
    persist('가상 데이터로 초기화했습니다.');
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  warn(loaded.message);
  rebuildOptions();
  render();
})();
