import React, { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProjectProvider } from '@/contexts/ProjectContext'
import WebSocketService from '@/utils/WebSocketService'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import ProjectView from './pages/project/ProjectView'
import ProjectListPage from './pages/ProjectListPage'

// Create a new QueryClient instance
const queryClient = new QueryClient()

// Make WebSocketService available globally for debugging
declare global {
  interface Window {
    getWebSocketService?: () => WebSocketService;
  }
}

const App: React.FC = () => {
  useEffect(() => {
    // Initialize WebSocketService and make it accessible for debugging
    const webSocketService = WebSocketService.getInstance()
    window.getWebSocketService = () => webSocketService

    // Cleanup function
    return () => {
      webSocketService.cleanup()
      delete window.getWebSocketService
    }
  }, [])

  return <React.StrictMode>
    <QueryClientProvider client={ queryClient }>
      <TooltipProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={ <Index /> } />
              <Route path='/projects' element={ <ProjectListPage /> } />
              <Route path='/project/:projectId' element={ <ProjectView /> } />
              <Route path='*' element={ <NotFound /> } />
            </Routes>
          </BrowserRouter>

          <Toaster />
          <Sonner />
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
}

export default App
