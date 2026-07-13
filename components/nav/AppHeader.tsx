'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const AppHeader = () => {
  const pathname = usePathname()
  if (pathname.startsWith('/lesson')) return null

  return (
    <div className="flex items-center justify-between shrink-0 my-3 px-4">
      <h1 className="text-xl font-bold">Samvad</h1>
      <Link href="/profile"
        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold hover:bg-gray-300 transition-colors">
        ⚙️
      </Link>
    </div>
  )
}
