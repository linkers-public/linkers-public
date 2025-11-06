import React from 'react'
import LicenseUpdateClient from './LicenseUpdateClient'

interface PageProps {
  params: {
    id: string
  }
}

const page = ({ params }: PageProps) => {
  return <LicenseUpdateClient id={params.id} />
}

export default page

