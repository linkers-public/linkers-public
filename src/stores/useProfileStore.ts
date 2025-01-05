import { create } from 'zustand'

interface WorkExperience {
  id: number
  position: string
  company_name: string
  start_date: string
  end_date: string | null
  content: string[]
}

interface Education {
  id: number
  name: string
  start_date: string
  end_date: string | null
  content: string
}

interface License {
  id: number
  name: string
}

interface Profile {
  bio: string
  username: string
  main_job: string[]
  expertise: string[]
  account_work_experiences: WorkExperience[]
  account_educations: Education[]
  account_license: License[]
}

interface ProfileStore {
  profile: Profile
  setProfile: (profile: Profile) => void

  updateBasicProfile: (
    updates: Partial<
      Pick<Profile, 'bio' | 'username' | 'main_job' | 'expertise'>
    >,
  ) => void

  updateWorkExperience: (
    id: number,
    experience: Partial<WorkExperience>,
  ) => void
  addWorkExperience: (experience: any) => void
  deleteWorkExperience: (id: number) => void

  updateEducation: (id: number, education: Partial<Education>) => void
  addEducation: (education: Education) => void
  deleteEducation: (id: number) => void

  updateLicense: (id: number, license: Partial<License>) => void
  addLicense: (license: License) => void
  deleteLicense: (id: number) => void

  resetProfile: () => void
}

const initialProfile: Profile = {
  bio: '',
  username: '',
  main_job: [],
  expertise: [],
  account_work_experiences: [],
  account_educations: [],
  account_license: [],
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: initialProfile,
  setProfile: (profile) => set({ profile }),

  updateBasicProfile: (updates) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),

  updateWorkExperience: (id, experience) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_work_experiences: state.profile.account_work_experiences.map(
          (exp) => (exp.id === id ? { ...exp, ...experience } : exp),
        ),
      },
    })),

  addWorkExperience: (experience) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_work_experiences: [
          ...state.profile.account_work_experiences,
          experience,
        ],
      },
    })),

  deleteWorkExperience: (id: number) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_work_experiences: state.profile.account_work_experiences.filter(
          (exp) => exp.id !== id,
        ),
      },
    })),

  updateEducation: (id, education) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_educations: state.profile.account_educations.map((edu) =>
          edu.id === id ? { ...edu, ...education } : edu,
        ),
      },
    })),

  addEducation: (education) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_educations: [...state.profile.account_educations, education],
      },
    })),

  deleteEducation: (id) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_educations: state.profile.account_educations.filter(
          (edu) => edu.id !== id,
        ),
      },
    })),

  updateLicense: (id, license) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_license: state.profile.account_license.map((lic) =>
          lic.id === id ? { ...lic, ...license } : lic,
        ),
      },
    })),

  addLicense: (license) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_license: [...state.profile.account_license, license],
      },
    })),

  deleteLicense: (id) =>
    set((state) => ({
      profile: {
        ...state.profile,
        account_license: state.profile.account_license.filter(
          (lic) => lic.id !== id,
        ),
      },
    })),

  resetProfile: () => set({ profile: initialProfile }),
}))

export const selectEducations = (state: ProfileStore) =>
  state.profile.account_educations

export const selectWorkExperiences = (state: ProfileStore) =>
  state.profile.account_work_experiences

export const selectLicenses = (state: ProfileStore) =>
  state.profile.account_license

export const selectBasicProfile = (state: ProfileStore) => ({
  bio: state.profile.bio,
  username: state.profile.username,
  main_job: state.profile.main_job,
  expertise: state.profile.expertise,
})
