// A class to handle audio loading, playback and analysis
export class AudioEngine {
  private audioContext:     AudioContext | null = null
  private audioBuffers:     Map<string, AudioBuffer> = new Map()
  private audioSources:     AudioBufferSourceNode[] = []
  private gainNode:         GainNode | null = null
  private analyser:         AnalyserNode | null = null
  private startTime:        number = 0
  private pauseTime:        number = 0
  private sequence:         AudioSequenceItem[] = []
  private isPlaying:        boolean = false
  private isPaused:         boolean = false
  private scheduledSources: { source: AudioBufferSourceNode, startTime: number }[] = []

  constructor () {
    this.initAudioContext()
  }

  private initAudioContext () {
    try {
      // Create new AudioContext
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)

      // Create analyzer for frequency visualization
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.gainNode.connect(this.analyser)

      console.log('AudioContext initialized successfully')
    }
    catch (error) {
      console.error('Failed to initialize AudioContext:', error)
    }
  }

  public async loadAudio (url: string): Promise<string> {
    if (!this.audioContext)
      throw new Error('AudioContext not initialized')

    // Check if we already have this audio loaded
    if (this.audioBuffers.has(url))
      return url

    try {
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`Failed to fetch audio file: ${response.statusText}`)

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.audioBuffers.set(url, audioBuffer)
      console.log(`Audio loaded: ${url}`)

      return url
    }
    catch (error) {
      console.error(`Error loading audio: ${url}`, error)
      throw error
    }
  }

  public async loadSequence (sequence: AudioSequenceItem[]): Promise<void> {
    this.sequence = [ ...sequence ]

    // Load all audio files in parallel
    const loadPromises = sequence.map(item => this.loadAudio(item.src))

    try {
      await Promise.all(loadPromises)
      console.log('All audio files loaded successfully')
    }
    catch (error) {
      console.error('Failed to load some audio files:', error)
      throw error
    }
  }

  public play (): void {
    if (!this.audioContext)
      this.initAudioContext()

    // Resume audio context if it's suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended')
      this.audioContext.resume()

    // If already playing, do nothing
    if (this.isPlaying && !this.isPaused)
      return

    // If paused, resume from pause time
    if (this.isPaused) {
      const elapsedTime = this.pauseTime - this.startTime
      this.startTime = this.audioContext!.currentTime - elapsedTime
      this.isPaused = false
      this.isPlaying = true

      // Schedule remaining audio based on current position
      this.scheduleRemainingAudio(elapsedTime)
      return
    }

    // Start fresh playback
    this.stop()
    this.startTime = this.audioContext!.currentTime
    this.isPlaying = true
    this.scheduleAudio()
  }

  private scheduleAudio (): void {
    if (!this.audioContext)
      return

    // Clear any existing scheduled sources
    this.scheduledSources = []

    // Schedule each audio file at its specified time
    this.sequence.forEach(item => {
      const buffer = this.audioBuffers.get(item.src)

      if (buffer) {
        const source = this.audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(this.gainNode!)

        // Calculate when to play this audio file
        const startTimeOffset = item.startTime / 1000 // Convert ms to seconds
        const absoluteStartTime = this.startTime + startTimeOffset

        // Schedule the audio to play
        source.start(absoluteStartTime)

        // Store reference to the source and its start time
        this.scheduledSources.push({
          source,
          startTime: absoluteStartTime
        })

        console.log(`Scheduled audio: ${item.src} at time ${startTimeOffset}s`)
      }
    })
  }

  private scheduleRemainingAudio (elapsedTime: number): void {
    if (!this.audioContext)
      return

    // Schedule only the audio files that haven't played yet
    const remainingItems = this.sequence.filter(item =>
      item.startTime / 1000 > elapsedTime)

    remainingItems.forEach(item => {
      const buffer = this.audioBuffers.get(item.src)

      if (buffer) {
        const source = this.audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(this.gainNode!)

        // Calculate when to play this audio file
        const startTimeOffset = item.startTime / 1000 // Convert ms to seconds
        const absoluteStartTime = this.startTime + startTimeOffset

        // Schedule the audio to play
        source.start(absoluteStartTime)

        // Store reference to the source
        this.scheduledSources.push({
          source,
          startTime: absoluteStartTime
        })
      }
    })
  }

  public pause (): void {
    if (!this.isPlaying || !this.audioContext)
      return

    // Mark the time when we paused
    this.pauseTime = this.audioContext.currentTime
    this.isPaused = true
    this.isPlaying = false

    // Stop all currently playing sources
    this.stopAllSources()
  }

  public stop (): void {
    this.isPlaying = false
    this.isPaused = false

    // Stop all currently playing sources
    this.stopAllSources()

    // Reset timers
    this.startTime = 0
    this.pauseTime = 0
  }

  private stopAllSources (): void {
    // Stop all scheduled sources
    this.scheduledSources.forEach(({ source }) => {
      try {
        source.stop()
      }
      catch (error) {
        // Ignore errors from already stopped sources
      }
    })
    this.scheduledSources = []
  }

  public setVolume (volume: number): void {
    if (this.gainNode) {
      // Convert from 0-100 range to 0-1 range for Web Audio API
      const normalizedVolume = Math.max(0, Math.min(1, volume / 100))
      this.gainNode.gain.value = normalizedVolume
    }
  }

  public getAnalyser (): AnalyserNode | null {
    return this.analyser
  }

  public isAudioPlaying (): boolean {
    return this.isPlaying && !this.isPaused
  }

  public getAudioContext (): AudioContext | null {
    return this.audioContext
  }

  public getCurrentTime (): number {
    if (!this.audioContext || !this.isPlaying)
      return 0

    if (this.isPaused)
      return (this.pauseTime - this.startTime) * 1000

    return (this.audioContext.currentTime - this.startTime) * 1000 // Convert to ms
  }

  // Return expected duration of the sequence in milliseconds
  public getTotalDuration (): number {
    if (this.sequence.length === 0)
      return 0

    let maxEndTime = 0

    this.sequence.forEach(item => {
      const buffer = this.audioBuffers.get(item.src)
      if (buffer) {
        const endTime = item.startTime + buffer.duration * 1000
        if (endTime > maxEndTime)
          maxEndTime = endTime
      }
    })

    return maxEndTime
  }
}

// Define the type for sequence items
export interface AudioSequenceItem {
  src:       string;
  startTime: number; // in milliseconds
}

// Singleton instance
let instance: AudioEngine | null = null

export const getAudioEngine = (): AudioEngine => {
  if (!instance)
    instance = new AudioEngine()
  return instance
}
