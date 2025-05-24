import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Music, Plus, Search, Calendar, Clock, Users } from 'lucide-react'
import { Loader2 } from 'lucide-react'


interface Project {
  id:            string;
  name:          string;
  created_at:    string;
  updated_at:    string;
  bpm:           number;
  master_volume: number;
}

const loadProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error)
      throw error

    return {
      error: null,
      data,
    }
  }
  catch (error) {
    console.error('Error loading projects:', error)
    toast({
      title:       'Error Loading Projects',
      description: 'Failed to load your projects. Please try again.',
      variant:     'destructive',
    })
    return {
      error,
      data: []
    }
  }
}

const handleCreateProject = async (newProjectName: string) => {
  if (!newProjectName.trim()) {
    toast({
      title:       'Project Name Required',
      description: 'Please enter a name for your project.',
      variant:     'destructive',
    })
    return {
      error: new Error('Name required'),
      data:  null,
    }
  }

  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        name:          newProjectName.trim(),
        bpm:           120,
        master_volume: 80,
        settings:      {
          theme:             'dark',
          snapToGrid:        true,
          gridSize:          1,
          autoSave:          true,
          showCollaborators: true
        }
      })
      .select()
      .single()

    if (projectError)
      throw projectError

    // Create default track
    const { error: trackError, data } = await supabase
      .from('tracks')
      .insert({
        project_id: projectData.id,
        name:       'Track 1',
        color:      '#60A5FA',
        volume:     75,
        muted:      false,
        solo:       false,
        armed:      false
      })
      .select()
      .single()

    if (trackError)
      throw trackError

    toast({
      title:       'Project Created',
      description: `Successfully created "${newProjectName}"`,
    })

    return {
      data,
      error: null,
    }
  }
  catch (error) {
    console.error('Error creating project:', error)
    toast({
      title:       'Error Creating Project',
      description: 'Failed to create project. Please try again.',
      variant:     'destructive',
    })

    return {
      data: null,
      error,
    }
  }
}

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate()
  const [ projects, setProjects ] = useState<Project[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ isCreateDialogOpen, setIsCreateDialogOpen ] = useState(false)
  const [ newProjectName, setNewProjectName ] = useState('')
  const [ creating, setCreating ] = useState(false)

  // Load projects from database
  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data } = await loadProjects()
      setProjects(data || [])
      setLoading(false)
    }

    load()
  }, [])

  // Filter projects based on search term
  const filteredProjects = useMemo(() => projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [ projects, searchTerm ])

  // Create new project

  // Open project
  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0)
      return 'Today'
    if (diffDays === 1)
      return 'Yesterday'
    if (diffDays < 7)
      return `${diffDays} days ago`
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365)
      return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setCreating(true)

    const { data, error } = await handleCreateProject(newProjectName)
    setCreating(false)
    if (!error) {
      navigate(`/project/${data.id}`)
      setIsCreateDialogOpen(false)
      setNewProjectName(''); handleCreateProject(newProjectName)
    }
  }

  return
  <div className='min-h-screen bg-background'>
    <div className='container mx-auto px-4 py-8'>

      <div className='flex flex-col gap-6 mb-8'>
        <header className='flex items-center gap-3'>
          <Music className='h-8 w-8 text-primary' />

          <h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>
            AudioBlocks
          </h1>
        </header>

        <main className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>Your Projects</h2>

            <p className='text-muted-foreground'>
              Create and manage your audio compositions
            </p>
          </div>

          <Dialog open={ isCreateDialogOpen } onOpenChange={ setIsCreateDialogOpen }>
            <DialogTrigger asChild>
              <Button size='lg' className='gap-2'>
                <Plus className='h-4 w-4' />
                New Project
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>

                <DialogDescription>
                  Start a new audio composition project
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 mt-4'>
                <form className='space-y-2' onSubmit={ handleSubmit }>
                  <Label>
                    Project Name
                    <Input
                      id='project-name'
                      placeholder='My Awesome Track'
                      value={ newProjectName }
                      onChange={ e => setNewProjectName(e.target.value) } />
                  </Label>

                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      onClick={ () => {
                        setIsCreateDialogOpen(false)
                        setNewProjectName('')
                      } }
                      disabled={ creating }>
                      Cancel
                    </Button>

                    <Button
                      type='submit'
                      disabled={ creating || !newProjectName.trim() }>
                      {creating
                        ? <>
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                          Creating...
                        </>
                        : 'Create Project'
                      }
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </main>

        {/* Search */}
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />

          <Input
            placeholder='Search projects...'
            value={ searchTerm }
            onChange={ e => setSearchTerm(e.target.value) }
            className='pl-10' />
        </div>
      </div>

      {/* Projects Grid */}
      {loading
        ? <div className='flex items-center justify-center py-12'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
            <p className='text-muted-foreground'>Loading your projects...</p>
          </div>
        </div>
        : filteredProjects.length === 0
          ? <div className='text-center py-12'>
            <Music className='h-16 w-16 text-muted-foreground mx-auto mb-4' />

            <h3 className='text-xl font-semibold text-foreground mb-2'>
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>

            <p className='text-muted-foreground mb-6'>
              {searchTerm
                ? `No projects match "${searchTerm}"`
                : 'Create your first audio project to get started'
              }
            </p>

            {!searchTerm &&
              <Button onClick={ () => setIsCreateDialogOpen(true) } size='lg'>
                <Plus className='h-4 w-4 mr-2' />
                Create Your First Project
              </Button>
            }
          </div>
          : <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredProjects.map(project =>
              <Card
                key={ project.id }
                className='cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50'
                onClick={ () => handleOpenProject(project.id) }>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <Music className='h-8 w-8 text-primary flex-shrink-0' />

                    <div className='text-xs text-muted-foreground'>
                      {timeAgo(project.updated_at)}
                    </div>
                  </div>

                  <CardTitle className='text-lg truncate' title={ project.name }>
                    {project.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className='space-y-3'>
                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      {project.bpm} BPM
                    </div>

                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {formatDate(project.created_at)}
                    </div>
                  </div>

                  <div className='pt-2 border-t border-border/50'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={ e => {
                        e.stopPropagation()
                        handleOpenProject(project.id)
                      } }>
                      Open Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      }
    </div>
  </div>
}

export default ProjectListPage
