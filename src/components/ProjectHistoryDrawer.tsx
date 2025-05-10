
import React from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { Record } from './Record';
import { useProject } from '@/contexts/ProjectContext';
import { ActionType, ProjectHistoryEntry } from '@/types/collaborative';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ActionIcons: Record<string, React.ReactNode> = {
  [ActionType.ADD_TRACK]: <Plus size={16} />,
  [ActionType.REMOVE_TRACK]: <Trash size={16} />,
  [ActionType.UPDATE_TRACK]: <Music size={16} />,
  [ActionType.MUTE_TRACK]: <Volume2 size={16} />,
  [ActionType.SOLO_TRACK]: <Mic size={16} />,
  [ActionType.ARM_TRACK]: <Record size={16} />,
  [ActionType.SET_TRACK_VOLUME]: <Volume2 size={16} />,
  [ActionType.ADD_BLOCK]: <Plus size={16} />,
  [ActionType.REMOVE_BLOCK]: <Trash size={16} />,
  [ActionType.MOVE_BLOCK]: <MousePointer size={16} />,
  [ActionType.RESIZE_BLOCK]: <MousePointer size={16} />,
  [ActionType.UPDATE_BLOCK]: <Music size={16} />,
  [ActionType.ADD_MARKER]: <Flag size={16} />,
  [ActionType.UPDATE_MARKER]: <Flag size={16} />,
  [ActionType.REMOVE_MARKER]: <Trash size={16} />,
  [ActionType.INITIATE_FILE_UPLOAD]: <Plus size={16} />,
  [ActionType.COMPLETE_FILE_UPLOAD]: <Music size={16} />,
};

// Helper function to get a human-readable action description
const getActionDescription = (entry: ProjectHistoryEntry): string => {
  const params = entry.params;
  
  switch (entry.action) {
    case ActionType.ADD_TRACK:
      return `Added track "${params.track?.name || 'Unnamed'}"`;
    
    case ActionType.REMOVE_TRACK:
      return `Removed track "${params.trackName || params.trackId}"`;
    
    case ActionType.UPDATE_TRACK:
      if (params.name) return `Renamed track to "${params.name}"`;
      if (params.color) return `Changed track color`;
      return `Updated track properties`;
    
    case ActionType.MUTE_TRACK:
      return `${params.muted ? 'Muted' : 'Unmuted'} track`;
    
    case ActionType.SOLO_TRACK:
      return `${params.solo ? 'Soloed' : 'Unsoloed'} track`;
    
    case ActionType.ARM_TRACK:
      return `${params.armed ? 'Armed' : 'Disarmed'} track for recording`;
    
    case ActionType.SET_TRACK_VOLUME:
      return `Set track volume to ${params.volume}`;
    
    case ActionType.ADD_BLOCK:
      return `Added clip "${params.block?.name || 'Unnamed'}"`;
    
    case ActionType.REMOVE_BLOCK:
      return `Removed clip "${params.blockName || params.blockId}"`;
    
    case ActionType.MOVE_BLOCK:
      return `Moved clip to position ${params.startBeat}`;
    
    case ActionType.RESIZE_BLOCK:
      return `Resized clip to ${params.lengthBeats} beats`;
    
    case ActionType.UPDATE_BLOCK:
      if (params.name) return `Renamed clip to "${params.name}"`;
      if (params.pitch !== undefined) return `Changed clip pitch to ${params.pitch}`;
      if (params.volume !== undefined) return `Changed clip volume to ${params.volume}`;
      return `Updated clip properties`;
    
    case ActionType.START_EDITING_BLOCK:
      return `Started editing clip`;
    
    case ActionType.END_EDITING_BLOCK:
      return `Finished editing clip`;
    
    case ActionType.ADD_MARKER:
      return `Added marker "${params.marker?.label || 'Unnamed'}"`;
    
    case ActionType.UPDATE_MARKER:
      return `Updated marker properties`;
    
    case ActionType.REMOVE_MARKER:
      return `Removed marker`;
    
    case ActionType.CHANGE_BPM:
      return `Changed BPM to ${params.bpm}`;
    
    case ActionType.UPDATE_SETTINGS:
      return `Updated project settings`;
    
    case ActionType.INITIATE_FILE_UPLOAD:
      return `Started uploading file "${params.fileName}"`;
    
    case ActionType.UPLOAD_FILE_CHUNK:
      return `Uploading file chunk ${params.chunkIndex + 1} of ${params.totalChunks}`;
    
    case ActionType.COMPLETE_FILE_UPLOAD:
      return `Completed uploading file "${params.fileName}"`;
    
    case ActionType.IMPORT_AUDIO_SAMPLE:
      return `Imported audio file "${params.fileName}"`;
    
    default:
      return `${entry.action.replace(/_/g, ' ')}`;
  }
};

interface HistoryItemProps {
  entry: ProjectHistoryEntry;
  isSelected: boolean;
  onClick: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ entry, isSelected, onClick }) => {
  const icon = ActionIcons[entry.action] || <Zap size={16} />;
  const time = new Date(entry.timestamp);
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-border flex items-center cursor-pointer",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <div 
        className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
        style={{ backgroundColor: entry.userColor || '#ccc' }}
      >
        {icon}
      </div>
      
      <div className="flex-grow">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{entry.userName || 'User'}</span>
          <span className="text-xs text-muted-foreground">{format(time, 'HH:mm:ss')}</span>
        </div>
        <p className="text-sm">{getActionDescription(entry)}</p>
      </div>
    </div>
  );
};

interface ProjectHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectHistoryDrawer: React.FC<ProjectHistoryDrawerProps> = ({ open, onOpenChange }) => {
  const { 
    state, 
    restoreToTimestamp, 
    selectedHistoryIndex,
    setSelectedHistoryIndex
  } = useProject();
  
  const handleItemClick = (index: number) => {
    setSelectedHistoryIndex(index);
  };
  
  const handleRestore = () => {
    if (selectedHistoryIndex !== null) {
      const entry = state.history[selectedHistoryIndex];
      restoreToTimestamp(entry.timestamp);
    }
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Project History</DrawerTitle>
        </DrawerHeader>
        
        <div className="h-[60vh] overflow-y-auto">
          {state.history.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No history entries yet. Actions will appear here as you work.
            </div>
          ) : (
            state.history.map((entry, index) => (
              <HistoryItem 
                key={entry.messageId}
                entry={entry}
                isSelected={selectedHistoryIndex === index}
                onClick={() => handleItemClick(index)}
              />
            )).reverse() // Show newest first
          )}
        </div>
        
        <DrawerFooter>
          <Button 
            onClick={handleRestore} 
            disabled={selectedHistoryIndex === null}
            className="w-full"
          >
            <Undo className="mr-2 h-4 w-4" />
            Restore to Selected Point
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ProjectHistoryDrawer;
