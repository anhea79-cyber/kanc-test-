'use strict';
const { projects, selectProjects, summarize, availableYears, formatWon } = window.KancData;
const yearFilter = document.getElementById('year-filter');
for (const year of availableYears(projects)) {
  const option = document.createElement('option');
  option.value = String(year);
  option.textContent = `${year}년`;
  yearFilter.append(option);
}
function render() {
  const selected = selectProjects(projects, yearFilter.value);
  const summary = summarize(selected);
  document.getElementById('total-budget').textContent = formatWon(summary.budget);
  document.getElementById('total-count').textContent = `${summary.total}건`;
  document.getElementById('active-count').textContent = `${summary.active}건`;
  document.getElementById('closed-count').textContent = `${summary.closed}건`;
  document.getElementById('list-count').textContent = `${summary.total}건`;
  document.getElementById('selection-description').textContent = yearFilter.value === 'all' ? '전체 연도의 과제를 표시합니다.' : `${yearFilter.value}년 기준 과제를 표시합니다.`;
  const rows = selected.map(project => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    const name = document.createElement('span');
    name.className = 'project-name';
    name.textContent = project.name;
    const id = document.createElement('span');
    id.className = 'project-id';
    id.textContent = project.id;
    nameCell.append(name, id);
    row.append(nameCell);
    for (const [index, value] of [project.lead, `${project.year}년`, `${project.start} ~ ${project.end}`, formatWon(project.budget), project.status].entries()) {
      const cell = document.createElement('td');
      if (index === 3) cell.className = 'number';
      if (index === 4) {
        const badge = document.createElement('span');
        badge.className = `badge ${project.status === '진행' ? 'active' : 'closed'}`;
        badge.textContent = project.status;
        cell.append(badge);
      } else cell.textContent = value;
      row.append(cell);
    }
    return row;
  });
  document.getElementById('project-rows').replaceChildren(...rows);
  document.getElementById('empty-state').hidden = selected.length !== 0;
}
yearFilter.addEventListener('change', render);
render();
