export type ContractRiskResult = {
  summary: string
  riskLevel: string
  riskLevelDescription: string
  riskContent: { 내용: string; 설명: string }[]
  checklist: { 항목: string; 결론: string }[]
  negotiationPoints: Record<string, string>
  legalReferences: { name: string; description: string }[]
}

