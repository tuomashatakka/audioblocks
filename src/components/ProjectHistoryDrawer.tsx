import React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import {
  Flag,
  Bookmark,
  Star,
  Mic,
  Music,
  Zap,
  MessageCircle,
  MousePointer,
  Volume2,
  Plus,
  Trash,
  Undo
} from 'lucide-react'
import { Record } from './Record'
import { useProject } from '@/contexts/ProjectContext'
import { actionDescriptions, ActionType, ProjectHistoryEntry } from '@/types/collaborative'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'


const ActionIcons: Record<string, React.ReactNode> = {
  [ActionType.ADD_TRACK]:            <Plus size={ 16 } />,
  [ActionType.REMOVE_TRACK]:         <Trash size={ 16 } />,
  [ActionType.UPDATE_TRACK]:         <Music size={ 16 } />,
  [ActionType.MUTE_TRACK]:           <Volume2 size={ 16 } />,
  [ActionType.SOLO_TRACK]:           <Mic size={ 16 } />,
  [ActionType.ARM_TRACK]:            <Record size={ 16 } />,
  [ActionType.SET_TRACK_VOLUME]:     <Volume2 size={ 16 } />,
  [ActionType.ADD_BLOCK]:            <Plus size={ 16 } />,
  [ActionType.REMOVE_BLOCK]:         <Trash size={ 16 } />,
  [ActionType.MOVE_BLOCK]:           <MousePointer size={ 16 } />,
  [ActionType.RESIZE_BLOCK]:         <MousePointer size={ 16 } />,
  [ActionType.UPDATE_BLOCK]:         <Music size={ 16 } />,
  [ActionType.ADD_MARKER]:           <Flag size={ 16 } />,
  [ActionType.UPDATE_MARKER]:        <Flag size={ 16 } />,
  [ActionType.REMOVE_MARKER]:        <Trash size={ 16 } />,
  [ActionType.INITIATE_FILE_UPLOAD]: <Plus size={ 16 } />,
  [ActionType.COMPLETE_FILE_UPLOAD]: <Music size={ 16 } />,
}

// Helper function to get a human-readable action description
const getActionDescription = (entry: ProjectHistoryEntry): string => {
  const params = entry.params
  const actionType = entry.action
  const values = Object.values(typeof params === 'object' ? params : {})

  if (actionDescriptions[actionType])
    return actionDescriptions[actionType](params, ...values)
  return `${(ActionType[actionType] || 'Unknown action').replace(/_/g, ' ')}`
}

interface HistoryItemProps {
  entry:      ProjectHistoryEntry;
  isSelected: boolean;
  onClick:    () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ entry, isSelected, onClick }) => {
  const icon = ActionIcons[entry.action] || <Zap size={ 16 } />
  const time = new Date(entry.timestamp)

  return <div
    className={ cn(
      'p-3 border-b border-border flex items-center cursor-pointer',
      isSelected ? 'bg-accent' : 'hover:bg-accent/50'
    ) }
    onClick={ onClick }>
    <div
      className='h-8 w-8 rounded-full flex items-center justify-center mr-3'
      style={{ backgroundColor: entry.userColor || '#ccc' }}>
      {icon}
    </div>

    <div className='flex-grow'>
      <div className='flex justify-between mb-1'>
        <span className='text-sm font-medium'>{entry.userName || 'User'}</span>
        <span className='text-xs text-muted-foreground'>{format(time, 'HH:mm:ss')}</span>
      </div>

      <p className='text-sm'>{getActionDescription(entry)}</p>
    </div>
  </div>
}

interface ProjectHistoryDrawerProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectHistoryDrawer: React.FC<ProjectHistoryDrawerProps> = ({ open, onOpenChange }) => {
  const {
    state,
    restoreToTimestamp,
    selectedHistoryIndex,
    setSelectedHistoryIndex
  } = useProject()

  const handleItemClick = (index: number) => {
    setSelectedHistoryIndex(index)
  }

  const handleRestore = () => {
    if (selectedHistoryIndex !== null) {
      const entry = state.history[selectedHistoryIndex]
      restoreToTimestamp(entry.timestamp)
    }
  }

  return <Drawer open={ open } onOpenChange={ onOpenChange }>
    <DrawerContent className='max-h-[85vh]'>
      <DrawerHeader>
        <DrawerTitle>Project History</DrawerTitle>
      </DrawerHeader>

      <div className='h-[60vh] overflow-y-auto'>
        {state.history.length === 0
          ? <div className='p-4 text-center text-muted-foreground'>
            No history entries yet. Actions will appear here as you work.
          </div>
          : state.history.map((entry, index) =>
            <HistoryItem
              key={ entry.messageId }
              entry={ entry }
              isSelected={ selectedHistoryIndex === index }
              onClick={ () => handleItemClick(index) } />
          ).reverse() // Show newest first
        }
      </div>

      <DrawerFooter>
        <Button
          onClick={ handleRestore }
          disabled={ selectedHistoryIndex === null }
          className='w-full'>
          <Undo className='mr-2 h-4 w-4' />
          Restore to Selected Point
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
}

export default ProjectHistoryDrawer
