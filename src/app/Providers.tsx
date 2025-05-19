'use client'

import { SessionProvider } from 'next-auth/react'
import { PropsWithChildren } from 'react'


type ProvidersProps = PropsWithChildren<{}>

export default function Providers (props: ProvidersProps) {
  return <SessionProvider>
    {props.children}
  </SessionProvider>
}

Providers.defaultProps = {}
