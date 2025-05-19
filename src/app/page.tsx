'use client'

import { signIn, signOut, useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Clock, Music, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Project {
  id:         string;
  name:       string;
  created_at: string;
  owner_id:   string;
}

export default function ProjectsPage () {
  const [ projects, setProjects ] = useState<Project[]>([])
  const [ isLoading, setIsLoading ] = useState(true)
  const { data: session, status } = useSession();
  const supabase = createClientComponentClient()
  const router = useRouter()
  // const isLoggedIn = isAuthenticated() // No longer needed

  useEffect(() => {
    async function fetchProjects () {
      if (!session?.user)
        return

      console.log(session.user, session)

      try {
        const { data, error } = await supabase
          .schema('daw')
          .from('projects')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error)
          throw error

        setProjects(data || [])
      }
      catch (error) {
        console.error('Error fetching projects:', error)
      }
      finally {
        setIsLoading(false)
      }
    }

    if (session?.user)
      fetchProjects()
  }, [ supabase, session?.user ])

  const handleLogout = () => {
    signOut()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric'
    }).format(date)
  }

  if (status === 'loading' || status === 'unauthenticated')
    return null

  return <main>
    <header className='top-toolbar'>
      <div className='toolbar-section'>
        <h1>AudioBlocks</h1>
      </div>

      <div className='toolbar-section'>
        <span className='mr-4'>Welcome, {session.user.name || session.user.email}!</span>

        <Link href='/project' className='transport-button'>
          <Plus size={ 20 } />
        </Link>

        <button onClick={ handleLogout } className='transport-button'>
          <LogOut size={ 20 } />
        </button>
      </div>
    </header>

    <div className='projects-list'>
      {isLoading
        ? <div>Loading projects...</div>
        : projects.length === 0
          ? <div className='flex flex-col items-center justify-center p-8'>
            <h2 className='text-xl font-semibold mb-2'>No projects found</h2>
            <p className='text-muted-foreground mb-4'>Create your first audio project to get started</p>

            <Link href='/project' className='transport-button active'>
              <Plus size={ 20 } className='mr-2' />
              Create Project
            </Link>
          </div>
          : projects.map(project =>
            <article key={ project.id } className='project-card'>
              <header className='project-card-header'>
                <h2 className='project-card-title'>{project.name}</h2>
              </header>

              <div className='project-card-content'>
                <div className='waveform-container'>
                  <div className='waveform-channel'>
                    <div className='waveform-data pulse-animation'>
                      {Array.from({ length: 20 }).map((_, i) =>
                        <div
                          key={ i }
                          className='waveform-bar'
                          style={{
                            height: `${Math.random() * 100}%`,
                          }} />
                      )}
                    </div>
                  </div>

                  <div className='waveform-channel'>
                    <div className='waveform-data pulse-animation'>
                      {Array.from({ length: 20 }).map((_, i) =>
                        <div
                          key={ i }
                          className='waveform-bar'
                          style={{
                            height: `${Math.random() * 100}%`,
                          }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <footer className='project-card-footer'>
                <div className='project-card-meta'>
                  <Clock size={ 14 } />
                  <span>{formatDate(project.created_at)}</span>
                </div>

                <Link href={ `/project/${project.id}` } className='transport-button'>
                  <Music size={ 16 } />
                </Link>
              </footer>
            </article>
          )
      }
    </div>
  </main>
}
