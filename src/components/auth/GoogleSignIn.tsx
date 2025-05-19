'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

interface GoogleSignInProps {
  className?: string
  redirectTo?: string
}

export default function GoogleSignIn({ 
  className, 
  redirectTo = '/' 
}: GoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Redirecting to Supabase Google auth with redirectTo:', `${window.location.origin}${redirectTo}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
          // Skip creating a user in the database and just use Supabase Auth
          skipBrowserRedirect: false,
        },
      })
      
      if (error) {
        console.error('Supabase auth error:', error)
        setError(error.message)
      }
    } catch (err) {
      console.error('Sign in failed:', err)
      setError('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        className={className}
        variant="default"
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google (Supabase)'}
      </Button>
      
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}
