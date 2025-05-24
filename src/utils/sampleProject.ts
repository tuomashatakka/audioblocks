import { supabase } from '@/integrations/supabase/client'


export interface SampleProjectData {
  name:         string;
  bpm:          number;
  masterVolume: number;
  settings:     any;
  tracks: {
    name:      string;
    type:      'audio' | 'bus' | 'master';
    color:     string;
    volume:    number;
    muted:     boolean;
    solo:      boolean;
    armed:     boolean;
    receives?: string[];
    sends?:    { trackId: string; amount: number }[];
  }[];
  blocks: {
    name:        string;
    trackIndex:  number;
    startBeat:   number;
    lengthBeats: number;
    volume:      number;
    pitch:       number;
  }[];
}

const defaultSampleProject: SampleProjectData = {
  name:         'Sample Project',
  bpm:          120,
  masterVolume: 80,
  settings:     {
    theme:             'dark',
    snapToGrid:        true,
    gridSize:          1,
    autoSave:          true,
    showCollaborators: true
  },
  tracks: [
    { name: 'Drums', type: 'audio', color: '#FF466A', volume: 80, muted: false, solo: false, armed: false, sends: []},
    { name: 'Bass', type: 'audio', color: '#FFB446', volume: 75, muted: false, solo: false, armed: false, sends: []},
    { name: 'Synth', type: 'audio', color: '#64C850', volume: 70, muted: false, solo: false, armed: false, sends: []},
    { name: 'Vocals', type: 'audio', color: '#5096FF', volume: 85, muted: false, solo: false, armed: false, sends: []},
    { name: 'Reverb Bus', type: 'bus', color: '#fb7185', volume: 60, muted: false, solo: false, armed: false, receives: []},
    { name: 'Master', type: 'master', color: '#22c55e', volume: 80, muted: false, solo: false, armed: false },
  ],
  blocks: [
    { name: 'Kick Pattern', trackIndex: 0, startBeat: 0, lengthBeats: 4, volume: 80, pitch: 0 },
    { name: 'Snare Pattern', trackIndex: 0, startBeat: 8, lengthBeats: 4, volume: 75, pitch: 0 },
    { name: 'Bass Line', trackIndex: 1, startBeat: 4, lengthBeats: 8, volume: 70, pitch: 0 },
    { name: 'Synth Lead', trackIndex: 2, startBeat: 12, lengthBeats: 6, volume: 65, pitch: 0 },
    { name: 'Vocal Chop', trackIndex: 3, startBeat: 16, lengthBeats: 8, volume: 85, pitch: 2 },
  ]
}

export async function createSampleProject (projectData: SampleProjectData = defaultSampleProject): Promise<string> {
  try {
    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name:          projectData.name,
        bpm:           projectData.bpm,
        master_volume: projectData.masterVolume,
        settings:      projectData.settings
      })
      .select()
      .single()

    if (projectError)
      throw projectError

    // Create tracks
    const trackInserts = projectData.tracks.map(track => ({
      project_id: project.id,
      name:       track.name,
      track_type: track.type,
      color:      track.color,
      volume:     track.volume,
      muted:      track.muted,
      solo:       track.solo,
      armed:      track.armed,
      receives:   track.receives || [],
      sends:      track.sends || []
    }))

    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .insert(trackInserts)
      .select()

    if (tracksError)
      throw tracksError

    // Create audio blocks
    const blockInserts = projectData.blocks.map(block => ({
      track_id:     tracks[block.trackIndex].id,
      name:         block.name,
      start_beat:   block.startBeat,
      length_beats: block.lengthBeats,
      volume:       block.volume,
      pitch:        block.pitch
    }))

    const { data: blocks, error: blocksError } = await supabase
      .from('audio_blocks')
      .insert(blockInserts)
      .select()

    if (blocksError)
      throw blocksError

    console.log('Sample project created successfully!', {
      project: project.id,
      tracks:  tracks.length,
      blocks:  blocks.length
    })

    return project.id
  }
  catch (error) {
    console.error('Error creating sample project:', error)
    throw error
  }
}

export async function createCustomSampleProject (
  name: string,
  customTracks?: string[],
  customSettings?: any
): Promise<string> {
  const tracks = customTracks?.map((trackName, index) => {
    const colors = [ '#FF466A', '#FFB446', '#64C850', '#5096FF', '#9B59B6', '#E67E22' ]
    return {
      name:   trackName,
      type:   'audio' as const,
      color:  colors[index % colors.length],
      volume: 75,
      muted:  false,
      solo:   false,
      armed:  false,
      sends:  []
    }
  }) || defaultSampleProject.tracks.filter(track => track.type !== 'master')

  // Always add a master track
  tracks.push({
    name:   'Master',
    type:   'master',
    color:  '#22c55e',
    volume: 80,
    muted:  false,
    solo:   false,
    armed:  false
  })

  const customProject: SampleProjectData = {
    ...defaultSampleProject,
    name,
    tracks,
    settings: { ...defaultSampleProject.settings, ...customSettings },
    blocks:   [] // Start with no blocks for custom projects
  }

  return createSampleProject(customProject)
}
