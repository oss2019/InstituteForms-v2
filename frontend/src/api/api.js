import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
});

export const googleAuth = (code) => api.get('/user/google?code=' + code);
export const submitEventApproval = (data) => api.post('/event/apply', data);
export const studentGoogleLogin = (token) => api.post('/user/student-google-login', { token });
export const submitMessFeedback = (data) => api.post('/feedback/mess', data);
export const submitCanteenFeedback = (data) => api.post('/feedback/canteen', data);
export const submitAccommodationRequest = (data) => api.post('/feedback/accommodation', data);
export const getMessFeedbacks = () => api.get('/feedback/mess');
export const getCanteenFeedbacks = () => api.get('/feedback/canteen');
export const getAccommodationRequests = () => api.get('/feedback/accommodation');

export default api;
