// Common UI class definitions to reduce repetition in components

export const ui = {
  toolbar:        'flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border z-10 backdrop-blur-md',
  toolbarSection: 'flex items-center space-x-2',
  button:         {
    icon:      'h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors',
    primary:   'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost:     'hover:bg-accent hover:text-accent-foreground',
    transport: 'flex items-center justify-center h-10 w-10 rounded-full bg-secondary hover:bg-secondary/70 transition-all active:scale-95',
  },
  trackBlock: {
    base:         'track-block absolute rounded-sm border-2 overflow-hidden backdrop-blur-sm bg-black/30',
    selected:     'border-primary shadow-lg',
    notSelected:  'border-transparent',
    dragging:     'opacity-70',
    locked:       'opacity-70 cursor-not-allowed',
    movable:      'cursor-move',
    waveform:     'bg-primary/60',
    resizeHandle: 'absolute right-0 top-0 bottom-0 w-2 cursor-col-resize',
  },
  overlay: {
    gradient: 'absolute inset-0 pointer-events-none bg-gradient-animate',
  },
  layout: {
    fullScreen:    'flex flex-col h-screen overflow-hidden bg-background text-foreground',
    growContainer: 'flex-grow relative overflow-auto',
  },
  collaboration: {
    remoteCursor: 'absolute pointer-events-none z-50',
    cursorDot:    'w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2',
    nameTag:      'absolute left-2 top-2 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded whitespace-nowrap',
    lockedBy:     'inline-flex items-center text-xs text-red-500',
  },
  contextMenu: {
    container:  'backdrop-blur-md bg-popover/90 border border-border shadow-xl animate-in fade-in zoom-in-95',
    item:       'flex items-center px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    subTrigger: 'flex items-center px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    subContent: 'backdrop-blur-md bg-popover/90 border border-border shadow-xl rounded-md min-w-[8rem]',
  },
  mixer: {
    channel: 'flex flex-col h-full bg-muted/30 border-r border-border',
    fader:   'w-full h-32 cursor-ns-resize',
    knob:    'w-8 h-8 rounded-full bg-secondary cursor-pointer hover:bg-accent transition-colors',
    meter:   'w-2 h-full bg-gradient-to-t from-primary/30 to-primary',
  },
  transport: {
    container:   'flex items-center space-x-2 px-4 py-2 bg-secondary/80 border-b border-border z-10 backdrop-blur-md',
    button:      'h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors',
    timeDisplay: 'font-mono text-sm bg-muted/50 px-2 py-1 rounded border border-border',
    slider:      'h-1 w-full bg-muted rounded-full overflow-hidden',
    sliderThumb: 'h-4 w-4 rounded-full bg-primary border-2 border-background absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2',
  },
  panels: {
    resizer:   'w-2 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors',
    header:    'py-2 px-3 flex items-center justify-between bg-secondary/80 border-b border-border',
    container: 'flex flex-col h-full overflow-hidden bg-background/50 backdrop-blur-sm',
  },
  timeline: {
    marker:      'absolute h-full w-px bg-primary/50 cursor-pointer',
    markerLabel: 'absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-muted text-xs px-1 py-0.5 rounded whitespace-nowrap',
    beat:        'absolute h-full w-px bg-muted/30',
    bar:         'absolute h-full w-px bg-muted/50',
    playhead:    'absolute h-full w-px bg-primary/80 z-50 shadow-glow-sm',
  },
  masterTrack: {
    container:     'master-track border-t-2 border-border bg-gradient-to-r from-slate-900 to-slate-800 flex items-center relative',
    controls:      'master-controls flex items-center space-x-3 px-4 min-w-[200px] border-r border-border bg-slate-900/80',
    waveform:      'master-waveform flex-1 relative overflow-hidden',
    levelMeter:    'level-meter flex items-center space-x-1 min-w-[60px]',
    levelBar:      'w-1 h-4 rounded-sm transition-all duration-75',
    label:         'text-sm font-bold text-green-400',
    badge:         'text-xs bg-green-500/20 border-green-500/30 text-green-400',
    liveIndicator: 'w-2 h-2 bg-green-500 rounded-full animate-pulse'
  },
  busTrack: {
    container:     'bg-orange-950/20 border-orange-500/20',
    icon:          'h-3 w-3 text-orange-400',
    badge:         'text-xs bg-orange-500/20 border-orange-500/30 text-orange-400',
    sendIndicator: 'h-3 w-3 text-orange-400'
  }
}
