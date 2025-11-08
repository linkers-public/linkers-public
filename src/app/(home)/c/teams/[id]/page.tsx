import { notFound } from 'next/navigation'
import TeamDetailClient from './TeamDetailClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const teamId = parseInt(id, 10)

  if (isNaN(teamId)) {
    notFound()
  }

  return <TeamDetailClient teamId={teamId} />
}

