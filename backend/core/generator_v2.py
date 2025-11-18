"""
Generator v2 - 실전형
임베딩 생성 및 LLM 분석
"""

from typing import List, Dict, Any, Optional
import os
import json
from openai import OpenAI
from config import settings

# 로컬 임베딩 모델 (선택사항)
_local_embedding_model = None
_ollama_llm = None

def _get_local_embedding_model():
    """로컬 임베딩 모델 지연 로드"""
    global _local_embedding_model
    if _local_embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            import os
            
            print(f"[로딩] 로컬 임베딩 모델: {settings.local_embedding_model}")
            
            # GPU 우선 사용 (CUDA 사용 가능 시)
            if torch.cuda.is_available():
                device = "cuda"
                device_name = torch.cuda.get_device_name(0)
                print(f"[GPU] CUDA 사용 가능: {device_name}")
            else:
                device = "cpu"
                print(f"[CPU] CUDA 사용 불가, CPU 사용")
            
            # 환경 변수로 device 강제 지정 (meta tensor 문제 방지)
            os.environ.setdefault("TORCH_DEVICE", device)
            
            try:
                # 첫 번째 시도: device를 명시적으로 지정 (GPU 우선)
                _local_embedding_model = SentenceTransformer(
                    settings.local_embedding_model,
                    device=device
                )
                print(f"[완료] 로컬 임베딩 모델 로드 완료 (device: {device})")
            except Exception as e:
                # meta tensor 에러 발생 시 다른 방법으로 재시도
                if "meta tensor" in str(e).lower() or "to_empty" in str(e).lower():
                    print(f"[경고] 모델 로딩 에러 발생 (meta tensor), 재시도 중...: {str(e)}")
                    # 모델 캐시를 우회하고 직접 로드 시도
                    try:
                        # GPU가 있으면 GPU로, 없으면 CPU로 재시도
                        retry_device = "cuda" if torch.cuda.is_available() else "cpu"
                        _local_embedding_model = SentenceTransformer(
                            settings.local_embedding_model,
                            device=retry_device,
                            trust_remote_code=True
                        )
                        print(f"[완료] 로컬 임베딩 모델 재로드 완료 (device: {retry_device})")
                    except Exception as retry_e:
                        # 최종 시도: GPU가 있으면 GPU로, 없으면 CPU로
                        if torch.cuda.is_available():
                            print(f"[경고] 재시도 실패, GPU로 최종 시도 중...: {str(retry_e)}")
                            final_device = "cuda"
                        else:
                            print(f"[경고] 재시도 실패, CPU로 최종 시도 중...: {str(retry_e)}")
                            final_device = "cpu"
                        
                        _local_embedding_model = SentenceTransformer(
                            settings.local_embedding_model,
                            trust_remote_code=True,
                            device=final_device
                        )
                        print(f"[완료] 로컬 임베딩 모델 최종 로드 완료 (device: {final_device})")
                else:
                    raise
        except ImportError:
            raise ImportError("sentence-transformers가 설치되지 않았습니다. pip install sentence-transformers")
    return _local_embedding_model

def _get_ollama_llm():
    """Ollama LLM 지연 로드"""
    global _ollama_llm
    if _ollama_llm is None:
        try:
            # langchain-ollama 사용 (권장, deprecated 경고 없음)
            from langchain_ollama import OllamaLLM
            print(f"[연결] Ollama LLM: {settings.ollama_base_url} (모델: {settings.ollama_model})")
            _ollama_llm = OllamaLLM(
                base_url=settings.ollama_base_url,
                model=settings.ollama_model,
                temperature=settings.llm_temperature
            )
            print("[완료] Ollama LLM 연결 완료 (langchain-ollama)")
        except ImportError:
            try:
                # 대안: langchain-community의 Ollama 사용 (deprecated)
                from langchain_community.llms import Ollama
                print(f"[경고] langchain-ollama를 사용할 수 없습니다. deprecated된 langchain_community.llms.Ollama를 사용합니다.")
                print(f"[연결] Ollama LLM: {settings.ollama_base_url} (모델: {settings.ollama_model})")
                _ollama_llm = Ollama(
                    base_url=settings.ollama_base_url,
                    model=settings.ollama_model,
                    temperature=settings.llm_temperature
                )
                print("[완료] Ollama LLM 연결 완료")
            except ImportError:
                raise ImportError("Ollama 지원이 설치되지 않았습니다. pip install langchain-ollama 또는 pip install langchain-community")
        except Exception as e:
            raise Exception(f"Ollama 연결 실패: {str(e)}\n[팁] Ollama가 실행 중인지 확인하세요: ollama serve")
    return _ollama_llm


