import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/auth`;

const register = async (name, email, password, role) => {
  const response = await axios.post(`${API_URL}/register`, {
    name,
    email,
    password,
    role,
  });
  return response.data;
};

const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });
  return response.data;
};

const getUsers = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const authService = {
  register,
  login,
  getUsers,
};

export default authService;
