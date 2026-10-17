// file:// 실행을 지원하는 테스트 데이터. data/sample-projects.json과 동일합니다.
(function(root) {
  const samples = [
  {
    "id": "KANC-DEMO-001",
    "title": "GaN 전력반도체 공정 고도화",
    "department": "화합물공정팀",
    "lead": "가상연구자 A",
    "role": "주관",
    "start": "2026-01-01",
    "end": "2028-12-31",
    "status": "진행",
    "progress": 35,
    "budget": 2400,
    "memo": "에피 성장 조건 비교 실험 진행. 다음 공정 검토회의 준비."
  },
  {
    "id": "KANC-DEMO-002",
    "title": "개방형 나노팹 공정 데이터 표준화",
    "department": "공정지원팀",
    "lead": "가상연구자 B",
    "role": "주관",
    "start": "2026-03-01",
    "end": "2026-11-10",
    "status": "진행",
    "progress": 78,
    "budget": 650,
    "memo": "표준 항목 검토 및 시범 데이터 정리."
  },
  {
    "id": "KANC-DEMO-003",
    "title": "양자소자 측정 플랫폼 개발",
    "department": "소자연구팀",
    "lead": "가상연구자 C",
    "role": "참여",
    "start": "2025-07-01",
    "end": "2027-06-30",
    "status": "진행",
    "progress": 56,
    "budget": 1800,
    "memo": "측정 모듈 시작품 평가 중."
  },
  {
    "id": "KANC-DEMO-004",
    "title": "SiC 소자 신뢰성 평가 기술",
    "department": "분석평가팀",
    "lead": "가상연구자 D",
    "role": "주관",
    "start": "2026-05-01",
    "end": "2028-04-30",
    "status": "진행",
    "progress": 20,
    "budget": 1200,
    "memo": "평가 시편 확보 및 시험 조건 수립."
  },
  {
    "id": "KANC-DEMO-005",
    "title": "반도체 패키징 시제품 제작 지원",
    "department": "공정지원팀",
    "lead": "가상연구자 E",
    "role": "참여",
    "start": "2025-01-01",
    "end": "2026-09-30",
    "status": "진행",
    "progress": 92,
    "budget": 800,
    "memo": "기간 경과 점검 예시. 최종 평가 일정 확인 필요."
  },
  {
    "id": "KANC-DEMO-006",
    "title": "차세대 광소자 집적 공정 기획",
    "department": "소자연구팀",
    "lead": "가상연구자 F",
    "role": "주관",
    "start": "2027-01-01",
    "end": "2029-12-31",
    "status": "기획",
    "progress": 0,
    "budget": 3200,
    "memo": "가상 기획과제. 목표 및 역할 분담 검토."
  },
  {
    "id": "KANC-DEMO-007",
    "title": "화합물반도체 인력양성 프로그램",
    "department": "교육협력팀",
    "lead": "가상연구자 G",
    "role": "주관",
    "start": "2026-01-01",
    "end": "2026-12-31",
    "status": "진행",
    "progress": 70,
    "budget": 400,
    "memo": "실습 프로그램 3차 운영 준비."
  },
  {
    "id": "KANC-DEMO-008",
    "title": "나노소재 표면 분석 기술 개발",
    "department": "분석평가팀",
    "lead": "가상연구자 H",
    "role": "참여",
    "start": "2025-03-01",
    "end": "2026-08-31",
    "status": "종료",
    "progress": 100,
    "budget": 550,
    "memo": "최종 결과 정리 완료."
  },
  {
    "id": "KANC-DEMO-009",
    "title": "8인치 공정 전환 타당성 검토",
    "department": "화합물공정팀",
    "lead": "가상연구자 I",
    "role": "주관",
    "start": "2026-06-01",
    "end": "2027-05-31",
    "status": "보류",
    "progress": 15,
    "budget": 300,
    "memo": "협력기관 실험 일정 조정 중."
  },
  {
    "id": "KANC-DEMO-010",
    "title": "연구장비 공동활용 서비스 개선",
    "department": "공정지원팀",
    "lead": "가상연구자 J",
    "role": "주관",
    "start": "2026-02-01",
    "end": "2026-10-30",
    "status": "진행",
    "progress": 85,
    "budget": 180,
    "memo": "이용자 안내 시범 운영 및 의견 수렴."
  },
  {
    "id": "KANC-DEMO-011",
    "title": "국방용 RF 소자 공정 기초연구",
    "department": "화합물공정팀",
    "lead": "가상연구자 K",
    "role": "참여",
    "start": "2027-04-01",
    "end": "2029-03-31",
    "status": "기획",
    "progress": 0,
    "budget": 2100,
    "memo": "실제 사업과 무관한 가상 기획 예시."
  },
  {
    "id": "KANC-DEMO-012",
    "title": "나노공정 실습 콘텐츠 개발",
    "department": "교육협력팀",
    "lead": "가상연구자 L",
    "role": "주관",
    "start": "2025-01-01",
    "end": "2025-12-31",
    "status": "종료",
    "progress": 100,
    "budget": 220,
    "memo": "실습 콘텐츠 제작 완료."
  }
];
  if (typeof module === "object" && module.exports) module.exports = samples;
  else root.KANCSamples = samples;
})(typeof globalThis !== "undefined" ? globalThis : this);
