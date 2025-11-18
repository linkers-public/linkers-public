"""
로깅 설정 통합 모듈
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime
from pathlib import Path


def setup_logging(
    log_dir: str = "./logs",
    log_level: int = logging.INFO,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
    enable_file_logging: bool = True,
    enable_console_logging: bool = True,
) -> dict:
    """
    로깅 설정 초기화
    
    Args:
        log_dir: 로그 파일 저장 디렉토리
        log_level: 로그 레벨 (logging.INFO, logging.DEBUG 등)
        max_bytes: 로그 파일 최대 크기 (바이트)
        backup_count: 백업 파일 개수
        enable_file_logging: 파일 로깅 활성화 여부
        enable_console_logging: 콘솔 로깅 활성화 여부
    
    Returns:
        uvicorn log_config 딕셔너리
    """
    # 로그 디렉토리 생성
    os.makedirs(log_dir, exist_ok=True)
    
    # 로그 파일 경로
    log_file = os.path.join(log_dir, f"server_{datetime.now().strftime('%Y%m%d')}.log")
    
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # 기존 핸들러 제거 (중복 방지)
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # 포매터 설정
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 콘솔 핸들러
    if enable_console_logging:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # 파일 핸들러 (로테이션)
    if enable_file_logging:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # uvicorn 로거 설정
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(log_level)
    if enable_file_logging:
        uvicorn_logger.addHandler(file_handler)
    uvicorn_logger.propagate = True
    
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.setLevel(log_level)
    if enable_file_logging:
        uvicorn_access_logger.addHandler(file_handler)
    uvicorn_access_logger.propagate = True
    
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.setLevel(log_level)
    if enable_file_logging:
        uvicorn_error_logger.addHandler(file_handler)
    uvicorn_error_logger.propagate = True
    
    # uvicorn log_config 생성
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default"],
                "level": logging.getLevelName(log_level),
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": logging.getLevelName(log_level),
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": logging.getLevelName(log_level),
                "propagate": False,
            },
        },
    }
    
    # 파일 로깅 활성화 시 추가
    if enable_file_logging:
        log_config["handlers"]["file"] = {
            "formatter": "default",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": log_file,
            "maxBytes": max_bytes,
            "backupCount": backup_count,
            "encoding": "utf-8",
        }
        log_config["handlers"]["access_file"] = {
            "formatter": "access",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": log_file,
            "maxBytes": max_bytes,
            "backupCount": backup_count,
            "encoding": "utf-8",
        }
        log_config["loggers"]["uvicorn"]["handlers"].append("file")
        log_config["loggers"]["uvicorn.error"]["handlers"].append("file")
        log_config["loggers"]["uvicorn.access"]["handlers"].append("access_file")
    
    return log_config


def get_logger(name: str) -> logging.Logger:
    """
    로거 인스턴스 가져오기
    
    Args:
        name: 로거 이름 (보통 __name__ 사용)
    
    Returns:
        Logger 인스턴스
    """
    return logging.getLogger(name)

