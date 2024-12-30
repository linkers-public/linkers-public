'use client'

import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const getManager = async (id: number) => {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('managers_no_rls')
    .select('*')
    .eq('id', id)
    .single()
}

// ----------------------------------------------------

type ProposalStatus = '수락' | '거절' | '미응답'

type MakerProfile = {
  id: number
  profileImage: string | null
  name: string
  currentCompany: string | null
  duration: string
  specialization: string
  projectLink: string | null
  status: ProposalStatus
  messageSent: boolean
}

const dummyProfiles: MakerProfile[] = [
  {
    id: 1,
    profileImage: null,
    name: '유재명',
    currentCompany: 'ABC Corp',
    duration: '재직 중',
    specialization: '프론트엔드 개발',
    projectLink: 'https://github.com/user1/project',
    status: '미응답',
    messageSent: false,
  },
  {
    id: 2,
    profileImage: 'https://example.com/image2.png',
    name: '김도현',
    currentCompany: 'XYZ Inc',
    duration: '2년',
    specialization: '데이터 분석',
    projectLink: null,
    status: '수락',

    messageSent: true,
  },
  {
    id: 3,
    profileImage: null,
    name: '박민수',
    currentCompany: null,
    duration: '프리랜서',
    specialization: '백엔드 개발',
    projectLink: 'https://portfolio.com/user3',
    status: '거절',

    messageSent: true,
  },
  {
    id: 4,
    profileImage: 'https://example.com/image4.png',
    name: '이서윤',
    currentCompany: 'Tech Co',
    duration: '5년',
    specialization: 'UI/UX 디자인',
    projectLink: null,
    status: '미응답',

    messageSent: false,
  },
  {
    id: 5,
    profileImage: null,
    name: '최민지',
    currentCompany: 'Innovate Ltd',
    duration: '1년',
    specialization: '모바일 앱 개발',
    projectLink: 'https://apps.com/user5',
    status: '수락',

    messageSent: true,
  },
  {
    id: 6,
    profileImage: 'https://example.com/image6.png',
    name: '정하늘',
    currentCompany: null,
    duration: '3년',
    specialization: '프로덕트 매니지먼트',
    projectLink: null,
    status: '거절',
    messageSent: false,
  },
  {
    id: 7,
    profileImage: null,
    name: '김은지',
    currentCompany: 'Startup X',
    duration: '6개월',
    specialization: '브랜드 마케팅',
    projectLink: 'https://user7portfolio.com',
    status: '미응답',

    messageSent: true,
  },
  {
    id: 8,
    profileImage: 'https://example.com/image8.png',
    name: '조수연',
    currentCompany: 'Freelance',
    duration: '1년',
    specialization: '기술문서 작성',
    projectLink: 'https://docs.com/user8',
    status: '수락',

    messageSent: false,
  },
  {
    id: 9,
    profileImage: null,
    name: '황정우',
    currentCompany: 'Beta Tech',
    duration: '4년',
    specialization: 'AI 엔지니어',
    projectLink: null,
    status: '거절',

    messageSent: true,
  },
  {
    id: 10,
    profileImage: 'https://example.com/image10.png',
    name: '이수빈',
    currentCompany: 'Global Solutions',
    duration: '7년',
    specialization: '풀스택 개발',
    projectLink: 'https://github.com/user10/project',
    status: '미응답',

    messageSent: false,
  },
]

export const getMakerProposals = async (
  filters: Partial<{
    status: ProposalStatus[]
    specialization: string[]
    experience: [number, number]
    job: string[]
  }>,
): Promise<MakerProfile[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredProfiles = dummyProfiles.filter((profile) => {
        const profileExperience = parseInt(
          profile.duration.replace(/[^0-9]/g, ''),
          10,
        )
        return (
          (filters.status ? filters.status.includes(profile.status) : true) &&
          (filters.specialization?.length
            ? filters.specialization.some((spec) =>
                profile.specialization.includes(spec),
              )
            : true) &&
          (filters.experience
            ? profileExperience >= filters.experience[0] &&
              profileExperience <= filters.experience[1]
            : true) &&
          (filters.job?.length
            ? filters.job.some((job) => profile.specialization.includes(job))
            : true)
        )
      })
      resolve(filteredProfiles)
    }, 100)
  })
}
