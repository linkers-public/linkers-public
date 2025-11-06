'use client'
import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';

interface Maker {
  user_id: string;
  username: string;
  bio: string;
  expertise: string[] | null;
  main_job: string[] | null;
  role: string;
  availability_status: string | null;
}

const SearchMakersPage: React.FC = () => {
  const supabase = createSupabaseBrowserClient();
  
  const [makers, setMakers] = useState<Maker[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<Maker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const skillOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MySQL', 'PostgreSQL',
    'MongoDB', 'Redis', 'GraphQL', 'REST API', 'TypeScript', 'JavaScript',
    'iOS', 'Android', 'Flutter', 'React Native', 'Swift', 'Kotlin'
  ];

  const jobOptions = [
    '웹 개발', '앱 개발', '백엔드 개발', '프론트엔드 개발', '풀스택 개발',
    '데이터 분석', 'AI/ML', 'DevOps', 'UI/UX 디자인', '프로젝트 매니저'
  ];

  useEffect(() => {
    fetchMakers();
  }, []);

  useEffect(() => {
    filterMakers();
  }, [makers, searchTerm, selectedSkills, selectedJobs]);

  const fetchMakers = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('role', 'MAKER')
        .not('deleted_at', 'is', null);

      if (error) throw error;
      setMakers(data || []);
    } catch (error) {
      console.error('메이커 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMakers = () => {
    let filtered = makers;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(maker =>
        maker.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maker.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 기술 스택 필터링
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(maker =>
        selectedSkills.some(skill =>
          maker.expertise?.some(expertise => 
            expertise.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // 직무 필터링
    if (selectedJobs.length > 0) {
      filtered = filtered.filter(maker =>
        selectedJobs.some(job =>
          maker.main_job?.some(mainJob => 
            mainJob.toLowerCase().includes(job.toLowerCase())
          )
        )
      );
    }

    setFilteredMakers(filtered);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleJobToggle = (job: string) => {
    setSelectedJobs(prev =>
      prev.includes(job)
        ? prev.filter(j => j !== job)
        : [...prev, job]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSelectedJobs([]);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">메이커 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">메이커 검색</h1>
            <p className="text-gray-600">프로젝트에 적합한 메이커를 찾아보세요</p>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* 검색창 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="메이커 이름 또는 소개로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 기술 스택 필터 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기술 스택
              </label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* 직무 필터 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직무
              </label>
              <div className="flex flex-wrap gap-2">
                {jobOptions.map((job) => (
                  <button
                    key={job}
                    onClick={() => handleJobToggle(job)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedJobs.includes(job)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 초기화 */}
            {(searchTerm || selectedSkills.length > 0 || selectedJobs.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 결과 요약 */}
          <div className="mb-4">
            <p className="text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredMakers.length}</span>명의 메이커를 찾았습니다.
            </p>
          </div>

          {/* 메이커 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMakers.map((maker) => (
              <div
                key={maker.user_id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* 메이커 기본 정보 */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-lg">
                        {maker.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{maker.username}</h3>
                      <p className="text-sm text-gray-500">메이커</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {maker.bio || '소개가 없습니다.'}
                  </p>
                </div>

                {/* 전문 분야 */}
                {maker.expertise && maker.expertise.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">전문 분야</h4>
                    <div className="flex flex-wrap gap-1">
                      {maker.expertise.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {maker.expertise.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{maker.expertise.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 주요 직무 */}
                {maker.main_job && maker.main_job.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">주요 직무</h4>
                    <div className="flex flex-wrap gap-1">
                      {maker.main_job.slice(0, 2).map((job, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
                        >
                          {job}
                        </span>
                      ))}
                      {maker.main_job.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{maker.main_job.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/profile/${maker.username}`, '_blank')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    프로필 보기
                  </button>
                  <button
                    onClick={() => {
                      // 프로젝트 제안 페이지로 이동 (메이커 정보 포함)
                      window.location.href = `/enterprise/counsel-form?maker=${maker.username}`;
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    프로젝트 제안
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 결과가 없을 때 */}
          {filteredMakers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                다른 검색어나 필터를 시도해보세요.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchMakersPage;
