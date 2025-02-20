import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4001", // Adjust as per your backend server URL
});

export const googleAuth = (code) => api.get(`/user/google?code=${code}`);
export const submitEventApproval = (data) => api.post(`/event/apply`, data);

export default api;