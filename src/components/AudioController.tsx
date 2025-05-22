
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAudioEngine, AudioSequenceItem } from '@/utils/AudioEngine';
import FrequencyDrawer from './FrequencyDrawer';

// Define a simple demo sequence
const demoSequence: AudioSequenceItem[] = [
  { src: '/audio/drums.mp3', startTime: 0 },
  { src: '/audio/bass.mp3', startTime: 2000 },
  { src: '/audio/synth.mp3', startTime: 4000 },
  { src: '/audio/vocals.mp3', startTime: 8000 },
];

const AudioController: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Initialize audio engine and load audio files
  useEffect(() => {
    const audioEngine = getAudioEngine();
    
    const loadAudio = async () => {
      try {
        await audioEngine.loadSequence(demoSequence);
        setIsLoaded(true);
        setDuration(audioEngine.getTotalDuration());
        toast({
          title: "Audio loaded",
          description: "All audio files have been successfully loaded.",
        });
      } catch (error) {
        console.error("Failed to load audio:", error);
        toast({
          title: "Error loading audio",
          description: "There was a problem loading the audio files.",
          variant: "destructive",
        });
      }
    };
    
    loadAudio();
    
    // Set initial volume
    audioEngine.setVolume(volume);
    
    return () => {
      // Cleanup on unmount
      audioEngine.stop();
    };
  }, []);
  
  // Update volume when it changes
  useEffect(() => {
    const audioEngine = getAudioEngine();
    audioEngine.setVolume(volume);
  }, [volume]);
  
  // Update current time during playback
  useEffect(() => {
    if (!isPlaying) return;
    
    const audioEngine = getAudioEngine();
    let animationFrame: number;
    
    const updateTime = () => {
      setCurrentTime(audioEngine.getCurrentTime());
      
      // Check if playback has reached the end
      if (audioEngine.getCurrentTime() >= duration) {
        setIsPlaying(false);
        setIsPaused(false);
      } else {
        animationFrame = requestAnimationFrame(updateTime);
      }
    };
    
    animationFrame = requestAnimationFrame(updateTime);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, duration]);
  
  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlay = () => {
    if (!isLoaded) {
      toast({
        title: "Still loading",
        description: "Audio files are still being loaded. Please wait.",
      });
      return;
    }
    
    const audioEngine = getAudioEngine();
    audioEngine.play();
    setIsPlaying(true);
    setIsPaused(false);
  };
  
  const handlePause = () => {
    const audioEngine = getAudioEngine();
    audioEngine.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };
  
  const handleStop = () => {
    const audioEngine = getAudioEngine();
    audioEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card/80 backdrop-blur-md rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Audio Sequence Player</h2>
      
      <div className="flex justify-center gap-2 mb-6">
        <Button 
          variant="outline" 
          className="w-16 h-16 rounded-full"
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={!isLoaded}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-16 h-16 rounded-full"
          onClick={handleStop}
          disabled={!isLoaded || (!isPlaying && !isPaused)}
        >
          <Square size={24} />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="progress-bar w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Volume2 size={18} />
          <Slider
            defaultValue={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
      
      {/* Frequency graph drawer */}
      <FrequencyDrawer isPlaying={isPlaying} />
    </div>
  );
};

export default AudioController;
