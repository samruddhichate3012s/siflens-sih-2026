import PageHeader from '../components/layout/PageHeader.jsx'

export default function NewReport() {
  return (
    <>
      <PageHeader
        title="New Safety Report"
        subtitle="Submit a safety event for AI-assisted barrier and SIF precursor analysis."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        Report submission form ships in Stage 5.
      </div>
    </>
  )
}
