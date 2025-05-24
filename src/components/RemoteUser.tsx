import React from 'react'


interface RemoteUserProps {
  id:       string;
  name:     string;
  position: { x: number; y: number };
  color:    string;
}

const RemoteUser: React.FC<RemoteUserProps> = ({
  id,
  name,
  position,
  color
}) =>
  <div
    className='remote-cursor'
    style={{
      left: `${position.x}px`,
      top:  `${position.y}px`
    }}>
    {/* Cursor */}
    <div
      className='w-5 h-5 transform -translate-x-1/2 -translate-y-1/2'
      style={{ color }}>
      <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
        <path d='M5 2.5L16 10L5 17.5V2.5Z' fill='currentColor' />
      </svg>
    </div>

    {/* Username tag */}
    <div
      className='absolute left-2 top-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap'
      style={{ backgroundColor: color }}>
      {name}
    </div>
  </div>


export default RemoteUser
