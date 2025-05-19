'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Play, Pause, SkipBack, Save, 
  Plus, Settings, ChevronLeft, ChevronRight,
  Volume2, Mic, Headphones, ZoomIn, ZoomOut, LogOut
} from 'lucide-react'
import { Record } from '@/components/Record'
import { useProject } from '@/contexts/ProjectContext'
import { ActionType } from '@/types/collaborative'
import { isAuthenticated, logoutUser } from '@/lib/auth'


export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { 
    state, 
    dispatch, 
    sendMessage 
  } = useProject()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [trackHeight] = useState(80)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(100)
  const [totalDuration] = useState(180) // 3 minutes in seconds
  const [masterVolume, setMasterVolume] = useState(80)
  const [bpm, setBpm] = useState(120)
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])
  
  const handleLogout = () => {
    logoutUser()
    router.push('/login')
  }

  const editorRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const trackListRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const playheadAnimationRef = useRef<number | null>(null)

  // Format time as MM:SS:MS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor(seconds % 1 * 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`
  }

  // Handle horizontal scrolling
  const handleEditorScroll = () => {
    if (editorRef.current && timelineRef.current) timelineRef.current.scrollLeft = editorRef.current.scrollLeft
  }

  // Handle playing state
  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      sendMessage(ActionType.PAUSE, {})
      if (playheadAnimationRef.current) {
        cancelAnimationFrame(playheadAnimationRef.current)
        playheadAnimationRef.current = null
      }
    }
 else {
      setIsPlaying(true)
      sendMessage(ActionType.PLAY, {})
      animatePlayhead()
    }
  }

  // Handle restart
  const handleRestart = () => {
    setCurrentTime(0)
    sendMessage(ActionType.RESTART, {})
    if (!isPlaying) {
      setIsPlaying(true)
      animatePlayhead()
    }
  }

  // Handle master volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setMasterVolume(value)
    sendMessage(ActionType.SET_MASTER_VOLUME, { volume: value })
  }

  // Handle BPM change
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setBpm(value)
    sendMessage(ActionType.CHANGE_BPM, { bpm: value })
  }

  // Add a new track
  const handleAddTrack = () => {
    const newTrackId = `track-${Date.now()}`
    const colors = [ '#FF466A', '#FFB446', '#64C850', '#5096FF' ]
    const trackCount = Object.keys(state.tracks).length
    const newColor = colors[trackCount % colors.length]

    sendMessage(ActionType.ADD_TRACK, {
      track: {
        id:     newTrackId,
        name:   `Track ${trackCount + 1}`,
        color:  newColor,
        volume: 75,
        muted:  false,
        solo:   false,
        armed:  false
      }
    })
  }

  // Zoom in/out
  const handleZoomIn = () => {
    setPixelsPerSecond(prev => Math.min(prev + 20, 200))
  }

  const handleZoomOut = () => {
    setPixelsPerSecond(prev => Math.max(prev - 20, 50))
  }

  // Animate playhead
  const animatePlayhead = () => {
    const startTime = performance.now()
    const startPosition = currentTime

    const updatePlayhead = (timestamp: number) => {
      if (!isPlaying)
return

      const elapsed = (timestamp - startTime) / 1000
      const newTime = Math.min(startPosition + elapsed, totalDuration)
      setCurrentTime(newTime)

      if (playheadRef.current) playheadRef.current.style.left = `${newTime * pixelsPerSecond}px`

      if (newTime < totalDuration) playheadAnimationRef.current = requestAnimationFrame(updatePlayhead) else {
        setIsPlaying(false)
        sendMessage(ActionType.PAUSE, {})
      }
    }

    playheadAnimationRef.current = requestAnimationFrame(updatePlayhead)
  }

  // Seek to position
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current)
return

    const rect = timelineRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left + timelineRef.current.scrollLeft
    const newTime = Math.max(0, Math.min(offsetX / pixelsPerSecond, totalDuration))

    setCurrentTime(newTime)
    if (playheadRef.current) playheadRef.current.style.left = `${newTime * pixelsPerSecond}px`
  }

  // Clean up animation on unmount
  useEffect(() => () => {
      if (playheadAnimationRef.current) {
        cancelAnimationFrame(playheadAnimationRef.current)
      }
    }, [])

  // Generate track lanes from state
  const trackLanes = Object.values(state.tracks).map((track, index) => ({
    ...track,
    blocks: Object.values(state.blocks).filter(block => block.trackId === track.id)
  }))

  return <main className="daw">
      <header className="top-toolbar">
        <div className="toolbar-section">
          <Link href="/" className="transport-button">
            <ChevronLeft size={20} />
          </Link>
          <h1>{state.name || 'Untitled Project'}</h1>
        </div>

        <div className="toolbar-section transport-controls">
          <button className="transport-button" onClick={handleRestart}>
            <SkipBack size={20} />
          </button>
          <button
            className={`transport-button ${isPlaying ? 'active' : ''}`}
            onClick={handlePlay}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        <div className="toolbar-section">
          <div className="toolbar-section">
            <label htmlFor="bpm">BPM</label>
            <input
              id="bpm"
              type="number"
              min="40"
              max="240"
              value={bpm}
              onChange={handleBpmChange}
              className="form-input"
              style={{ width: '60px' }}
            />
          </div>

          <div className="toolbar-section">
            <Volume2 size={16} />
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={handleVolumeChange}
              className="form-input"
            />
          </div>

          <button className="transport-button" onClick={handleZoomIn}>
            <ZoomIn size={20} />
          </button>
          <button className="transport-button" onClick={handleZoomOut}>
            <ZoomOut size={20} />
          </button>
          <button className="transport-button">
            <Settings size={20} />
          </button>
          <button className="transport-button" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="track-list-panel" ref={trackListRef}>
          <div className="track-list-header">
            <h3>Tracks</h3>
            <button className="track-control-button" onClick={handleAddTrack}>
              <Plus size={16} />
            </button>
          </div>

          {trackLanes.map((track, index) => (
            <div
              key={track.id}
              className="track-item"
              style={{ height: `${trackHeight}px` }}
            >
              <div className="track-item-header">
                <div
                  className="track-color"
                  style={{ backgroundColor: track.color }}
                />
                <span className="track-name">{track.name}</span>
              </div>

              <div className="track-controls">
                <button
                  className={`track-control-button ${track.muted ? 'active' : ''}`}
                  onClick={() => sendMessage(ActionType.MUTE_TRACK, { trackId: track.id, muted: !track.muted })}
                >
                  <Volume2 size={16} />
                </button>
                <button
                  className={`track-control-button ${track.solo ? 'active' : ''}`}
                  onClick={() => sendMessage(ActionType.SOLO_TRACK, { trackId: track.id, solo: !track.solo })}
                >
                  <Headphones size={16} />
                </button>
                <button
                  className={`track-control-button ${track.armed ? 'active' : ''}`}
                  onClick={() => sendMessage(ActionType.ARM_TRACK, { trackId: track.id, armed: !track.armed })}
                >
                  <Record size={16} />
                </button>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.volume}
                  onChange={(e) => sendMessage(
                    ActionType.SET_TRACK_VOLUME,
                    { trackId: track.id, volume: parseInt(e.target.value, 10) }
                  )}
                  className="form-input"
                />
              </div>
            </div>
          ))}
        </aside>

        <div className="timeline-area">
          <div
            className="timeline"
            ref={timelineRef}
            onClick={handleSeek}
          >
            {/* Time markers */}
            {Array.from({ length: Math.ceil(totalDuration / 10) }).map((_, i) => (
              <div
                key={i}
                className="timeline-marker"
                style={{
                  position: 'absolute',
                  left: `${i * 10 * pixelsPerSecond}px`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    height: '12px',
                    borderLeft: '1px solid var(--border)',
                    marginTop: '4px'
                  }}
                />
                <span style={{ fontSize: '10px' }}>{formatTime(i * 10)}</span>
              </div>
            ))}

            {/* Second markers */}
            {Array.from({ length: totalDuration }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${i * pixelsPerSecond}px`,
                  height: '8px',
                  borderLeft: '1px solid var(--border)',
                  opacity: i % 10 === 0 ? 0 : 0.5,
                  bottom: 0
                }}
              />
            ))}
          </div>

          <div
            className="editor-area"
            ref={editorRef}
            onScroll={handleEditorScroll}
          >
            <div
              className="editor-content"
              style={{
                width: `${totalDuration * pixelsPerSecond}px`,
                height: `${trackLanes.length * trackHeight}px`
              }}
            >
              {/* Track lanes */}
              {trackLanes.map((track, index) => (
                <div
                  key={track.id}
                  className="track-lane"
                  style={{
                    top: `${index * trackHeight}px`,
                    height: `${trackHeight}px`,
                    width: '100%',
                    position: 'absolute'
                  }}
                >
                  {/* Audio blocks for this track */}
                  {track.blocks.map(block => (
                    <div
                      key={block.id}
                      className={`audio-block ${state.editingBlockId === block.id ? 'selected' : ''}`}
                      style={{
                        left: `${block.startTime * pixelsPerSecond}px`,
                        width: `${(block.endTime - block.startTime) * pixelsPerSecond}px`,
                        height: `${trackHeight - 2}px`,
                        top: '1px',
                        backgroundColor: `${track.color}40`
                      }}
                      onClick={() => sendMessage(ActionType.START_EDITING_BLOCK, { blockId: block.id })}
                    >
                      <div className="audio-block-header">
                        {block.name || 'Unnamed Block'}
                      </div>

                      <div className="audio-block-content">
                        <div className="audio-block-waveform">
                          {/* Dynamic waveform visualization */}
                          <div className="waveform-container">
                            {/* Top channel (left) */}
                            <div className="waveform-channel">
                              <div className="waveform-data pulse-animation">
                                {Array.from({ length: 30 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="waveform-bar"
                                    style={{
                                      height: `${Math.random() * 100}%`
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Bottom channel (right) */}
                            <div className="waveform-channel">
                              <div className="waveform-data pulse-animation">
                                {Array.from({ length: 30 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="waveform-bar"
                                    style={{
                                      height: `${Math.random() * 100}%`
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="resize-handle" />
                    </div>
                  ))}
                </div>
              ))}

              {/* Playhead */}
              <div
                ref={playheadRef}
                className="playhead"
                style={{
                  left: `${currentTime * pixelsPerSecond}px`,
                  height: '100%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>

}
