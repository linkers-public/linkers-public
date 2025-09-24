'use client'

import { fetchTeamProfileByTeamManager } from '@/apis/team.service'
import { create } from 'zustand'

interface TeamMember {
  id: string
  name: string
  user_id: string
  role: string
  created_at: string
  account: any
}

interface TeamProfile {
  id: number
  name: string
  bio: string
  specialty: string[]
  sub_specialty: string[]
  prefered: string[]
  manager_id: string
  created_at: string
  updated_at: string
  team_members: TeamMember[]

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
