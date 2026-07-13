import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/candidates`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getCandidates = async (search = "", status = "", source = "", archived = "false", sort = "newest", page = "", limit = "", jobId = "", minMatchScore = "") => {
  let url = API_URL;
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (source) params.append("source", source);
  if (archived) params.append("archived", archived);
  if (sort) params.append("sort", sort);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  if (jobId) params.append("jobId", jobId);
  if (minMatchScore) params.append("minMatchScore", minMatchScore);

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await axios.get(url, getHeaders());
  return response.data;
};

const getCandidateById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

// Upgraded createCandidate to support multipart data (with files)
const createCandidate = async (candidateFormData) => {
  const token = localStorage.getItem("token");
  // Check if it's FormData, if not send JSON
  const headers = candidateFormData instanceof FormData 
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }
      }
    : getHeaders();
  
  const response = await axios.post(API_URL, candidateFormData, headers);
  return response.data;
};

// Upgraded updateCandidate to support multipart data (with files)
const updateCandidate = async (id, candidateFormData) => {
  const token = localStorage.getItem("token");
  const headers = candidateFormData instanceof FormData 
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }
      }
    : getHeaders();

  // Express PUT sometimes has issues with multipart/form-data.
  // We can send it via PUT or POST, but PUT is standard in our backend route.
  const response = await axios.put(`${API_URL}/${id}`, candidateFormData, headers);
  return response.data;
};

const deleteCandidate = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const getCandidateStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getHeaders());
  return response.data;
};

const archiveCandidate = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/archive`, {}, getHeaders());
  return response.data;
};

const restoreCandidate = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/restore`, {}, getHeaders());
  return response.data;
};

const addRecruiterNote = async (id, text) => {
  const response = await axios.post(`${API_URL}/${id}/notes`, { text }, getHeaders());
  return response.data;
};

const getCandidateReports = async () => {
  const response = await axios.get(`${API_URL}/reports`, getHeaders());
  return response.data;
};

const uploadResumeFile = async (id, file) => {
  const formData = new FormData();
  formData.append("resume", file);
  const response = await axios.post(`${API_URL}/${id}/resume`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const parseResumeFile = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);
  const response = await axios.post(`${API_URL}/parse`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const generateAIQuestions = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/generate-questions`, {}, getHeaders());
  return response.data;
};

/* --- Bulk operations API triggers --- */

const bulkDelete = async (ids) => {
  const response = await axios.post(`${API_URL}/bulk-delete`, { ids }, getHeaders());
  return response.data;
};

const bulkUpdateStatus = async (ids, status) => {
  const response = await axios.post(`${API_URL}/bulk-status`, { ids, status }, getHeaders());
  return response.data;
};

const bulkEmail = async (candidateIds, subject, message, attachmentsPayload = null) => {
  const token = localStorage.getItem("token");
  let data;
  let headers = { Authorization: `Bearer ${token}` };

  if (attachmentsPayload instanceof FormData) {
    data = attachmentsPayload;
    // Let browser set the boundary for multipart/form-data
  } else {
    data = { candidateIds, subject, message };
  }

  const response = await axios.post(
    `${API_BASE_URL}/email/send-bulk`,
    data,
    { headers }
  );
  return response.data;
};

const bulkAssign = async (ids, jobId) => {
  const response = await axios.post(`${API_URL}/bulk-assign`, { ids, jobId }, getHeaders());
  return response.data;
};

const candidateService = {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateStats,
  archiveCandidate,
  restoreCandidate,
  addRecruiterNote,
  getCandidateReports,
  uploadResumeFile,
  parseResumeFile,
  generateAIQuestions,
  bulkDelete,
  bulkUpdateStatus,
  bulkEmail,
  bulkAssign,
  createScorecard: async (id, scorecardData) => {
    const response = await axios.post(`${API_URL}/${id}/scorecards`, scorecardData, getHeaders());
    return response.data;
  },
  getCandidateScorecards: async (id) => {
    const response = await axios.get(`${API_URL}/${id}/scorecards`, getHeaders());
    return response.data;
  },
  editRecruiterNote: async (id, noteId, text) => {
    const response = await axios.put(`${API_URL}/${id}/notes/${noteId}`, { text }, getHeaders());
    return response.data;
  },
  deleteRecruiterNote: async (id, noteId) => {
    const response = await axios.delete(`${API_URL}/${id}/notes/${noteId}`, getHeaders());
    return response.data;
  }
};

export default candidateService;
