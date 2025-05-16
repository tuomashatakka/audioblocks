
// Common UI class definitions to reduce repetition in components

export const ui = {
  // Layout
  layout: {
    fullScreen: "flex flex-col h-screen overflow-hidden bg-background text-foreground",
    growContainer: "flex-grow relative overflow-auto",
    section: "p-4 md:p-6",
  },
  
  // Common components
  toolbar: "flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border z-10 backdrop-blur-md",
  toolbarSection: "flex items-center gap-2",
  
  // Buttons
  button: {
    base: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    icon: "h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    sizes: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
  },

  // Form elements
  form: {
    group: "space-y-2",
    label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },
  
  // Track elements
  trackBlock: {
    base: "track-block absolute rounded-sm border-2 overflow-hidden backdrop-blur-sm bg-black/30",
    selected: "border-primary shadow-lg",
    notSelected: "border-transparent",
    dragging: "opacity-70",
    locked: "opacity-70 cursor-not-allowed",
    movable: "cursor-move",
    waveform: "bg-primary/60 rounded-sm mx-px",
    resizeHandle: "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
    contextMenu: "bg-popover border border-border shadow-md rounded-md p-1 min-w-[160px]",
    contextMenuItem: "flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
  },
  
  // Timeline elements
  timeline: {
    container: "bg-muted/50 border-b border-border relative backdrop-blur-sm",
    beats: "absolute top-0 left-0 h-full pointer-events-none",
    bar: "absolute top-0 left-0 h-full w-px bg-border pointer-events-none",
    barStart: "bg-border/80 w-[2px] box-shadow-primary",
    beat: "absolute top-0 left-0 h-full w-px bg-border/50 pointer-events-none",
    playhead: "absolute top-0 h-full w-px bg-primary box-shadow-primary z-10",
  },
  
  // DAW UI elements
  daw: {
    trackHeader: "flex items-center px-2 py-1 border-b border-border bg-secondary/60",
    trackControls: "flex items-center gap-1",
    trackName: "text-xs font-medium truncate",
    trackColor: "w-2 h-full absolute left-0 top-0 bottom-0",
    mixer: {
      channel: "flex flex-col items-center border-r border-border",
      fader: "h-32 w-6 bg-secondary rounded-full",
      knob: "w-6 h-6 rounded-full bg-secondary border border-border",
      meter: "h-24 w-2 bg-secondary/50 rounded-full overflow-hidden",
      meterLevel: "absolute bottom-0 w-full bg-primary rounded-full",
    },
    transport: {
      container: "flex items-center gap-2 px-4 py-1 bg-secondary border-b border-border",
      button: "h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent/50",
      timeDisplay: "font-mono text-xs px-2 py-1 bg-background/60 rounded border border-border",
      tempoDisplay: "font-mono text-xs px-2 py-1 bg-background/60 rounded border border-border",
    },
  },
  
  // Markers
  marker: {
    item: "absolute top-0 flex flex-col items-center cursor-pointer z-20 transition-transform hover:scale-110",
    line: "w-px h-full bg-current opacity-70",
    icon: "absolute top-1 -translate-x-1/2 bg-background border border-current rounded-full p-1 transition-all box-shadow-sm",
    label: "absolute bottom-1 -translate-x-1/2 bg-background text-foreground text-xs px-1 rounded white-space-nowrap backdrop-blur-sm",
  },
  
  // Overlays and effects
  overlay: {
    gradient: "absolute inset-0 pointer-events-none bg-gradient-animate",
    panel: "bg-popover/90 border border-border rounded-md shadow-lg backdrop-blur-md",
    dialog: "fixed inset-0 z-50 flex items-center justify-center bg-black/80",
  },
  
  // Card elements
  card: {
    base: "rounded-lg border bg-card text-card-foreground shadow-sm",
    header: "flex flex-col space-y-1.5 p-6",
    title: "text-2xl font-semibold leading-none tracking-tight",
    description: "text-sm text-muted-foreground",
    content: "p-6 pt-0",
    footer: "flex items-center p-6 pt-0",
  },
  
  // Animation classes
  animation: {
    fadeIn: "animate-in fade-in-0",
    slideIn: "animate-in slide-in-from-bottom-3",
    pulse: "animate-pulse",
  },
  
  // DAW specific resizable panels
  panel: {
    resizable: "border border-border overflow-hidden resize",
    handle: "absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-border/30 hover:bg-primary/30",
    header: "bg-secondary/80 border-b border-border px-3 py-1 text-sm font-medium flex items-center justify-between",
    headerButtons: "flex items-center gap-1",
    scrollArea: "h-full overflow-auto custom-scrollbar",
  },
};
