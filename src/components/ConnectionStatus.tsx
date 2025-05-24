import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useProject } from '@/contexts/ProjectContext'


type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export const ConnectionStatus = () => {
  const { state } = useProject()
  const [ status, setStatus ] = useState<ConnectionStatus>('connecting')
  const [ lastSync, setLastSync ] = useState<Date | null>(null)

  useEffect(() => {
    // Update status based on the project connection state
    setStatus(state.isConnected ? 'connected' : 'disconnected')

    if (state.isConnected)
      setLastSync(new Date())
  }, [ state.isConnected ])

  return <TooltipProvider>
    <Tooltip delayDuration={ 300 }>
      <TooltipTrigger asChild>
        <div className='flex items-center'>
          <Badge
            variant='outline'
            className={ cn(
              'flex items-center gap-1 py-1 px-2 h-8',
              status === 'connected' && 'bg-green-500/10 text-green-600 border-green-500/20',
              status === 'connecting' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              status === 'disconnected' && 'bg-red-500/10 text-red-600 border-red-500/20'
            ) }>
            {status === 'connected' &&
                <>
                  <Wifi className='h-3.5 w-3.5' />
                  <span className='text-xs'>Connected</span>
                </>
            }

            {status === 'connecting' &&
                <>
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  <span className='text-xs'>Connecting</span>
                </>
            }

            {status === 'disconnected' &&
                <>
                  <WifiOff className='h-3.5 w-3.5' />
                  <span className='text-xs'>Disconnected</span>
                </>
            }
          </Badge>
        </div>
      </TooltipTrigger>

      <TooltipContent side='bottom'>
        <div className='text-xs'>
          <p className='font-medium'>Realtime Sync Status</p>

          <p className='text-muted-foreground'>
            {status === 'connected' && `Connected ${lastSync ? `(last sync: ${lastSync.toLocaleTimeString()})` : ''}`}
            {status === 'connecting' && 'Establishing connection...'}
            {status === 'disconnected' && 'Connection lost. Trying to reconnect...'}
          </p>

          {status === 'disconnected' &&
              <p className='text-xs mt-1 text-red-500'>
                Changes will sync when connection is restored
              </p>
          }
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
}

export default ConnectionStatus
