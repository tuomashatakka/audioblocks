'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginButton from './LoginButton'
import GoogleSignIn from './GoogleSignIn'

interface AuthStatusProps {
  useSupabase?: boolean
  callbackUrl?: string
}

export default function AuthStatus({ useSupabase = false, callbackUrl = '/' }: AuthStatusProps) {
  // NextAuth status
  const { data: session, status } = useSession()
  const isNextAuthLoading = status === 'loading'
  const isNextAuthAuthenticated = status === 'authenticated'
  
  // Supabase status (only used if useSupabase is true)
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false)
  
  useEffect(() => {
    if (!useSupabase) return
    
    const getSupabaseSession = async () => {
      setIsSupabaseLoading(true)
      const { data } = await supabase.auth.getSession()
      setSupabaseUser(data.session?.user || null)
      setIsSupabaseLoading(false)
    }
    
    getSupabaseSession()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSupabaseUser(session?.user || null)
      }
    )
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [useSupabase])
  
  // Determine which auth to use
  const isLoading = useSupabase ? isSupabaseLoading : isNextAuthLoading
  const isAuthenticated = useSupabase ? !!supabaseUser : isNextAuthAuthenticated
  
  if (isLoading) {
    return <div className="animate-pulse h-10 w-10 rounded-full bg-muted"></div>
  }

  if (!isAuthenticated) {
    return useSupabase ? <GoogleSignIn redirectTo={callbackUrl} /> : <LoginButton callbackUrl={callbackUrl} />
  }
  
  // Get user details based on the active auth method
  const user = useSupabase ? supabaseUser : session?.user
  const name = useSupabase ? user?.user_metadata?.full_name : user?.name
  const email = user?.email
  const image = useSupabase ? user?.user_metadata?.avatar_url : user?.image
  
  const userInitials = name
    ? name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
    : email ? email.substring(0, 2).toUpperCase() : '?'
    
  const handleSignOut = async () => {
    if (useSupabase) {
      await supabase.auth.signOut()
    } else {
      await signOut({ callbackUrl })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={image ?? ''} alt={name ?? 'User'} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {useSupabase && <p className="text-xs text-muted-foreground italic">Using Supabase Auth</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
