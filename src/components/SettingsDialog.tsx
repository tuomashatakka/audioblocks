import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'


interface SettingsDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    snapToGrid:        boolean;
    gridSize:          number;
    autoSave:          boolean;
    showCollaborators: boolean;
    theme:             'dark' | 'light' | 'darcula' | 'catppuccino' | 'nord';
  };
  onSettingsChange: (key: string, value: any) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) =>
  <Dialog open={ open } onOpenChange={ onOpenChange }>
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>

        <DialogDescription>
          Configure your preferences for the application
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue='general' className='mt-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='general'>General</TabsTrigger>
          <TabsTrigger value='editor'>Editor</TabsTrigger>
          <TabsTrigger value='appearance'>Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='space-y-4 mt-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='auto-save' className='flex flex-col'>
              <span>Auto Save</span>

              <span className='text-xs text-muted-foreground'>
                Automatically save changes
              </span>
            </Label>

            <Switch
              id='auto-save'
              checked={ settings.autoSave }
              onCheckedChange={ checked =>
                onSettingsChange('autoSave', checked)
              } />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='show-collaborators' className='flex flex-col'>
              <span>Show Collaborators</span>

              <span className='text-xs text-muted-foreground'>
                Show other users in the editor
              </span>
            </Label>

            <Switch
              id='show-collaborators'
              checked={ settings.showCollaborators }
              onCheckedChange={ checked =>
                onSettingsChange('showCollaborators', checked)
              } />
          </div>
        </TabsContent>

        <TabsContent value='editor' className='space-y-4 mt-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='snap-to-grid' className='flex flex-col'>
              <span>Snap to Grid</span>

              <span className='text-xs text-muted-foreground'>
                Align clips to the grid
              </span>
            </Label>

            <Switch
              id='snap-to-grid'
              checked={ settings.snapToGrid }
              onCheckedChange={ checked =>
                onSettingsChange('snapToGrid', checked)
              } />
          </div>

          <div className='space-y-2'>
            <Label>Grid Size</Label>

            <div className='flex items-center gap-2'>
              <Slider
                value={ [ settings.gridSize ] }
                min={ 0.25 }
                max={ 4 }
                step={ 0.25 }
                onValueChange={ ([ value ]) =>
                  onSettingsChange('gridSize', value)
                }
                disabled={ !settings.snapToGrid } />

              <span className='w-12 text-sm'>{settings.gridSize} beat</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label>Theme</Label>

            <div className='grid grid-cols-3 gap-2'>
              {[ 'dark', 'darcula', 'catppuccino', 'nord' ].map(theme =>
                <Button
                  key={ theme }
                  variant={ settings.theme === theme ? 'default' : 'outline' }
                  className='p-2 h-auto'
                  onClick={ () => onSettingsChange('theme', theme) }>
                  <div className='text-sm capitalize'>{theme}</div>
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>


export default SettingsDialog
