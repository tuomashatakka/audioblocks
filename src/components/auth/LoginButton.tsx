'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

interface LoginButtonProps {
  className?: string
  callbackUrl?: string
}

export default function LoginButton({ className, callbackUrl = '/' }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      console.log('Starting Google sign in with callback URL:', callbackUrl)
      
      // Use more explicit parameters for signIn
      const result = await signIn('google', { 
        callbackUrl,
        redirect: true,
      })
      
      console.log('Sign in result:', result)
      
      if (result?.error) {
        setError(result.error)
        console.error('Login error:', result.error)
      }
    } catch (error) {
      console.error('Login failed:', error)
      setError('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleLogin} 
        disabled={isLoading}
        className={className}
        variant="default"
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
      
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}
