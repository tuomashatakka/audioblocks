'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { getCurrentUser, isAuthenticated } from '@/lib/auth'
import { ensureUuid } from '@/utils/auth/idConversion'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export default function CreateProjectPage () {
  const [ projectName, setProjectName ] = useState('Untitled Project')
  const [ isSubmitting, setIsSubmitting ] = useState(false)
  const [ isLoading, setIsLoading ] = useState(true)
  const [ error, setError ] = useState<string | null>(null)
  const [ supabaseUser, setSupabaseUser ] = useState<any>(null)
  const router = useRouter()
  const isAuthedd = isAuthenticated()
  const currentUser = getCurrentUser()

  // Check Supabase authentication
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Failed to get Supabase session:', error)
          return
        }
        
        setSupabaseUser(data.session?.user || null)
        
        if (data.session?.user) {
          console.log('✅ Supabase user authenticated:', data.session.user.email)
        } else {
          console.log('❌ No Supabase user authenticated')
        }
      } catch (err) {
        console.error('Error checking Supabase auth:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSupabaseAuth()
  }, [])
  
  // Check if user is authenticated with NextAuth
  useEffect(() => {
    if (!isAuthedd && !isLoading && !supabaseUser) {
      router.push('/login')
    }
  }, [isAuthedd, isLoading, supabaseUser, router])
  
  // Function to refresh Supabase session
  const refreshSession = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Failed to refresh session:', error)
        setError('Failed to refresh session. Please try logging in again.')
        return
      }
      
      setSupabaseUser(data.session?.user || null)
      
      console.log('Session refreshed:', !!data.session)
    } catch (err) {
      console.error('Error refreshing session:', err)
      setError('An error occurred while refreshing your session.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // First, make sure we have a valid user
      if (!currentUser)
        throw new Error('You must be logged in to create a project')
        
      // Get the current authenticated session from Supabase
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      
      if (!session) {
        console.error('No active Supabase session found')
        throw new Error('Your session has expired. Please log in again.')
      }
      
      console.log('Active session found:', !!session)
      console.log('Session user ID:', session?.user?.id)
        
      // Step 1: Create or update user entry first
      console.log('Creating or syncing user entry for auth user:', session.user.id)
      
      // First, create a user record in the users table if needed
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          updated_at: new Date().toISOString()
        })
      
      if (userError) {
        console.error('Error syncing user:', userError)
        throw new Error('Failed to sync user data. Please try again.')
      }
      
      console.log('User synced successfully')
      
      // Step 2: Try using the simple RPC function which should work with our user
      try {
        console.log('Attempting to use create_project RPC function')
        const { data: projectId, error: rpcError } = await supabase.rpc(
          'create_project',
          { 
            project_name: projectName
          }
        )
        
        if (rpcError) {
          console.error('RPC approach failed:', rpcError)
          throw rpcError
        }
        
        console.log('Project created successfully with RPC function, ID:', projectId)
        router.push(`/project/${projectId}`)
        return
      } catch (rpcError) {
        console.error('Error with RPC approach:', rpcError)
        // Continue to try direct insert
      }
      
      // Step 3: Last resort - try direct insert
      console.log('Falling back to direct insert')
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          owner_id: session.user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error)
        throw error

      // Navigate to the new project
      router.push(`/project/${data.id}`)
    }
    catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while creating the project')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return <main>
    <header className='top-toolbar'>
      <div className='toolbar-section'>
        <Link href='/' className='transport-button'>
          <ChevronLeft size={20} />
        </Link>

        <h1>Create New Project</h1>
      </div>
    </header>

    <form className='create-project-form' onSubmit={handleSubmit}>
      <div className='form-header'>
        <h2 className='form-title'>New Audio Project</h2>
        <p className='form-description'>Create a new audio project to start composing</p>
        
        {supabaseUser ? (
          <div className="text-xs text-muted-foreground mt-2">
            Authenticated as: {supabaseUser.email}
          </div>
        ) : (
          <div className="text-xs text-destructive mt-2">
            Not authenticated with Supabase
          </div>
        )}
      </div>

      {error &&
        <div role='alert' className="p-3 mb-4 bg-destructive/20 border border-destructive rounded text-destructive">
          {error}
          {error?.includes('session') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshSession}
              className="mt-2 w-full"
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Session
            </Button>
          )}
        </div>
      }

      <div className='form-group'>
        <label htmlFor='projectName' className='form-label'>
          Project Name
        </label>

        <input
          id='projectName'
          type='text'
          className='form-input'
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          required />
      </div>

      <div className='form-actions'>
        <Link href='/' className='transport-button'>
          Cancel
        </Link>

        <button
          type='submit'
          className='transport-button active'
          disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  </main>
}