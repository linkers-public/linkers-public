/**
 * 공고 업로드부터 견적 생성까지 전체 워크플로우
 */

import { FrontendRAG } from '../rag/frontend-rag'
import type { AnnouncementMetadata, AnalysisResult, MatchedTeam, EstimateDocument } from '@/types/rag'

interface WorkflowResult {
  docId: string
  metadata: AnnouncementMetadata
  analysis?: AnalysisResult
  matchedTeams?: MatchedTeam[]
  estimates?: EstimateDocument[]
}

interface WorkflowProgress {
  phase: 'upload' | 'metadata' | 'analysis' | 'matching' | 'estimates' | 'completed'
  progress: number
  message?: string
  data?: any
}

type ProgressCallback = (progress: WorkflowProgress) => void

export class BiddingWorkflow {
  private frontendRAG: FrontendRAG
  private backendAPIUrl: string

  constructor(backendAPIUrl: string = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000') {
    this.frontendRAG = new FrontendRAG()
    this.backendAPIUrl = backendAPIUrl
  }

  /**
   * 전체 워크플로우:
   * 1. 업로드 → 2. 메타데이터 추출 → 3. 심층 분석 → 4. 팀 매칭 → 5. 견적 생성
   */
  async processAnnouncement(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<WorkflowResult> {
    try {
      // === STEP 1: 문서 업로드 (Frontend) ===
      this.notifyProgress(onProgress, {
        phase: 'upload',
        progress: 10,
        message: '문서 업로드 중...',
      })

      const uploadResult = await this.uploadDocument(file)
      const docId = uploadResult.doc_id

      this.notifyProgress(onProgress, {
        phase: 'upload',
        progress: 30,
        message: '업로드 완료',
      })

      // === STEP 2: 메타데이터 추출 (Frontend RAG) ===
      // 빠른 응답 (5초 이내)
      this.notifyProgress(onProgress, {
        phase: 'metadata',
        progress: 40,
        message: '메타데이터 추출 중...',
      })

      const metadata = await this.frontendRAG.extractMetadata(docId)

      this.notifyProgress(onProgress, {
        phase: 'metadata',
        progress: 50,
        message: '메타데이터 추출 완료',
        data: metadata,
      })

      // === STEP 3: 심층 분석 (Backend RAG) ===
      // 백그라운드 작업 (30초~1분)
      this.notifyProgress(onProgress, {
        phase: 'analysis',
        progress: 60,
        message: '심층 분석 시작...',
      })

      const analysisJob = await this.startBackendAnalysis(docId)
      const analysis = await this.waitForAnalysis(analysisJob.job_id, onProgress)

      this.notifyProgress(onProgress, {
        phase: 'analysis',
        progress: 80,
        message: '분석 완료',
        data: analysis,
      })

      // === STEP 4: 팀 매칭 (Backend RAG) ===
      this.notifyProgress(onProgress, {
        phase: 'matching',
        progress: 85,
        message: '팀 매칭 중...',
      })

      const matchedTeams = await this.matchTeams(docId, {
        top_k: 10,
        min_score: 0.7,
      })

      this.notifyProgress(onProgress, {
        phase: 'matching',
        progress: 90,
        message: `${matchedTeams.length}개 팀 매칭 완료`,
        data: matchedTeams,
      })

      // === STEP 5: 견적서 초안 생성 (선택한 팀별) ===
      this.notifyProgress(onProgress, {
        phase: 'estimates',
        progress: 95,
        message: '견적서 생성 중...',
      })

      const estimates = await Promise.all(
        matchedTeams.slice(0, 3).map(team =>
          this.generateEstimate(docId, team.team_id)
        )
      )

      this.notifyProgress(onProgress, {
        phase: 'completed',
        progress: 100,
        message: '모든 작업 완료',
      })

      return {
        docId,
        metadata,
        analysis,
        matchedTeams,
        estimates,
      }
    } catch (error) {
      console.error('워크플로우 오류:', error)
      throw error
    }
  }

  /**
   * 문서 업로드
   */
  private async uploadDocument(file: File): Promise<{ doc_id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', 'pdf')

    const response = await fetch('/api/rag/ingest', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('문서 업로드 실패')
    }

    const result = await response.json()
    return { doc_id: result.docId.toString() }
  }

  /**
   * Backend 분석 작업 시작
   */
  private async startBackendAnalysis(docId: string): Promise<{ job_id: string }> {
    const response = await fetch(`${this.backendAPIUrl}/api/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId }),
    })

    if (!response.ok) {
      throw new Error('분석 작업 시작 실패')
    }

    return await response.json()
  }

  /**
   * 분석 완료 대기 (Server-Sent Events 또는 폴링)
   */
  private async waitForAnalysis(
    jobId: string,
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult> {
    // Server-Sent Events 사용
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(
        `${this.backendAPIUrl}/api/analysis/stream/${jobId}`
      )

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.status === 'completed') {
          eventSource.close()
          resolve(data.result)
        } else if (data.status === 'failed') {
          eventSource.close()
          reject(new Error(data.error))
        } else if (data.status === 'progress') {
          // 진행 상황 업데이트
          this.notifyProgress(onProgress, {
            phase: 'analysis',
            progress: 60 + (data.progress * 0.2), // 60-80%
            message: data.message,
          })
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        reject(new Error('분석 중 오류가 발생했습니다.'))
      }

      // 타임아웃 (5분)
      setTimeout(() => {
        eventSource.close()
        reject(new Error('분석 시간 초과'))
      }, 5 * 60 * 1000)
    })
  }

  /**
   * 팀 매칭
   */
  private async matchTeams(
    docId: string,
    options: { top_k: number; min_score: number }
  ): Promise<MatchedTeam[]> {
    const response = await fetch(
      `${this.backendAPIUrl}/api/announcements/${docId}/match?top_k=${options.top_k}&min_score=${options.min_score}`
    )

    if (!response.ok) {
      throw new Error('팀 매칭 실패')
    }

    const result = await response.json()
    return result.data?.matched_teams || []
  }

  /**
   * 견적서 생성
   */
  private async generateEstimate(
    docId: string,
    teamId: string
  ): Promise<EstimateDocument> {
    const response = await fetch(`${this.backendAPIUrl}/api/estimates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        announcement_id: docId,
        team_id: teamId,
      }),
    })

    if (!response.ok) {
      throw new Error('견적서 생성 실패')
    }

    const result = await response.json()
    return {
      team_id: teamId,
      content: result.data?.estimate || '',
      created_at: new Date().toISOString(),
    }
  }

  /**
   * 진행 상황 알림
   */
  private notifyProgress(
    callback: ProgressCallback | undefined,
    progress: WorkflowProgress
  ) {
    if (callback) {
      callback(progress)
    }
  }
}

