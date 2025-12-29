import React from 'react'

import { SiteFooter } from '@/components/site-footer/footer'
import { LobbyNavbar } from './components/lobby-navbar'

export default function LobbyLayout({ children }: React.PropsWithChildren) {
  return (
    <div className='overflow-y-scroll h-screen'>
      <LobbyNavbar />
      <main className='space-y-10'>{children}</main>
      <SiteFooter />
    </div>
  )
}
