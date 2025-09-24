'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import EnterpriseSidebar from '@/components/EnterpriseSidebar';

interface FormData {
  // 1단계: 기본 정보
  projectTitle: string;
  requirements: string;
  expectedPeriod: string;
  expectedBudget: string;
  
  // 2단계: 기술 및 분야
  requiredSkills: string[];
  projectField: string;
  
  // 3단계: 추가 정보
  referenceLinks: string;
  additionalRequirements: string;
  uiUxLevel: string;
  securityRequirements: string;
}

const ProjectCounselForm: React.FC = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    projectTitle: '',
    requirements: '',
    expectedPeriod: '',
    expectedBudget: '',
    requiredSkills: [],
    projectField: '',
    referenceLinks: '',
    additionalRequirements: '',
    uiUxLevel: '',
    securityRequirements: ''
  });

  const budgetOptions = [
    '500만원 이하',
    '500만원 ~ 1000만원',
    '1000만원 ~ 5000만원',
    '5000만원 ~ 1억원',
  ];

  const periodOptions = [
    '1개월 이하',
    '1개월 ~ 3개월',
    '3개월 ~ 6개월',
    '6개월 ~ 1년',
  ];

  const fieldOptions = [
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

  const skillOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MySQL', 'PostgreSQL',
    'MongoDB', 'Redis', 'GraphQL', 'REST API', 'TypeScript', 'JavaScript'
  ];

  const uiUxOptions = [
    '기본적인 UI/UX',
    '중간 수준의 UI/UX',
    '고급 UI/UX 디자인',
    '프리미엄 UI/UX'
  ];

  const securityOptions = [
    '기본 보안',
    '중간 수준 보안',
    '고급 보안',
    '엔터프라이즈급 보안'
  ];

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
          title: formData.projectTitle,
          outline: formData.requirements,
          period: formData.expectedPeriod as any,
          cost: formData.expectedBudget as any,
          feild: formData.projectField as any,
          skill: formData.requiredSkills as any,
          output: formData.additionalRequirements,
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트에 대해 알려주세요</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          어떤 서비스를 만들고 싶으신가요? *
        </label>
        <input
          type="text"
          value={formData.projectTitle}
          onChange={(e) => handleInputChange('projectTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 온라인 쇼핑몰, 모바일 앱, 회사 홈페이지 등"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          어떤 기능이 필요하신가요? *
        </label>
        <textarea
          value={formData.requirements}
          onChange={(e) => handleInputChange('requirements', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="예: 회원가입, 결제 기능, 관리자 페이지, 모바일 앱 등"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          언제까지 완성되면 좋을까요? *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {periodOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleInputChange('expectedPeriod', option)}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.expectedPeriod === option
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          예상 예산은 얼마 정도인가요? *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {budgetOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleInputChange('expectedBudget', option)}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.expectedBudget === option
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">어떤 종류의 서비스인가요?</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          서비스 유형을 선택해주세요 *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {fieldOptions.map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => handleInputChange('projectField', field)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                formData.projectField === field
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {field}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          참고할 만한 서비스가 있나요? (선택사항)
        </label>
        <input
          type="text"
          value={formData.referenceLinks}
          onChange={(e) => handleInputChange('referenceLinks', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 네이버, 카카오톡, 쿠팡 등"
        />
        <p className="text-sm text-gray-500 mt-1">
          비슷한 서비스를 참고하면 더 정확한 견적을 받을 수 있어요
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">마지막으로 추가로 알려주세요</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          디자인이나 참고할 만한 자료가 있나요? (선택사항)
        </label>
        <input
          type="text"
          value={formData.referenceLinks}
          onChange={(e) => handleInputChange('referenceLinks', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 디자인 시안, 참고 사이트, 브랜드 가이드 등"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          디자인 수준은 어느 정도를 원하시나요? (선택사항)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {uiUxOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleInputChange('uiUxLevel', option)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                formData.uiUxLevel === option
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          기타 특별한 요구사항이 있나요? (선택사항)
        </label>
        <textarea
          value={formData.additionalRequirements}
          onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="예: 특별한 기능, 보안 요구사항, 운영 환경 등"
        />
      </div>
    </div>
  );

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.projectTitle && formData.requirements && formData.expectedPeriod && formData.expectedBudget;
      case 2:
        return formData.projectField;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <EnterpriseSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 상담 신청</h1>
              <p className="text-gray-600">간단한 질문에 답해주시면 맞춤 견적을 받아보실 수 있어요</p>
            </div>

            {/* 진행 단계 표시 */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>프로젝트 정보</span>
                <span>서비스 유형</span>
                <span>추가 요구사항</span>
              </div>
            </div>

            {/* 폼 내용 */}
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* 버튼 */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isStepValid() || loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '제출 중...' : '상담 신청하기'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCounselForm;
