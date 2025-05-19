'use client'

import { signIn as authSignIn, signOut as authSignOut, useSession } from 'next-auth/react'
import type { SignInOptions, SignOutParams } from 'next-auth/react'

/**
 * Check if the user is authenticated
 */
export function isAuthenticated() {
  const { status } = useSession()
  return status === 'authenticated'
}

/**
 * Get the current user data
 */
export function getCurrentUser() {
  const { data } = useSession()
  return data?.user
}

/**
 * Get the current user ID
 */
export function getCurrentUserId() {
  const { data } = useSession()
  return data?.user?.id
}

/**
 * Sign in with the specified provider
 */
export function signIn(provider: string, options?: SignInOptions) {
  return authSignIn(provider, options)
}

/**
 * Sign out the current user
 */
export function signOut(options?: SignOutParams) {
  return authSignOut(options)
}

/**
 * Check if the user is loading
 */
export function isAuthLoading() {
  const { status } = useSession()
  return status === 'loading'
}
