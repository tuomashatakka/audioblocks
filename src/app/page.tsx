'use client'

import { ProjectProvider } from '@/contexts/ProjectContext'
import { DAW } from '@/components/DAW'
import { PropsWithChildren } from 'react'
import { Providers } from './Providers'
import '@/styles/index.css'


type IndexPageProps = PropsWithChildren<{}>


export default function IndexPage (props: IndexPageProps) {
  return <main>
    <Providers>
      <ProjectProvider>
        <DAW />
      </ProjectProvider>
    </Providers>
  </main>
}

IndexPage.defaultProps = {}
