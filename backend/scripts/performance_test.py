"""
성능 테스트 스크립트
RAG 시스템의 각 컴포넌트별 성능 측정
"""

import asyncio
import time
import statistics
from typing import List, Dict, Any
from pathlib import Path
import sys

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.generator_v2 import LLMGenerator
from core.legal_rag_service import LegalRAGService
from core.supabase_vector_store import SupabaseVectorStore
from core.document_processor_v2 import DocumentProcessor
from config import settings


class PerformanceTester:
    """성능 테스트 클래스"""
    
    def __init__(self):
        self.generator = LLMGenerator()
        self.legal_service = LegalRAGService(embedding_cache_size=100)
        self.vector_store = SupabaseVectorStore()
        self.processor = DocumentProcessor()
        self.results: Dict[str, List[float]] = {}
    
    def print_header(self, title: str):
        """헤더 출력"""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)
    
    def print_result(self, test_name: str, times: List[float], unit: str = "초"):
        """결과 출력"""
        if not times:
            print(f"❌ {test_name}: 측정 실패")
            return
        
        avg = statistics.mean(times)
        median = statistics.median(times)
        min_time = min(times)
        max_time = max(times)
        std_dev = statistics.stdev(times) if len(times) > 1 else 0
        
        print(f"\n📊 {test_name}")
        print(f"   평균: {avg:.3f} {unit}")
        print(f"   중앙값: {median:.3f} {unit}")
        print(f"   최소: {min_time:.3f} {unit}")
        print(f"   최대: {max_time:.3f} {unit}")
        print(f"   표준편차: {std_dev:.3f} {unit}")
        print(f"   측정 횟수: {len(times)}회")
        
        self.results[test_name] = times
    
    async def test_embedding_single(self, iterations: int = 10) -> List[float]:
        """단일 임베딩 생성 성능 테스트"""
        self.print_header("1. 단일 임베딩 생성 성능")
        
        test_texts = [
            "근로계약서의 수습 기간은 최대 3개월을 초과할 수 없다.",
            "임금은 매월 말일에 지급하며, 지급일이 휴일인 경우 그 전일로 지급한다.",
            "근로자는 정당한 사유 없이 근로를 제공하지 않을 수 없다.",
            "사용자는 근로자의 안전과 건강을 보호할 의무가 있다.",
            "근로시간은 1주 40시간을 초과할 수 없다.",
        ]
        
        times = []
        for i in range(iterations):
            text = test_texts[i % len(test_texts)]
            start = time.time()
            try:
                embedding = await asyncio.to_thread(self.generator.embed_one, text)
                elapsed = time.time() - start
                times.append(elapsed)
                print(f"   [{i+1}/{iterations}] {elapsed:.3f}초 - '{text[:30]}...'")
            except Exception as e:
                print(f"   ❌ [{i+1}/{iterations}] 실패: {str(e)}")
        
        return times
    
    async def test_embedding_batch(self, batch_sizes: List[int] = [1, 5, 10, 20]) -> Dict[int, List[float]]:
        """배치 임베딩 생성 성능 테스트"""
        self.print_header("2. 배치 임베딩 생성 성능")
        
        test_texts = [
            f"근로계약서 조항 {i}: 근로자는 정당한 사유 없이 근로를 제공하지 않을 수 없다."
            for i in range(50)
        ]
        
        results = {}
        for batch_size in batch_sizes:
            print(f"\n   배치 크기: {batch_size}")
            times = []
            for i in range(3):  # 각 배치 크기당 3회 측정
                batch = test_texts[:batch_size]
                start = time.time()
                try:
                    embeddings = await asyncio.to_thread(self.generator.embed, batch)
                    elapsed = time.time() - start
                    times.append(elapsed)
                    avg_per_item = elapsed / batch_size
                    print(f"      [{i+1}/3] {elapsed:.3f}초 (항목당 {avg_per_item:.3f}초)")
                except Exception as e:
                    print(f"      ❌ [{i+1}/3] 실패: {str(e)}")
            
            if times:
                avg = statistics.mean(times)
                avg_per_item = avg / batch_size
                print(f"      평균: {avg:.3f}초 (항목당 {avg_per_item:.3f}초)")
                results[batch_size] = times
        
        return results
    
    async def test_embedding_cache(self, iterations: int = 20) -> Dict[str, List[float]]:
        """임베딩 캐시 효과 테스트"""
        self.print_header("3. 임베딩 캐시 효과")
        
        test_text = "근로계약서의 수습 기간은 최대 3개월을 초과할 수 없다."
        
        # 캐시 없이 (첫 실행)
        print("\n   캐시 없이 (첫 실행):")
        first_times = []
        for i in range(5):
            start = time.time()
            try:
                embedding = await asyncio.to_thread(self.generator.embed_one, test_text)
                elapsed = time.time() - start
                first_times.append(elapsed)
                print(f"      [{i+1}/5] {elapsed:.3f}초")
            except Exception as e:
                print(f"      ❌ [{i+1}/5] 실패: {str(e)}")
        
        # 캐시 있음 (재사용)
        print("\n   캐시 있음 (재사용):")
        cached_times = []
        for i in range(iterations):
            start = time.time()
            try:
                # LegalRAGService의 캐시를 사용
                embedding = await self.legal_service._get_embedding(test_text)
                elapsed = time.time() - start
                cached_times.append(elapsed)
                if i < 5:
                    print(f"      [{i+1}/{iterations}] {elapsed:.3f}초")
            except Exception as e:
                print(f"      ❌ [{i+1}/{iterations}] 실패: {str(e)}")
        
        return {
            "캐시 없음": first_times,
            "캐시 있음": cached_times
        }
    
    async def test_vector_search(self, iterations: int = 10) -> List[float]:
        """벡터 검색 성능 테스트"""
        self.print_header("4. 벡터 검색 성능")
        
        queries = [
            "수습 기간 해고 조건",
            "임금 지급 시기",
            "근로시간 제한",
            "휴가 및 휴직",
            "해고 사유 및 절차",
        ]
        
        times = []
        for i in range(iterations):
            query = queries[i % len(queries)]
            start = time.time()
            try:
                chunks = await self.legal_service._search_legal_chunks(query=query, top_k=10)
                elapsed = time.time() - start
                times.append(elapsed)
                print(f"   [{i+1}/{iterations}] {elapsed:.3f}초 - '{query}' (결과: {len(chunks)}개)")
            except Exception as e:
                print(f"   ❌ [{i+1}/{iterations}] 실패: {str(e)}")
        
        return times
    
    async def test_llm_response(self, iterations: int = 5) -> List[float]:
        """LLM 응답 생성 성능 테스트"""
        self.print_header("5. LLM 응답 생성 성능")
        
        queries = [
            "수습 기간 해고 조건은 어떻게 되나요?",
            "임금 지급 시기는 언제인가요?",
            "근로시간 제한은 어떻게 되나요?",
        ]
        
        times = []
        for i in range(iterations):
            query = queries[i % len(queries)]
            start = time.time()
            try:
                # 간단한 LLM 호출 테스트
                response = await asyncio.to_thread(
                    self.generator.llm.invoke,
                    f"다음 질문에 간단히 답변하세요: {query}"
                )
                elapsed = time.time() - start
                times.append(elapsed)
                response_text = response.content[:50] if hasattr(response, 'content') else str(response)[:50]
                print(f"   [{i+1}/{iterations}] {elapsed:.3f}초 - '{query}'")
                print(f"      응답: {response_text}...")
            except Exception as e:
                print(f"   ❌ [{i+1}/{iterations}] 실패: {str(e)}")
        
        return times
    
    async def test_dual_rag_search(self, iterations: int = 5) -> List[float]:
        """Dual RAG 검색 성능 테스트"""
        self.print_header("6. Dual RAG 검색 성능")
        
        query = "수습 기간 해고 조건"
        doc_id = None  # 테스트용 doc_id (실제로는 존재하는 doc_id 사용)
        
        times = []
        for i in range(iterations):
            start = time.time()
            try:
                # 계약서 청크 검색과 법령 청크 검색을 병렬로 실행
                query_embedding = await self.legal_service._get_embedding(query)
                
                # 병렬 검색
                contract_task = self.legal_service._search_contract_chunks(
                    doc_id=doc_id or "test-doc-id",
                    query=query,
                    top_k=5
                ) if doc_id else asyncio.sleep(0)  # doc_id가 없으면 스킵
                
                legal_task = self.legal_service._search_legal_chunks(query=query, top_k=8)
                
                contract_chunks, legal_chunks = await asyncio.gather(
                    contract_task,
                    legal_task,
                    return_exceptions=True
                )
                
                elapsed = time.time() - start
                times.append(elapsed)
                
                contract_count = len(contract_chunks) if not isinstance(contract_chunks, Exception) else 0
                legal_count = len(legal_chunks) if not isinstance(legal_chunks, Exception) else 0
                
                print(f"   [{i+1}/{iterations}] {elapsed:.3f}초 - 계약서: {contract_count}개, 법령: {legal_count}개")
            except Exception as e:
                print(f"   ❌ [{i+1}/{iterations}] 실패: {str(e)}")
        
        return times
    
    async def test_contract_analysis_pipeline(self, test_text: str = None) -> Dict[str, float]:
        """전체 계약서 분석 파이프라인 성능 테스트"""
        self.print_header("7. 전체 계약서 분석 파이프라인")
        
        if not test_text:
            test_text = """
            제1조 (근로기간)
            본 계약의 근로기간은 2024년 1월 1일부터 2024년 12월 31일까지로 한다.
            
            제2조 (수습기간)
            근로자는 수습기간 6개월을 거쳐야 하며, 수습기간 중에는 정당한 사유 없이 해고할 수 있다.
            
            제3조 (근로시간)
            근로시간은 1주 50시간을 초과할 수 없으며, 휴게시간은 포함하지 않는다.
            
            제4조 (임금)
            임금은 매월 말일에 지급하며, 지급일이 휴일인 경우 그 전일로 지급한다.
            """
        
        pipeline_times = {}
        
        # 1. 텍스트 추출 (이미 추출된 텍스트 사용)
        print("\n   1단계: 텍스트 추출 (스킵 - 이미 추출됨)")
        
        # 2. 청킹
        print("   2단계: 청킹")
        start = time.time()
        try:
            chunks = self.processor.to_contract_chunks(test_text)
            elapsed = time.time() - start
            pipeline_times["청킹"] = elapsed
            print(f"      완료: {elapsed:.3f}초 ({len(chunks)}개 청크)")
        except Exception as e:
            print(f"      ❌ 실패: {str(e)}")
            pipeline_times["청킹"] = 0
        
        # 3. 임베딩 생성
        print("   3단계: 임베딩 생성")
        start = time.time()
        try:
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = await asyncio.to_thread(self.generator.embed, chunk_texts)
            elapsed = time.time() - start
            pipeline_times["임베딩 생성"] = elapsed
            print(f"      완료: {elapsed:.3f}초 ({len(embeddings)}개 임베딩)")
        except Exception as e:
            print(f"      ❌ 실패: {str(e)}")
            pipeline_times["임베딩 생성"] = 0
        
        # 4. Dual RAG 검색
        print("   4단계: Dual RAG 검색")
        start = time.time()
        try:
            query = self.legal_service._build_query_from_contract(test_text, None)
            query_embedding = await self.legal_service._get_embedding(query)
            
            legal_chunks = await self.legal_service._search_legal_chunks(query=query, top_k=8)
            elapsed = time.time() - start
            pipeline_times["RAG 검색"] = elapsed
            print(f"      완료: {elapsed:.3f}초 (법령 청크: {len(legal_chunks)}개)")
        except Exception as e:
            print(f"      ❌ 실패: {str(e)}")
            pipeline_times["RAG 검색"] = 0
        
        # 5. LLM 분석
        print("   5단계: LLM 분석")
        start = time.time()
        try:
            result = await self.legal_service._llm_summarize_risk(
                query=query,
                contract_text=test_text,
                contract_chunks=[],
                grounding_chunks=legal_chunks[:5]  # 상위 5개만 사용
            )
            elapsed = time.time() - start
            pipeline_times["LLM 분석"] = elapsed
            print(f"      완료: {elapsed:.3f}초 (이슈: {len(result.issues)}개)")
        except Exception as e:
            print(f"      ❌ 실패: {str(e)}")
            pipeline_times["LLM 분석"] = 0
        
        # 전체 시간
        total_time = sum(pipeline_times.values())
        pipeline_times["전체"] = total_time
        print(f"\n   총 소요 시간: {total_time:.3f}초")
        
        return pipeline_times
    
    async def test_async_parallelism(self) -> Dict[str, float]:
        """비동기 병렬 처리 효과 테스트"""
        self.print_header("8. 비동기 병렬 처리 효과")
        
        queries = [
            "수습 기간 해고 조건",
            "임금 지급 시기",
            "근로시간 제한",
        ]
        
        # 순차 실행
        print("\n   순차 실행:")
        start = time.time()
        for query in queries:
            try:
                await self.legal_service._search_legal_chunks(query=query, top_k=5)
            except Exception as e:
                print(f"      ❌ 실패: {str(e)}")
        sequential_time = time.time() - start
        print(f"      완료: {sequential_time:.3f}초")
        
        # 병렬 실행
        print("\n   병렬 실행:")
        start = time.time()
        try:
            tasks = [
                self.legal_service._search_legal_chunks(query=query, top_k=5)
                for query in queries
            ]
            await asyncio.gather(*tasks)
        except Exception as e:
            print(f"      ❌ 실패: {str(e)}")
        parallel_time = time.time() - start
        print(f"      완료: {parallel_time:.3f}초")
        
        speedup = sequential_time / parallel_time if parallel_time > 0 else 0
        print(f"\n   속도 향상: {speedup:.2f}배")
        
        return {
            "순차 실행": sequential_time,
            "병렬 실행": parallel_time,
            "속도 향상": speedup
        }
    
    def print_summary(self):
        """전체 결과 요약"""
        self.print_header("성능 테스트 결과 요약")
        
        print("\n📈 주요 지표:")
        for test_name, times in self.results.items():
            if times:
                avg = statistics.mean(times)
                print(f"   {test_name}: 평균 {avg:.3f}초")
        
        print("\n💡 최적화 권장사항:")
        if "단일 임베딩" in self.results and "배치 임베딩" in self.results:
            single_avg = statistics.mean(self.results.get("단일 임베딩", [0]))
            print(f"   - 배치 임베딩 사용 시 속도 향상 가능")
        
        if "캐시 없음" in self.results and "캐시 있음" in self.results:
            no_cache = statistics.mean(self.results.get("캐시 없음", [0]))
            with_cache = statistics.mean(self.results.get("캐시 있음", [0]))
            if no_cache > 0:
                cache_speedup = no_cache / with_cache if with_cache > 0 else 0
                print(f"   - 캐시 사용 시 {cache_speedup:.2f}배 속도 향상")
        
        print("\n✅ 테스트 완료!")


