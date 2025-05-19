'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { LoginButton, GoogleSignIn } from '@/components/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true)
  
  useEffect(() => {
    const getSupabaseUser = async () => {
      try {
        setIsLoadingSupabase(true)
        const { data } = await supabase.auth.getSession()
        setSupabaseUser(data.session?.user || null)
      } catch (error) {
        console.error('Error getting Supabase session:', error)
      } finally {
        setIsLoadingSupabase(false)
      }
    }
    
    getSupabaseUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSupabaseUser(session?.user || null)
      }
    )
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])
  
  const handleSignOutSupabase = async () => {
    try {
      await supabase.auth.signOut()
      setSupabaseUser(null)
    } catch (error) {
      console.error('Error signing out from Supabase:', error)
    }
  }
  
  const handleSignOutNextAuth = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/auth-test' })
    } catch (error) {
      console.error('Error signing out from NextAuth:', error)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* NextAuth Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              NextAuth Status
              <Link href="https://next-auth.js.org/" target="_blank" className="opacity-50 hover:opacity-100">
                <ExternalLink size={14} />
              </Link>
            </CardTitle>
            <CardDescription>
              {status === 'loading' 
                ? 'Loading...' 
                : status === 'authenticated' 
                  ? 'Authenticated with NextAuth' 
                  : 'Not authenticated with NextAuth'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'loading' ? (
              <div className="animate-pulse h-20 bg-muted rounded"></div>
            ) : status === 'authenticated' ? (
              <div className="bg-muted p-4 rounded">
                <p><strong>Name:</strong> {session?.user?.name}</p>
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <p><strong>ID:</strong> {session?.user?.id}</p>
                
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => console.log('Full session data:', session)}
                  >
                    Log Full Session Data
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleSignOutNextAuth}
                  >
                    Sign Out from NextAuth
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  You are not signed in with NextAuth.
                </p>
                <LoginButton callbackUrl="/auth-test" />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Supabase Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Supabase Status
              <Link href="https://supabase.com/docs/guides/auth" target="_blank" className="opacity-50 hover:opacity-100">
                <ExternalLink size={14} />
              </Link>
            </CardTitle>
            <CardDescription>
              {isLoadingSupabase 
                ? 'Loading...' 
                : supabaseUser 
                  ? 'Authenticated with Supabase' 
                  : 'Not authenticated with Supabase'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSupabase ? (
              <div className="animate-pulse h-20 bg-muted rounded"></div>
            ) : supabaseUser ? (
              <div className="bg-muted p-4 rounded">
                <p><strong>Name:</strong> {supabaseUser.user_metadata?.full_name || 'Not provided'}</p>
                <p><strong>Email:</strong> {supabaseUser.email}</p>
                <p><strong>ID:</strong> {supabaseUser.id}</p>
                
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => console.log('Full Supabase user:', supabaseUser)}
                  >
                    Log Full Supabase User
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleSignOutSupabase}
                  >
                    Sign Out from Supabase
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  You are not signed in with Supabase.
                </p>
                <GoogleSignIn redirectTo="/auth-test" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug & Troubleshooting</CardTitle>
          <CardDescription>
            Tools to help debug authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex justify-between items-center"
              asChild
            >
              <Link href="/api/auth/signin">
                NextAuth Sign In Page <ArrowUpRight size={14} />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-between items-center"
              asChild
            >
              <Link href="/api/auth/providers">
                NextAuth Providers <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
          
          <div className="border rounded p-4 text-sm">
            <p className="font-medium mb-2">Auth Flow Options:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>NextAuth Google Sign In - Uses OAuth flow through NextAuth.js</li>
              <li>Supabase Direct Google Sign In - Uses direct Supabase auth flow</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="default" className="w-full">
            <Link href="/login">
              Return to Login Page
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
