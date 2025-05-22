
import React, { useRef, useEffect } from 'react';
import { getAudioEngine } from '@/utils/AudioEngine';

interface FrequencyGraphProps {
  isPlaying: boolean;
  visible: boolean;
}

const FrequencyGraph: React.FC<FrequencyGraphProps> = ({ isPlaying, visible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Clean up animation frame on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const audioEngine = getAudioEngine();
    const analyser = audioEngine.getAnalyser();
    const canvas = canvasRef.current;
    
    // If not visible or not playing or missing elements, don't render
    if (!visible || !isPlaying || !analyser || !canvas) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match container
    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start drawing
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      // Request next frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bar width based on canvas size and buffer length
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;
      
      // Draw each frequency bar
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#3B82F6');  // Blue at bottom
        gradient.addColorStop(0.5, '#EC4899'); // Pink in middle
        gradient.addColorStop(1, '#8B5CF6');  // Purple at top
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1; // Add small gap between bars
        
        // Only draw a portion of the bars to make the visualization look better
        if (x > canvas.width) break;
      }
    };
    
    // Start the animation
    draw();
    
    // Cleanup
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying, visible]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
    />
  );
};

export default FrequencyGraph;
