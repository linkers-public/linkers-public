'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import EnterpriseSidebar from '@/components/EnterpriseSidebar';
import { Calendar, Briefcase, DollarSign, Star } from 'lucide-react';

interface MakerProfile {
  user_id: string;
  username: string;
  bio: string;
  expertise: string[] | null;
  main_job: string[] | null;
  role: string;
  created_at: string;
  availability_status: string | null;
  // 추가 프로필 정보
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
}

interface Project {
  project_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  status: string;
  created_at: string;
}

const MakerProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
  const [maker, setMaker] = useState<MakerProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const username = params?.username as string;

  useEffect(() => {
    if (username) {
      fetchMakerProfile();
      checkBookmarkStatus();
    }
  }, [username]);

  const fetchMakerProfile = async () => {
    try {
      // 메이커 기본 정보 조회
      const { data: makerData, error: makerError } = await supabase
        .from('accounts')
        .select('*')
        .eq('username', username)
        .eq('role', 'MAKER')
        .single();

      if (makerError) throw makerError;
      setMaker(makerData);

      // 메이커의 프로젝트 이력 조회 (예시)
      // 실제로는 프로젝트 테이블에서 조회
      setProjects([]);

    } catch (error) {
      console.error('메이커 프로필 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 북마크 상태 확인 로직
        // 실제로는 북마크 테이블에서 조회
        setIsBookmarked(false);
      }
    } catch (error) {
      console.error('북마크 상태 확인 실패:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 북마크 토글 로직
      // 실제로는 북마크 테이블에 추가/삭제
      setIsBookmarked(!isBookmarked);
      alert(isBookmarked ? '북마크에서 제거되었습니다.' : '북마크에 추가되었습니다.');
    } catch (error) {
      console.error('북마크 처리 실패:', error);
    }
  };

  const handleContact = () => {
    setShowContactModal(true);
  };

  const handleProjectProposal = () => {
    // 프로젝트 제안 페이지로 이동
    router.push(`/enterprise/counsel-form?maker=${username}`);
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">메이커 프로필을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!maker) {
    return (
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">메이커를 찾을 수 없습니다</h3>
            <p className="text-gray-600 mb-4">요청하신 메이커의 프로필이 존재하지 않습니다.</p>
            <button
              onClick={() => router.push('/enterprise/search-makers')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              메이커 검색으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <EnterpriseSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>

          {/* 메이커 프로필 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-6">
                  <span className="text-blue-600 font-bold text-2xl">
                    {maker.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{maker.username}</h1>
                  <p className="text-gray-600 text-lg mb-2">{maker.bio || '소개가 없습니다.'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(maker.created_at).toLocaleDateString('ko-KR')} 가입</span>
                    {maker.experience_years && (
                      <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {maker.experience_years}년 경력</span>
                    )}
                    {maker.hourly_rate && (
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> 시간당 {maker.hourly_rate.toLocaleString()}원</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBookmark}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isBookmarked
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {isBookmarked ? (
                      <>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        북마크됨
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        북마크
                      </>
                    )}
                  </span>
                </button>
                <button
                  onClick={handleContact}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  연락하기
                </button>
                <button
                  onClick={handleProjectProposal}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  프로젝트 제안
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 기본 정보 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 전문 분야 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">전문 분야</h2>
                <div className="flex flex-wrap gap-2">
                  {maker.expertise?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 주요 직무 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 직무</h2>
                <div className="flex flex-wrap gap-2">
                  {maker.main_job?.map((job, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {job}
                    </span>
                  ))}
                </div>
              </div>

              {/* 프로젝트 이력 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 이력</h2>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-gray-600">아직 공개된 프로젝트가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.project_id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {project.tech_stack.map((tech, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            project.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'completed' ? '완료' : '진행중'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 사이드바 정보 */}
            <div className="space-y-6">
              {/* 연락처 정보 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처</h3>
                <div className="space-y-3">
                  {maker.portfolio_url && (
                    <a
                      href={maker.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      포트폴리오
                    </a>
                  )}
                  {maker.github_url && (
                    <a
                      href={maker.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  )}
                  {maker.linkedin_url && (
                    <a
                      href={maker.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-700 hover:text-blue-900"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* 가용성 */}
              {maker.availability && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">가용성</h3>
                  <p className="text-gray-600">{maker.availability}</p>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 시작하기</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleProjectProposal}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    프로젝트 제안하기
                  </button>
                  <button
                    onClick={handleContact}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    메시지 보내기
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`w-full px-4 py-3 rounded-md transition-colors ${
                      isBookmarked
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {isBookmarked ? '북마크에서 제거' : '북마크에 추가'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 연락 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">메시지 보내기</h3>
            <textarea
              placeholder="메시지를 입력하세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  alert('메시지가 전송되었습니다!');
                  setShowContactModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerProfilePage;
