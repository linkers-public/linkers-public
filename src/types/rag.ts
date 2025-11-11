/**
 * RAG 시스템 타입 정의
 */

export interface Doc {
  id: number
  source: 'narajangter' | 'ntis' | 'pdf' | 'internal'
  doc_url?: string
  title?: string
  project_code?: string
  published_at?: string
  raw_text?: string
  created_at: string
  created_by?: string
}

export interface DocChunk {
  id: number
  doc_id: number
  chunk_index: number
  text: string
  meta: Record<string, any>
  embedding?: number[]
  created_at: string
}

export interface TeamEmbedding {
  team_id: number
  summary: string
  meta: Record<string, any>
  embedding?: number[]
  updated_at: string
}

export interface IngestRequest {
  file?: File
  source: 'narajangter' | 'ntis' | 'pdf' | 'internal'
  title?: string
  publishedAt?: string
  docUrl?: string
}

export interface IngestResponse {
  docId: number
  chunks: number
}

export interface QueryRequest {
  mode: 'summary' | 'estimate' | 'match'
  query: string
  topK?: number
  withTeams?: boolean
  docIds?: number[]
}

export interface UsedChunk {
  id: number
  doc_id: number
  score: number
}

export interface MatchedTeam {
  team_id: number
  score: number
  reason?: string
}

export interface QueryResponse {
  answer: string
  usedChunks: UsedChunk[]
  teams?: MatchedTeam[]
}

export interface TeamUpdateRequest {
  teamId: number
  summary: string
  meta: Record<string, any>
}

