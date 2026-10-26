import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getScenarios } from '@/lib/data/scenarios'

const ConversationsPage = async () => {
  const supabase = await createClient()
  const scenarios = await getScenarios(supabase)

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
      <h2 className="text-[28px] font-bold leading-[1.2]">Practise speaking</h2>
      <p className="mt-2 text-[15px] text-gray-500">
        Talk through a real situation in Marathi. Speak or type — you&apos;ll get a gentle correction when something is off.
      </p>

      {scenarios.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-200 p-6 text-center">
          <p className="font-semibold">No conversations yet</p>
          <p className="mt-1 text-[15px] text-gray-500">New situations are on the way. Keep going with your lessons meanwhile.</p>
          <Link href="/" className="mt-4 inline-flex h-11 px-6 items-center rounded-full bg-coral-strong text-white font-semibold text-[15px]">
            Back to lessons
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {scenarios.map((scenario) => (
            <li key={scenario.slug}>
              <Link
                href={`/conversations/${scenario.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 p-5 active:scale-[0.985] transition-transform duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[17px]">{scenario.title}</p>
                  <p className="mt-0.5 text-[15px] text-gray-500">{scenario.title_mr}</p>
                  <p className="mt-3 inline-flex rounded-full bg-coral/5 px-3 py-1 text-[13px] font-medium text-coral-strong">
                    {scenario.goals.length} goals
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ConversationsPage
