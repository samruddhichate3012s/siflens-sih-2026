import PageHeader from '../components/layout/PageHeader.jsx'

export default function HistoricalMemory() {
  return (
    <>
      <PageHeader
        title="Historical Safety Memory"
        subtitle="Explore reports connected by semantic safety similarity."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        Semantic search and similarity results ship in Stage 7.
      </div>
    </>
  )
}
