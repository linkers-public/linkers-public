"""
Legal Chunker - 법률/계약 문서 전용 청킹
제n조 기준으로 문서를 분할
"""

import re
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass


@dataclass
class Section:
    """법률 조항 섹션"""
    title: str  # "제1조 (목적)"
    body: str   # 조항 본문


@dataclass
class LegalChunk:
    """법률 청크"""
    id: Optional[str] = None
    doc_id: Optional[str] = None
    source: Optional[str] = None
    file_path: Optional[str] = None
    section_title: Optional[str] = None
    chunk_index: int = 0
    text: str = ""


class LegalChunker:
    """법률/계약 문서 전용 청커"""
    
    # 조 헤딩 패턴 (제n조, 제 n 조 등 다양한 형식 지원)
    ARTICLE_PATTERN = re.compile(
        r"^제\s*\d+\s*조\b.*",
        re.MULTILINE
    )
    
    # 부칙, 부록 등도 섹션으로 인식
    SUBSECTION_PATTERNS = [
        re.compile(r"^제\s*\d+\s*조", re.MULTILINE),  # 제n조
        re.compile(r"^제\s*\d+\s*장", re.MULTILINE),  # 제n장
        re.compile(r"^제\s*\d+\s*절", re.MULTILINE),  # 제n절
        re.compile(r"^\d+\.\s", re.MULTILINE),        # 1. 2. 3.
        re.compile(r"^\(\d+\)", re.MULTILINE),        # (1) (2) (3)
        re.compile(r"^[가-힣]\.\s", re.MULTILINE),    # 가. 나. 다.
    ]
    
    def __init__(self, max_chars: int = 1200, overlap: int = 200):
        """
        Args:
            max_chars: 최대 청크 크기 (문자 수)
            overlap: 청크 간 오버랩 (문자 수)
        """
        self.max_chars = max_chars
        self.overlap = overlap
    
    def split_by_article(self, text: str) -> List[Section]:
        """
        텍스트를 조(제n조) 단위로 분할
        
        Args:
            text: 원본 텍스트
        
        Returns:
            Section 리스트
        """
        if not text or not text.strip():
            return []
        
        sections = []
        lines = text.split('\n')
        current_section = None
        current_body = []
        
        for line in lines:
            # 조 헤딩 발견
            if self.ARTICLE_PATTERN.match(line.strip()):
                # 이전 섹션 저장
                if current_section and current_body:
                    current_section.body = '\n'.join(current_body).strip()
                    if current_section.body:
                        sections.append(current_section)
                
                # 새 섹션 시작
                current_section = Section(
                    title=line.strip(),
                    body=""
                )
                current_body = []
            else:
                # 본문 추가
                if current_section:
                    current_body.append(line)
                else:
                    # 조 헤딩이 없으면 첫 줄을 제목으로
                    if not current_section:
                        current_section = Section(
                            title="전체",
                            body=""
                        )
                    current_body.append(line)
        
        # 마지막 섹션 저장
        if current_section:
            current_section.body = '\n'.join(current_body).strip()
            if current_section.body:
                sections.append(current_section)
        
        # 조 헤딩이 하나도 없으면 전체를 하나의 섹션으로
        if not sections:
            sections.append(Section(
                title="전체",
                body=text.strip()
            ))
        
        return sections
    
    def chunk_text(self, text: str, max_chars: int = None, overlap: int = None) -> List[str]:
        """
        텍스트를 길이 기준으로 청크 생성 (슬라이딩 윈도우)
        
        Args:
            text: 원본 텍스트
            max_chars: 최대 청크 크기 (기본값: self.max_chars)
            overlap: 오버랩 크기 (기본값: self.overlap)
        
        Returns:
            청크 텍스트 리스트
        """
        if max_chars is None:
            max_chars = self.max_chars
        if overlap is None:
            overlap = self.overlap
        
        if not text or not text.strip():
            return []
        
        text = text.strip()
        
        # 텍스트가 max_chars보다 짧으면 그대로 반환
        if len(text) <= max_chars:
            return [text]
        
        chunks = []
        current_pos = 0
        
        while current_pos < len(text):
            # 청크 끝 위치 계산
            chunk_end = min(current_pos + max_chars, len(text))
            
            # 오버랩을 고려한 시작 위치
            if current_pos > 0:
                chunk_start = max(0, current_pos - overlap)
            else:
                chunk_start = current_pos
            
            # 청크 텍스트 추출
            chunk_text = text[chunk_start:chunk_end]
            
            # 자연스러운 분할을 위해 문장 끝에서 자르기 시도
            if chunk_end < len(text):
                # 마지막 문장 끝 찾기
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')
                
                # 문장 끝이나 줄바꿈이 있으면 그 지점에서 자르기
                if last_period > len(chunk_text) * 0.7:  # 청크의 70% 이상에서 찾은 경우만
                    chunk_text = chunk_text[:last_period + 1]
                    chunk_end = chunk_start + len(chunk_text)
                elif last_newline > len(chunk_text) * 0.7:
                    chunk_text = chunk_text[:last_newline]
                    chunk_end = chunk_start + len(chunk_text)
            
            if chunk_text.strip():
                chunks.append(chunk_text.strip())
            
            # 다음 청크 시작 위치
            if chunk_end >= len(text):
                break
            current_pos = chunk_end
        
        return chunks if chunks else [text]
    
    def build_legal_chunks(
        self,
        text: str,
        source_name: str,
        file_path: str,
        doc_id: Optional[str] = None
    ) -> List[LegalChunk]:
        """
        텍스트에서 법률 청크 생성
        
        프로세스:
        1. split_by_article로 섹션 분할
        2. 각 섹션의 body에 chunk_text 적용
        3. LegalChunk 리스트 반환
        
        Args:
            text: 원본 텍스트
            source_name: 출처 (예: "moel", "mss", "mcst")
            file_path: 파일 경로
            doc_id: 문서 ID (선택)
        
        Returns:
            LegalChunk 리스트
        """
        chunks = []
        
        # 1. 섹션 분할
        sections = self.split_by_article(text)
        
        if not sections:
            # 섹션이 없으면 전체를 하나의 청크로
            section_chunks = self.chunk_text(text)
            for i, chunk_text in enumerate(section_chunks):
                chunks.append(LegalChunk(
                    doc_id=doc_id,
                    source=source_name,
                    file_path=file_path,
                    section_title="전체",
                    chunk_index=i,
                    text=chunk_text
                ))
            return chunks
        
        # 2. 각 섹션을 청크로 분할
        global_chunk_index = 0
        for section in sections:
            section_chunks = self.chunk_text(section.body)
            
            for i, chunk_text in enumerate(section_chunks):
                chunks.append(LegalChunk(
                    doc_id=doc_id,
                    source=source_name,
                    file_path=file_path,
                    section_title=section.title,
                    chunk_index=global_chunk_index,
                    text=chunk_text
                ))
                global_chunk_index += 1
        
        return chunks


def extract_doc_type_from_path(file_path: str) -> str:
    """
    파일 경로에서 문서 타입 추출
    
    Args:
        file_path: 파일 경로
    
    Returns:
        문서 타입 ("law", "standard_contract", "manual", "case")
    """
    path_lower = file_path.lower()
    
    if "laws" in path_lower or "법" in path_lower:
        return "law"
    elif "standard_contracts" in path_lower or "계약" in path_lower or "contract" in path_lower:
        return "standard_contract"
    elif "manuals" in path_lower or "매뉴얼" in path_lower or "manual" in path_lower:
        return "manual"
    elif "cases" in path_lower or "케이스" in path_lower or "case" in path_lower:
        return "case"
    else:
        return "law"  # 기본값