class LLMGenerator:
    """LLM 생성기 - 임베딩 및 분석"""
    
    def __init__(self):
        # 로컬 임베딩 사용 가능 여부 확인
        try:
            from sentence_transformers import SentenceTransformer
            settings.use_local_embedding = True
            _local_embedding_available = True
        except ImportError:
            _local_embedding_available = False
            settings.use_local_embedding = False
            print("[경고] sentence-transformers가 설치되지 않았습니다.")
            print("[해결] Windows Long Path를 활성화한 후 재시작하세요:")
            print("   관리자 PowerShell: New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\" -Name \"LongPathsEnabled\" -Value 1 -PropertyType DWORD -Force")
            raise ImportError("sentence-transformers가 필요합니다. Windows Long Path를 활성화하고 재시작한 후 pip install sentence-transformers를 실행하세요.")
        
        settings.use_ollama = True
        
        # 벡터 DB 선택: Supabase가 연결되어 있으면 우선 사용
        if settings.supabase_url:
            settings.use_chromadb = False
            print("[시스템] 무료 스택 사용")
            print(f"   - 벡터 DB: Supabase pgvector (연결됨)")
            print(f"   - 임베딩: 로컬 (sentence-transformers)")
        elif not settings.use_chromadb:
            # Supabase도 없고 ChromaDB도 명시 안 했으면 ChromaDB 기본 사용
            settings.use_chromadb = True
            print("[시스템] 무료 스택 사용")
            print(f"   - 벡터 DB: ChromaDB (로컬)")
            print(f"   - 임베딩: 로컬 (sentence-transformers)")
        else:
            print("[시스템] 무료 스택 사용")
            print(f"   - 벡터 DB: ChromaDB (로컬)")
            print(f"   - 임베딩: 로컬 (sentence-transformers)")
        
        self.use_local_embedding = settings.use_local_embedding
        self.use_ollama = settings.use_ollama
        self.disable_llm = settings.disable_llm
        self.use_openai = False  # 항상 False (무료 스택만 사용)
        self.client = None  # OpenAI 클라이언트 사용 안 함
        self.embedding_model = settings.local_embedding_model  # 로컬 임베딩 모델명 (호환성)
        
        self.llm_temperature = settings.llm_temperature
    
    def embed(self, texts: List[str], model_type: str = "doc") -> List[List[float]]:
        """
        텍스트 리스트 → 임베딩 벡터 리스트
        
        Args:
            texts: 텍스트 리스트
            model_type: 모델 타입 ("doc" 또는 "company")
                - "doc": 문서 임베딩 (공고문용, BAAI/bge-m3 권장)
                - "company": 기업 임베딩 (팀/기업용, multilingual-e5-large 또는 text-embedding-3-small)
        
        Returns:
            임베딩 벡터 리스트
        """
        if not texts:
            return []
        
        # 로컬 임베딩 모델 사용 (무료)
        if self.use_local_embedding:
            try:
                # 모델 타입에 따라 다른 모델 사용 (선택사항)
                # 현재는 기본 모델 사용, 추후 확장 가능
                model = _get_local_embedding_model()
                # 배치 크기 조정으로 속도 개선 (큰 배치는 더 빠름, 메모리 사용량 증가)
                batch_size = min(64, len(texts))  # 최대 64개씩 배치 처리
                embeddings = model.encode(
                    texts, 
                    convert_to_numpy=True, 
                    show_progress_bar=True,  # 진행 상황 표시
                    batch_size=batch_size,
                    normalize_embeddings=True  # 정규화로 품질 향상
                )
                return embeddings.tolist()
            except Exception as e:
                raise Exception(f"로컬 임베딩 생성 실패: {str(e)}")
        
        # OpenAI 임베딩 사용 (유료)
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            
            return [item.embedding for item in response.data]
        except Exception as e:
            raise Exception(f"임베딩 생성 실패: {str(e)}")
    
    def embed_one(self, text: str, model_type: str = "doc") -> List[float]:
        """
        단일 텍스트 임베딩
        
        Args:
            text: 텍스트
            model_type: 모델 타입 ("doc" 또는 "company")
        """
        return self.embed([text], model_type=model_type)[0]
    
    def analyze_announcement(
        self,
        text: str,
        seed_meta: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        공고문 구조화 분석 (LLM)
        
        Args:
            text: 공고 본문 텍스트
            seed_meta: 정규식으로 추출한 초기 메타데이터
        
        Returns:
            구조화된 분석 결과
        """
        if seed_meta is None:
            seed_meta = {}
        
        # 텍스트 길이 제한 (토큰 절약)
        text_preview = text[:8000] if len(text) > 8000 else text
        
        messages = [
            {
                "role": "system",
                "content": """당신은 공공입찰 공고 분석 전문가입니다.
주어진 공고문에서 핵심 정보를 정확하게 추출하여 JSON 형식으로 반환하세요.

필수 필드:
- project_name: 프로젝트명
- budget_min: 최소 예산 (숫자)
- budget_max: 최대 예산 (숫자)
- duration_months: 수행 기간 (개월, 숫자)
- essential_skills: 필수 기술 스택 (배열)
- preferred_skills: 우대 기술 스택 (배열)
- submission_docs: 제출 서류 목록 (배열)
- summary: 공고 요약 (200자 이내)
- deadline: 입찰 마감일 (YYYY-MM-DD 형식)

주의사항:
- 공고문에 명시된 내용만 추출
- 추측하지 말고, 정보가 없으면 null 또는 빈 배열
- 예산은 원 단위 숫자로 변환 (억→100000000, 만원→10000)
- JSON 형식만 반환 (설명 없이)"""
            },
            {
                "role": "user",
                "content": f"""초기 메타데이터 힌트:
{json.dumps(seed_meta, ensure_ascii=False)}

공고문:
{text_preview}

위 정보를 바탕으로 구조화된 분석 결과를 JSON으로 반환하세요."""
            }
        ]
        
        # LLM 비활성화 모드 (개발/테스트용 - 비용 절감)
        if self.disable_llm:
            print("[경고] LLM 분석이 비활성화되어 있습니다. 더미 데이터를 반환합니다.")
            return {
                "project_name": seed_meta.get("title", "분석 비활성화"),
                "budget_min": seed_meta.get("budget_min"),
                "budget_max": seed_meta.get("budget_max"),
                "duration_months": None,
                "essential_skills": [],
                "preferred_skills": [],
                "submission_docs": [],
                "summary": "LLM 분석이 비활성화되어 있습니다. 설정에서 DISABLE_LLM=false로 변경하세요.",
                "deadline": seed_meta.get("end_date")
            }
        
        # Ollama 사용 (해커톤 모드)
        if self.use_ollama:
            try:
                llm = _get_ollama_llm()
                # LangChain Ollama는 ChatModel이 아니므로 직접 호출
                prompt_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
                prompt_text += "\n\nJSON 형식으로만 응답하세요."
                
                response_text = llm.invoke(prompt_text)
                
                # JSON 추출 시도
                try:
                    result = json.loads(response_text)
                except:
                    # JSON이 아닌 경우 텍스트에서 추출 시도
                    import re
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        result = json.loads(json_match.group())
                    else:
                        result = {
                            "project_name": seed_meta.get("title", "분석 완료"),
                            "summary": response_text[:200]
                        }
                
                return result
            except Exception as e:
                print(f"[경고] Ollama 분석 오류: {str(e)}")
                return {
                    "project_name": seed_meta.get("title", "분석 실패"),
                    "summary": f"Ollama 분석 중 오류: {str(e)}"
                }
        
        # OpenAI 사용
        if not self.client:
            raise ValueError("LLM 클라이언트가 초기화되지 않았습니다.")
        
        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=self.llm_temperature
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text) if result_text else {}
            
            return result
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {str(e)}")
            return {
                "project_name": "분석 실패",
                "summary": "LLM 분석 중 오류가 발생했습니다."
            }
        except Exception as e:
            print(f"LLM 분석 오류: {str(e)}")
            return {
                "project_name": "분석 실패",
                "summary": f"오류: {str(e)}"
            }
    
    def generate_matching_rationale(
        self,
        team_data: Dict[str, Any],
        requirements: Dict[str, Any]
    ) -> str:
        """
        팀 추천 사유 생성
        
        Args:
            team_data: 팀 정보
            requirements: 프로젝트 요구사항
        
        Returns:
            추천 사유 텍스트
        """
        prompt = f"""다음 팀이 프로젝트에 적합한 이유를 3가지로 간결하게 요약하세요:

[프로젝트 요구사항]
- 필수 기술: {', '.join(requirements.get('essential_skills', []))}
- 우대 기술: {', '.join(requirements.get('preferred_skills', []))}
- 예산: {requirements.get('budget_range', '미정')}
- 기간: {requirements.get('duration', '미정')}

[팀 정보]
- 이름: {team_data.get('name', 'Unknown')}
- 기술: {', '.join(team_data.get('skills', []))}
- 경력: {team_data.get('experience_years', 0)}년
- 평점: {team_data.get('rating', 0)}/5.0

출력 형식 (번호 없이):
✓ [강점 1]
✓ [강점 2]
✓ [강점 3]
"""
        
        if self.disable_llm:
            return "LLM이 비활성화되어 있습니다. 설정에서 DISABLE_LLM=false로 변경하세요."
        
        # Ollama 사용
        if self.use_ollama:
            try:
                llm = _get_ollama_llm()
                full_prompt = f"당신은 프로젝트 매칭 전문가입니다.\n\n{prompt}"
                return llm.invoke(full_prompt)
            except Exception as e:
                return f"Ollama 생성 실패: {str(e)}"
        
        if not self.client:
            raise ValueError("LLM 클라이언트가 초기화되지 않았습니다.")
        
        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": "당신은 프로젝트 매칭 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.llm_temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"매칭 사유 생성 실패: {str(e)}"
    
    def generate_estimate_draft(
        self,
        project_info: Dict[str, Any],
        team_info: Dict[str, Any],
        past_estimates: List[str] = None
    ) -> str:
        """
        견적서 초안 생성
        
        Args:
            project_info: 프로젝트 정보
            team_info: 팀 정보
            past_estimates: 과거 유사 견적서 (참고용)
        
        Returns:
            견적서 초안 텍스트
        """
        if past_estimates is None:
            past_estimates = []
        
        prompt = f"""다음 정보를 바탕으로 공공사업 견적서 초안을 작성하세요:

[프로젝트 정보]
- 프로젝트명: {project_info.get('project_name', 'Unknown')}
- 예산 범위: {project_info.get('budget_range', '미정')}
- 수행 기간: {project_info.get('duration', '미정')}
- 필수 기술: {', '.join(project_info.get('essential_skills', []))}

[투입 인력]
- 팀명: {team_info.get('name', 'Unknown')}
- 보유 기술: {', '.join(team_info.get('skills', []))}
- 경력: {team_info.get('experience_years', 0)}년

[참고: 유사 프로젝트 견적]
{chr(10).join(past_estimates[:2]) if past_estimates else '참고 자료 없음'}

출력 형식:
## 1. 사업 개요
## 2. 투입 인력 및 비용
## 3. 세부 견적 내역
## 4. 총 예상 금액

각 항목을 간결하고 명확하게 작성하세요.
"""
        
        if self.disable_llm:
            return "LLM이 비활성화되어 있습니다. 설정에서 DISABLE_LLM=false로 변경하세요."
        
        # Ollama 사용
        if self.use_ollama:
            try:
                llm = _get_ollama_llm()
                full_prompt = f"당신은 견적서 작성 전문가입니다.\n\n{prompt}"
                return llm.invoke(full_prompt)
            except Exception as e:
                return f"Ollama 생성 실패: {str(e)}"
        
        if not self.client:
            raise ValueError("LLM 클라이언트가 초기화되지 않았습니다.")
        
        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": "당신은 견적서 작성 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.llm_temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return f"견적서 생성 실패: {str(e)}"

