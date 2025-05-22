'use client'

import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'


export const Providers = ({ children }: PropsWithChildren) => {
  const queryClient = new QueryClient()

  return <QueryClientProvider client={ queryClient }>
    <TooltipProvider>
      { children }
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
}
