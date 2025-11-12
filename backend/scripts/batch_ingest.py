"""
배치 인입 스크립트
폴더의 모든 PDF 파일을 자동으로 RAG에 반영
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# 상위 디렉토리를 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.orchestrator_v2 import Orchestrator
from core.supabase_vector_store import SupabaseVectorStore


class BatchIngester:
    """배치 인입 처리기"""
    
    def __init__(self):
        self.orchestrator = Orchestrator()
        self.store = SupabaseVectorStore()
        self.results: List[Dict[str, Any]] = []
    
    def scan_folder(self, folder_path: str, extensions: List[str] = None) -> List[Path]:
        """
        폴더 스캔하여 파일 목록 반환
        
        Args:
            folder_path: 스캔할 폴더 경로
            extensions: 허용할 파일 확장자 (기본: ['.pdf', '.txt', '.hwp', '.hwpx'])
        
        Returns:
            파일 경로 리스트
        """
        if extensions is None:
            extensions = ['.pdf', '.txt', '.hwp', '.hwpx', '.html', '.htm']
        
        folder = Path(folder_path)
        if not folder.exists():
            raise FileNotFoundError(f"폴더를 찾을 수 없습니다: {folder_path}")
        
        files = []
        # 특수문자가 있는 파일명도 찾기 위해 모든 파일을 스캔한 후 확장자로 필터링
        for file_path in folder.rglob("*"):
            if file_path.is_file():
                # README.md 등 제외
                if file_path.name.lower() in ['readme.md', '.gitkeep']:
                    continue
                # 확장자 확인 (대소문자 무시)
                if file_path.suffix.lower() in [ext.lower() for ext in extensions]:
                    files.append(file_path)
        
        return sorted(files)
    
    def extract_meta_from_filename(self, file_path: Path) -> Dict[str, Any]:
        """
        파일명에서 메타데이터 추출
        
        예시:
        - "나라장터_2024-001_웹사이트구축.pdf" 
          → source=나라장터, external_id=2024-001, title=웹사이트구축
        """
        filename = file_path.stem  # 확장자 제거
        
        # 파일명 패턴 파싱 (선택사항)
        # 기본값 설정
        meta = {
            "source": "batch_upload",
            "external_id": filename,
            "title": filename,
            "agency": None,
            "budget_min": None,
            "budget_max": None,
            "start_date": None,
            "end_date": None,
        }
        
        # 파일명에서 정보 추출 시도
        parts = filename.split('_')
        if len(parts) >= 2:
            meta["source"] = parts[0]
            meta["external_id"] = parts[1] if len(parts) > 1 else filename
            meta["title"] = '_'.join(parts[2:]) if len(parts) > 2 else parts[1]
        
        return meta
    
    def process_file(
        self,
        file_path: Path,
        meta: Dict[str, Any] = None,
        verbose: bool = True
    ) -> Dict[str, Any]:
        """
        단일 파일 처리
        
        Args:
            file_path: 파일 경로
            meta: 메타데이터 (없으면 파일명에서 추출)
            verbose: 진행 상황 출력 여부
        
        Returns:
            처리 결과
        """
        if meta is None:
            meta = self.extract_meta_from_filename(file_path)
        
        result = {
            "file": str(file_path),
            "status": "pending",
            "announcement_id": None,
            "error": None,
            "started_at": datetime.now().isoformat(),
        }
        
        try:
            if verbose:
                print(f"[처리 중] {file_path.name}")
            
            # 파일 타입 결정
            suffix = file_path.suffix.lower()
            if suffix == ".pdf":
                file_type = "pdf"
            elif suffix in [".hwp", ".hwpx"]:
                file_type = "hwp"
            elif suffix == ".txt":
                file_type = "text"
            elif suffix in [".html", ".htm"]:
                file_type = "html"
            else:
                file_type = None  # 자동 감지
            
            # 파이프라인 실행 (동기 함수)
            announcement_id = self.orchestrator.process_file(
                file_path=str(file_path),
                file_type=file_type,
                meta=meta
            )
            
            result.update({
                "status": "success",
                "announcement_id": announcement_id,
                "completed_at": datetime.now().isoformat(),
            })
            
            if verbose:
                print(f"[완료] {file_path.name} → {announcement_id}")
        
        except Exception as e:
            result.update({
                "status": "failed",
                "error": str(e),
                "completed_at": datetime.now().isoformat(),
            })
            
            if verbose:
                print(f"[실패] {file_path.name} - {str(e)}")
        
        return result
    
    def process_folder(
        self,
        folder_path: str,
        extensions: List[str] = None,
        parallel: bool = False,
        max_workers: int = 3,
        verbose: bool = True
    ) -> Dict[str, Any]:
        """
        폴더의 모든 파일 배치 처리
        
        Args:
            folder_path: 폴더 경로
            extensions: 허용할 파일 확장자
            parallel: 병렬 처리 여부
            max_workers: 병렬 처리 시 최대 워커 수
            verbose: 진행 상황 출력 여부
        
        Returns:
            배치 처리 결과
        """
        # 파일 스캔
        files = self.scan_folder(folder_path, extensions)
        
        if not files:
            print(f"[경고] 처리할 파일이 없습니다: {folder_path}")
            return {
                "total": 0,
                "success": 0,
                "failed": 0,
                "results": []
            }
        
        print(f"[발견] 파일: {len(files)}개")
        print(f"[시작] 처리 시작...\n")
        
        # 파일 처리
        if parallel:
            # 병렬 처리 (멀티프로세싱)
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                results = list(executor.map(
                    lambda f: self.process_file(f, verbose=verbose),
                    files
                ))
        else:
            # 순차 처리
            results = []
            for i, file in enumerate(files, 1):
                if verbose:
                    print(f"[{i}/{len(files)}] ", end="")
                result = self.process_file(file, verbose=verbose)
                results.append(result)
        
        # 결과 집계
        success_count = sum(1 for r in results if r["status"] == "success")
        failed_count = sum(1 for r in results if r["status"] == "failed")
        
        summary = {
            "total": len(files),
            "success": success_count,
            "failed": failed_count,
            "results": results,
            "processed_at": datetime.now().isoformat(),
        }
        
        # 결과 출력
        print(f"\n{'='*50}")
        print(f"[완료] 배치 처리 완료")
        print(f"   전체: {summary['total']}개")
        print(f"   성공: {summary['success']}개")
        print(f"   실패: {summary['failed']}개")
        print(f"{'='*50}")
        
        return summary
    
    def save_report(self, summary: Dict[str, Any], output_path: str = None):
        """
        처리 결과 리포트 저장
        
        Args:
            summary: 배치 처리 결과
            output_path: 리포트 저장 경로 (없으면 자동 생성)
        """
        import json
        
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"./data/batch_reports/report_{timestamp}.json"
        
        # 리포트 디렉토리 생성
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # JSON 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"[저장] 리포트: {output_path}")


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="공고 문서 배치 인입 스크립트")
    parser.add_argument(
        "folder",
        type=str,
        help="처리할 폴더 경로"
    )
    parser.add_argument(
        "--extensions",
        type=str,
        nargs="+",
        default=[".pdf", ".txt", ".html", ".htm"],
        help="처리할 파일 확장자 (기본: .pdf .txt .html .htm)"
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="병렬 처리 활성화"
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=3,
        help="병렬 처리 시 최대 워커 수 (기본: 3)"
    )
    parser.add_argument(
        "--report",
        type=str,
        help="리포트 저장 경로 (선택)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="진행 상황 출력 안 함"
    )
    
    args = parser.parse_args()
    
    # 배치 처리기 생성
    ingester = BatchIngester()
    
    # 폴더 처리
    summary = ingester.process_folder(
        folder_path=args.folder,
        extensions=args.extensions,
        parallel=args.parallel,
        max_workers=args.max_workers,
        verbose=not args.quiet
    )
    
    # 리포트 저장
    if args.report or not args.quiet:
        ingester.save_report(summary, args.report)
    
    # 실패한 파일이 있으면 종료 코드 1
    if summary["failed"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()

