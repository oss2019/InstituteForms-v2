import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001", // Use environment variable for production
});

export const googleAuth = (code) => api.get(`/user/google?code=${code}`);
export const submitEventApproval = (data) => api.post(`/event/apply`, data);

export default api;