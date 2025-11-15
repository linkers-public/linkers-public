# backend/core/document_processor.py

from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from typing import List, Dict
import re
from datetime import datetime


class DocumentProcessor:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def process_pdf(self, pdf_path: str) -> tuple[List, str]:
        """
        PDF를 처리하여 청크와 전체 텍스트 반환
        Returns: (chunks, full_text)
        """
        try:
            # PDF 로드 (pypdf 직접 사용)
            reader = PdfReader(pdf_path)
            pages = []
            
            # 각 페이지에서 텍스트 추출
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                pages.append({
                    "page_content": text,
                    "page_number": page_num + 1
                })
            
            # 전체 텍스트 추출
            full_text = "\n".join([page["page_content"] for page in pages])
            
            # 텍스트 정제
            cleaned_text = self._clean_text(full_text)
            
            # 청킹
            chunks = self.text_splitter.create_documents(
                texts=[cleaned_text],
                metadatas=[{
                    "source": pdf_path,
                    "doc_type": "공고문",
                    "processed_at": datetime.now().isoformat(),
                    "page_count": len(pages)
                }]
            )
            
            return chunks, cleaned_text
            
        except Exception as e:
            raise Exception(f"PDF 처리 중 오류: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """텍스트 정제"""
        # 중복 공백 제거
        text = re.sub(r'\s+', ' ', text)
        # 불필요한 특수문자 제거 (한글, 영문, 숫자, 기본 구두점만 유지)
        text = re.sub(r'[^\w\s가-힣.,()%\-:/]', '', text)
        return text.strip()
    
    def extract_structured_info(self, text: str) -> Dict:
        """
        정규식으로 구조화된 정보 추출
        """
        patterns = {
            "예산": [
                r'예산[:\s]*([0-9,]+)\s*(원|만원|억)',
                r'사업[비용]*[:\s]*([0-9,]+)\s*(원|만원|억)',
            ],
            "기간": [
                r'[수행]*기간[:\s]*([0-9]+)\s*(개월|일|년)',
                r'사업기간[:\s]*([0-9]+)\s*(개월|일|년)',
            ],
            "입찰마감": [
                r'마감[일]*[:\s]*(\d{4}[-./년]\d{1,2}[-./월]\d{1,2})',
                r'제출기한[:\s]*(\d{4}[-./년]\d{1,2}[-./월]\d{1,2})',
            ]
        }
        
        extracted = {}
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text)
                if match:
                    extracted[key] = match.group(1) + (match.group(2) if match.lastindex > 1 else "")
                    break
        
        return extracted
    
    def create_team_document(self, team_data: Dict) -> str:
        """팀 프로필을 검색 가능한 문서로 변환"""
        doc = f"""
        팀명: {team_data.get('name', 'Unknown')}
        팀 ID: {team_data.get('team_id', 'Unknown')}
        
        보유 기술:
        {', '.join(team_data.get('skills', []))}
        
        경력: {team_data.get('experience_years', 0)}년
        평점: {team_data.get('rating', 0)}/5.0
        지역: {team_data.get('location', 'Unknown')}
        
        주요 프로젝트:
        {chr(10).join(['- ' + p for p in team_data.get('projects', [])])}
        
        팀 소개:
        {team_data.get('description', '')}
        """
        return doc.strip()

