import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/jobs`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getJobs = async (search = "", department = "", status = "", page = "", limit = "") => {
  let url = API_URL;
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (department) params.append("department", department);
  if (status) params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await axios.get(url, getHeaders());
  return response.data;
};

const getJobById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const createJob = async (jobData) => {
  const response = await axios.post(API_URL, jobData, getHeaders());
  return response.data;
};

const updateJob = async (id, jobData) => {
  const response = await axios.put(`${API_URL}/${id}`, jobData, getHeaders());
  return response.data;
};

const deleteJob = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const jobService = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};

export default jobService;
