
// Common UI class definitions to reduce repetition in components

export const ui = {
  toolbar: "flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border z-10 backdrop-blur-md",
  toolbarSection: "flex items-center space-x-2",
  button: {
    icon: "h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  },
  trackBlock: {
    base: "track-block absolute rounded-sm border-2 overflow-hidden backdrop-blur-sm bg-black/30",
    selected: "border-primary shadow-lg",
    notSelected: "border-transparent",
    dragging: "opacity-70",
    locked: "opacity-70 cursor-not-allowed",
    movable: "cursor-move",
    waveform: "bg-primary/60 rounded-sm mx-px",
    resizeHandle: "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
  },
  overlay: {
    gradient: "absolute inset-0 pointer-events-none bg-gradient-animate",
  },
  layout: {
    fullScreen: "flex flex-col h-screen overflow-hidden bg-background text-foreground",
    growContainer: "flex-grow relative overflow-auto",
  },
  collaboration: {
    remoteCursor: "absolute pointer-events-none z-50",
    cursorDot: "w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2",
    nameTag: "absolute left-2 top-2 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded whitespace-nowrap",
    lockedBy: "inline-flex items-center text-xs text-red-500",
  },
};
