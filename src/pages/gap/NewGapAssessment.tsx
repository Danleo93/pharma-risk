import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { GapAssessmentCreatePanel } from '../../components/gap/GapAssessmentCreatePanel'
import { PageHeader } from '../../components/ui/PageHeader'

export default function NewGapAssessment() {
  const navigate = useNavigate()

  return (
    <div className="clinical-page">
      <PageHeader
        title="Nuovo assessment Gap"
        description="Crea un assessment selezionando uno o piu processi della libreria Gap."
        eyebrow="Gap Analysis"
        icon={<FilePlus2 className="h-6 w-6" />}
        backAction={(
          <Link to="/gap/assessments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" />
            Torna agli assessment
          </Link>
        )}
      />

      <GapAssessmentCreatePanel
        onCreated={(assessment) => navigate(`/gap/assessment/${assessment.id}`)}
      />
    </div>
  )
}
