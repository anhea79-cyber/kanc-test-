/* 모든 값은 실습을 위한 가상 데이터입니다. 연구비 단위: 원. */
(function (root) {
  'use strict';
  const projects = [
    { id: 'KANC-2026-001', name: '차세대 반도체 나노소재 공정 연구', lead: '김가상', year: 2026, start: '2026-01-01', end: '2026-12-31', budget: 320000000, status: '진행' },
    { id: 'KANC-2026-002', name: 'AI 기반 나노소자 특성 분석', lead: '이가상', year: 2026, start: '2026-03-01', end: '2026-11-30', budget: 180000000, status: '진행' },
    { id: 'KANC-2026-003', name: '친환경 박막 증착 기술 개발', lead: '박가상', year: 2026, start: '2026-01-01', end: '2026-06-30', budget: 150000000, status: '종료' },
    { id: 'KANC-2025-001', name: '고감도 바이오센서 플랫폼 개발', lead: '최가상', year: 2025, start: '2025-01-01', end: '2026-12-31', budget: 240000000, status: '진행' },
    { id: 'KANC-2025-002', name: '나노패턴 측정 신뢰성 향상', lead: '정가상', year: 2025, start: '2025-02-01', end: '2025-12-31', budget: 110000000, status: '종료' },
    { id: 'KANC-2025-003', name: '반도체 장비 공동활용 실증', lead: '한가상', year: 2025, start: '2025-04-01', end: '2025-12-31', budget: 90000000, status: '종료' },
    { id: 'KANC-2024-001', name: '양자점 소재 기초 특성 연구', lead: '윤가상', year: 2024, start: '2024-01-01', end: '2024-12-31', budget: 130000000, status: '종료' },
    { id: 'KANC-2024-002', name: '마이크로 유체 소자 제작 연구', lead: '오가상', year: 2024, start: '2024-03-01', end: '2024-11-30', budget: 80000000, status: '종료' }
  ];
  function selectProjects(items, year) {
    return year === 'all' ? [...items] : items.filter(item => String(item.year) === String(year));
  }
  function summarize(items) {
    return { total: items.length, budget: items.reduce((sum, item) => sum + item.budget, 0), active: items.filter(item => item.status === '진행').length, closed: items.filter(item => item.status === '종료').length };
  }
  function availableYears(items) { return [...new Set(items.map(item => item.year))].sort((a, b) => b - a); }
  function formatWon(value) { return new Intl.NumberFormat('ko-KR').format(value) + '원'; }
  const api = { projects, selectProjects, summarize, availableYears, formatWon };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KancData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
