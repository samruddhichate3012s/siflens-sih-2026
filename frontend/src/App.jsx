import React, { useState, useEffect } from "react"
import { api } from "./api"
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  PlusCircle, 
  Search, 
  Activity, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ChevronRight, 
  TrendingUp, 
  Layers, 
  ArrowDown, 
  Check, 
  SlidersHorizontal,
  Flame,
  UserCheck
} from "lucide-react"
import { 
  initialReports, 
  mockSimilarReports, 
  mockPrecursors, 
  barrierChartData 
} from "./data/mockData"

const NOT_RECORDED = "Not recorded"

const statusLabel = (validationStatus, revisionCount) => {
  if (validationStatus === "validated") return "Validated"
  if (validationStatus === "rejected") return "Rejected (excluded)"
  if (revisionCount > 0) return `Re-analysed (rev ${revisionCount}) · Pending Validation`
  return "Pending Validation"
}

const ACTION_STYLES = {
  validated: "bg-green-50 text-green-800",
  modified: "bg-amber-50 text-amber-800",
  rejected: "bg-red-50 text-red-700",
}

// Converts a backend report (snake_case) into the field names the UI uses.
// Missing values show "Not recorded" instead of borrowing mock data.
const toUiReport = (r) => ({
  id: r.id,
  type: r.report_type || NOT_RECORDED,
  location: r.location || NOT_RECORDED,
  description: r.report_text,
  translatedText: r.translated_text,
  detectedLanguage: r.detected_language,
  sifPotential: r.sif_potential || "Unknown",
  barrierFailure: r.barrier_failure || NOT_RECORDED,
  validationStatus: r.validation_status || "pending",
  revisionCount: r.revision_count || 0,
  hseAdditionalInfo: r.hse_additional_info,
  status: statusLabel(r.validation_status, r.revision_count),
  date: (r.timestamp || new Date().toISOString()).split("T")[0],
  activity: r.activity || NOT_RECORDED,
  hazard: r.hazard || NOT_RECORDED,
  energy: r.energy || NOT_RECORDED,
  exposure: r.exposure || NOT_RECORDED,
  criticalControl: r.critical_control || NOT_RECORDED,
  potentialConsequence: r.potential_consequence || NOT_RECORDED,
  lifeSavingRule: r.lifesaving_rule || NOT_RECORDED,
  evidence: r.evidence || NOT_RECORDED,
})

// Mock precursors use a different shape; convert them so one page renders both.
const mockPrecursorsUi = mockPrecursors.map((p, idx) => ({
  id: `mock-${idx}`,
  name: p.name,
  lifesavingRule: p.activities.join(", "),
  occurrenceCount: p.reportsCount,
  sifRelatedCount: parseInt(p.sifRelated, 10) || 0,
  evidenceReportIds: [],
  validationStatus: p.status,
}))

