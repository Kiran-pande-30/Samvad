import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { getProfile } from '@/lib/data/profile'
import MobileNavBar from '@/components/nav/MobileNavBar'
import ModuleList from '@/components/modules/ModuleList'
import { getModulesWithLessons } from '@/lib/data/modules'

const SamvadIllustration = () => {
  const ink = '#111111'
  const globeStroke = '#DDDDE4'
  const bubble1 = '#FF5C3F'
  const bubble2 = '#F5B400'
  const bubble3 = '#3D6FFF'

  return (
    <svg viewBox="0 0 330 300" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block overflow-visible">
      <circle cx="175" cy="155" r="120" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="155" rx="120" ry="34" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="108" rx="100" ry="27" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="202" rx="100" ry="27" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="65"  rx="58"  ry="16" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="244" rx="58"  ry="16" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="155" rx="44"  ry="120" stroke={globeStroke} strokeWidth="1.5"/>
      <ellipse cx="175" cy="155" rx="88"  ry="120" stroke={globeStroke} strokeWidth="1.5"/>
      <rect x="104" y="166" width="44" height="60" rx="11" fill="#C5D9F8" stroke={ink} strokeWidth="2"/>
      <path d="M114 166 Q128 157 142 166" stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="113" y="183" width="26" height="19" rx="4.5" fill="white" stroke={ink} strokeWidth="1.5"/>
      <line x1="113" y1="208" x2="131" y2="208" stroke={ink} strokeWidth="1" strokeDasharray="3.5 2.5"/>
      <path d="M146 170 Q141 196 143 246 L209 246 Q211 196 208 170 Q199 160 177 159 Q155 160 146 170Z"
        fill="white" stroke={ink} strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M207 181 Q232 194 236 222 L236 246"
        stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <rect x="225" y="228" width="24" height="40" rx="5.5" fill={ink}/>
      <rect x="227" y="231" width="20" height="34" rx="3.5" fill="white"/>
      <circle cx="237" cy="265" r="2" fill={ink}/>
      <path d="M169 139 L167 161 L185 161 L184 139Z" fill="white" stroke={ink} strokeWidth="2"/>
      <circle cx="175" cy="103" r="35" fill="white" stroke={ink} strokeWidth="2.5"/>
      <path d="M140 101 Q135 111 140 121" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M210 101 Q215 111 210 121" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M141 99 Q148 74 175 71 Q202 74 209 99 Q204 81 175 78 Q146 81 141 99Z" fill="#1A1A1A"/>
      <path d="M140 100 Q148 64 175 62 Q202 64 210 100"
        stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="130" y="98"  width="14" height="24" rx="7" fill={ink}/>
      <rect x="210" y="98"  width="14" height="24" rx="7" fill={ink}/>
      <circle cx="165" cy="107" r="9" fill="none" stroke={ink} strokeWidth="2"/>
      <circle cx="185" cy="107" r="9" fill="none" stroke={ink} strokeWidth="2"/>
      <line x1="174" y1="107" x2="176" y2="107" stroke={ink} strokeWidth="2" strokeLinecap="round"/>
      <line x1="156" y1="107" x2="152" y2="105" stroke={ink} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="194" y1="107" x2="198" y2="105" stroke={ink} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="52" cy="136" r="43" fill={bubble1}/>
      <path d="M92 150 L114 162 L89 166Z" fill={bubble1}/>
      <text x="52" y="144" textAnchor="middle" fontSize={18}
        fontFamily="'Noto Sans', 'Noto Sans Devanagari', serif" fontWeight="600" fill="white">
        नमस्ते
      </text>
      <rect x="224" y="52" width="98" height="62" rx="19" fill={bubble2}/>
      <path d="M236 112 L222 130 L254 120Z" fill={bubble2}/>
      <text x="273" y="94" textAnchor="middle" fontSize="36"
        fontFamily="'DM Sans', sans-serif" fontWeight="700" fill="white">Hi</text>
      <rect x="227" y="248" width="86" height="56" rx="17" fill={bubble3}/>
      <path d="M240 248 L226 233 L258 243Z" fill={bubble3}/>
      <circle cx="263" cy="270" r="14" fill="rgba(255,255,255,0.22)"/>
      <path d="M259 264 L259 276 L271 270Z" fill="white"/>
      <circle cx="292" cy="258" r="4.5" fill="white" fillOpacity="0.55"/>
      <circle cx="303" cy="273" r="3"   fill="white" fillOpacity="0.4"/>
      <circle cx="290" cy="285" r="2.5" fill="white" fillOpacity="0.5"/>
    </svg>
  )
}

const RootPage = async () => {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  if (user) {
    const profile = await getProfile(supabase, user.id)
    const modules = profile.active_language_pair?.slug
      ? await getModulesWithLessons(supabase, profile.active_language_pair.slug)
      : []

    return (
      <div className="flex flex-col min-h-dvh pb-16">
        <div className="fixed inset-0 flex justify-center">
          <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col px-7 pt-6 pb-10">
            <div className="flex items-center justify-between shrink-0 mb-8">
              <h1 className="text-[32px] font-bold text-[#111111]">Samvad</h1>
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-[#F0F0F0] flex items-center justify-center text-[18px] font-semibold text-[#111111] hover:bg-[#E0E0E0] transition-colors"
              >
                ⚙️
              </Link>
            </div>
            <ModuleList modules={modules} />
          </div>
        </div>
        <MobileNavBar />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex justify-center">
      <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col px-7 pt-16 pb-10">

        <h1 className="text-[38px] font-bold leading-[1.16] tracking-[-1px] text-[#111111] shrink-0">
          Talk Across Languages
        </h1>

        <div className="flex-1 flex items-center justify-center min-h-0 -mx-1 my-2">
          <SamvadIllustration />
        </div>

        <div className="shrink-0">
          <p className="text-base font-normal leading-[1.58] text-[#8A8A96] mb-6">
            Built for India&apos;s closely connected languages.
          </p>

          <Link
            href="/login"
            className="w-full h-14.5 bg-[#FF5C3F] text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-between pl-7.5 pr-4.5 cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150">
            <span>Start Learning</span>
            <div className="w-9.5 h-9.5 bg-white/18 rounded-full flex items-center justify-center text-[19px] leading-none">
              →
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RootPage;