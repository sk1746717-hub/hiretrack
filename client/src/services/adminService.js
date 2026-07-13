import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/admin/users`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

const getUsers = async () => {
  const response = await axios.get(API_URL, getHeaders());
  return response.data;
};

const updateUserRole = async (id, role) => {
  const response = await axios.put(`${API_URL}/${id}/role`, { role }, getHeaders());
  return response.data;
};

const updateUserStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/${id}/status`, { status }, getHeaders());
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData, getHeaders());
  return response.data;
};

const adminService = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};

export default adminService;
