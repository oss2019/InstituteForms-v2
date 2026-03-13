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

// ── Welfare Complaint API (mess / canteen / accommodation) ────────────────────
// Student
export const submitWelfareComplaint    = (data)        => api.post('/welfare/submit', data);
export const getMyWelfareComplaints    = (data)        => api.post('/welfare/my', data);
export const replyToWelfareQuery       = (data)        => api.post('/welfare/query/reply', data);

// Secretary / FIC / Associate Dean
export const getActionNeededComplaints = (data)        => api.post('/welfare/action-needed', data);
export const getAllComplaintsForRole   = (data)        => api.post('/welfare/all-for-role', data);
export const handleComplaintAction     = (mongoId, data) => api.post(`/welfare/action/${mongoId}`, data);

// SW Office
export const getComplaintsForSWO      = ()            => api.get('/welfare/swo');

// Detail view
export const getWelfareComplaintById  = (mongoId)     => api.get(`/welfare/${mongoId}`);

// ── Mess Block Accommodation Booking API ─────────────────────────────────────
// Student
export const getAccommodationBookingSettings   = ()            => api.get('/accommodation-booking/settings');
export const submitAccommodationBooking        = (data)        => api.post('/accommodation-booking/submit', data);
export const getMyAccommodationBookings        = (data)        => api.post('/accommodation-booking/my', data);
export const replyToAccommodationBookingQuery  = (data)        => api.post('/accommodation-booking/query/reply', data);

// Staff
export const getAccommodationActionNeeded      = (data)        => api.post('/accommodation-booking/action-needed', data);
export const getAllAccommodationBookingsForRole = (data)       => api.post('/accommodation-booking/all-for-role', data);
export const handleAccommodationBookingAction  = (mongoId, data) => api.post(`/accommodation-booking/action/${mongoId}`, data);
export const updateAccommodationBookingSettings = (data)       => api.post('/accommodation-booking/settings/update', data);

export default api;
