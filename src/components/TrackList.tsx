import React, { forwardRef, useState } from 'react'
import { Mic, Volume2, Lock, ChevronLeft, ChevronRight, Wrench, Activity, Send, ArrowRight } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Record } from './Record'
import { cn } from '@/lib/utils'


export interface TrackInfo {
  id:                string;
  name:              string;
  type:              'audio' | 'bus' | 'master'; // Track type for different functionality
  color:             string;
  volume:            number;
  muted:             boolean;
  solo:              boolean;
  armed?:            boolean;
  locked?:           boolean;
  lockedByUser?:     string;
  lockedByUserName?: string;
  // Additional properties for bus/master tracks
  receives?:         string[]; // For bus tracks - which tracks send to this bus
  sends?:            { trackId: string; amount: number }[]; // For audio tracks - send to buses
}

interface TrackListProps {
  tracks:             TrackInfo[];
  onVolumeChange:     (trackId: string, volume: number) => void;
  onMuteToggle:       (trackId: string) => void;
  onSoloToggle:       (trackId: string) => void;
  onArmToggle?:       (trackId: string) => void;
  onLockToggle?:      (trackId: string) => void;
  onRename:           (trackId: string, name: string) => void;
  trackHeight:        number;
  scrollTop?:         number;
  onTrackListScroll?: (scrollTop: number) => void;
  localUserId:        string;
}

const TrackList = forwardRef<HTMLDivElement, TrackListProps>(({
  tracks,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onArmToggle,
  onLockToggle,
  onRename,
  trackHeight,
  scrollTop,
  onTrackListScroll,
  localUserId
}, ref) => {
  const [ isCollapsed, setIsCollapsed ] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onTrackListScroll)
      onTrackListScroll(e.currentTarget.scrollTop)
  }

  return <div
    className={ cn(
      'w-48 min-w-48 border-r border-border bg-muted flex flex-col relative track-list',
      isCollapsed && 'collapsed'
    ) }>
    <button
      className='track-list-toggle'
      onClick={ () => setIsCollapsed(!isCollapsed) }
      title={ isCollapsed ? 'Expand track list' : 'Collapse track list' }>
      {isCollapsed ? <ChevronRight size={ 12 } /> : <ChevronLeft size={ 12 } />}
    </button>

    <div className='p-2 border-b border-border bg-secondary'>
      <h3 className='text-sm font-medium'>Tracks</h3>
    </div>

    <div
      ref={ ref }
      className='tracks-list flex-grow overflow-y-auto'
      style={{ scrollTop: scrollTop || 0 } as React.CSSProperties}
      onScroll={ handleScroll }>
      {tracks.map((track, index) => {
        const isLockedByCurrentUser = track.locked && track.lockedByUser === localUserId
        const isLockedByOtherUser = track.locked && track.lockedByUser !== localUserId
        const isBusTrack = track.type === 'bus'
        const isMasterTrack = track.type === 'master'

        // Don't render master track here - it's handled separately
        if (isMasterTrack)
          return null

        return <div
          key={ track.id }
          className={ cn(
            'track-item border-b border-border flex flex-col p-2',
            track.locked && 'bg-muted/50',
            isBusTrack && 'bg-orange-950/20 border-orange-500/20'
          ) }
          style={{ height: `${trackHeight}px` }}>
          <div className='track-content'>
            <div className='flex items-center justify-between mb-1'>
              <div className='flex items-center space-x-1 flex-grow'>
                {/* Track type indicator */}
                {isBusTrack
                  ? <Send className='h-3 w-3 text-orange-400 flex-shrink-0' />
                  : <div
                    className='w-3 h-3 rounded-full flex-shrink-0'
                    style={{ backgroundColor: track.color }} />
                }

                <span className='text-xs font-medium truncate flex-grow'>{track.name}</span>

                {/* Track type badge */}
                {isBusTrack &&
                  <Badge variant='outline' className='text-xs bg-orange-500/20 border-orange-500/30 text-orange-400'>
                    BUS
                  </Badge>
                }
              </div>

              <div className='flex items-center space-x-1'>
                {isLockedByOtherUser &&
                      <div className='text-red-500 mr-1' title={ `Locked by ${track.lockedByUserName || 'another user'}` }>
                        <Lock className='h-3 w-3' />
                      </div>
                }

                {isLockedByCurrentUser &&
                      <div className='text-green-500 mr-1' title='Locked by you'>
                        <Lock className='h-3 w-3' />
                      </div>
                }
              </div>
            </div>

            <div className='flex items-center justify-between mb-2'>
              <ToggleGroup type='multiple' className='gap-0'>
                <ToggleGroupItem
                  value='mute'
                  size='sm'
                  className='h-6 w-6 p-0'
                  aria-label='Mute'
                  disabled={ isLockedByOtherUser }
                  data-state={ track.muted ? 'on' : 'off' }
                  onClick={ () => onMuteToggle(track.id) }>
                  <Volume2 className='h-3 w-3' />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value='solo'
                  size='sm'
                  className='h-6 w-6 p-0'
                  aria-label='Solo'
                  disabled={ isLockedByOtherUser }
                  data-state={ track.solo ? 'on' : 'off' }
                  onClick={ () => onSoloToggle(track.id) }>
                  <Mic className='h-3 w-3' />
                </ToggleGroupItem>

                {/* Show record arm only for audio tracks */}
                {onArmToggle && !isBusTrack &&
                      <ToggleGroupItem
                        value='arm'
                        size='sm'
                        className='h-6 w-6 p-0'
                        aria-label='Record Arm'
                        disabled={ isLockedByOtherUser }
                        data-state={ track.armed ? 'on' : 'off' }
                        onClick={ () => onArmToggle(track.id) }>
                        <Record className='h-3 w-3' />
                      </ToggleGroupItem>
                }

                {/* Show sends indicator for bus tracks */}
                {isBusTrack && track.receives && track.receives.length > 0 &&
                      <div className='h-6 w-6 p-0 flex items-center justify-center' title={ `Receives from ${track.receives.length} track(s)` }>
                        <ArrowRight className='h-3 w-3 text-orange-400' />
                      </div>
                }

                {onLockToggle &&
                      <ToggleGroupItem
                        value='lock'
                        size='sm'
                        className='h-6 w-6 p-0'
                        aria-label={ track.locked ? 'Unlock Track' : 'Lock Track' }
                        disabled={ isLockedByOtherUser }
                        data-state={ track.locked && track.lockedByUser === localUserId ? 'on' : 'off' }
                        onClick={ () => onLockToggle(track.id) }>
                        <Wrench className='h-3 w-3' />
                      </ToggleGroupItem>
                }
              </ToggleGroup>
            </div>

            <div className='flex items-center'>
              <Slider
                className='w-full h-2'
                value={ [ track.volume ] }
                min={ 0 }
                max={ 100 }
                step={ 1 }
                onValueChange={ ([ value ]) => onVolumeChange(track.id, value) }
                disabled={ isLockedByOtherUser } />
            </div>
          </div>
        </div>
      })}
    </div>
  </div>
})

TrackList.displayName = 'TrackList'

export default TrackList
