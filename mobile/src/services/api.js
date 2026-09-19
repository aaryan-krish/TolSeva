import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your local IP when testing on device
// e.g. http://192.168.1.100:5000/api
const BASE_URL = 'https://tolseva.onrender.com/api'; // Android emulator

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('tolseva_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const requestVendorOtp = (data) => api.post('/auth/vendor/request-otp', data);
export const verifyVendorOtp = (data) => api.post('/auth/vendor/verify-otp', data);
export const inspectorLogin = (data) => api.post('/auth/inspector/login', data);
export const requestPasswordResetOtp = (data) => api.post('/auth/reset-password/request-otp', data);
export const verifyPasswordReset = (data) => api.post('/auth/reset-password/verify', data);


// Vendor
export const getMachines = () => api.get('/vendor/machines');
export const addMachine = (data) => api.post('/vendor/machines', data);
export const bookAppointment = (data) => api.post('/vendor/appointments', data);

// Inspector
export const getAssignedVisits = (filter) => api.get('/inspector/assigned-visits', { params: { filter } });
export const submitVerification = (data) => api.post('/inspector/verify', data);
export const getCertificate = (id) => api.get(`/inspector/certificate/${id}`);

export default api;
