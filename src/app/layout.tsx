import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/index.css'
import Providers from './Providers'


const inter = Inter({ subsets: [ 'latin' ]})

export const metadata: Metadata = {
  title:       'AudioBlocks - Digital Audio Workstation',
  description: 'A collaborative digital audio workstation for creating music',
}

type Props = Readonly<{
  children: React.ReactNode
}>

export default function RootLayout ({ children }: Props) {
  return <html lang='en'>
    <body className={ inter.className }>
      <Providers>
        {children}
      </Providers>
    </body>
  </html>
}
