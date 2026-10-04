'use client'

import { usePathname } from 'next/navigation'

export const AppHeader = () => {
  const pathname = usePathname()
  if (pathname.startsWith('/lesson')) return null

  return (
    <div className="flex items-center shrink-0 h-16 px-4">
      <h1 className="text-xl font-bold">Samvad</h1>
    </div>
  )
}
