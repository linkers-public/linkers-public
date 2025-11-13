"""
공고 삭제 스크립트
RAG에 저장된 공고 데이터를 완전히 삭제
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.supabase_vector_store import SupabaseVectorStore
import argparse


def delete_announcement(announcement_id: str = None, external_id: str = None, source: str = None):
    """
    공고 삭제
    
    Args:
        announcement_id: 공고 UUID (우선)
        external_id: 외부 ID
        source: 출처
    """
    store = SupabaseVectorStore()
    store._ensure_initialized()
    
    sb = store.sb
    
    # announcement_id가 없으면 external_id로 찾기
    if not announcement_id:
        if not external_id or not source:
            print("❌ announcement_id 또는 (external_id + source)가 필요합니다")
            return
        
        result = sb.table("announcements")\
            .select("id")\
            .eq("external_id", external_id)\
            .eq("source", source)\
            .order("version", desc=True)\
            .limit(1)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            print(f"❌ 공고를 찾을 수 없습니다: {source}/{external_id}")
            return
        
        announcement_id = result.data[0]["id"]
        print(f"📋 공고 찾음: {announcement_id}")
    
    # 1. 청크 삭제
    chunks_result = sb.table("announcement_chunks")\
        .delete()\
        .eq("announcement_id", announcement_id)\
        .execute()
    
    print(f"✅ 청크 삭제 완료")
    
    # 2. 본문 삭제
    body_result = sb.table("announcement_bodies")\
        .delete()\
        .eq("announcement_id", announcement_id)\
        .execute()
    
    print(f"✅ 본문 삭제 완료")
    
    # 3. 분석 결과 삭제
    analysis_result = sb.table("announcement_analysis")\
        .delete()\
        .eq("announcement_id", announcement_id)\
        .execute()
    
    print(f"✅ 분석 결과 삭제 완료")
    
    # 4. 공고 메타데이터 삭제
    announcement_result = sb.table("announcements")\
        .delete()\
        .eq("id", announcement_id)\
        .execute()
    
    print(f"✅ 공고 메타데이터 삭제 완료")
    
    print(f"\n🎉 공고 삭제 완료: {announcement_id}")


def list_announcements(source: str = None, limit: int = 20):
    """공고 목록 조회"""
    store = SupabaseVectorStore()
    store._ensure_initialized()
    
    sb = store.sb
    
    query = sb.table("announcements")\
        .select("id, source, external_id, title, version, created_at")\
        .order("created_at", desc=True)\
        .limit(limit)
    
    if source:
        query = query.eq("source", source)
    
    result = query.execute()
    
    if not result.data:
        print("📋 공고가 없습니다")
        return
    
    print(f"\n📋 공고 목록 (최근 {len(result.data)}개):\n")
    print(f"{'ID':<40} {'Source':<15} {'External ID':<20} {'Title':<30} {'Version'}")
    print("-" * 120)
    
    for ann in result.data:
        print(f"{ann['id']:<40} {ann.get('source', ''):<15} {ann.get('external_id', ''):<20} {ann.get('title', '')[:30]:<30} v{ann.get('version', 1)}")


def main():
    parser = argparse.ArgumentParser(description="공고 삭제 스크립트")
    parser.add_argument("--delete", type=str, help="삭제할 공고 ID (UUID)")
    parser.add_argument("--external-id", type=str, help="외부 ID")
    parser.add_argument("--source", type=str, help="출처")
    parser.add_argument("--list", action="store_true", help="공고 목록 조회")
    parser.add_argument("--limit", type=int, default=20, help="목록 조회 시 최대 개수")
    
    args = parser.parse_args()
    
    if args.list:
        list_announcements(source=args.source, limit=args.limit)
    elif args.delete or (args.external_id and args.source):
        delete_announcement(
            announcement_id=args.delete,
            external_id=args.external_id,
            source=args.source
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

