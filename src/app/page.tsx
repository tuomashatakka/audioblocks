import { DAW } from '@/components/DAW'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { PropsWithChildren } from 'react'


type IndexPageProps = PropsWithChildren<{}>

export default function IndexPage (props: IndexPageProps) {
  return <main>
    <ProjectProvider>
      <DAW />
    </ProjectProvider>
  </main>
}

IndexPage.defaultProps = {}
