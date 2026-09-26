import PageHeader from '../components/layout/PageHeader.jsx'

export default function Dashboard() {
  return (
    <>
      <PageHeader
        status="System Operational"
        title="Safety Intelligence Center"
        subtitle="Monitor emerging SIF precursor signals and critical safety-barrier failures."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        Dashboard content ships in Stage 4.
      </div>
    </>
  )
}
