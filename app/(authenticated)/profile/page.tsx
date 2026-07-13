import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { getProfile } from '@/lib/data/profile'

const ProfilePage = async () => {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)
  const joinedAt = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <main className="flex-1 min-h-0 flex flex-col px-4 overflow-y-auto">
      <div className="w-full rounded-2xl shadow-md overflow-hidden">
        <div className="bg-linear-to-br from-brand-blue to-brand-blue-light px-4 py-4 flex justify-between">
          <div className="w-16 h-16 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
          </div>

          <div className="flex flex-col gap-1 min-w-0 items-end text-muted">
            <span className="text-lg font-bold truncate">{profile.display_name}</span>
            <span className="text-sm truncate">{user.email}</span>
            <span className="text-xs">Joined on {joinedAt}</span>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl shadow-md overflow-hidden bg-linear-to-br from-brand-blue to-brand-blue-light mt-4">
        <div className="px-4 py-4 flex flex-col gap-3">
          <span className="text-sm font-semibold text-white">Stats</span>

          <div className="flex justify-between items-center text-sm text-muted">
            <span>Current Streak</span>
            <span className="font-medium">{profile.current_streak}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-muted">
            <span>Daily Goal</span>
            <span className="font-medium">{profile.daily_goal}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-muted">
            <span>Native Language</span>
            <span className="font-medium capitalize">{profile.native_language}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 mt-auto pt-4 pb-4">
        <button
          type="button"
          disabled
          className="w-full rounded-2xl shadow-md bg-surface px-4 py-4 flex items-center justify-between disabled:cursor-not-allowed"
        >
          <span className="text-sm font-semibold">Dictionary</span>
          <span className="text-xs font-medium text-stone bg-white rounded-full px-3 py-1">Coming soon</span>
        </button>

        <button
          type="button"
          disabled
          className="w-full rounded-2xl shadow-md bg-surface px-4 py-4 flex items-center justify-between disabled:cursor-not-allowed"
        >
          <span className="text-sm font-semibold">Logout</span>
          <span className="text-xs font-medium text-stone bg-white rounded-full px-3 py-1">Coming soon</span>
        </button>
      </div>
    </main>
  )
}

export default ProfilePage
