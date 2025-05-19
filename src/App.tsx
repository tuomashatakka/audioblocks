import React, { PropsWithChildren } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectProvider } from '@/contexts/ProjectContext'



// Create a new QueryClient instance
const queryClient = new QueryClient()

const App: React.FC = ({ children }: PropsWithChildren) =>
  <React.StrictMode>
    <QueryClientProvider client={ queryClient }>
      <TooltipProvider>
        <ProjectProvider>
          { children }
          <Toaster />
          <Sonner />
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>


export default App
