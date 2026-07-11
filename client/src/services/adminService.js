import axios from "axios";

const API_URL = "https://hiretrack-api-801x.onrender.com/api/admin/users";

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

const adminService = {
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};

export default adminService;
