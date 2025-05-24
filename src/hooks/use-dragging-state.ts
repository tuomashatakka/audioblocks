import * as React from 'react';
import { useContext } from 'react';
import { UIContext } from '../contexts/ui-context';

const useDraggingState = () => {
  const { isDragging, dragTarget, startDragging, stopDragging } = useContext(UIContext);

  return { isDragging, dragTarget, startDragging, stopDragging };
};

export default useDraggingState;