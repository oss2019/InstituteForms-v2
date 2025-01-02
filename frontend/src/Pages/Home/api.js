import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:4001/user",
});

export const googleAuth = (code) => api.get(`/google?code=${code}`);