import { redirect } from 'next/navigation'
import { Flame, Languages, LogOut, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { getProfile } from '@/lib/data/profile'
import { effectiveStreak } from '@/lib/data/progress'

// Server Action: clears the Supabase session cookies, then sends the user to the landing page.
const signOut = async () => {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

const ProfilePage = async () => {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)
  const streak = effectiveStreak(profile.current_streak, profile.last_active_date, profile.timezone)
  const joinedAt = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <main className="flex-1 min-h-0 flex flex-col gap-4 px-4 pb-4 overflow-y-auto">
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200">
        <div className="w-14 h-14 shrink-0 rounded-full bg-coral/10 flex items-center justify-center">
          <span className="text-xl font-bold text-coral-strong">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-bold truncate">{profile.display_name}</span>
          <span className="text-sm text-gray-500 truncate">{user.email}</span>
          <span className="text-xs text-gray-400 mt-0.5">Joined {joinedAt}</span>
        </div>
      </div>

      <div
        className={`flex items-center gap-4 p-5 rounded-2xl ${
          streak > 0 ? 'bg-linear-to-br from-coral to-coral-light text-white' : 'bg-coral/5 border border-coral/15'
        }`}
      >
        <Flame
          className={`w-10 h-10 shrink-0 ${streak > 0 ? 'fill-white/30' : 'text-coral'}`}
          strokeWidth={1.75}
        />
        <div className="flex flex-col">
          <span className="text-[28px] font-bold leading-[1.1]">
            {streak} day{streak === 1 ? '' : 's'}
          </span>
          <span className={`text-sm ${streak > 0 ? 'text-white/90' : 'text-gray-500'}`}>
            {streak > 0 ? 'Current streak. Keep it going!' : 'Finish a lesson today to start your streak'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 p-4 rounded-2xl border border-gray-200">
          <Target className="w-5 h-5 text-coral-strong" />
          <span className="text-xs text-gray-500">Daily goal</span>
          <span className="text-[17px] font-semibold">
            {profile.daily_goal} lesson{profile.daily_goal === 1 ? '' : 's'} / day
          </span>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-2xl border border-gray-200">
          <Languages className="w-5 h-5 text-coral-strong" />
          <span className="text-xs text-gray-500">Learning</span>
          <span className="text-[17px] font-semibold capitalize">{profile.native_language} → Marathi</span>
        </div>
      </div>

      <form action={signOut} className="mt-auto">
        <button
          type="submit"
          className="w-full min-h-14 rounded-2xl border border-gray-200 px-5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform duration-150"
        >
          <span className="text-[15px] font-semibold text-error">Log out</span>
          <LogOut className="w-4.5 h-4.5 text-error" />
        </button>
      </form>
    </main>
  )
}

export default ProfilePage
