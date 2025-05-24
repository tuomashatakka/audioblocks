'use client'

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { MusicIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { createContext, useContext, useMemo, useState, useCallback } from 'react'

// Define the state types
interface ContextMenuItem {
  label:  string
  action: () => void
  // Add other properties like icon, disabled, etc. as needed
}

interface ContextMenuState {
  isOpen:   boolean
  position: { x: number, y: number } | null
  items:    ContextMenuItem[]
}

interface DraggingState {
  isDragging: boolean
  dragTarget: any | null // Use a more specific type if possible
}

interface UIContextValue {
  contextMenu: ContextMenuState
  isDragging:  DraggingState['isDragging']
  dragTarget:  DraggingState['dragTarget']
}

interface UIDispatchContextValue {
  openContextMenu:  (position: { x: number, y: number }, items: ContextMenuItem[]) => void
  closeContextMenu: () => void
  startDragging:    (target: any) => void
  stopDragging:     () => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)
const UIDispatchContext = createContext<UIDispatchContextValue | undefined>(undefined)

UIContext.displayName = 'User interface context'
UIDispatchContext.displayName = 'User interface actions context'

interface UIContextProviderProps {
  children: React.ReactNode
}

const UIContextProvider = ({ children }: UIContextProviderProps) => {
  const [ contextMenu, setContextMenu ] = useState<ContextMenuState>({
    isOpen:   false,
    position: null,
    items:    [],
  })

  const [ dragging, setDragging ] = useState<DraggingState>({
    isDragging: false,
    dragTarget: null,
  })

  const startDragging = useCallback((target: any) => {
    setDragging({ isDragging: true, dragTarget: target })
  }, [])

  const stopDragging = useCallback(() => {
    setDragging({ isDragging: false, dragTarget: null })
  }, [])

  const openContextMenu = (props: { x: number, y: number, items: ContextMenuItem[] }) => {
    setContextMenu({
      isOpen:   true,
      position: {
        x: props.x,
        y: props.y,
      },
      items: props.items
    })
  }

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, position: null, items: []})
  }, [])

  const value: UIContextValue = useMemo(() => ({
    contextMenu,
    isDragging: dragging.isDragging,
    dragTarget: dragging.dragTarget,
  }), [ contextMenu, dragging ])

  const dispatch = useMemo(() => ({
    openContextMenu,
    closeContextMenu,
    startDragging,
    stopDragging,
  }), [])

  const onContextMenu = e => {
    e.preventDefault()

    const x = e.clientX
    const y = e.clientY

    openContextMenu({ x, y, items: []})
  }

  return <UIDispatchContext.Provider value={ dispatch }>
    <UIContext.Provider value={ value }>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div onContextMenu={ onContextMenu }>
            {children}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className='w-48'>
          <ContextMenuItem>
            <UploadIcon /> Upload Audio
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem>
            <PlusIcon /> New audio block
          </ContextMenuItem>

          <ContextMenuItem disabled>
            <MusicIcon /> New midi block
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

    </UIContext.Provider>
  </UIDispatchContext.Provider>
}


function useUIContext () {
  const state = useContext(UIContext)
  const dispatch = useContext(UIDispatchContext)
  if (!state || !dispatch)
    throw new Error('useUIContext must be used within a UIContextProvider')

  return { state, dispatch }
}


export { UIContext, UIContextProvider, useUIContext }
