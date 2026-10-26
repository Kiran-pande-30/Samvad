import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getScenario } from '@/lib/data/scenarios'
import { NotFoundError } from '@/lib/data/errors'
import ConversationChat from '@/components/conversation/ConversationChat'

const ConversationPage = async ({ params }: PageProps<'/conversations/[slug]'>) => {
  const { slug } = await params
  const supabase = await createClient()

  const scenario = await getScenario(supabase, slug).catch((e) => {
    if (e instanceof NotFoundError) notFound()
    throw e
  })

  return <ConversationChat scenario={scenario} />
}

export default ConversationPage
