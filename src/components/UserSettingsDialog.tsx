import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProject } from '@/contexts/ProjectContext'


interface UserSettingsDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { state, updateUserName } = useProject()
  const [ userName, setUserName ] = useState(state.settings?.userName || '')

  useEffect(() => {
    setUserName(state.settings?.userName || '')
  }, [ state.settings?.userName, open ])

  const handleSave = () => {
    if (userName.trim()) {
      updateUserName(userName.trim())
      onOpenChange(false)
    }
  }

  return <Dialog open={ open } onOpenChange={ onOpenChange }>
    <DialogContent className='sm:max-w-[425px]'>
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>

        <DialogDescription>
          Set your nickname for collaboration.
        </DialogDescription>
      </DialogHeader>

      <div className='grid gap-4 py-4'>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='userName' className='text-right'>
            Your Name
          </Label>

          <Input
            id='userName'
            className='col-span-3'
            value={ userName }
            onChange={ e => setUserName(e.target.value) }
            placeholder='Enter your nickname' />
        </div>

        <div className='col-span-4 text-xs text-muted-foreground'>
          Your name will be visible to other collaborators in this project.
        </div>
      </div>

      <DialogFooter>
        <Button onClick={ handleSave }>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

export default UserSettingsDialog
