import axios from "axios";

const API_URL = "http://localhost:5000/api/candidates";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getCandidates = async (search = "", status = "", source = "", archived = "false", sort = "newest", page = "", limit = "") => {
  let url = API_URL;
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (source) params.append("source", source);
  if (archived) params.append("archived", archived);
  if (sort) params.append("sort", sort);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

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

const createCandidate = async (candidateData) => {
  const response = await axios.post(API_URL, candidateData, getHeaders());
  return response.data;
};

const updateCandidate = async (id, candidateData) => {
  const response = await axios.put(`${API_URL}/${id}`, candidateData, getHeaders());
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
