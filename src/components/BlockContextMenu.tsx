
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from '@/hooks/use-toast';
import { Copy, Edit, Move, Settings, Trash2 } from 'lucide-react';

interface BlockContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShowSettings: () => void;
  disabled?: boolean;
  isLocked?: boolean;
}

const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onShowSettings,
  disabled = false,
  isLocked = false,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  const handleContextAction = (action: () => void, actionName: string) => {
    if (isLocked) {
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
      <ContextMenuContent className="w-56">
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
