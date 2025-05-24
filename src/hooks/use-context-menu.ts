import * as React from 'react'
import { useContext } from 'react'
import { UIContext } from '../contexts/ui-context'


const useContextMenu = () => {
  const { contextMenu, openContextMenu, closeContextMenu } = useContext(UIContext)

  return { contextMenu, openContextMenu, closeContextMenu }
}

export default useContextMenu