async def main():
    """메인 함수"""
    print("🚀 RAG 시스템 성능 테스트 시작")
    print(f"   임베딩 모델: {settings.local_embedding_model}")
    print(f"   LLM 모델: {settings.ollama_model}")
    print(f"   벡터 DB: {'Supabase' if settings.supabase_url else 'ChromaDB'}")
    
    tester = PerformanceTester()
    
    try:
        # 1. 단일 임베딩 생성
        single_times = await tester.test_embedding_single(iterations=10)
        tester.print_result("단일 임베딩 생성", single_times)
        
        # 2. 배치 임베딩 생성
        batch_results = await tester.test_embedding_batch(batch_sizes=[1, 5, 10, 20])
        for batch_size, times in batch_results.items():
            tester.print_result(f"배치 임베딩 ({batch_size}개)", times)
        
        # 3. 캐시 효과
        cache_results = await tester.test_embedding_cache(iterations=20)
        for cache_type, times in cache_results.items():
            tester.print_result(f"임베딩 생성 ({cache_type})", times)
        
        # 4. 벡터 검색
        search_times = await tester.test_vector_search(iterations=10)
        tester.print_result("벡터 검색", search_times)
        
        # 5. LLM 응답 생성
        llm_times = await tester.test_llm_response(iterations=5)
        tester.print_result("LLM 응답 생성", llm_times)
        
        # 6. Dual RAG 검색
        dual_rag_times = await tester.test_dual_rag_search(iterations=5)
        tester.print_result("Dual RAG 검색", dual_rag_times)
        
        # 7. 전체 파이프라인
        pipeline_results = await tester.test_contract_analysis_pipeline()
        for stage, time_taken in pipeline_results.items():
            print(f"\n   {stage}: {time_taken:.3f}초")
        
        # 8. 비동기 병렬 처리
        async_results = await tester.test_async_parallelism()
        for test_type, time_taken in async_results.items():
            if isinstance(time_taken, float):
                print(f"\n   {test_type}: {time_taken:.3f}초")
            else:
                print(f"\n   {test_type}: {time_taken:.2f}배")
        
        # 요약
        tester.print_summary()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ 테스트가 중단되었습니다.")
    except Exception as e:
        print(f"\n\n❌ 테스트 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

