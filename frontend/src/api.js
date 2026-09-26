const API_BASE_URL = "http://localhost:8000/api"; // Default FastAPI port

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

  // Send a new report for AI processing
  analyzeReport: async (reportData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      return await response.json();
    } catch (error) {
      console.error("Error analyzing report:", error);
      throw error;
    }
  },

  // Submit HSE Officer validation
  validateReport: async (reportId, actionType, hseComment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, comment: hseComment })
      });
      return await response.json();
    } catch (error) {
      console.error("Error validating report:", error);
      throw error;
    }
  }
};
