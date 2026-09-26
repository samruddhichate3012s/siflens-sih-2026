const API_BASE_URL = "http://localhost:8000";

export const api = {
  // Fetch all reports for the dashboard and repository
  getReports: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching reports:", error);
      return null; // Fallback to mock data in App.jsx if backend is down
    }
  },

  // Fetch a single report's full analysis
  getReport: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching report:", error);
      return null;
    }
  },

  // Send a new report for AI processing
  analyzeReport: async (reportText, reportType = null, location = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_text: reportText, report_type: reportType, location })
      });
      if (!response.ok) throw new Error(`Analyze failed with status ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error analyzing report:", error);
      throw error;
    }
  },

  // Fetch historically similar reports for a given analyzed report
  getSimilarReports: async (reportId, topK = 5) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/similar?top_k=${topK}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching similar reports:", error);
      return null;
    }
  },

  // Fetch all recurring precursor patterns
  getPrecursors: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/precursors`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching precursors:", error);
      return null;
    }
  },

  // Fetch one precursor pattern's full detail
  getPrecursorDetails: async (precursorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/precursors/${precursorId}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching precursor details:", error);
      return null;
    }
  },

  // Trigger recomputation of recurring precursor patterns
  discoverPrecursors: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/precursors/discover`, {
        method: "POST"
      });
      return await response.json();
    } catch (error) {
      console.error("Error running precursor discovery:", error);
      throw error;
    }
  },

  // Submit HSE Officer validation for a PRECURSOR PATTERN
  // Note: validation happens on precursor patterns, not individual reports,
  // since a precursor represents a recurring pattern across multiple reports.
  validatePrecursor: async (precursorId, status, comment, validator) => {
    try {
      const response = await fetch(`${API_BASE_URL}/precursors/${precursorId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment, validator })
      });
      return await response.json();
    } catch (error) {
      console.error("Error validating precursor:", error);
      throw error;
    }
  },

  // HSE decision on one report: action is "validate", "modify" or "reject".
  // Modify re-runs the AI with the additional info and returns the report to pending.
  validateReport: async (reportId, action, validator, comment = "", additionalInfo = "") => {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, validator, comment, additional_info: additionalInfo })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `Validation failed (${response.status})`);
    return data;
  },

  // Validation documentation for one report
  getReportValidations: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/validations`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching report validations:", error);
      return null;
    }
  },

  // Validation documentation across all reports
  getAllValidations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/validations`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching validation records:", error);
      return null;
    }
  },

  // Fetch validation history for a precursor pattern
  getPrecursorValidations: async (precursorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/precursors/${precursorId}/validations`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching validation history:", error);
      return null;
    }
  }
};