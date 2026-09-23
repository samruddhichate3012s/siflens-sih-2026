import { useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader.jsx'

export default function ReportAnalysis() {
  const { id } = useParams()
  return (
    <>
      <PageHeader
        title={`Report #${id}`}
        subtitle="Safety barrier chain, AI reasoning and historical connections."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        The Safety Barrier Chain and AI Reasoning panel ship in Stage 6 — the highest-priority page.
      </div>
    </>
  )
}
