import { Block } from '@/contexts/projectReducer'
import { AudioSequenceItem, getAudioEngine } from './AudioEngine'
import { supabase } from '@/integrations/supabase/client'


export class AudioSequenceService {
  private static instance: AudioSequenceService | null = null
  private audioUrlCache:   Map<string, string> = new Map()

  static getInstance (): AudioSequenceService {
    if (!AudioSequenceService.instance)
      AudioSequenceService.instance = new AudioSequenceService()
    return AudioSequenceService.instance
  }

  /**
   * Convert TrackBlocks to AudioSequenceItems for playback
   */
  async convertBlocksToSequence (
    blocks: Block[],
    bpm: number,
    projectId: string
  ): Promise<AudioSequenceItem[]> {
    const sequence: AudioSequenceItem[] = []

    // Process blocks that have audio files
    const blocksWithAudio = blocks.filter(block => block.fileId)

    for (const block of blocksWithAudio)
      try {
        const audioUrl = await this.getAudioUrl(block.fileId!, projectId)
        if (audioUrl) {
        // Convert beat position to milliseconds
          const startTimeMs = this.beatsToMilliseconds(block.startBeat, bpm)

          sequence.push({
            src:       audioUrl,
            startTime: startTimeMs
          })
        }
      }
      catch (error) {
        console.error(`Failed to load audio for block ${block.id}:`, error)
      }

    return sequence
  }

  /**
   * Get audio URL from Supabase storage, with caching
   */
  private async getAudioUrl (fileId: string, projectId: string): Promise<string | null> {
    // Check cache first
    if (this.audioUrlCache.has(fileId))
      return this.audioUrlCache.get(fileId)!

    try {
      // Get public URL from Supabase storage
      const { data } = supabase.storage
        .from('project-audio')
        .getPublicUrl(fileId)

      if (data.publicUrl) {
        // Cache the URL
        this.audioUrlCache.set(fileId, data.publicUrl)
        return data.publicUrl
      }
    }
    catch (error) {
      console.error('Error getting audio URL:', error)
    }

    return null
  }

  /**
   * Convert beat position to milliseconds based on BPM
   */
  private beatsToMilliseconds (beats: number, bpm: number): number {
    // 60 seconds per minute / BPM = seconds per beat
    // beats * seconds per beat * 1000 = milliseconds
    return beats * 60 / bpm * 1000
  }

  /**
   * Update audio sequence in AudioEngine with current blocks
   */
  async updateAudioSequence (blocks: Block[], bpm: number, projectId: string): Promise<void> {
    try {
      const sequence = await this.convertBlocksToSequence(blocks, bpm, projectId)
      const audioEngine = getAudioEngine()

      if (sequence.length > 0) {
        await audioEngine.loadSequence(sequence)
        console.log(`Loaded ${sequence.length} audio blocks for playback`)
      }
      else {
        // Clear sequence if no audio blocks
        await audioEngine.loadSequence([])
        console.log('No audio blocks to load')
      }
    }
    catch (error) {
      console.error('Error updating audio sequence:', error)
    }
  }

  /**
   * Clear the audio URL cache
   */
  clearCache (): void {
    this.audioUrlCache.clear()
  }

  /**
   * Get the total duration of the project in milliseconds
   */
  getProjectDuration (blocks: Block[], bpm: number): number {
    if (blocks.length === 0)
      return 0

    let maxEndTime = 0
    blocks.forEach(block => {
      const endBeat = block.startBeat + block.lengthBeats
      const endTimeMs = this.beatsToMilliseconds(endBeat, bpm)
      if (endTimeMs > maxEndTime)
        maxEndTime = endTimeMs
    })

    return maxEndTime
  }
}

export const getAudioSequenceService = (): AudioSequenceService => AudioSequenceService.getInstance()
