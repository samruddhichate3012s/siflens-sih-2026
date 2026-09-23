import PageHeader from '../components/layout/PageHeader.jsx'

export default function Reports() {
  return (
    <>
      <PageHeader
        title="Safety Reports"
        subtitle="Browse and search all submitted safety reports."
      />
      <div className="card p-8 text-center text-[13px] text-ink/40">
        Reports table ships alongside Stage 4 (Dashboard) and Stage 6.
      </div>
    </>
  )
}
