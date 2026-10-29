import React from 'react'

import { display } from '@/puck/fonts'
import '@/puck/blocks.css'
import './styles.css'

export const metadata = {
  description: 'Build components on a live bench, submit them for review, and publish them to the page.',
  title: {
    default: 'Live editor',
    template: '%s | Live editor',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={display.variable}>
      <body className="font-sans">
        <main>{children}</main>
      </body>
    </html>
  )
}
