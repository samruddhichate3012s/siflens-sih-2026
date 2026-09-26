import PageHeader from '../components/layout/PageHeader.jsx'

export default function Analytics() {
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Trends across precursors, barrier failures, and SIF potential."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        Trend and distribution charts ship in Stage 10.
      </div>
    </>
  )
}
