import React, { useState } from "react"
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState(initialReports[0])
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [hseComment, setHseComment] = useState("")
  const [validationAlert, setValidationAlert] = useState(null)

  // New report form state
  const [formData, setFormData] = useState({
    type: "Near Miss",
    location: "Plant 2 — Boiler Feed Station",
    description: "During routine line flushing, contractor unlocked the high-pressure steam bypass valve before receiving clearance from the control room operator. Zero-energy lockout was bypassed."
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // SIF Potential badge styling
  const getSifBadge = (potential) => {
    if (potential === "High") {
      return "bg-rose-500/20 text-rose-400 border border-rose-500/30"
    } else if (potential === "Medium") {
      return "bg-amber-500/20 text-amber-400 border border-amber-500/30"
    }
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
  }

  // Handle New Report Submission
  const handleAnalyzeReport = (e) => {
    e.preventDefault()
    setIsAnalyzing(true)

    setTimeout(() => {
      const newId = `REP-2026-0${Math.floor(Math.random() * 900) + 100}`
      const createdReport = {
        id: newId,
        type: formData.type,
        location: formData.location,
        sifPotential: "High",
        barrierFailure: "Unauthorized Bypass / Zero-Energy Breach",
        status: "Pending Validation",
        date: new Date().toISOString().split("T")[0],
        activity: "High-Pressure Steam Bypass Operation",
        hazard: "Superheated Steam (350°C, 40 bar)",
        energy: "Thermal & High-Pressure Fluid",
        exposure: "Direct Line of Blast / Severe Skin Contact",
        criticalControl: "Permit-to-Work Isolation Sign-off & Lockout Box",
        potentialConsequence: "Catastrophic Scalding / Fatal Blast SIF",
        lifeSavingRule: "LSR #3: Safe Isolation of Pressurized Systems",
        evidence: "Contractor bypassed permit verification steps; lockout key was not stored in the communal lockbox.",
        confidence: 96
      }

      setReports([createdReport, ...reports])
      setSelectedReport(createdReport)
      setIsAnalyzing(false)
      setActiveTab("analysis")
    }, 800)
  }

  // HSE Validation Actions
  const handleValidateAction = (actionType) => {
    const updated = reports.map((r) => {
      if (r.id === selectedReport.id) {
        return {
          ...r,
          status: actionType === "confirm" ? "Validated (High SIF)" : actionType === "modify" ? "Modified to Medium SIF" : "Rejected SIF"
        }
      }
      return r
    })
    setReports(updated)
    setSelectedReport({
      ...selectedReport,
      status: actionType === "confirm" ? "Validated (High SIF)" : actionType === "modify" ? "Modified to Medium SIF" : "Rejected SIF"
    })
    setValidationAlert(`HSE Validation Logged: ${actionType.toUpperCase()} applied to${selectedReport.id}`)
    setTimeout(() => setValidationAlert(null), 4000)
  }

  const filteredReports = reports.filter(r => {
    if (filterSeverity === "All") return true
    return r.sifPotential === filterSeverity
  })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/70 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none text-white">SIFLens</h1>
              <span className="text-xs text-amber-400 font-mono tracking-wider font-semibold">SIH 2026 HSE INTEL</span>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "dashboard" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              1. Dashboard
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "reports" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Safety Reports
            </button>

            <button
              onClick={() => setActiveTab("new-report")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "new-report" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              3. New Report
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "analysis" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              4. Report Analysis
            </button>

            <button
              onClick={() => setActiveTab("similar")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "similar" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Search className="w-4 h-4" />
              5. Similar Reports
            </button>

            <button
              onClick={() => setActiveTab("precursors")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "precursors" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              6. Recurring Precursors
            </button>

            <button
              onClick={() => setActiveTab("validation")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "validation" ? "bg-rose-600/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              7. HSE Validation
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="text-xs text-slate-400">Target Backend API</div>
          <div className="font-mono text-xs text-emerald-400 mt-0.5">FastAPI: Ready for Connect</div>
          <div className="text-[11px] text-slate-500 mt-1">SIH 2026 • Teammate-Frontend</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active View:</span>
            <span className="text-sm font-semibold text-slate-200 capitalize">{activeTab.replace("-", " ")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Bridge: Mock Active
            </span>
            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              HSE Officer Console
            </div>
          </div>
        </header>

        {validationAlert && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 px-8 py-2.5 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {validationAlert}
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* 1. DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-slate-400">Total Safety Reports</div>
                  <div className="text-3xl font-bold text-slate-100 mt-2">248</div>
                  <div className="text-xs text-slate-500 mt-1">+14 logged this week</div>
                </div>

                <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-rose-300">High SIF-Potential Reports</div>
                  <div className="text-3xl font-bold text-rose-400 mt-2">34</div>
                  <div className="text-xs text-rose-400/80 mt-1">Requires immediate barrier audit</div>
                </div>

                <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-amber-300">Recurring Precursors</div>
                  <div className="text-3xl font-bold text-amber-400 mt-2">12</div>
                  <div className="text-xs text-amber-400/80 mt-1">LOTO & Fall protection lead</div>
                </div>

                <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-medium text-indigo-300">Pending HSE Validations</div>
                  <div className="text-3xl font-bold text-indigo-400 mt-2">9</div>
                  <div className="text-xs text-indigo-400/80 mt-1">2 flagged critical for sign-off</div>
                </div>
              </div>

              {/* Barrier Chart + Quick Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-200">Recurring Barrier-Failure Distribution</h2>
                    <span className="text-xs text-slate-400 font-mono">Pareto Distribution</span>
                  </div>
                  <div className="space-y-4">
                    {barrierChartData.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="text-slate-400">{item.count} Failures ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200 mb-2">Life-Saving Rule (LSR) Focus</h2>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      78% of High SIF predictions in the last 30 days correlate with breaches in <span className="text-rose-400 font-semibold">LSR #3 (Hazardous Energy Isolation)</span> and <span className="text-amber-400 font-semibold">LSR #1 (Working at Height)</span>.
                    </p>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1">
                      <div className="font-semibold text-slate-200">Recommended Action:</div>
                      <div className="text-slate-400">Trigger mandatory engineering barrier lockout review for Unit 4 and Boiler House.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("new-report")}
                    className="mt-6 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    + Log New Incident / Near Miss
                  </button>
                </div>
              </div>

              {/* Recent Reports Table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-200">Recent Safety Reports</h2>
                  <button 
                    onClick={() => setActiveTab("reports")}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    View All Reports <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="pb-3 font-medium">Report ID</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Location</th>
                        <th className="pb-3 font-medium">SIF Potential</th>
                        <th className="pb-3 font-medium">Barrier Failure</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {reports.slice(0, 4).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 font-mono font-medium text-slate-200">{r.id}</td>
                          <td className="py-3">{r.type}</td>
                          <td className="py-3">{r.location}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getSifBadge(r.sifPotential)}`}>
                              {r.sifPotential}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{r.barrierFailure}</td>
                          <td className="py-3">
                            <span className="text-slate-300 font-mono text-[11px]">{r.status}</span>
                          </td>
                          <td className="py-3 text-slate-500">{r.date}</td>
                          <td className="py-3">
                            <button
                              onClick={() => {
                                setSelectedReport(r)
                                setActiveTab("analysis")
                              }}
                              className="text-rose-400 hover:underline font-medium"
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
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Safety Reports Repository</h2>
                  <p className="text-xs text-slate-400">Review all near-misses, unsafe acts, and high SIF precursor events.</p>
                </div>
                {/* Filter controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">SIF Severity:</span>
                  {["All", "High", "Medium", "Low"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilterSeverity(level)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                        filterSeverity === level 
                          ? "bg-rose-600 text-white" 
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">Report ID</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">SIF Potential</th>
                      <th className="pb-3 font-medium">Barrier Failure</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 font-mono font-medium text-slate-200">{r.id}</td>
                        <td className="py-3">{r.type}</td>
                        <td className="py-3">{r.location}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getSifBadge(r.sifPotential)}`}>
                            {r.sifPotential}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{r.barrierFailure}</td>
                        <td className="py-3 text-slate-300">{r.status}</td>
                        <td className="py-3 text-slate-500 font-mono">{r.date}</td>
                        <td className="py-3">
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setActiveTab("analysis")
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-600/30 text-rose-300 border border-slate-700 text-xs transition"
                          >
                            Analysis & Chain
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
            <div className="max-w-2xl mx-auto bg-slate-900/70 border border-slate-800 rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100">Log New Safety Observation / Incident</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter incident text. The AI pipeline analyzes energy, critical controls, and barrier failure chains.
                </p>
              </div>

              <form onSubmit={handleAnalyzeReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Report Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option>Near Miss</option>
                    <option>Unsafe Condition</option>
                    <option>Unsafe Act</option>
                    <option>Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Plant Unit</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    placeholder="e.g. Unit 4 — Catalytic Cracker"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Observation</label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                    placeholder="Describe what happened, equipment involved, personnel actions, and controls..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
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
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-rose-400">{selectedReport.id}</span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{selectedReport.type}</span>
                    <span className="text-xs text-slate-400">{selectedReport.location}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100 mt-1">
                    Activity: {selectedReport.activity}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">SIF Prediction</div>
                    <div className="text-base font-bold text-rose-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      {selectedReport.sifPotential} SIF Potential ({selectedReport.confidence}%)
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("validation")}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Go to HSE Validation
                  </button>
                </div>
              </div>

              {/* SAFETY BARRIER CHAIN (Core SIH Deliverable) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    Safety Barrier Chain
                  </h3>
                  <span className="text-xs text-slate-400">Sequential Breakdown of Barrier Degradation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
                  {/* Step 1: Activity */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">1. Activity</div>
                      <div className="text-xs font-semibold text-slate-200 mt-1">{selectedReport.activity}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800">Operational Phase</div>
                  </div>

                  {/* Step 2: Hazard / Energy */}
                  <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">2. Hazard / Energy</div>
                      <div className="text-xs font-semibold text-amber-300 mt-1">{selectedReport.hazard}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">{selectedReport.energy}</div>
                    </div>
                    <div className="text-[10px] text-amber-500/80 mt-3 pt-2 border-t border-slate-800">Hazardous Source</div>
                  </div>

                  {/* Step 3: Critical Control */}
                  <div className="bg-slate-950 border border-emerald-900/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">3. Critical Control</div>
                      <div className="text-xs font-semibold text-emerald-300 mt-1">{selectedReport.criticalControl}</div>
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-3 pt-2 border-t border-slate-800">Primary Defense</div>
                  </div>

                  {/* Step 4: Barrier Failure */}
                  <div className="bg-rose-950/30 border border-rose-800/60 rounded-lg p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">4. Barrier Failure</div>
                      <div className="text-xs font-semibold text-rose-300 mt-1">{selectedReport.barrierFailure}</div>
                    </div>
                    <div className="text-[10px] text-rose-400/80 mt-3 pt-2 border-t border-rose-900/40">Latent/Active Breach</div>
                  </div>

                  {/* Step 5: Exposure */}
                  <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">5. Exposure</div>
                      <div className="text-xs font-semibold text-amber-200 mt-1">{selectedReport.exposure}</div>
                    </div>
                    <div className="text-[10px] text-amber-500/80 mt-3 pt-2 border-t border-slate-800">Vulnerability Zone</div>
                  </div>

                  {/* Step 6: Potential Consequence */}
                  <div className="bg-rose-950/40 border border-rose-600 rounded-lg p-3.5 flex flex-col justify-between shadow-md shadow-rose-950">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">6. Potential Consequence</div>
                      <div className="text-xs font-bold text-rose-200 mt-1">{selectedReport.potentialConsequence}</div>
                    </div>
                    <div className="text-[10px] font-semibold text-rose-400 mt-3 pt-2 border-t border-rose-900/60">SIF Event</div>
                  </div>
                </div>
              </div>

              {/* Life-Saving Rule & Extracted Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Life-Saving Rule Implicated</h4>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-xs font-semibold text-amber-400">{selectedReport.lifeSavingRule}</div>
                    <div className="text-xs text-slate-400 mt-1">Violation classified under Mandatory Corporate Safety Rules.</div>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Extracted Semantic Evidence</h4>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-300 italic">"{selectedReport.evidence}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SIMILAR REPORTS (Semantic Similarity) */}
          {activeTab === "similar" && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100">Semantically Similar Historical Incidents</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Retrieved via dense semantic vector embeddings across historical plant incident registries.
                </p>
              </div>

              <div className="space-y-3">
                {mockSimilarReports.map((report) => (
                  <div key={report.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{report.id}</span>
                        <span className="text-xs text-slate-500 font-mono">• {report.date}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-200">{report.title}</div>
                      <div className="text-xs text-rose-400/90">{report.consequence}</div>
                    </div>

                    <div className="w-full sm:w-48 shrink-0 space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Match Score</span>
                        <span className="text-rose-400 font-bold">{report.similarity}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${report.similarity}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. RECURRING PRECURSORS */}
          {activeTab === "precursors" && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100">Recurring SIF Precursors & Pattern Detection</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clusters of repeated barrier degradation events across plant locations and maintenance activities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPrecursors.map((p, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                        <div className="text-xs text-rose-400 font-medium mt-0.5">{p.sifRelated}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {p.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 font-medium">Affected Locations: </span>
                        {p.locations.join(", ")}
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Correlated Activities: </span>
                        {p.activities.join(", ")}
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Total Incident Count: </span>
                        <span className="font-semibold text-slate-100">{p.reportsCount} reports</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. HSE VALIDATION */}
          {activeTab === "validation" && (
            <div className="max-w-3xl mx-auto bg-slate-900/70 border border-slate-800 rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100">HSE Officer Validation & Sign-Off</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm, modify, or reject AI-predicted SIF potential classifications before official regulatory archival.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-rose-400 font-bold">{selectedReport.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getSifBadge(selectedReport.sifPotential)}`}>
                    {selectedReport.sifPotential} SIF Potential
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200">{selectedReport.activity} at {selectedReport.location}</div>
                <div className="text-xs text-slate-400">Barrier Failure: {selectedReport.barrierFailure}</div>
                <div className="text-xs text-slate-400">Current Status: <span className="text-slate-200 font-mono">{selectedReport.status}</span></div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">HSE Officer Commentary / Rationale</label>
                <textarea
                  rows={4}
                  value={hseComment}
                  onChange={(e) => setHseComment(e.target.value)}
                  placeholder="Enter notes on field verification, contractor interviews, or corrective actions taken..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleValidateAction("confirm")}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm AI Classification
                </button>

                <button
                  onClick={() => handleValidateAction("modify")}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  Modify Classification
                </button>

                <button
                  onClick={() => handleValidateAction("reject")}
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject / Downgrade SIF
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
