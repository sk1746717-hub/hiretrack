import axios from "axios";

const API_URL = "https://hiretrack-api-801x.onrender.com/api/tasks";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getTasks = async (status = "", priority = "") => {
  let url = API_URL;
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (priority) params.append("priority", priority);

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await axios.get(url, getHeaders());
  return response.data;
};

const createTask = async (taskData) => {
  const response = await axios.post(API_URL, taskData, getHeaders());
  return response.data;
};

const updateTask = async (id, taskData) => {
  const response = await axios.put(`${API_URL}/${id}`, taskData, getHeaders());
  return response.data;
};

const deleteTask = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const taskService = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};

export default taskService;
