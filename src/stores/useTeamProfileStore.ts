'use client'

import { fetchTeamProfileByTeamManager } from '@/apis/team.service'
import { create } from 'zustand'

interface TeamMember {
  id: number
  maker_id: string | null
  team_id: number | null
  status: string | null
  created_at: string
  updated_at: string | null
  account: {
    profile_id: string
    user_id: string
    username: string
    role: 'MAKER' | 'MANAGER' | 'NONE'
    bio?: string | null
  } | null
}

interface TeamProfile {
  id: number
  name: string
  bio: string | null
  specialty: string[] | null
  sub_specialty: string[] | null
  prefered: string[] | null
  manager_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  team_members: TeamMember[] | null
  manager?: {
    profile_id: string
    user_id: string
    username: string
    role: 'MAKER' | 'MANAGER' | 'NONE'
    bio?: string | null
    profile_image_url?: string | null
  } | null

  teamHistory?: {
    id: string
    version: string
    date: string
    description: string
  }[]
}

interface TeamProfileState {
  teamProfile: TeamProfile | null
  fetchTeamProfile: () => Promise<void>
}

export const useTeamProfileStore = create<TeamProfileState>((set) => ({
  teamProfile: null,
  fetchTeamProfile: async () => {
    try {
      const { data, error } = await fetchTeamProfileByTeamManager()
      if (error) throw error
      set({ teamProfile: data as unknown as TeamProfile })
    } catch (err) {
      throw err
    }
  },
}))
