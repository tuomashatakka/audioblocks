import { ContextMenu } from '@radix-ui/react-context-menu'
import React, { createContext, Fragment, useState } from 'react'

// Define the UI context
const UIContext = createContext(null)

UIContext.displayName = 'User interface context'

// Provider component
const UIProvider = ({ children }) => {
  // State to manage context menu visibility and position
  const [ contextMenu, setContextMenu ] = useState({ visible: false, x: 0, y: 0, items: []})
  const [ dragging, setDragging ] = useState({ over: false, item: null })
  const [ isProcessingUIAction, setIsProcessingUIAction ] = useState(false)

  // Function to display context menu
  const displayContextMenu = (x, y, items) => {
    setContextMenu({ visible: true, x, y, items })
  }

  // Function to hide context menu
  const hideContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, items: []})
  }

  const onContextMenu = e => {
    displayContextMenu(e.clientX, e.clientY, [])
  }

  // Function to handle drag start
  const handleDragStart = item => {
    setDragging({ over: true, item })
  }

  // Function to handle drag end
  const handleDragEnd = () => {
    setDragging({ over: false, item: null })
  }

  // Function to handle drag over
  const handleDragOver = () => {
    if (dragging.over) {
      // Handle drag over logic
    }
  }

  // Function to handle drop
  const handleDrop = () => {
    if (dragging.over) {
      // Handle drop logic
    }
  }

  return <UIContext.Provider
    value={{
      contextMenu,
      displayContextMenu,
      hideContextMenu,
      dragging,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDrop,
    }}>
    <div onContextMenu={ onContextMenu }>
      {children}
    </div>

    <ContextMenu />
  </UIContext.Provider>
}

export {
  UIProvider,
  UIContext,
}
