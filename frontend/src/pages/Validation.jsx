import PageHeader from '../components/layout/PageHeader.jsx'

export default function Validation() {
  return (
    <>
      <PageHeader
        title="HSE Validation Queue"
        subtitle="Review AI-flagged precursors. The AI does not make the final safety decision."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        The validation queue and confirm/modify/reject workflow ship in Stage 9.
      </div>
    </>
  )
}
