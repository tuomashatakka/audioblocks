
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface ClipEditPopupProps {
  blockId: string;
  name: string;
  volume: number;
  pitch: number;
  position: { x: number; y: number };
  onNameChange: (id: string, name: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onPitchChange: (id: string, pitch: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ClipEditPopup: React.FC<ClipEditPopupProps> = ({
  blockId,
  name,
  volume,
  pitch,
  position,
  onNameChange,
  onVolumeChange,
  onPitchChange,
  onDelete,
  onClose
}) => {
  const [localName, setLocalName] = useState(name);
  const popupRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmitName = () => {
    onNameChange(blockId, localName);
  };

  return (
    <div 
      ref={popupRef}
      className="clip-edit-popup p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 10}px`
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Edit Clip</h3>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="clip-name" className="text-xs">Clip Name</Label>
          <div className="flex space-x-1">
            <Input 
              id="clip-name"
              value={localName} 
              onChange={(e) => setLocalName(e.target.value)}
              className="h-8 text-sm"
            />
            <Button 
              size="sm"
              variant="secondary" 
              className="h-8"
              onClick={handleSubmitName}
            >
              Save
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Volume</Label>
            <span className="text-xs">{volume}%</span>
          </div>
          <Slider 
            value={[volume]} 
            min={0} 
            max={100} 
            step={1}
            onValueChange={([value]) => onVolumeChange(blockId, value)}
          />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-xs">Pitch</Label>
            <span className="text-xs">{pitch > 0 ? `+${pitch}` : pitch}</span>
          </div>
          <Slider 
            value={[pitch]} 
            min={-12} 
            max={12} 
            step={1}
            onValueChange={([value]) => onPitchChange(blockId, value)}
          />
        </div>
        
        <div className="pt-2">
          <Button 
            variant="destructive" 
            size="sm"
            className="w-full"
            onClick={() => {
              onDelete(blockId);
              onClose();
            }}
          >
            Delete Clip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClipEditPopup;
