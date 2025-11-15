"""
DocumentProcessor v2 - 실전형
PDF → Text → Chunks 변환
"""

from typing import List, Dict, Any
import re
import os
from pathlib import Path
from pydantic import BaseModel

# langchain_text_splitters는 scipy/nltk 의존성으로 Windows에서 매우 느리므로
# 기본적으로 SimpleTextSplitter를 사용하고, 필요시에만 lazy import
LANGCHAIN_SPLITTER_AVAILABLE = False
RecursiveCharacterTextSplitter = None


class Chunk(BaseModel):
    """청크 모델"""
    index: int
    content: str
    metadata: Dict[str, Any]


class SimpleTextSplitter:
    """간단한 텍스트 분할기 (langchain_text_splitters 대체용)"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, separators: List[str] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]
    
    def create_documents(self, texts: List[str], metadatas: List[Dict[str, Any]] = None) -> List[Any]:
        """텍스트 리스트를 문서 리스트로 변환"""
        if metadatas is None:
            metadatas = [{}] * len(texts)
        
        documents = []
        for text, metadata in zip(texts, metadatas):
            chunks = self._split_text(text)
            for i, chunk_text in enumerate(chunks):
                # LangChain Document 형식과 호환되도록 page_content 속성 추가
                doc = type('Document', (), {
                    'page_content': chunk_text,
                    'metadata': {**metadata, 'chunk_index': i}
                })()
                documents.append(doc)
        
        return documents
    
    def _split_text(self, text: str) -> List[str]:
        """텍스트를 청크로 분할"""
        if not text:
            return []
        
        chunks = []
        current_pos = 0
        
        while current_pos < len(text):
            # 청크 크기 계산
            chunk_end = min(current_pos + self.chunk_size, len(text))
            
            # 오버랩을 고려한 시작 위치
            if current_pos > 0:
                chunk_start = max(0, current_pos - self.chunk_overlap)
            else:
                chunk_start = current_pos
            
            # 청크 텍스트 추출
            chunk_text = text[chunk_start:chunk_end]
            
            # 구분자를 사용하여 자연스러운 분할 시도
            if chunk_end < len(text):
                # 다음 구분자 찾기
                best_split = -1
                best_sep_len = 0
                for sep in self.separators:
                    if sep:
                        last_sep = chunk_text.rfind(sep)
                        if last_sep > len(chunk_text) * 0.5:  # 청크의 절반 이상에서 찾은 경우만
                            if last_sep > best_split:
                                best_split = last_sep
                                best_sep_len = len(sep)
                
                if best_split > 0:
                    chunk_text = chunk_text[:best_split + best_sep_len]
                    chunk_end = chunk_start + len(chunk_text)
            
            if chunk_text.strip():
                chunks.append(chunk_text.strip())
            
            # 다음 청크 시작 위치
            if chunk_end >= len(text):
                break
            current_pos = chunk_end
        
        return chunks if chunks else [text]


class DocumentProcessor:
    """문서 처리기 - PDF/텍스트 → 청크"""
    
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = (
            int(os.getenv("CHUNK_SIZE", "1000")) 
            if chunk_size is None 
            else chunk_size
        )
        self.chunk_overlap = (
            int(os.getenv("CHUNK_OVERLAP", "200")) 
            if chunk_overlap is None 
            else chunk_overlap
        )
        
        # 기본적으로 SimpleTextSplitter 사용 (Windows에서 scipy/nltk 로딩이 매우 느림)
        # langchain_text_splitters는 필요시에만 lazy import
        self.splitter = SimpleTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
    
    def pdf_to_text(self, pdf_path: str) -> str:
        """
        PDF → 텍스트 추출
        
        여러 방법을 시도:
        1. PyMuPDF (fitz) - 가장 강력함, 이미지 기반 PDF도 처리 가능
        2. pdfplumber - 표와 구조화된 데이터에 좋음
        3. PyPDFLoader - 기본 방법
        
        Args:
            pdf_path: PDF 파일 경로
        
        Returns:
            추출된 텍스트
        """
        # 파일 존재 확인
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")
        
        text = None
        error_messages = []
        
        # 방법 1: PyMuPDF (fitz) 시도 - 가장 강력함
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(pdf_path)
            text_parts = []
            
            print(f"[PDF 처리] PyMuPDF로 시도 중... (파일: {os.path.basename(pdf_path)})")
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                # 텍스트 추출
                page_text = page.get_text()
                if page_text and page_text.strip():
                    text_parts.append(page_text)
                    print(f"[PDF 처리] 페이지 {page_num + 1}: {len(page_text)}자 추출")
            
            doc.close()
            
            if text_parts:
                text = "\n".join(text_parts)
                if text and text.strip():
                    print(f"[PDF 처리] PyMuPDF로 텍스트 추출 성공 ({len(text_parts)}페이지, 총 {len(text)}자)")
                else:
                    print(f"[PDF 처리] PyMuPDF: 텍스트 추출했지만 내용이 비어있음")
                    error_messages.append("PyMuPDF: 텍스트를 추출했지만 내용이 비어있습니다")
            else:
                print(f"[PDF 처리] PyMuPDF: 텍스트를 추출할 수 없음 (이미지 기반 PDF일 수 있음)")
                error_messages.append("PyMuPDF: 텍스트를 추출할 수 없습니다 (이미지 기반 PDF일 수 있음)")
        except ImportError:
            print(f"[PDF 처리] PyMuPDF가 설치되지 않았습니다")
            error_messages.append("PyMuPDF가 설치되지 않았습니다 (pip install pymupdf)")
        except Exception as e:
            print(f"[PDF 처리] PyMuPDF 오류: {str(e)}")
            error_messages.append(f"PyMuPDF 실패: {str(e)}")
        
        # 방법 2: pdfplumber 시도 (표 처리에 좋음)
        if not text or not text.strip():
            try:
                import pdfplumber
                print(f"[PDF 처리] pdfplumber로 시도 중...")
                with pdfplumber.open(pdf_path) as pdf:
                    text_parts = []
                    for page_num, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text_parts.append(page_text)
                            print(f"[PDF 처리] pdfplumber 페이지 {page_num + 1}: {len(page_text)}자 추출")
                    
                    if text_parts:
                        text = "\n".join(text_parts)
                        if text and text.strip():
                            print(f"[PDF 처리] pdfplumber로 텍스트 추출 성공 ({len(text_parts)}페이지, 총 {len(text)}자)")
                        else:
                            print(f"[PDF 처리] pdfplumber: 텍스트 추출했지만 내용이 비어있음")
                            error_messages.append("pdfplumber: 텍스트를 추출했지만 내용이 비어있습니다")
                    else:
                        print(f"[PDF 처리] pdfplumber: 텍스트를 추출할 수 없음")
                        error_messages.append("pdfplumber: 텍스트를 추출할 수 없습니다")
            except ImportError:
                print(f"[PDF 처리] pdfplumber가 설치되지 않았습니다")
                error_messages.append("pdfplumber가 설치되지 않았습니다 (pip install pdfplumber)")
            except Exception as e:
                print(f"[PDF 처리] pdfplumber 오류: {str(e)}")
                error_messages.append(f"pdfplumber 실패: {str(e)}")
        
        # 방법 3: pypdf 시도 (기본 방법)
        if not text or not text.strip():
            try:
                from pypdf import PdfReader
                print(f"[PDF 처리] pypdf로 시도 중...")
                reader = PdfReader(pdf_path)
                pages = []
                
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        pages.append(page_text)
                
                if pages:
                    text = "\n".join(pages)
                    if text and text.strip():
                        print(f"[PDF 처리] pypdf로 텍스트 추출 성공 ({len(pages)}페이지, 총 {len(text)}자)")
                    else:
                        print(f"[PDF 처리] pypdf: 텍스트 추출했지만 내용이 비어있음")
                        error_messages.append("pypdf: 텍스트를 추출했지만 내용이 비어있습니다")
                else:
                    print(f"[PDF 처리] pypdf: 페이지를 읽을 수 없음")
                    error_messages.append("pypdf: 페이지를 읽을 수 없습니다")
            except ImportError:
                print(f"[PDF 처리] pypdf가 설치되지 않았습니다")
                error_messages.append("pypdf가 설치되지 않았습니다 (pip install pypdf)")
            except Exception as e:
                print(f"[PDF 처리] pypdf 오류: {str(e)}")
                error_messages.append(f"pypdf 실패: {str(e)}")
        
        # 방법 4: OCR 시도 (스캔된 이미지 PDF용)
        if not text or not text.strip():
            try:
                import pytesseract
                from pdf2image import convert_from_path
                print(f"[PDF 처리] OCR로 시도 중... (스캔된 PDF 처리)")
                
                # PDF를 이미지로 변환
                images = convert_from_path(pdf_path, dpi=300)
                text_parts = []
                
                for page_num, image in enumerate(images):
                    # OCR 수행
                    page_text = pytesseract.image_to_string(image, lang='kor+eng')
                    if page_text and page_text.strip():
                        text_parts.append(page_text)
                        print(f"[PDF 처리] OCR 페이지 {page_num + 1}: {len(page_text)}자 추출")
                
                if text_parts:
                    text = "\n".join(text_parts)
                    if text and text.strip():
                        print(f"[PDF 처리] OCR로 텍스트 추출 성공 ({len(text_parts)}페이지, 총 {len(text)}자)")
                    else:
                        print(f"[PDF 처리] OCR: 텍스트 추출했지만 내용이 비어있음")
                        error_messages.append("OCR: 텍스트를 추출했지만 내용이 비어있습니다")
                else:
                    print(f"[PDF 처리] OCR: 텍스트를 추출할 수 없음")
                    error_messages.append("OCR: 텍스트를 추출할 수 없습니다")
            except ImportError as e:
                missing_module = str(e).split("'")[1] if "'" in str(e) else "pytesseract 또는 pdf2image"
                print(f"[PDF 처리] OCR 라이브러리가 설치되지 않았습니다: {missing_module}")
                error_messages.append(f"OCR: {missing_module}가 설치되지 않았습니다 (pip install pytesseract pdf2image)")
            except Exception as e:
                print(f"[PDF 처리] OCR 오류: {str(e)}")
                error_messages.append(f"OCR 실패: {str(e)}")
        
        # 모든 방법 실패
        if not text or not text.strip():
            error_msg = "PDF 파일에서 텍스트를 추출할 수 없습니다.\n"
            error_msg += "파일이 이미지로만 구성되어 있거나 텍스트가 없을 수 있습니다.\n\n"
            
            if error_messages:
                error_msg += "시도한 방법:\n"
                for msg in error_messages:
                    error_msg += f"  - {msg}\n"
            else:
                error_msg += "시도한 방법: PyMuPDF, pdfplumber, pypdf, OCR 모두 시도했지만 텍스트를 추출할 수 없었습니다.\n"
            
            error_msg += "\n[해결 방법]\n"
            error_msg += "1. PyMuPDF 설치 확인: pip install pymupdf\n"
            error_msg += "2. pdfplumber 설치 확인: pip install pdfplumber\n"
            error_msg += "3. OCR 설치 (스캔된 PDF용): pip install pytesseract pdf2image\n"
            error_msg += "   - Tesseract OCR 엔진도 설치 필요: https://github.com/tesseract-ocr/tesseract\n"
            error_msg += "4. 다른 PDF 파일로 테스트해보세요."
            
            print(f"[PDF 처리] 최종 실패: 모든 방법 시도 완료, 텍스트 추출 불가")
            raise ValueError(error_msg)
        
        # 텍스트 정제
        text = self._clean_text(text)
        
        # 정제 후에도 텍스트가 있는지 확인
        if not text or not text.strip():
            raise ValueError(f"PDF 텍스트 정제 후 내용이 비어있습니다. 파일 형식이 올바르지 않을 수 있습니다: {pdf_path}")
        
        return text
    
    def hwp_to_text(self, hwp_path: str) -> str:
        """
        HWP/HWPX/HWPS → 텍스트 추출
        
        Args:
            hwp_path: HWP, HWPX 또는 HWPS 파일 경로
        
        Returns:
            추출된 텍스트
        """
        file_path = Path(hwp_path)
        suffix = file_path.suffix.lower()
        
        if suffix in ['.hwpx', '.hwps']:
            return self._hwpx_to_text(hwp_path)
        elif suffix == '.hwp':
            return self._hwp_to_text(hwp_path)
        else:
            raise ValueError(f"지원하지 않는 HWP 형식: {suffix}")
    
    def _hwpx_to_text(self, hwpx_path: str) -> str:
        """
        HWPX (XML 기반) → 텍스트 추출
        """
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            
            # HWPX는 ZIP 압축 파일
            with zipfile.ZipFile(hwpx_path, 'r') as zip_ref:
                # Contents/section0.xml에서 텍스트 추출
                try:
                    section_xml = zip_ref.read('Contents/section0.xml')
                    root = ET.fromstring(section_xml)
                    
                    # 텍스트 추출 (간단한 방법)
                    text_parts = []
                    for elem in root.iter():
                        if elem.text:
                            text_parts.append(elem.text.strip())
                    
                    text = '\n'.join(text_parts)
                    return self._clean_text(text)
                except KeyError:
                    # section0.xml이 없으면 다른 방법 시도
                    return self._extract_text_from_hwpx_zip(zip_ref)
        except Exception as e:
            raise Exception(f"HWPX 처리 실패: {str(e)}")
    
    def _extract_text_from_hwpx_zip(self, zip_ref) -> str:
        """HWPX ZIP에서 텍스트 추출 (대체 방법)"""
        text_parts = []
        for name in zip_ref.namelist():
            if name.endswith('.xml'):
                try:
                    xml_content = zip_ref.read(name)
                    root = ET.fromstring(xml_content)
                    for elem in root.iter():
                        if elem.text and elem.text.strip():
                            text_parts.append(elem.text.strip())
                except:
                    continue
        return self._clean_text('\n'.join(text_parts))
    
    def _hwp_to_text(self, hwp_path: str) -> str:
        """
        HWP (바이너리) → 텍스트 추출
        
        주의: HWP 바이너리 형식은 복잡하므로 외부 서비스 사용 권장
        """
        # 방법 1: 외부 변환 서비스 사용 (권장)
        hwp_converter_url = os.getenv("HWP_CONVERTER_URL", "http://localhost:8001/convert")
        
        try:
            import requests
            
            with open(hwp_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(
                    hwp_converter_url,
                    files=files,
                    timeout=30
                )
                response.raise_for_status()
                return self._clean_text(response.text)
        except Exception as e:
            print(f"[경고] HWP 변환 서비스 실패: {str(e)}")
            print("[팁] HWP 변환 서비스를 설정하거나 olefile 라이브러리를 사용하세요.")
            
            # 방법 2: olefile로 기본 추출 시도 (제한적)
            try:
                import olefile
                
                if olefile.isOleFile(hwp_path):
                    ole = olefile.OleFileIO(hwp_path)
                    # HWP 내부 구조에서 텍스트 추출 시도
                    # 주의: 이는 기본적인 추출만 가능
                    text_parts = []
                    for stream in ole.listdir():
                        if 'BodyText' in str(stream):
                            try:
                                data = ole.openstream(stream).read()
                                # 간단한 텍스트 추출 (완벽하지 않음)
                                text = data.decode('utf-8', errors='ignore')
                                text_parts.append(text)
                            except:
                                continue
                    ole.close()
                    return self._clean_text('\n'.join(text_parts))
                else:
                    raise Exception("올바른 HWP 파일이 아닙니다")
            except ImportError:
                raise Exception(
                    "HWP 파일 처리를 위해 다음 중 하나가 필요합니다:\n"
                    "1. HWP 변환 서비스 설정 (HWP_CONVERTER_URL)\n"
                    "2. olefile 라이브러리 설치: pip install olefile"
                )
            except Exception as e:
                raise Exception(f"HWP 처리 실패: {str(e)}")
    
    def html_to_text(self, html_path: str) -> str:
        """
        HTML → 텍스트 추출
        
        Args:
            html_path: HTML 파일 경로
            
        Returns:
            추출된 텍스트
        """
        try:
            from html.parser import HTMLParser
            from html import unescape
            
            class TextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text_parts = []
                    self.skip_tags = {'script', 'style', 'meta', 'link', 'head'}
                    self.current_tag = None
                
                def handle_starttag(self, tag, attrs):
                    self.current_tag = tag.lower()
                    if tag.lower() in {'br', 'p', 'div', 'li'}:
                        self.text_parts.append('\n')
                
                def handle_endtag(self, tag):
                    if tag.lower() in {'p', 'div', 'li', 'tr'}:
                        self.text_parts.append('\n')
                    self.current_tag = None
                
                def handle_data(self, data):
                    if self.current_tag not in self.skip_tags:
                        self.text_parts.append(data)
            
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            parser = TextExtractor()
            parser.feed(html_content)
            text = ''.join(parser.text_parts)
            
            # HTML 엔티티 디코딩
            text = unescape(text)
            
            # 텍스트 정제
            text = self._clean_text(text)
            
            return text
        except Exception as e:
            raise Exception(f"HTML 처리 실패: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """텍스트 정제"""
        # 중복 공백 제거
        text = re.sub(r'\s+', ' ', text)
        # 불필요한 특수문자 제거 (한글, 영문, 숫자, 기본 구두점만 유지)
        text = re.sub(r'[^\w\s가-힣.,()%\-:/]', '', text)
        return text.strip()
    
    def to_chunks(self, text: str, base_meta: Dict[str, Any] = None) -> List[Chunk]:
        """
        텍스트 → 청크 변환
        
        Args:
            text: 원본 텍스트
            base_meta: 기본 메타데이터
        
        Returns:
            청크 리스트
        """
        if base_meta is None:
            base_meta = {}
        
        # 텍스트 유효성 검사
        if text is None:
            raise ValueError("텍스트가 None입니다. 파일에서 텍스트를 추출하지 못했습니다.")
        
        if not isinstance(text, str):
            raise ValueError(f"텍스트가 문자열이 아닙니다. 타입: {type(text)}")
        
        # 텍스트가 비어있거나 공백만 있는지 확인
        text_stripped = text.strip()
        if not text_stripped:
            raise ValueError("텍스트가 비어있습니다. 파일이 비어있거나 텍스트 추출에 실패했습니다.")
        
        # 텍스트가 너무 짧은지 확인 (최소 길이 체크)
        if len(text_stripped) < 10:
            raise ValueError(f"텍스트가 너무 짧습니다 (길이: {len(text_stripped)}). 최소 10자 이상의 텍스트가 필요합니다.")
        
        try:
            # LangChain Document로 변환
            docs = self.splitter.create_documents([text])
            
            # 문서가 생성되지 않은 경우
            if not docs:
                raise ValueError(f"청크 분할 실패: 텍스트 길이 {len(text)}자, chunk_size={self.chunk_size}, chunk_overlap={self.chunk_overlap}")
            
            # Chunk 모델로 변환
            chunks = [
                Chunk(
                    index=i,
                    content=d.page_content,
                    metadata={
                        **base_meta,
                        "chunk_size": len(d.page_content),
                        "total_chunks": len(docs)
                    }
                )
                for i, d in enumerate(docs)
            ]
            
            # 빈 청크 필터링 (내용이 없는 청크 제거)
            chunks = [chunk for chunk in chunks if chunk.content.strip()]
            
            if not chunks:
                raise ValueError("모든 청크가 비어있습니다. 텍스트 정제 과정에서 내용이 모두 제거되었을 수 있습니다.")
            
            return chunks
            
        except Exception as e:
            # 더 자세한 오류 정보 제공
            error_msg = f"청크 생성 중 오류 발생: {str(e)}"
            if isinstance(e, ValueError):
                raise ValueError(error_msg)
            else:
                raise Exception(error_msg)
    
    def extract_structured_meta(self, text: str) -> Dict[str, Any]:
        """
        정규식으로 구조화된 메타데이터 추출
        (LLM 분석 전 초기 힌트 제공)
        
        Args:
            text: 공고 텍스트
        
        Returns:
            추출된 메타데이터
        """
        meta = {}
        
        # 예산 추출
        budget_patterns = [
            r'예산[:\s]*([0-9,]+)\s*(억|만원|원)',
            r'사업[비용]*[:\s]*([0-9,]+)\s*(억|만원|원)',
            r'(\d+)\s*억\s*원',
            r'₩?\s?([0-9,]+)\s*원',
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, text)
            if match:
                amount = match.group(1).replace(',', '')
                unit = match.group(2) if len(match.groups()) > 1 else '원'
                
                # 단위 변환
                if '억' in unit:
                    meta['budget_hint'] = f"{amount}억원"
                elif '만원' in unit:
                    meta['budget_hint'] = f"{amount}만원"
                else:
                    meta['budget_hint'] = f"{amount}원"
                break
        
        # 기간 추출
        period_patterns = [
            r'[수행]*기간[:\s]*([0-9]+)\s*(개월|일|년)',
            r'사업기간[:\s]*([0-9]+)\s*(개월|일|년)',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text)
            if match:
                meta['period_hint'] = f"{match.group(1)}{match.group(2)}"
                break
        
        # 입찰 마감일 추출
        deadline_patterns = [
            r'마감[일]*[:\s]*(\d{4}[-./년]\d{1,2}[-./월]\d{1,2})',
            r'제출기한[:\s]*(\d{4}[-./년]\d{1,2}[-./월]\d{1,2})',
        ]
        
        for pattern in deadline_patterns:
            match = re.search(pattern, text)
            if match:
                meta['deadline_hint'] = match.group(1)
                break
        
        return meta
    
    def process_file(
        self,
        file_path: str,
        file_type: str = None,
        base_meta: Dict[str, Any] = None
    ) -> tuple[str, List[Chunk]]:
        """
        파일 처리 (텍스트 추출 + 청킹)
        
        Args:
            file_path: 파일 경로
            file_type: 파일 타입 ('pdf', 'text', 'hwp', 'hwpx', 'html') - None이면 자동 감지
            base_meta: 기본 메타데이터
        
        Returns:
            (text, chunks)
        """
        # 파일 타입 자동 감지
        if file_type is None:
            suffix = Path(file_path).suffix.lower()
            if suffix == '.pdf':
                file_type = 'pdf'
            elif suffix in ['.hwp', '.hwpx', '.hwps']:
                file_type = 'hwp'
            elif suffix == '.txt':
                file_type = 'text'
            elif suffix in ['.html', '.htm']:
                file_type = 'html'
            else:
                raise ValueError(f"지원하지 않는 파일 형식: {suffix}")
        
        # 파일 타입별 처리
        if file_type == "pdf":
            text = self.pdf_to_text(file_path)
        elif file_type == "text":
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"텍스트 파일을 찾을 수 없습니다: {file_path}")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            except UnicodeDecodeError:
                # UTF-8 실패 시 다른 인코딩 시도
                try:
                    with open(file_path, 'r', encoding='cp949') as f:
                        text = f.read()
                except Exception as e:
                    raise Exception(f"텍스트 파일 인코딩 오류: {str(e)}")
            
            if not text or not text.strip():
                raise ValueError(f"텍스트 파일이 비어있습니다: {file_path}")
            
            text = self._clean_text(text)
            
            if not text or not text.strip():
                raise ValueError(f"텍스트 정제 후 내용이 비어있습니다: {file_path}")
        elif file_type == "hwp":
            text = self.hwp_to_text(file_path)
        elif file_type == "html":
            text = self.html_to_text(file_path)
        else:
            raise ValueError(f"지원하지 않는 파일 타입: {file_type}")
        
        # 텍스트 추출 검증
        if text is None:
            raise ValueError(f"파일에서 텍스트를 추출하지 못했습니다: {file_path}")
        
        if not isinstance(text, str):
            raise ValueError(f"추출된 텍스트가 문자열이 아닙니다. 타입: {type(text)}")
        
        text_stripped = text.strip()
        if not text_stripped:
            raise ValueError(f"추출된 텍스트가 비어있습니다: {file_path}")
        
        chunks = self.to_chunks(text, base_meta)
        
        return text, chunks

