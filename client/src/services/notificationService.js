import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/notifications`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getNotifications = async () => {
  const response = await axios.get(API_URL, getHeaders());
  return response.data;
};

const markAsRead = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/read`, {}, getHeaders());
  return response.data;
};

const markAllAsRead = async () => {
  const response = await axios.put(`${API_URL}/read-all`, {}, getHeaders());
  return response.data;
};

const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

export default notificationService;
