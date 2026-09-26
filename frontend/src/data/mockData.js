export const initialReports = [
  {
    id: "REP-2026-089",
    type: "Near Miss",
    location: "Unit 4 — Catalytic Cracking Unit",
    sifPotential: "High",
    barrierFailure: "LOTO Bypass / Energy Isolation",
    status: "Pending Validation",
    date: "2026-09-22",
    activity: "Pump P-401B Impeller Overhaul",
    hazard: "Pressurized Toxic Hydrocarbon Gas (75 psi)",
    energy: "High Pressure Pneumatic & Chemical",
    exposure: "Breathing Zone / Direct Line of Fire",
    criticalControl: "Double Block and Bleed + Lockout/Tagout",
    potentialConsequence: "Fatal Toxic Inhalation / Blast SIF",
    lifeSavingRule: "LSR #3: Verify Hazardous Energy Isolation Before Work",
    evidence: "Secondary bleed valve tag was absent; isolation spool was cracked open without zero-energy verification.",
    confidence: 94
  },
  {
    id: "REP-2026-084",
    type: "Unsafe Condition",
    location: "Plant 2 — Boiler Feed Station",
    sifPotential: "High",
    barrierFailure: "Missing Fall Arrest Anchor",
    status: "Pending Validation",
    date: "2026-09-21",
    activity: "Steam Drum Valve Inspection",
    hazard: "Elevated Platform at 8.5 Meters",
    energy: "Gravitational Potential",
    exposure: "Unprotected Edge / Scaffold Gap",
    criticalControl: "100% Tie-Off Full Body Harness & Static Line",
    potentialConsequence: "Fatal Fall from Height",
    lifeSavingRule: "LSR #1: Always Use Fall Protection Above 1.8m",
    evidence: "Scaffold toe-board removed on north face; harness lanyard tied to non-rated cable tray.",
    confidence: 91
  },
  {
    id: "REP-2026-077",
    type: "Unsafe Act",
    location: "Substation B — Switchgear Room",
    sifPotential: "High",
    barrierFailure: "Arc Flash PPE Not Worn",
    status: "Validated",
    date: "2026-09-19",
    activity: "11kV Circuit Breaker Racking",
    hazard: "High Voltage Electrical Arc Flash",
    energy: "Electrical (11,000 Volts)",
    exposure: "Direct Proximity within Flash Boundary",
    criticalControl: "Category 4 Arc Flash Suit & Remote Racking Tool",
    potentialConsequence: "Severe Third-Degree Burns / Fatal Blast",
    lifeSavingRule: "LSR #4: Authorized Arc Flash Boundary Protocols",
    evidence: "Technician racked breaker manually with standard 8 cal/cm² coverall instead of rated blast gear.",
    confidence: 89
  },
  {
    id: "REP-2026-071",
    type: "Incident",
    location: "Warehouse Yard — Bay 3",
    sifPotential: "Medium",
    barrierFailure: "Pedestrian Barrier Ignored",
    status: "Validated",
    date: "2026-09-18",
    activity: "Forklift Pallet Transfer",
    hazard: "Moving Heavy Equipment (3.5T Forklift)",
    energy: "Kinetic Mechanical",
    exposure: "Shared Pedestrian/Equipment Pathway",
    criticalControl: "Physical Segregation & Proximity Alarms",
    potentialConsequence: "Crush Injury / Fracture",
    lifeSavingRule: "LSR #7: Maintain Safe Exclusion Zones around Mobile Plant",
    evidence: "Pedestrian walked inside 3m swing perimeter while driver had obstructed line of sight.",
    confidence: 82
  },
  {
    id: "REP-2026-065",
    type: "Unsafe Condition",
    location: "Tank Farm — Sump Area",
    sifPotential: "Low",
    barrierFailure: "Spill Containment Plug Missing",
    status: "Rejected",
    date: "2026-09-16",
    activity: "Routine Sump Drainage",
    hazard: "Residual Lube Oil Sheen",
    energy: "Low Environmental",
    exposure: "Surface Runoff",
    criticalControl: "Secondary Containment Bund",
    potentialConsequence: "Minor Environmental Non-Compliance",
    lifeSavingRule: "LSR #9: Protect the Environment & Prevent Spills",
    evidence: "Drainage valve had slight seepage; no immediate personnel safety hazard.",
    confidence: 72
  }
];

export const mockSimilarReports = [
  {
    id: "HIST-2025-412",
    title: "LOTO incomplete on pump feed breaker during overhaul",
    similarity: 91,
    consequence: "High SIF — Electrical Shock Hazard",
    date: "Oct 2025"
  },
  {
    id: "HIST-2025-309",
    title: "Isolation not confirmed before valve inspection on refinery feed",
    similarity: 87,
    consequence: "High SIF — Toxic Gas Exposure",
    date: "Aug 2025"
  },
  {
    id: "HIST-2025-188",
    title: "Lock not applied on secondary steam isolation manifold",
    similarity: 84,
    consequence: "High SIF — Scalding Risk",
    date: "May 2025"
  },
  {
    id: "HIST-2024-904",
    title: "Breaker tagout applied without physical padlock lockbox",
    similarity: 78,
    consequence: "Medium SIF — Accidental Energization",
    date: "Dec 2024"
  }
];

export const mockPrecursors = [
  {
    name: "LOTO Inadequate Physical Isolation",
    reportsCount: 19,
    locations: ["Unit 4", "Plant 2", "Substation B"],
    activities: ["Overhaul", "Emergency Maintenance", "Spool Removal"],
    sifRelated: "15 / 19 High SIF",
    status: "Critical Precursor"
  },
  {
    name: "Improper Scaffold Tie-Off / Missing Guardrails",
    reportsCount: 14,
    locations: ["Boiler Station", "Flare Stack 2", "Tank 108"],
    activities: ["Inspection", "Insulation Lagging", "Welding"],
    sifRelated: "11 / 14 High SIF",
    status: "Under Audit"
  },
  {
    name: "Bypassed Mobile Equipment Exclusion Zone",
    reportsCount: 9,
    locations: ["Bay 3 Yard", "Logistics Dock", "Scrap Yard"],
    activities: ["Pallet Movement", "Coil Unloading"],
    sifRelated: "4 / 9 High SIF",
    status: "Monitored"
  },
  {
    name: "Hot Work Spark Containment Breakdown",
    reportsCount: 7,
    locations: ["Pipe Rack C", "Unit 1 Crude Still"],
    activities: ["Pipe Grinding", "TIG Welding"],
    sifRelated: "5 / 7 High SIF",
    status: "Action Required"
  }
];

export const barrierChartData = [
  { label: "Energy Isolation (LOTO)", count: 19, color: "bg-rose-500", pct: 85 },
  { label: "Fall Protection & Guarding", count: 14, color: "bg-amber-500", pct: 62 },
  { label: "Permit to Work Compliance", count: 11, color: "bg-blue-500", pct: 48 },
  { label: "Exclusion Zone Enforcement", count: 9, color: "bg-indigo-500", pct: 38 },
  { label: "Toxic/Gas Detection Barriers", count: 6, color: "bg-emerald-500", pct: 28 }
];
