import { ModuleWithLessons } from '@/lib/types'
import ModuleCard from '@/components/modules/ModuleCard'

const ModuleList = ({ modules }: { modules: ModuleWithLessons[] }) => {
  return (
    <div>
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  )
}

export default ModuleList
