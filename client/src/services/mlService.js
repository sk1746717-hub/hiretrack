import axios from "axios";
import { API_BASE_URL } from "./api";

const ML_API_URL = `${API_BASE_URL}/ml`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const mlService = {
  getHealth: async () => {
    const response = await axios.get(`${ML_API_URL}/health`, getHeaders());
    return response.data;
  },
  analyzeResume: async (payload) => {
    // payload can be { resumeText } or { candidateId }
    const response = await axios.post(`${ML_API_URL}/analyze-resume`, payload, getHeaders());
    return response.data;
  },
  matchCandidate: async (payload) => {
    // payload can be { job, candidate } or { candidateId, jobId }
    const response = await axios.post(`${ML_API_URL}/match-candidate`, payload, getHeaders());
    return response.data;
  },
  rankCandidates: async (payload) => {
    // payload can be { job, candidates } or { jobId }
    const response = await axios.post(`${ML_API_URL}/rank-candidates`, payload, getHeaders());
    return response.data;
  },
  analyzeSkillGap: async (payload) => {
    // payload can be { job, candidate } or { candidateId, jobId }
    const response = await axios.post(`${ML_API_URL}/skill-gap`, payload, getHeaders());
    return response.data;
  },
  predictSuccess: async (payload) => {
    // payload can be numerical features or { candidateId, jobId }
    const response = await axios.post(`${ML_API_URL}/predict-success`, payload, getHeaders());
    return response.data;
  },
  analyzeInterview: async (payload) => {
    // payload can be { job, candidate, interviewData } or { candidateId, jobId }
    const response = await axios.post(`${ML_API_URL}/interview-analysis`, payload, getHeaders());
    return response.data;
  },
};

export default mlService;
