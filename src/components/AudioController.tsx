import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Square, Volume2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getAudioEngine, AudioSequenceItem } from '@/utils/AudioEngine'
import FrequencyDrawer from './FrequencyDrawer'


const AudioController: React.FC = () => {
  const [ volume, setVolume ] = useState(80)
  const [ currentTime, setCurrentTime ] = useState(0)
  const [ duration, setDuration ] = useState(0)

  // Initialize audio engine
  useEffect(() => {
    const audioEngine = getAudioEngine()

    // Set initial volume
    audioEngine.setVolume(volume)

    // Update duration from engine
    setDuration(audioEngine.getTotalDuration())
  }, [ volume ])

  // Update volume when it changes
  useEffect(() => {
    const audioEngine = getAudioEngine()
    audioEngine.setVolume(volume)
  }, [ volume ])

  // Update current time during playback
  useEffect(() => {
    const audioEngine = getAudioEngine()
    let animationFrame: number

    const updateTime = () => {
      setCurrentTime(audioEngine.getCurrentTime())
      setDuration(audioEngine.getTotalDuration())

      if (audioEngine.isAudioPlaying())
        animationFrame = requestAnimationFrame(updateTime)
    }

    animationFrame = requestAnimationFrame(updateTime)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    const audioEngine = getAudioEngine()
    audioEngine.play()
  }

  const handlePause = () => {
    const audioEngine = getAudioEngine()
    audioEngine.pause()
  }

  const handleStop = () => {
    const audioEngine = getAudioEngine()
    audioEngine.stop()
    setCurrentTime(0)
  }

  return <div className='w-full max-w-md mx-auto p-4 bg-card/80 backdrop-blur-md rounded-lg shadow-lg'>
    <h2 className='text-xl font-bold mb-4 text-center'>Audio Sequence Player</h2>

    <div className='flex justify-center gap-2 mb-6'>
      <Button
        variant='outline'
        className='w-16 h-16 rounded-full'
        onClick={ handlePlay }>
        <Play size={ 24 } />
      </Button>

      <Button
        variant='outline'
        className='w-16 h-16 rounded-full'
        onClick={ handlePause }>
        <Pause size={ 24 } />
      </Button>

      <Button
        variant='outline'
        className='w-16 h-16 rounded-full'
        onClick={ handleStop }>
        <Square size={ 24 } />
      </Button>
    </div>

    <div className='space-y-4'>
      <div className='flex justify-between text-sm text-muted-foreground'>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className='progress-bar w-full h-2 bg-secondary rounded-full overflow-hidden'>
        <div
          className='h-full bg-primary'
          style={{ width: `${duration > 0 ? currentTime / duration * 100 : 0}%` }} />
      </div>

      <div className='flex items-center gap-2 mt-4'>
        <Volume2 size={ 18 } />

        <Slider
          defaultValue={ [ volume ] }
          max={ 100 }
          step={ 1 }
          onValueChange={ value => setVolume(value[0]) } />
      </div>
    </div>

    {/* Frequency graph drawer */}
    <FrequencyDrawer isPlaying={ getAudioEngine().isAudioPlaying() } />
  </div>
}

export default AudioController
