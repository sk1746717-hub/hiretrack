import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/templates`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

const getTemplates = async () => {
  const response = await axios.get(API_URL, getHeaders());
  return response.data;
};

const createTemplate = async (templateData) => {
  const response = await axios.post(API_URL, templateData, getHeaders());
  return response.data;
};

const updateTemplate = async (id, templateData) => {
  const response = await axios.put(`${API_URL}/${id}`, templateData, getHeaders());
  return response.data;
};

const deleteTemplate = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
  return response.data;
};

const templateService = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

export default templateService;
