'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import MakersLogo from '@/components/common/MakersLogo';
import EnterpriseSidebar from '@/components/EnterpriseSidebar';
import { Hand, FileText, Search, BarChart, Users, Clipboard, Clock, CheckCircle, DollarSign, Calendar, Lightbulb, PenTool } from 'lucide-react';

interface ProjectStats {
  totalProjects: number;
  pendingProjects: number;
  estimatesReceived: number;
  completedProjects: number;
}

const EnterpriseHomePage: React.FC = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    pendingProjects: 0,
    estimatesReceived: 0,
    completedProjects: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 클라이언트 정보 가져오기
        const { data: clientData } = await supabase
          .from('client')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (clientData) {
          // 프로젝트 통계 가져오기
          const { data: projects } = await supabase
            .from('counsel')
            .select('counsel_status')
            .eq('client_id', clientData.user_id);

          if (projects) {
            const totalProjects = projects.length;
            const pendingProjects = projects.filter(p => p.counsel_status === 'pending').length;
            const estimatesReceived = projects.filter(p => ['estimate_received', 'recruiting'].includes(p.counsel_status)).length;
            const completedProjects = projects.filter(p => p.counsel_status === 'end').length;

            setStats({
              totalProjects,
              pendingProjects,
              estimatesReceived,
              completedProjects
            });
          }

          // 최근 프로젝트 가져오기
          const { data: recentData } = await supabase
            .from('counsel')
            .select('*')
            .eq('client_id', clientData.user_id)
            .order('start_date', { ascending: false })
            .limit(3);

          setRecentProjects(recentData || []);
        }
      }
    } catch (error) {
      console.error('사용자 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '접수됨', color: 'bg-blue-100 text-blue-800', icon: <Clipboard className="w-4 h-4" /> };
      case 'recruiting':
        return { text: '매칭 중', color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-4 h-4" /> };
      case 'estimate_received':
        return { text: '견적 도착', color: 'bg-green-100 text-green-800', icon: <FileText className="w-4 h-4" /> };
      case 'contract_progress':
        return { text: '계약 진행', color: 'bg-purple-100 text-purple-800', icon: <PenTool className="w-4 h-4" /> };
      case 'end':
        return { text: '완료', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" /> };
      default:
        return { text: '접수됨', color: 'bg-blue-100 text-blue-800', icon: <Clipboard className="w-4 h-4" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="w-full px-4 md:px-6">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              안녕하세요! <Hand className="w-6 h-6 md:w-7 md:h-7" />
            </h1>
            <p className="text-gray-600 text-lg">
              {user?.user_metadata?.full_name || user?.email || '고객'}님, 오늘도 좋은 하루 되세요!
            </p>
          </div>

          {/* 빠른 액션 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => router.push('/enterprise/counsel-form')}
              className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">프로젝트 상담 신청</h3>
              </div>
              <p className="text-gray-600 text-sm">
                새로운 프로젝트를 시작하고 싶으시다면 상담을 신청해보세요
              </p>
            </button>

            <button
              onClick={() => router.push('/enterprise/search-makers')}
              className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">메이커 검색</h3>
              </div>
              <p className="text-gray-600 text-sm">
                프로젝트에 적합한 메이커를 직접 찾아보세요
              </p>
            </button>

            <button
              onClick={() => router.push('/enterprise/my-counsel')}
              className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <BarChart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">내 프로젝트</h3>
              </div>
              <p className="text-gray-600 text-sm">
                진행 중인 프로젝트의 상태를 확인해보세요
              </p>
            </button>

            <button
              onClick={() => window.open('/search-makers', '_blank')}
              className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">전체 메이커 보기</h3>
              </div>
              <p className="text-gray-600 text-sm">
                모든 메이커의 상세 프로필을 확인해보세요
              </p>
            </button>
          </div>

          {/* 프로젝트 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Clipboard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  <p className="text-sm text-gray-600">총 프로젝트</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingProjects}</p>
                  <p className="text-sm text-gray-600">진행 중</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.estimatesReceived}</p>
                  <p className="text-sm text-gray-600">견적 도착</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
                  <p className="text-sm text-gray-600">완료</p>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 프로젝트 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">최근 프로젝트</h2>
              <button
                onClick={() => router.push('/enterprise/my-counsel')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                전체 보기 →
              </button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 프로젝트가 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 프로젝트를 시작해보세요!</p>
                <button
                  onClick={() => router.push('/enterprise/counsel-form')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  프로젝트 상담 신청하기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => {
                  const statusInfo = getStatusInfo(project.counsel_status);
                  return (
                    <div
                      key={project.counsel_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/enterprise/counsel-detail/${project.counsel_id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {project.cost}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {project.period}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(project.start_date).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 도움말 섹션 */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              도움이 필요하신가요?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">프로젝트 상담 신청 방법</p>
                <p>간단한 질문에 답하시면 맞춤 견적을 받아보실 수 있어요</p>
              </div>
              <div>
                <p className="font-medium mb-1">메이커 검색 팁</p>
                <p>기술 스택이나 직무별로 필터링하여 원하는 메이커를 찾아보세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseHomePage;
