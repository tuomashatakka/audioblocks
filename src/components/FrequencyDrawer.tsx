
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { WaveformIcon, XIcon } from 'lucide-react';
import FrequencyGraph from './FrequencyGraph';
import { getAudioEngine } from '@/utils/AudioEngine';

interface FrequencyDrawerProps {
  isPlaying: boolean;
}

const FrequencyDrawer: React.FC<FrequencyDrawerProps> = ({ isPlaying }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  
  // Effect to manage rendering based on playback state
  useEffect(() => {
    // Only render when playing and drawer is open
    setShouldRender(isPlaying && isOpen);
    
    // Close drawer when playback stops
    if (!isPlaying && isOpen) {
      setIsOpen(false);
    }
  }, [isPlaying, isOpen]);

  return (
    <div>
      {isPlaying && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <XIcon size={18} /> : <WaveformIcon size={18} />}
            {isOpen ? "Hide Frequency Graph" : "Show Frequency Graph"}
          </Button>
        </div>
      )}
      
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[300px] max-h-[50vh] bg-slate-900/90 backdrop-blur-md">
          <div className="w-full h-full p-4">
            <FrequencyGraph isPlaying={isPlaying} visible={shouldRender} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FrequencyDrawer;
