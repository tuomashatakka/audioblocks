
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu';
import { toast } from '@/hooks/use-toast';
import { Copy, Edit, Move, Settings, Trash2, Scissors, Volume2, Lock, Unlock, ArrowLeft, ArrowRight } from 'lucide-react';
import { ui } from '@/styles/ui-classes';

interface BlockContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShowSettings: () => void;
  disabled?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onSplit?: () => void;
  onNudgeLeft?: () => void;
  onNudgeRight?: () => void;
}

const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onShowSettings,
  disabled = false,
  isLocked = false,
  onToggleLock,
  onSplit,
  onNudgeLeft,
  onNudgeRight,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  const handleContextAction = (action: () => void, actionName: string) => {
    if (isLocked && actionName !== 'unlock') {
      toast({
        title: "Action not allowed",
        description: "This block is currently being edited by another user.",
        variant: "destructive",
      });
      return;
    }
    action();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-background/95 backdrop-blur-sm border border-border shadow-lg">
        <ContextMenuItem 
          className="flex items-center"
          onClick={() => handleContextAction(onEdit, 'edit')}
          disabled={isLocked}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Block</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          className="flex items-center"
          onClick={() => handleContextAction(onDuplicate, 'duplicate')}
          disabled={isLocked}
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </ContextMenuItem>
        
        {onSplit && (
          <ContextMenuItem 
            className="flex items-center"
            onClick={() => handleContextAction(onSplit, 'split')}
            disabled={isLocked}
          >
            <Scissors className="mr-2 h-4 w-4" />
            <span>Split at Playhead</span>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuGroup>
          {onNudgeLeft && (
            <ContextMenuItem 
              className="flex items-center"
              onClick={() => handleContextAction(onNudgeLeft, 'nudgeLeft')}
              disabled={isLocked}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Nudge Left</span>
            </ContextMenuItem>
          )}
          
          {onNudgeRight && (
            <ContextMenuItem 
              className="flex items-center"
              onClick={() => handleContextAction(onNudgeRight, 'nudgeRight')}
              disabled={isLocked}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>Nudge Right</span>
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
        
        {onToggleLock && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              className="flex items-center"
              onClick={() => handleContextAction(onToggleLock, isLocked ? 'unlock' : 'lock')}
            >
              {isLocked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  <span>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Lock</span>
                </>
              )}
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuItem 
          className="flex items-center"
          onClick={() => handleContextAction(onShowSettings, 'settings')}
          disabled={isLocked}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          className="flex items-center text-destructive focus:text-destructive"
          onClick={() => handleContextAction(onDelete, 'delete')}
          disabled={isLocked}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BlockContextMenu;
