import React from 'react'
import CareerUpdateClient from './CareerUpdateClient'

interface PageProps {
  params: {
    id: string
  }
}
const page = ({ params }: PageProps) => {
  return <CareerUpdateClient id={params.id} />
}

export default page
