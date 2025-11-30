import type { ContractRiskResult } from "@/types/contract"

const badgeColor: Record<string, string> = {
  "고": "bg-red-100 text-red-700",
  "중": "bg-amber-100 text-amber-700",
  "저": "bg-emerald-100 text-emerald-700",
}

interface Props {
  result: ContractRiskResult
}

export function ContractRiskBubble({ result }: Props) {
  const riskClass = badgeColor[result.riskLevel] ?? "bg-slate-100 text-slate-700"

  return (
    <div className="space-y-2">
      {/* 상단 요약 */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-700">
            전체 위험도
          </span>
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${riskClass}`}
          >
            {result.riskLevel}
          </span>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed">
          {result.riskLevelDescription || result.summary}
        </p>
      </div>

      {/* 핵심 위험 포인트 */}
      {result.riskContent?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-700">
            🔍 핵심 위험 포인트
          </p>
          <ul className="space-y-1">
            {result.riskContent.map((item, i) => (
              <li
                key={i}
                className="rounded-lg bg-white px-2 py-1.5 text-xs text-slate-800 border border-slate-200"
              >
                <p className="font-medium text-xs">{item.내용}</p>
                <p className="mt-0.5 text-[10px] text-slate-600 leading-relaxed">{item.설명}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 체크리스트 */}
      {result.checklist?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-700">
            ✅ 꼭 확인해 볼 것
          </p>
          <ul className="space-y-1">
            {result.checklist.map((item, i) => (
              <li key={i} className="rounded-lg bg-white px-2 py-1.5 text-xs border border-slate-200">
                <p className="font-medium text-xs">• {item.항목}</p>
                <p className="mt-0.5 text-[10px] text-slate-600 leading-relaxed">{item.결론}</p>
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

