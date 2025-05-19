'use client'

import { LoginButton, SupabaseAuthStatus } from '@/components/auth'
import GoogleSignIn from '@/components/auth/GoogleSignIn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true)

  // Function to manually refresh Supabase session
  const refreshSupabaseSession = async () => {
    try {
      setIsLoadingSupabase(true)

      // First, get current session
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session) {
        // We have a session, try to refresh it
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          console.error('Failed to refresh session:', refreshError)
        } else if (refreshData?.session) {
          console.log('✅ Session refreshed successfully')
          setSupabaseUser(refreshData.session.user)
        }
      } else {
        console.log('❌ No Supabase session to refresh')
        setSupabaseUser(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    } finally {
      setIsLoadingSupabase(false)
    }
  }

  // Check Supabase auth status
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        setIsLoadingSupabase(true)

        // Get current session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session fetch error:', error)
          return
        }

        const user = data?.session?.user || null
        setSupabaseUser(user)

        // Print auth debug info
        if (user) {
          console.log('✅ Supabase authenticated:', true)
          console.log('Supabase user ID:', user.id)
          console.log('Supabase user email:', user.email)
          console.log('Session expires at:', data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'unknown')
        } else {
          console.log('❌ Supabase authenticated:', false)
        }
      } catch (error) {
        console.error('Error checking Supabase auth:', error)
      } finally {
        setIsLoadingSupabase(false)
      }
    }

    checkSupabaseAuth()

    // Set up listener for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change event:', event)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSupabaseUser(session?.user || null)
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const isNextAuthAuthenticated = status === 'authenticated'
  const isNextAuthLoading = status === 'loading'
  const isSupabaseAuthenticated = !!supabaseUser
  const isAnyAuthenticated = isNextAuthAuthenticated || isSupabaseAuthenticated
  const isAnyLoading = isNextAuthLoading || isLoadingSupabase

  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AudioBlocks</CardTitle>
          <CardDescription>
            {isAnyAuthenticated
              ? 'You are signed in!'
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>

        {error && (
          <CardContent className="pt-0 pb-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>
                {error === 'Callback'
                  ? 'There was an error with the Google callback. Please try again.'
                  : `Error: ${error}`}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardContent>
          {isAnyLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : isAnyAuthenticated ? (
            <Tabs defaultValue={isNextAuthAuthenticated ? "nextauth" : "supabase"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nextauth" disabled={!isNextAuthAuthenticated}>NextAuth</TabsTrigger>
                <TabsTrigger value="supabase" disabled={!isSupabaseAuthenticated}>Supabase</TabsTrigger>
              </TabsList>

              <TabsContent value="nextauth">
                {isNextAuthAuthenticated && (
                  <div className="rounded-md bg-muted p-4 w-full mt-4">
                    <p className="text-sm font-medium">Logged in with NextAuth:</p>
                    <p className="text-sm mt-1">{session?.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="supabase">
                {isSupabaseAuthenticated && (
                  <div className="rounded-md bg-muted p-4 w-full mt-4">
                    <p className="text-sm font-medium">Logged in with Supabase:</p>
                    <p className="text-sm mt-1">{supabaseUser?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{supabaseUser?.email}</p>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={async () => {
                        await supabase.auth.signOut();
                      }}
                    >
                      Sign out of Supabase
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="nextauth" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nextauth">NextAuth</TabsTrigger>
                <TabsTrigger value="supabase">Supabase Direct</TabsTrigger>
              </TabsList>
              <TabsContent value="nextauth" className="mt-4 flex justify-center">
                <LoginButton callbackUrl={callbackUrl} />
              </TabsContent>
              <TabsContent value="supabase" className="mt-4 flex justify-center">
                <GoogleSignIn redirectTo={callbackUrl} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-center text-xs text-muted-foreground">
            {isAnyLoading
              ? 'Loading authentication status...'
              : isAnyAuthenticated
                ? 'You can now access your projects'
                : 'Sign in with your Google account to continue'}
          </p>

          <div className="flex flex-col items-center gap-2 text-xs">
            <a
              href="/api/auth/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View NextAuth Provider Debug Info
            </a>

            <a
              href="/auth-test"
              className="text-primary hover:underline"
            >
              Advanced Authentication Test Page
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshSupabaseSession}
              className="text-xs mt-1"
              disabled={isLoadingSupabase}
            >
              Refresh Supabase Session
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
