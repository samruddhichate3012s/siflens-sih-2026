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