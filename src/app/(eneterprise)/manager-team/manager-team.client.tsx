'use client'

import { useState } from 'react'
import Link from 'next/link' // Link 컴포넌트 임포트
import Sidebar from '../../../components/Sidebar' // Sidebar 컴포넌트 임포트

const Home: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('마일스톤')
  const [openProjects, setOpenProjects] = useState(false) // 드롭다운 상태 관리

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab)
  }

  const handleClickProjects = () => {
    setOpenProjects(!openProjects)
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 5, padding: '20px' }}>
        {/* 우측 상단 네 개의 주요 박스 */}
        <header style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>진행도</div>
            <div>03 / 04</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>총 금액</div>
            <div>2,240,000 원</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>지급 금액</div>
            <div>1,240,000 원</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f1f1f1',
              borderRadius: '8px',
            }}
          >
            <div>다음 접수 기한</div>
            <div>24년 02월 31일</div>
          </div>
        </header>

        {/* 팀명 및 결제 버튼 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <strong>팀 명</strong>: 상담팀
          </div>
          <div>
            <button
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: '#ddd',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              여기까지
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              결제하기
            </button>
          </div>
        </div>

        {/* 탭 섹션 */}
        <div style={{ marginBottom: '20px' }}>
          <button
            style={{
              padding: '10px',
              backgroundColor:
                selectedTab === '마일스톤' ? '#007bff' : '#f1f1f1',
              color: selectedTab === '마일스톤' ? '#fff' : '#000',
              borderRadius: '4px',
              marginRight: '10px',
            }}
            onClick={() => handleTabClick('마일스톤')}
          >
            마일스톤
          </button>
          <button
            style={{
              padding: '10px',
              backgroundColor: selectedTab === '메시지' ? '#007bff' : '#f1f1f1',
              color: selectedTab === '메시지' ? '#fff' : '#000',
              borderRadius: '4px',
              marginRight: '10px',
            }}
            onClick={() => handleTabClick('메시지')}
          >
            메시지
          </button>
          <button
            style={{
              padding: '10px',
              backgroundColor:
                selectedTab === '첨부파일' ? '#007bff' : '#f1f1f1',
              color: selectedTab === '첨부파일' ? '#fff' : '#000',
              borderRadius: '4px',
            }}
            onClick={() => handleTabClick('첨부파일')}
          >
            첨부파일
          </button>
        </div>

        {/* 동적 콘텐츠 */}
        {selectedTab === '마일스톤' && (
          <section>
            <h2 style={{ marginBottom: '20px' }}>프로젝트명</h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {['정산 완료', '결제 완료', '진행중', '...'].map(
                (status, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: '#007bff',
                          borderRadius: '50%',
                          marginRight: '10px',
                        }}
                      ></div>
                      <div>
                        <strong>
                          메일스톤에 해당되는 제목이 들어가겠습니다.
                        </strong>
                        <p>메일스톤에 해당되는 내용이 들어가겠습니다.</p>
                      </div>
                    </div>
                    <div>기한 10 / 14</div>
                    <div
                      style={{
                        padding: '5px 10px',
                        backgroundColor:
                          status === '정산 완료'
                            ? '#28a745'
                            : status === '결제 완료'
                            ? '#ffc107'
                            : status === '진행중'
                            ? '#007bff'
                            : '#6c757d',
                        color: '#fff',
                        borderRadius: '5px',
                      }}
                    >
                      {status}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {selectedTab === '메시지' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <img
                src="/circle-icon.png"
                alt="receiver"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '10px',
                }}
              />
              <strong>상대방 이름</strong>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f1f1f1',
                  padding: '10px',
                  borderRadius: '8px',
                }}
              >
                <p>상대방이 보낸 메세지입니다. 여기에 내용을 작성하세요.</p>
                <span>오전 10:14</span>
              </div>
              <div
                style={{
                  backgroundColor: '#d1ecf1',
                  padding: '10px',
                  borderRadius: '8px',
                }}
              >
                <p>내가 보낸 메시지입니다. 여기에 내용을 작성하세요.</p>
                <span>오전 10:15</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="메시지를 입력하세요"
                style={{ flex: 1, padding: '10px', borderRadius: '4px' }}
              />
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                보내기
              </button>
            </div>
          </div>
        )}

        {selectedTab === '첨부파일' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <strong>첨부파일 목록</strong>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9',
                    padding: '10px',
                    borderRadius: '8px',
                  }}
                >
                  {/* 회색 원 배경에 아이콘 이미지 추가 */}
                  <div
                    style={{
                      width: '40px', // 원의 크기
                      height: '40px',
                      backgroundColor: '#808080', // 회색 배경
                      borderRadius: '50%', // 원 모양
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src="/images/image.png" // 이미지 파일 경로
                      alt="file icon"
                      style={{ width: '16px', height: '16px' }} // 이미지 크기
                    />
                  </div>
                  <div>
                    <p>파일 이름 {index + 1}.pdf</p>
                    <span>2024-12-15</span>
                  </div>
                  <button
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      borderRadius: '4px',
                    }}
                  >
                    다운로드
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
