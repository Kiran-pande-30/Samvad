import { ModuleColor } from '@/lib/types'

export const MODULE_GRADIENTS = [
  'from-coral to-coral-light',
  'from-magenta to-magenta-light',
  'from-purple to-purple-light',
  'from-luxe to-luxe-light',
  'from-rausch to-rausch-light',
  'from-brand-blue-700 to-brand-blue-700-light',
  'from-brand-cyan to-brand-cyan-light'
]

// Parallel to MODULE_GRADIENTS — index by (moduleNumber - 1) % length so a
// lesson dot matches the gradient color of its own module's sticky header.
export const MODULE_COLORS: ModuleColor[] = [
  { bg: 'bg-coral', border: 'border-[#C7431F]', outline: 'outline-coral' },
  { bg: 'bg-magenta', border: 'border-[#B64997]', outline: 'outline-magenta' },
  { bg: 'bg-purple', border: 'border-[#8342C1]', outline: 'outline-purple' },
  { bg: 'bg-luxe', border: 'border-[#37035E]', outline: 'outline-luxe' },
  { bg: 'bg-rausch', border: 'border-[#C72C48]', outline: 'outline-rausch' },
  { bg: 'bg-brand-blue-700', border: 'border-[#123462]', outline: 'outline-brand-blue-700' },
  { bg: 'bg-brand-cyan', border: 'border-[#3088C7]', outline: 'outline-brand-cyan' },
]