const toUiPrecursor = (p) => ({
  id: p.id,
  name: p.name,
  lifesavingRule: p.lifesaving_rule,
  occurrenceCount: p.occurrence_count || 0,
  sifRelatedCount: p.sif_related_count || 0,
  evidenceReportIds: (p.evidence_report_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
  validationStatus: p.validation_status || "pending",
})

const BAR_COLORS = ["bg-[#15617a]", "bg-teal-700", "bg-teal-600", "bg-teal-500", "bg-teal-400"]

// Counts reports per Life-Saving Rule for the dashboard bars.
const buildRuleChart = (reports) => {
  const counts = {}
  reports.forEach((r) => {
    const rule = r.lifeSavingRule
    if (!rule || rule === NOT_RECORDED || rule === "Unknown") return
    counts[rule] = (counts[rule] || 0) + 1
  })
  const total = reports.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], idx) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
      color: BAR_COLORS[idx % BAR_COLORS.length],
    }))
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState(initialReports[0])
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [hseComment, setHseComment] = useState("")
  const [validatorName, setValidatorName] = useState("")
  const [isModifying, setIsModifying] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSubmittingValidation, setIsSubmittingValidation] = useState(false)
  const [validationRecords, setValidationRecords] = useState([])
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [validationAlert, setValidationAlert] = useState(null)

  // New report form state
  const [formData, setFormData] = useState({
    type: "Near Miss",
    location: "Plant 2 · Boiler Feed Station",
    description: "During routine line flushing, contractor unlocked the high-pressure steam bypass valve before receiving clearance from the control room operator. Zero-energy lockout was bypassed."
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [precursors, setPrecursors] = useState(mockPrecursorsUi)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [similarData, setSimilarData] = useState(null)
  const [similarLoading, setSimilarLoading] = useState(false)

  const loadValidationRecords = () =>
    api.getAllValidations().then((data) => {
      if (Array.isArray(data)) setValidationRecords(data)
    })

  const loadPrecursors = () =>
    api.getPrecursors().then((data) => {
      if (Array.isArray(data)) setPrecursors(data.map(toUiPrecursor))
    })

  useEffect(() => {
    api.getReports().then((data) => {
      if (!data) return
      const list = Array.isArray(data) ? data : data.reports || []
      if (list.length === 0) return
      const mapped = list.map(toUiReport)
      setReports(mapped)
      setSelectedReport(mapped[0])
      setIsLive(true)
    })
    loadPrecursors()
    loadValidationRecords()
  }, [])

  // Similar Reports: ask the backend for FAISS matches for the selected report.
  useEffect(() => {
    if (activeTab !== "similar" || !isLive || !selectedReport) return
    setSimilarLoading(true)
    setSimilarData(null)
    api.getSimilarReports(selectedReport.id, 5).then((data) => {
      setSimilarData(data && Array.isArray(data.similar_reports) ? data : null)
      setSimilarLoading(false)
    })
  }, [activeTab, isLive, selectedReport?.id])

  const handleDiscoverPrecursors = async () => {
    setIsDiscovering(true)
    try {
      await api.discoverPrecursors()
      await loadPrecursors()
    } catch (err) {
      alert("Precursor discovery failed. Is the backend running?")
    } finally {
      setIsDiscovering(false)
    }
  }

  const openReport = (id) => {
    const found = reports.find((r) => r.id === id)
    if (found) {
      setSelectedReport(found)
      setActiveTab("analysis")
    }
  }

  // Dashboard numbers, all computed from the loaded reports and precursors.
  // Reports rejected by HSE stay in the list but are left out of every metric.
  const activeReports = reports.filter((r) => r.validationStatus !== "rejected")
  const rejectedCount = reports.length - activeReports.length
  const ruleChart = isLive ? buildRuleChart(activeReports) : barrierChartData
  const highSifReports = activeReports.filter((r) => r.sifPotential === "High")
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const reportsThisWeek = activeReports.filter((r) => r.date >= weekAgo).length
  const pendingReports = activeReports.filter((r) => r.validationStatus === "pending")
  const validatedCount = activeReports.filter((r) => r.validationStatus === "validated").length
  const topRule = ruleChart[0]
  const topRuleHighSif = topRule ? highSifReports.filter((r) => r.lifeSavingRule === topRule.label).length : 0


  
  // SIF Potential badge styling
  const getSifBadge = (potential) => {
    if (potential === "High") {
      return "bg-red-50 text-red-700 border border-red-200"
    } else if (potential === "Medium") {
      return "bg-amber-50 text-amber-800 border border-amber-200"
    }
    return "bg-green-50 text-green-800 border border-green-200"
  }

  // Handle New Report Submission
    
    const handleAnalyzeReport = async (e) => {
    e.preventDefault()
    setIsAnalyzing(true)
    try {
      const result = await api.analyzeReport(formData.description, formData.type, formData.location)
      const created = toUiReport(result)
      setReports((prev) => [created, ...prev])
      setSelectedReport(created)
      setActiveTab("analysis")
    } catch (err) {
      alert("Analysis failed. Is the backend running?")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReanalyze = async () => {
    setIsReanalyzing(true)
    try {
      const result = await api.reanalyzeReport(selectedReport.id)
      const updated = toUiReport(result)
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSelectedReport(updated)
      setValidationAlert(
        `Report #${updated.id} re-analysed: SIF ${result.previous_sif_potential || "?"} → ${updated.sifPotential}, rule ${result.previous_lifesaving_rule || "?"} → ${updated.lifeSavingRule}.`
      )
      setTimeout(() => setValidationAlert(null), 8000)
      await api.discoverPrecursors().catch(() => null)
      loadPrecursors()
    } catch (err) {
      alert(`Re-analysis failed: ${err.message}`)
    } finally {
      setIsReanalyzing(false)
    }
  }

  // HSE Validation Actions (saved in the backend)
  const handleValidateAction = async (action) => {
    if (!isLive) {
      alert("Validation needs the backend. Start Uvicorn and refresh.")
      return
    }
    if (!validatorName.trim()) {
      alert("Enter the HSE officer name first.")
      return
    }
    if (action === "modify" && !additionalInfo.trim()) {
      alert("Add the information the AI should consider before re-analysing.")
      return
    }
    if (action === "reject" && !window.confirm(`Reject report #${selectedReport.id}? It stays in the records but is removed from evaluation.`)) {
      return
    }
    setIsSubmittingValidation(true)
    try {
      const result = await api.validateReport(selectedReport.id, action, validatorName, hseComment, additionalInfo)
      const updated = toUiReport(result.report)
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSelectedReport(updated)
      setHseComment("")
      setAdditionalInfo("")
      setIsModifying(false)
      const messages = {
        validate: `Report #${updated.id} validated and saved to validation records.`,
        modify: `Report #${updated.id} re-analysed with HSE input (rev ${updated.revisionCount}). New result is back for validation.`,
        reject: `Report #${updated.id} rejected. It is kept but excluded from counts and precursors.`,
      }
      setValidationAlert(messages[action])
      setTimeout(() => setValidationAlert(null), 6000)
      // Rejections and re-analysis can change the recurring patterns.
      await api.discoverPrecursors().catch(() => null)
      loadPrecursors()
      loadValidationRecords()
    } catch (err) {
      alert(`Validation failed: ${err.message}`)
    } finally {
      setIsSubmittingValidation(false)
    }
  }

  const filteredReports = reports.filter(r => {
    if (filterSeverity === "All") return true
    return r.sifPotential === filterSeverity
  })

  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "reports", label: "Safety Reports", icon: FileText },
    { key: "new-report", label: "New Report", icon: PlusCircle },
    { key: "analysis", label: "Report Analysis", icon: Activity },
    { key: "similar", label: "Similar Reports", icon: Search },
    { key: "precursors", label: "Recurring Precursors", icon: Layers },
    { key: "validation", label: "HSE Validation", icon: UserCheck },
  ]
  const activeLabel = NAV_ITEMS.find((n) => n.key === activeTab)?.label || ""

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f5f8] text-slate-900">
      {/* Top utility strip */}
      <div className="bg-[#0b2a3c] text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <span>Smart India Hackathon 2026 · Prototype for Oil India Limited (HSE)</span>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400" : "bg-amber-400"}`}></span>
            {isLive ? "Analysis server connected" : "Analysis server offline · showing sample data"}
          </span>
        </div>
      </div>

      {/* Masthead */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md border-2 border-[#15617a] flex items-center justify-center text-[#15617a]">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0b2a3c] leading-tight">SIFLens</h1>
              <div className="text-sm text-slate-600">Safety Barrier &amp; SIF Precursor Intelligence System</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-500">Console</div>
            <div className="text-sm font-semibold text-slate-800">HSE Officer</div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#15617a] via-[#15617a] to-[#e0a526]"></div>
      </header>

      {/* Primary navigation */}
      <nav className="bg-[#15617a] shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-[3px] transition ${
                activeTab === key
                  ? "bg-white/10 text-white border-[#e0a526]"
                  : "text-teal-50/90 border-transparent hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1">
        {/* Page title and breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="text-xs text-slate-500">Home <ChevronRight className="inline w-3 h-3" /> {activeLabel}</div>
          <h2 className="text-xl font-bold text-[#0b2a3c] mt-1">{activeLabel}</h2>
        </div>

        {validationAlert && (
          <div className="max-w-7xl mx-auto px-6 mt-4">
            <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-700 text-green-900 px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 rounded-md">
              <Check className="w-4 h-4 text-green-800" />
              {validationAlert}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* 1. DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 border-t-4 border-t-[#15617a] rounded-md p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Safety Reports</div>
                  <div className="text-3xl font-bold text-[#0b2a3c] mt-2">{activeReports.length}</div>
                  <div className="text-[13px] text-slate-500 mt-1">
                    {reportsThisWeek} logged in the last 7 days{rejectedCount > 0 ? ` · ${rejectedCount} rejected (excluded)` : ""}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 border-t-4 border-t-red-700 rounded-md p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">High SIF-Potential Reports</div>
                  <div className="text-3xl font-bold text-red-700 mt-2">{highSifReports.length}</div>
                  <div className="text-[13px] text-slate-500 mt-1">
                    {activeReports.length ? Math.round((highSifReports.length / activeReports.length) * 100) : 0}% of active reports rated High by the AI
                  </div>
                </div>

                <div className="bg-white border border-slate-200 border-t-4 border-t-[#e0a526] rounded-md p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recurring Precursors</div>
                  <div className="text-3xl font-bold text-amber-800 mt-2">{precursors.length}</div>
                  <div className="text-[13px] text-slate-500 mt-1">
                    {precursors[0] ? `Top: ${precursors[0].lifesavingRule} (${precursors[0].occurrenceCount} reports)` : "Run discovery on the Precursors page"}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 border-t-4 border-t-slate-500 rounded-md p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending HSE Validations</div>
                  <div className="text-3xl font-bold text-teal-800 mt-2">{pendingReports.length}</div>
                  <div className="text-[13px] text-slate-500 mt-1">
                    {validatedCount} validated · {rejectedCount} rejected
                  </div>
                </div>
              </div>

              {/* Barrier Chart + Quick Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-800">Reports by Life-Saving Rule</h2>
                    <span className="text-[13px] text-slate-500 font-mono">Top 5 · % of all reports</span>
                  </div>
                  <div className="space-y-4">
                    {ruleChart.length === 0 && (
                      <div className="text-[13px] text-slate-500">No analysed reports with a Life-Saving Rule yet.</div>
                    )}
                    {ruleChart.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-[13px] font-medium">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.count} reports ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 mb-2">Life-Saving Rule (LSR) Focus</h2>
                    {topRule ? (
                      <>
                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                          <span className="text-red-700 font-semibold">{topRule.label}</span> is the most frequent rule, in {topRule.count} of {activeReports.length} active reports.{" "}
                          {topRuleHighSif} of those are rated High SIF potential.
                        </p>
                        <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-[13px] space-y-1">
                          <div className="font-semibold text-slate-800">Suggested focus:</div>
                          <div className="text-slate-500">Review the {topRule.label} controls in these {topRule.count} reports and validate the matching precursor pattern.</div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-slate-500 leading-relaxed mb-4">No Life-Saving Rule data yet. Analyse a report to populate this.</p>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab("new-report")}
                    className="mt-6 w-full py-2 bg-[#15617a] hover:bg-[#0f4c60] text-white text-[13px] font-semibold rounded-md transition"
                  >
                    + Log New Incident / Near Miss
                  </button>
                </div>
              </div>

              {/* Recent Reports Table */}
              <div className="bg-white border border-slate-200 rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-800">Recent Safety Reports</h2>
                  <button 
                    onClick={() => setActiveTab("reports")}
                    className="text-[13px] text-[#15617a] hover:underline font-medium flex items-center gap-1"
                  >
                    View All Reports <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Report ID</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Location</th>
                        <th className="py-2.5 px-3 font-semibold">SIF Potential</th>
                        <th className="py-2.5 px-3 font-semibold">Barrier Failure</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reports.slice(0, 4).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-medium text-slate-800">{r.id}</td>
                          <td className="py-3 px-3">{r.type}</td>
                          <td className="py-3 px-3">{r.location}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSifBadge(r.sifPotential)}`}>
                              {r.sifPotential}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">{r.barrierFailure}</td>
                          <td className="py-3 px-3">
                            <span className="text-slate-700 text-xs">{r.status}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                setSelectedReport(r)
                                setActiveTab("analysis")
                              }}
                              className="text-[#15617a] hover:underline font-medium"
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. SAFETY REPORTS VIEW */}
          {activeTab === "reports" && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Safety Reports Repository</h2>
                  <p className="text-[13px] text-slate-500">Review all near-misses, unsafe acts, and high SIF precursor events.</p>
                </div>
                {/* Filter controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-slate-500">SIF Severity:</span>
                  {["All", "High", "Medium", "Low"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilterSeverity(level)}
                      className={`px-2.5 py-1 text-[13px] rounded-md font-medium transition ${
                        filterSeverity === level 
                          ? "bg-[#15617a] text-white" 
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Report ID</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Location</th>
                      <th className="py-2.5 px-3 font-semibold">SIF Potential</th>
                      <th className="py-2.5 px-3 font-semibold">Barrier Failure</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">{r.id}</td>
                        <td className="py-3 px-3">{r.type}</td>
                        <td className="py-3 px-3">{r.location}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSifBadge(r.sifPotential)}`}>
                            {r.sifPotential}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{r.barrierFailure}</td>
                        <td className="py-3 px-3 text-slate-700">{r.status}</td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setActiveTab("analysis")
                            }}
                            className="px-3 py-1 rounded bg-white hover:bg-teal-50 text-[#15617a] border border-[#15617a]/40 text-[13px] font-medium whitespace-nowrap transition"
                          >
                            View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. NEW REPORT VIEW */}
          {activeTab === "new-report" && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-md p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Log New Safety Observation / Incident</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Enter incident text. The AI pipeline analyzes energy, critical controls, and barrier failure chains.
                </p>
              </div>

              <form onSubmit={handleAnalyzeReport} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Report Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#15617a]"
                  >
                    <option>Near Miss</option>
                    <option>Unsafe Condition</option>
                    <option>Unsafe Act</option>
                    <option>Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Location / Plant Unit</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#15617a]"
                    placeholder="e.g. Unit 4 · Catalytic Cracker"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Description / Observation</label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-[13px] text-slate-800 focus:outline-none focus:border-[#15617a] leading-relaxed font-sans"
                    placeholder="Describe what happened, equipment involved, personnel actions, and controls..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-[#15617a] hover:bg-[#0f4c60] text-white font-semibold text-[13px] rounded-md transition   flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Barrier Failure & SIF Potential...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze Report with SIFLens AI
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 4. REPORT ANALYSIS VIEW */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-red-700">{selectedReport.id}</span>
                    <span className="text-[13px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">{selectedReport.type}</span>
                    <span className="text-[13px] text-slate-500">{selectedReport.location}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">
                    Activity: {selectedReport.activity}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">SIF Prediction (AI rating: High / Medium / Low)</div>
                    <div className={`text-base font-bold flex items-center gap-1.5 ${selectedReport.sifPotential === "High" ? "text-red-700" : selectedReport.sifPotential === "Medium" ? "text-amber-700" : "text-green-800"}`}>
                      <Flame className="w-4 h-4" />
                      {selectedReport.sifPotential} SIF Potential
                    </div>
                  </div>
                  {isLive && (
                    <button
                      onClick={handleReanalyze}
                      disabled={isReanalyzing}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 border border-slate-300 text-[13px] font-semibold rounded-md transition"
                    >
                      {isReanalyzing ? "Re-analysing..." : "Reanalyze"}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("validation")}
                    className="px-3 py-2 bg-[#15617a] hover:bg-[#0f4c60] text-white text-[13px] font-semibold rounded-md transition"
                  >
                    Go to HSE Validation
                  </button>
                </div>
              </div>

              {/* SAFETY BARRIER CHAIN (Core SIH Deliverable) */}
              <div className="bg-white border border-slate-200 rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-700" />
                    Safety Barrier Chain
                  </h3>
                  <span className="text-[13px] text-slate-500">Sequential Breakdown of Barrier Degradation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
                  {/* Step 1: Activity */}
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">1. Activity</div>
                      <div className="text-[13px] font-semibold text-slate-800 mt-1">{selectedReport.activity}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">Operational Phase</div>
                  </div>

                  {/* Step 2: Hazard / Energy */}
                  <div className="bg-slate-50 border border-amber-200 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">2. Hazard / Energy</div>
                      <div className="text-[13px] font-semibold text-amber-800 mt-1">{selectedReport.hazard}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{selectedReport.energy}</div>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-3 pt-2 border-t border-slate-200">Hazardous Source</div>
                  </div>

                  {/* Step 3: Critical Control */}
                  <div className="bg-slate-50 border border-green-200 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-green-800 tracking-wider">3. Critical Control</div>
                      <div className="text-[13px] font-semibold text-green-800 mt-1">{selectedReport.criticalControl}</div>
                    </div>
                    <div className="text-[11px] text-green-800 mt-3 pt-2 border-t border-slate-200">Primary Defense</div>
                  </div>

                  {/* Step 4: Barrier Failure */}
                  <div className="bg-red-50 border border-red-200 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-red-700 tracking-wider">4. Barrier Failure</div>
                      <div className="text-[13px] font-semibold text-red-700 mt-1">{selectedReport.barrierFailure}</div>
                    </div>
                    <div className="text-[11px] text-red-700 mt-3 pt-2 border-t border-red-200">Latent/Active Breach</div>
                  </div>

                  {/* Step 5: Exposure */}
                  <div className="bg-slate-50 border border-amber-200 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">5. Exposure</div>
                      <div className="text-[13px] font-semibold text-amber-800 mt-1">{selectedReport.exposure}</div>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-3 pt-2 border-t border-slate-200">Vulnerability Zone</div>
                  </div>

                  {/* Step 6: Potential Consequence */}
                  <div className="bg-red-50 border border-red-300 rounded-md p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-red-700 tracking-wider">6. Potential Consequence</div>
                      <div className="text-[13px] font-bold text-red-800 mt-1">{selectedReport.potentialConsequence}</div>
                    </div>
                    <div className="text-[11px] font-semibold text-red-700 mt-3 pt-2 border-t border-red-200">SIF Event</div>
                  </div>
                </div>
              </div>

              {/* Original and translated text */}
              {selectedReport.description && (
                <div className="bg-white border border-slate-200 rounded-md p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Original Report{selectedReport.detectedLanguage ? ` (${selectedReport.detectedLanguage})` : ""}
                    </h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed">{selectedReport.description}</p>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-2">English Text Used for Analysis</h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed">{selectedReport.translatedText || selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* Life-Saving Rule & Extracted Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
                  <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Life-Saving Rule Implicated</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-[13px] font-semibold text-amber-800">{selectedReport.lifeSavingRule}</div>
                    <div className="text-[13px] text-slate-500 mt-1">Violation classified under Mandatory Corporate Safety Rules.</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
                  <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Extracted Semantic Evidence</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                    <p className="text-[13px] text-slate-700 italic">"{selectedReport.evidence}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SIMILAR REPORTS (Semantic Similarity) */}
          {activeTab === "similar" && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Similar Historical Incidents (OSHA memory)</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  The selected report is compared with about 3,000 historical OSHA incident narratives stored in a FAISS vector index.
                  Match score = how close the two texts are in meaning (cosine similarity of MiniLM sentence embeddings, 0 to 100%).
                  Matches that also share a keyword with the report's hazard, energy, control or barrier failure are ranked first.
                </p>
              </div>

              {isLive && (
                <div className="p-4 bg-slate-50 border border-red-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase text-red-700 tracking-wider">Compared report</div>
                    <select
                      value={selectedReport.id}
                      onChange={(e) => {
                        const found = reports.find((r) => String(r.id) === e.target.value)
                        if (found) setSelectedReport(found)
                      }}
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-[13px] text-slate-800"
                    >
                      {reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          Report #{r.id} · {r.lifeSavingRule}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[13px] text-slate-800">{selectedReport.translatedText || selectedReport.description}</div>
                  {similarData?.keywords_from && (
                    <div className="text-xs text-slate-500">Keywords taken from: {similarData.keywords_from}</div>
                  )}
                </div>
              )}

              {similarLoading && <div className="text-[13px] text-slate-500">Searching the historical index...</div>}
              {isLive && !similarLoading && !similarData && (
                <div className="text-[13px] text-amber-800">Could not load similar reports. Check that the backend is running and the FAISS index exists.</div>
              )}

              <div className="space-y-3">
                {isLive && similarData && similarData.similar_reports.map((m) => (
                  <div key={`${m.report_id}-${m.rank}`} className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] text-slate-500">#{m.rank} · OSHA {m.report_id}</span>
                        {m.event_type && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{m.event_type}</span>}
                        {m.nature && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{m.nature}</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.keyword_match ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                          {m.keyword_match ? "Meaning + keyword match" : "Meaning match only"}
                        </span>
                      </div>
                      <div className="text-[13px] text-slate-800 leading-relaxed">{m.narrative}</div>
                      {m.employer && <div className="text-xs text-slate-500">{m.employer}</div>}
                    </div>

                    <div className="w-full sm:w-44 shrink-0 space-y-1">
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-slate-500">Match Score</span>
                        <span className="text-red-700 font-bold">{m.similarity}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-700 rounded-full" style={{ width: `${m.similarity}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}

                {!isLive && mockSimilarReports.map((report) => (
                  <div key={report.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-slate-500">{report.id}</span>
                        <span className="text-[13px] text-slate-500 font-mono">· {report.date} · mock data</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{report.title}</div>
                      <div className="text-[13px] text-red-700">{report.consequence}</div>
                    </div>
                    <div className="w-full sm:w-48 shrink-0 space-y-1">
                      <div className="flex justify-between text-[13px] font-medium">
                        <span className="text-slate-500">Match Score</span>
                        <span className="text-red-700 font-bold">{report.similarity}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-700 rounded-full" style={{ width: `${report.similarity}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. RECURRING PRECURSORS */}
          {activeTab === "precursors" && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recurring SIF Precursors & Pattern Detection</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Analysed reports grouped by the Life-Saving Rule the AI assigned. A rule seen in 2 or more reports becomes a recurring precursor.
                    Counts are out of the {isLive ? activeReports.length : "mock"} active reports (HSE-rejected reports are excluded), not the OSHA history.
                  </p>
                </div>
                {isLive && (
                  <button
                    onClick={handleDiscoverPrecursors}
                    disabled={isDiscovering}
                    className="shrink-0 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition"
                  >
                    {isDiscovering ? "Re-running..." : "Re-run Discovery"}
                  </button>
                )}
              </div>

              {precursors.length === 0 && (
                <div className="text-[13px] text-slate-500">No recurring patterns yet. Click "Re-run Discovery" after analysing a few reports.</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {precursors.map((p) => (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                        <div className="text-[13px] text-red-700 font-medium mt-0.5">
                          {p.sifRelatedCount} / {p.occurrenceCount} rated High SIF
                        </div>
                      </div>
                      <span className="text-[13px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 capitalize">
                        {p.validationStatus}
                      </span>
                    </div>

                    <div className="space-y-2 text-[13px] text-slate-700">
                      <div>
                        <span className="text-slate-500 font-medium">Life-Saving Rule: </span>
                        {p.lifesavingRule}
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Total Report Count: </span>
                        <span className="font-semibold text-slate-900">{p.occurrenceCount} reports</span>
                      </div>
                      {p.evidenceReportIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Evidence reports: </span>
                          {p.evidenceReportIds.map((id) => (
                            <button
                              key={id}
                              onClick={() => openReport(id)}
                              className="px-1.5 py-0.5 rounded bg-white border border-[#15617a]/30 hover:bg-teal-50 text-[#15617a] font-mono text-xs"
                            >
                              #{id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. HSE VALIDATION */}
          {activeTab === "validation" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-slate-200 rounded-md p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">HSE Officer Validation & Sign-Off</h2>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Validate to sign off the AI result. Modify to add information and send the report back through the AI.
                      Reject to keep the report on record but remove it from evaluation.
                    </p>
                  </div>
                  {isLive && (
                    <select
                      value={selectedReport.id}
                      onChange={(e) => {
                        const found = reports.find((r) => String(r.id) === e.target.value)
                        if (found) {
                          setSelectedReport(found)
                          setIsModifying(false)
                        }
                      }}
                      className="shrink-0 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-800"
                    >
                      {[...pendingReports, ...reports.filter((r) => r.validationStatus !== "pending")].map((r) => (
                        <option key={r.id} value={r.id}>
                          #{r.id} · {r.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono text-[13px] text-red-700 font-bold">Report #{selectedReport.id} · {selectedReport.type} · {selectedReport.location}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSifBadge(selectedReport.sifPotential)}`}>
                      {selectedReport.sifPotential} SIF Potential
                    </span>
                  </div>
                  <div className="text-[13px] text-slate-700">{selectedReport.translatedText || selectedReport.description}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-slate-500 pt-1">
                    <div>Life-Saving Rule: <span className="text-slate-800">{selectedReport.lifeSavingRule}</span></div>
                    <div>Barrier Failure: <span className="text-slate-800">{selectedReport.barrierFailure}</span></div>
                    <div>Potential Consequence: <span className="text-slate-800">{selectedReport.potentialConsequence}</span></div>
                    <div>Status: <span className="text-slate-800 font-mono">{selectedReport.status}</span></div>
                  </div>
                  {selectedReport.hseAdditionalInfo && (
                    <div className="mt-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-[13px] text-amber-800 whitespace-pre-line">
                      <span className="font-semibold">HSE information used in re-analysis: </span>
                      {selectedReport.hseAdditionalInfo}
                    </div>
                  )}
                </div>

                {selectedReport.validationStatus === "rejected" ? (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[13px] text-red-800">
                    This report was rejected. It stays in the records below but is excluded from dashboard counts and precursor discovery.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">HSE Officer Name</label>
                        <input
                          value={validatorName}
                          onChange={(e) => setValidatorName(e.target.value)}
                          placeholder="e.g. R. Sharma"
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#15617a]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">Commentary / Rationale</label>
                        <input
                          value={hseComment}
                          onChange={(e) => setHseComment(e.target.value)}
                          placeholder="Field verification notes, interviews, corrective actions..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#15617a]"
                        />
                      </div>
                    </div>

                    {isModifying ? (
                      <div className="space-y-2 p-4 rounded-md border border-amber-300 bg-amber-50">
                        <label className="block text-[13px] font-semibold text-amber-800">
                          What should the AI take into account? (added to the report and re-analysed)
                        </label>
                        <textarea
                          rows={4}
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder="e.g. The valve was double-block isolated and only the tag was missing. No one was inside the line of fire."
                          className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-[13px] text-slate-800 focus:outline-none focus:border-amber-600 leading-relaxed font-sans"
                        ></textarea>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidateAction("modify")}
                            disabled={isSubmittingValidation}
                            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition flex items-center justify-center gap-2"
                          >
                            {isSubmittingValidation ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Re-analysing with SIFLens AI...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                Submit & Re-analyse
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setIsModifying(false)}
                            disabled={isSubmittingValidation}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-semibold rounded-md transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => handleValidateAction("validate")}
                          disabled={isSubmittingValidation}
                          className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Validate AI Analysis
                        </button>

                        <button
                          onClick={() => setIsModifying(true)}
                          disabled={isSubmittingValidation}
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modify (add info & re-analyse)
                        </button>

                        <button
                          onClick={() => handleValidateAction("reject")}
                          disabled={isSubmittingValidation}
                          className="flex-1 py-2.5 bg-red-700 hover:bg-[#15617a] disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject (exclude)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Validation documentation */}
              <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validation Documentation</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Every HSE decision, with the AI result it was made on. Stored in the report_validations table.
                  </p>
                </div>
                {validationRecords.length === 0 ? (
                  <div className="text-[13px] text-slate-500">No validation decisions recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Date</th>
                          <th className="py-2.5 px-3 font-semibold">Report</th>
                          <th className="py-2.5 px-3 font-semibold">Decision</th>
                          <th className="py-2.5 px-3 font-semibold">Officer</th>
                          <th className="py-2.5 px-3 font-semibold">AI result at the time</th>
                          <th className="py-2.5 px-3 font-semibold">Comment / Info added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {validationRecords.map((v) => (
                          <tr key={v.id} className="align-top">
                            <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{String(v.timestamp || "").replace("T", " ").slice(0, 16)}</td>
                            <td className="py-2 px-3">
                              <button onClick={() => openReport(v.report_id)} className="font-mono text-[#15617a] hover:underline">
                                #{v.report_id}
                              </button>
                              {v.revision > 0 && <span className="text-slate-500"> rev {v.revision}</span>}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded capitalize ${ACTION_STYLES[v.action] || ""}`}>{v.action}</span>
                            </td>
                            <td className="py-2 px-3">{v.validator}</td>
                            <td className="py-2 px-3 text-slate-500">{v.sif_potential} · {v.lifesaving_rule}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {v.comment}
                              {v.additional_info && <div className="text-amber-800">+ {v.additional_info}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0b2a3c] text-slate-300 text-xs mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between gap-2">
          <span>SIFLens · Safety Barrier &amp; SIF Precursor Intelligence · SIH 2026 prototype</span>
          <span>AI results are advisory and require HSE officer validation.</span>
        </div>
      </footer>
    </div>
  )
}
