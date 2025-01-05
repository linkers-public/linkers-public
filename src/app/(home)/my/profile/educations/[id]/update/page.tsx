import React from 'react'
import EducationUpdateClient from './EducationUpdateClient'

interface PageProps {
  params: {
    id: string
  }
}
const page = ({ params }: PageProps) => {
  return <EducationUpdateClient id={params.id} />
}
export default page
