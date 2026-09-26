import { useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader.jsx'

export default function PrecursorDetails() {
  const { id } = useParams()
  return (
    <>
      <PageHeader
        title="Precursor Case File"
        subtitle={`Investigation dossier for precursor #${id}.`}
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        The case file dossier ships in Stage 8.
      </div>
    </>
  )
}
