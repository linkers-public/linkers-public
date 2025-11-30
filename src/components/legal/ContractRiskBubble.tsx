import type { ContractRiskResult } from "@/types/contract"

const badgeColor: Record<string, string> = {
  "고": "bg-red-100 text-red-700 border-red-300",
  "중": "bg-amber-100 text-amber-700 border-amber-300",
  "저": "bg-emerald-100 text-emerald-700 border-emerald-300",
}

interface Props {
  result: ContractRiskResult
}

export function ContractRiskBubble({ result }: Props) {
  const riskClass = badgeColor[result.riskLevel] ?? "bg-slate-100 text-slate-700 border-slate-300"

  return (
    <div className="space-y-3">
      {/* 상단 요약 및 위험도 */}
      <div className="space-y-2">
        {/* 위험도 배지 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            위험도
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${riskClass}`}
          >
            {result.riskLevel}
          </span>
        </div>
        
        {/* 요약 (summary) */}
        {result.summary && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm text-slate-900 leading-relaxed font-medium">
              {result.summary}
            </p>
          </div>
        )}
        
        {/* 위험도 설명 (riskLevelDescription) */}
        {result.riskLevelDescription && result.riskLevelDescription !== result.summary && (
          <p className="text-xs text-slate-700 leading-relaxed">
            {result.riskLevelDescription}
          </p>
        )}
      </div>

      {/* 핵심 위험 포인트 */}
      {result.riskContent?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="text-base">🔍</span>
            핵심 위험 포인트
          </p>
          <ul className="space-y-2">
            {result.riskContent.map((item, i) => (
              <li
                key={i}
                className="rounded-lg bg-red-50/50 border border-red-200 px-3 py-2.5"
              >
                <p className="font-semibold text-xs text-red-900 mb-1">{item.내용}</p>
                <p className="text-xs text-slate-700 leading-relaxed">{item.설명}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 체크리스트 */}
      {result.checklist?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="text-base">✅</span>
            꼭 확인해 볼 것
          </p>
          <ul className="space-y-2">
            {result.checklist.map((item, i) => (
              <li key={i} className="rounded-lg bg-amber-50/50 border border-amber-200 px-3 py-2.5">
                <p className="font-semibold text-xs text-slate-900 mb-1">• {item.항목}</p>
                <p className="text-xs text-slate-700 leading-relaxed">{item.결론}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 수정 포인트 (있으면) */}
      {result.negotiationPoints &&
        Object.keys(result.negotiationPoints).length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold text-slate-700">
              📝 수정·협상 포인트
            </p>
            <ul className="space-y-1 text-[10px] text-slate-700">
              {Object.entries(result.negotiationPoints).map(([k, v]) => (
                <li key={k} className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
                  <span className="font-semibold text-indigo-600 mr-1 text-[10px]">
                    {k}
                  </span>
                  <span className="text-[10px]">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* 법적 근거 */}
      {result.legalReferences?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-700">
            ⚖️ 참고 법령
          </p>
          <ul className="space-y-0.5 text-[10px] text-slate-700">
            {result.legalReferences.map((ref, i) => (
              <li key={i} className="leading-relaxed">
                <span className="font-medium">{ref.name}</span> –{" "}
                {ref.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

