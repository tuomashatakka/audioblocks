import React, { PropsWithChildren } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProjectProvider } from '@/contexts/ProjectContext'
import Index from './app/page'
import NotFound from './app/NotFound'

// Create a new QueryClient instance

const App: React.FC = ({ children }: PropsWithChildren) =>
  <React.StrictMode>

    <BrowserRouter>
      <Routes>
        <Route path='/' element={ <Index /> } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path='*' element={ <NotFound /> } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>


export default App
