
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { 
  ArrowLeft, 
  ArrowRight,
  Lock,
  Scissors,
  Copy,
  Trash2,
  SplitSquareVertical,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ui } from '@/styles/ui-classes';

export type BlockContextMenuProps = {
  children: React.ReactNode;
  onNudgeLeft: () => void;
  onNudgeRight: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
  canSplit: boolean;
  position?: { x: number; y: number };
  onTimeStretchOpen?: () => void;
  onGainChange?: () => void;
  onPitchChange?: () => void;
  onRename?: () => void;
  onEdit?: () => void;
  currentPlayheadPosition?: number;
};

export const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
  children,
  onNudgeLeft,
  onNudgeRight,
  onSplit,
  onDelete,
  onDuplicate,
  onToggleLock,
  isLocked,
  canSplit,
  position,
  onTimeStretchOpen,
  onGainChange,
  onPitchChange,
  onRename,
  onEdit,
  currentPlayheadPosition
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent 
        className={cn(
          ui.contextMenu.container,
          "w-64"
        )}
      >
        <div className="p-2 text-xs font-medium text-muted-foreground border-b border-border mb-1">
          Clip Operations
        </div>

        <ContextMenuItem 
          onClick={onRename}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked}
        >
          <span className="mr-2">🏷️</span> Rename
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={onEdit}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked}
        >
          <span className="mr-2">✏️</span> Edit Properties
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onNudgeLeft}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Nudge Left
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onNudgeRight}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked}
        >
          <ArrowRight className="mr-2 h-4 w-4" /> Nudge Right
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onSplit}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked || !canSplit}
        >
          <Scissors className="mr-2 h-4 w-4" /> Split at Playhead
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onDuplicate}
          className={cn(ui.contextMenu.item)}
          disabled={isLocked}
        >
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className={cn(ui.contextMenu.subTrigger)} disabled={isLocked}>
            <SplitSquareVertical className="mr-2 h-4 w-4" /> 
            Advanced
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className={cn(ui.contextMenu.subContent)}>
            <ContextMenuItem 
              onClick={onTimeStretchOpen}
              className={cn(ui.contextMenu.item)}
            >
              <Maximize2 className="mr-2 h-4 w-4" /> Time Stretch
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={onGainChange}
              className={cn(ui.contextMenu.item)}
            >
              Volume Adjustment
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={onPitchChange}
              className={cn(ui.contextMenu.item)}
            >
              <Minimize2 className="mr-2 h-4 w-4" /> Pitch Shift
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onToggleLock}
          className={cn(ui.contextMenu.item, isLocked ? "text-green-500" : "")}
        >
          <Lock className="mr-2 h-4 w-4" /> {isLocked ? "Unlock" : "Lock"}
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onDelete}
          className={cn(ui.contextMenu.item, "text-destructive")}
          disabled={isLocked}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BlockContextMenu;
