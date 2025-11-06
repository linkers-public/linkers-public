'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import { Briefcase, Zap, Calendar, DollarSign, Phone, Mail, Tag, Link2, FileText, Palette, MessageSquare } from 'lucide-react';

interface FormData {
  projectServiceName: string;  // 프로젝트 서비스 이름
  functionality: string;  // 기능
  period: string;  // 기간
  cost: string;  // 비용
  contactPhone: string;  // 전화번호
  contactEmail: string;  // 이메일
  serviceType: string;  // 서비스 유형
  referenceService: string;  // 참고서비스
  materials: string;  // 자료
  designLevel: string;  // 디자인 수준
  otherRequirements: string;  // 기타 요구사항
}

const ProjectCounselForm: React.FC = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    projectServiceName: '',
    functionality: '',
    period: '',
    cost: '',
    contactPhone: '',
    contactEmail: '',
    serviceType: '',
    referenceService: '',
    materials: '',
    designLevel: '',
    otherRequirements: ''
  });

  const serviceTypeOptions = [
    '웹 개발',
    '앱 개발',
    '인공지능',
    '서버 개발',
    '클라우드',
    'CI/CD',
    '데이터베이스',
    '디자인',
    '보안',
  ];

  const designLevelOptions = [
    '기본적인 UI/UX',
    '중간 수준의 UI/UX',
    '고급 UI/UX 디자인',
    '프리미엄 UI/UX'
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/auth?role=client');
        return;
      }

      // client 테이블에서 client_id 가져오기
      const { data: clientData } = await supabase
        .from('client')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!clientData) {
        alert('기업 계정이 아닙니다.');
        return;
      }

      // counsel 테이블에 데이터 저장
      const { data, error } = await supabase
        .from('counsel')
        .insert({
          client_id: clientData.user_id,
          title: formData.projectServiceName,
          outline: formData.functionality,
          period: formData.period as any,
          cost: formData.cost as any,
          contact_phone: formData.contactPhone || null,
          contact_email: formData.contactEmail || null,
          feild: formData.serviceType as any,
          output: `${formData.referenceService ? `참고서비스: ${formData.referenceService}\n` : ''}${formData.materials ? `자료: ${formData.materials}\n` : ''}${formData.designLevel ? `디자인 수준: ${formData.designLevel}\n` : ''}${formData.otherRequirements ? `기타 요구사항: ${formData.otherRequirements}` : ''}`,
          start_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30일 후
          counsel_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // 성공 페이지로 이동
      router.push(`/enterprise/counsel-success?counselId=${data.counsel_id}`);
      
    } catch (error: any) {
      console.error('상담 신청 실패:', error);
      alert('상담 신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.projectServiceName && 
           formData.functionality && 
           formData.period && 
           formData.cost && 
           formData.contactPhone && 
           formData.contactEmail;
  };

  return (
    <div className="w-full">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">프로젝트 상담 신청</h1>
          <p className="text-lg text-gray-600">프로젝트 정보를 입력해주시면 맞춤 견적을 받아보실 수 있어요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={(e) => e.preventDefault()} className="p-8 md:p-10">
            <div className="space-y-8">
              {/* 기본 정보 섹션 */}
              <section className="space-y-6 pb-8 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  기본 정보
                </h2>
                
                {/* 프로젝트 서비스 이름 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    프로젝트 서비스 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.projectServiceName}
                    onChange={(e) => handleInputChange('projectServiceName', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                    placeholder="예: 온라인 쇼핑몰, 모바일 앱, 회사 홈페이지 등"
                    required
                  />
                </div>

                {/* 기능 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-500" />
                    기능 *
                  </label>
                  <textarea
                    value={formData.functionality}
                    onChange={(e) => handleInputChange('functionality', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white resize-none"
                    rows={5}
                    placeholder="예: 회원가입, 결제 기능, 관리자 페이지, 모바일 앱 등"
                    required
                  />
                </div>

                {/* 기간 및 비용 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      기간 *
                    </label>
                    <input
                      type="text"
                      value={formData.period}
                      onChange={(e) => handleInputChange('period', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      placeholder="예: 3개월, 6개월, 1년 등"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      비용 *
                    </label>
                    <input
                      type="text"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      placeholder="예: 500만원, 1000만원 ~ 5000만원 등"
                      required
                    />
                  </div>
                </div>

                {/* 연락처 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      전화번호 *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      placeholder="010-1234-5678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* 추가 정보 섹션 */}
              <section className="space-y-6 pb-8 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-6 h-6 text-blue-600" />
                  추가 정보
                </h2>

                {/* 서비스 유형 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    서비스 유형
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {serviceTypeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleInputChange('serviceType', option)}
                        className={`p-4 rounded-xl border-2 transition-all text-center font-medium ${
                          formData.serviceType === option
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 참고서비스 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    참고서비스
                  </label>
                  <input
                    type="text"
                    value={formData.referenceService}
                    onChange={(e) => handleInputChange('referenceService', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                    placeholder="예: 네이버, 카카오톡, 쿠팡 등"
                  />
                </div>

                {/* 자료 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    자료
                  </label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => handleInputChange('materials', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                    placeholder="예: 디자인 시안, 참고 사이트, 브랜드 가이드 등"
                  />
                </div>

                {/* 디자인 수준 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-500" />
                    디자인 수준
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {designLevelOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleInputChange('designLevel', option)}
                        className={`p-4 rounded-xl border-2 transition-all text-center font-medium ${
                          formData.designLevel === option
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* 기타 요구사항 섹션 */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  기타 요구사항
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    추가 요구사항이 있으시면 입력해주세요
                  </label>
                  <textarea
                    value={formData.otherRequirements}
                    onChange={(e) => handleInputChange('otherRequirements', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white resize-none"
                    rows={5}
                    placeholder="예: 특별한 기능, 보안 요구사항, 운영 환경 등"
                  />
                </div>
              </section>

            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end pt-8 mt-8 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid() || loading}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>제출 중...</span>
                  </>
                ) : (
                  <>
                    <span>상담 신청하기</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectCounselForm;
