import React from 'react';
import { 
  Flag, 
  Bookmark, 
  Star,
  Mic,
  Music,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Record } from './Record';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type MarkerIcon = 'record' | 'flag' | 'bookmark' | 'star' | 'mic' | 'music' | 'zap' | 'comment';

export interface TimelineMarkerProps {
  id: string;
  position: number;
  color: string;
  icon: MarkerIcon;
  label?: string;
  pixelsPerBeat: number;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const markerIcons: Record<MarkerIcon, React.ReactNode> = {
  'record': <Record size={16} />,
  'flag': <Flag size={16} />,
  'bookmark': <Bookmark size={16} />,
  'star': <Star size={16} />,
  'mic': <Mic size={16} />,
  'music': <Music size={16} />,
  'zap': <Zap size={16} />,
  'comment': <MessageCircle size={16} />
};

const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  id,
  position,
  color,
  icon,
  label,
  pixelsPerBeat,
  onClick,
  onDelete
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(id);
  };

  const ico = markerIcons[icon] || null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="timeline-marker-item" 
          style={{ 
            left: `${position * pixelsPerBeat}px`,
            color: color
          }}
          onClick={handleClick}
        >
          <div className="timeline-marker-line" />
          <div className="timeline-marker-icon">
            {ico}
          </div>
          <div className="timeline-marker-label">
            {label}
          </div>
          )}
        </div>
      </TooltipTrigger>

      <TooltipContent>
        <div className={`flex flex-col text-[${color}]`}`>
          <div className="font-medium">{label || 'Marker'}</div>
          <div className="text-xs text-muted-foreground">
            Position: {position}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TimelineMarker;
