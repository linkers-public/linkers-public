'use client'

interface Chunk {
  id: number
  doc_id: number | string
  score: number
  content?: string
}

interface EvidencePanelProps {
  chunks: Chunk[]
  onChunkClick?: (chunkId: number) => void
}

export default function EvidencePanel({
  chunks,
  onChunkClick,
}: EvidencePanelProps) {
  if (!chunks || chunks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm sticky top-24">
        <h3 className="text-lg font-semibold mb-4">사용된 근거</h3>
        <p className="text-sm text-slate-500">근거가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm sticky top-24">
      <h3 className="text-lg font-semibold mb-4">사용된 근거</h3>
      <div className="space-y-2">
        {chunks.map((chunk) => (
          <button
            key={chunk.id}
            onClick={() => onChunkClick?.(chunk.id)}
            className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-sm transition-colors"
          >
            <div className="font-mono text-blue-600">[id:{chunk.id}]</div>
            <div className="text-xs text-slate-500">
              문서 {chunk.doc_id} · {(chunk.score * 100).toFixed(1)}%
            </div>
            {chunk.content && (
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                {chunk.content}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

