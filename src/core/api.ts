import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AuthResponse, User, Mentor, Session, ApiResponse, Group, Review, SessionBookingRequest, UserSettings, Payment, Skill } from '../types';
import { env } from './env';

const API_BASE_URL = env.API_BASE_URL;
const ACCESS_TOKEN_KEY = 'skillsync_token';
const REFRESH_TOKEN_KEY = 'skillsync_refresh_token';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('skillsync_user');
  },
};

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (!axios.isAxiosError(error)) return fallback;

  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;

  const validationErrors = error.response?.data?.data?.validationErrors;
  if (validationErrors && typeof validationErrors === 'object') {
    const firstError = Object.values(validationErrors).flat().find(Boolean);
    if (typeof firstError === 'string') return firstError;
  }

  return fallback;
};

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await refreshClient.post<ApiResponse<AuthResponse>>('/auth-service/api/v1/auth/refresh', {
    refreshToken,
  });

  const payload = response.data?.data ?? {};
  const nextAccessToken = payload.accessToken || payload.token;
  const nextRefreshToken = payload.refreshToken || refreshToken;

  if (!nextAccessToken) return null;

  tokenStorage.setAccessToken(nextAccessToken);
  tokenStorage.setRefreshToken(nextRefreshToken);
  return nextAccessToken;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const nextAccessToken = await refreshAccessToken();
        if (nextAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
          return api(originalRequest);
        }
      } catch {
        tokenStorage.clear();
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ---- AUTH API ----
export const authAPI = {
  login: (credentials: any): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
    api.post('/auth-service/api/v1/auth/login', credentials),
  register: (userData: any): Promise<AxiosResponse<ApiResponse<string>>> => 
    api.post('/auth-service/api/v1/auth/register', userData),
  refresh: (refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth-service/api/v1/auth/refresh', { refreshToken }),
  sendOtp: (email: string): Promise<AxiosResponse<ApiResponse<string>>> => 
    api.post(`/auth-service/api/v1/auth/send-otp?email=${encodeURIComponent(email)}`),
  verifyOtp: (email: string, otp: string): Promise<AxiosResponse<ApiResponse<string>>> => 
    api.post(`/auth-service/api/v1/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`),
  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse<string>>> => 
    api.post('/auth-service/api/v1/auth/forgot-password', { email }),
  resetPassword: (data: any): Promise<AxiosResponse<ApiResponse<string>>> => 
    api.post('/auth-service/api/v1/auth/reset-password', data),
  googleLoginUrl: (): string => `${API_BASE_URL}/oauth2/authorization/google`,
  linkedinLoginUrl: (): string => `${API_BASE_URL}/oauth2/authorization/linkedin`,
};

// ---- USER API ----
export const userAPI = {
  getUser: (id: number): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get(`/auth-service/api/v1/users/${id}`),
  updateUser: (id: number, data: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.put(`/auth-service/api/v1/users/${id}`, data),
  updateProfile: (
    id: number,
    data: {
      firstName: string;
      lastName: string;
      headline?: string;
      learningGoal?: string;
    }
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/auth-service/api/v1/users/${id}/profile`, data),
  updateSettings: (
    id: number,
    data: UserSettings
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/auth-service/api/v1/users/${id}/settings`, data),
  getSettings: (id: number): Promise<AxiosResponse<ApiResponse<UserSettings>>> =>
    api.get(`/auth-service/api/v1/users/${id}/settings`),
  getAllUsers: (): Promise<AxiosResponse<ApiResponse<any[]>>> => 
    api.get('/auth-service/api/v1/users'),
};

  // ---- LEARNER API ----
  export const learnerAPI = {
    getProfile: (userId: number): Promise<AxiosResponse<any>> =>
      api.get(`/learner-service/api/v1/learners/${userId}`),
    updateProfile: (data: {
      phone?: string;
      location?: string;
      bio?: string;
      dob?: string;
    }): Promise<AxiosResponse<any>> =>
      api.put('/learner-service/api/v1/learners/self', data),
  };

// ---- MENTOR API ----
export const mentorAPI = {
  applyAsMentor: (data: any): Promise<AxiosResponse<Mentor>> => 
    api.post('/mentor-service/api/v1/mentors/apply', data),
  getAllMentors: (): Promise<AxiosResponse<Mentor[]>> => 
    api.get('/mentor-service/api/v1/mentors'),
  getMentorById: (id: number): Promise<AxiosResponse<Mentor>> => 
    api.get(`/mentor-service/api/v1/mentors/${id}`),
  getMentorByUserId: (userId: number): Promise<AxiosResponse<Mentor>> => 
    api.get(`/mentor-service/api/v1/mentors/users/${userId}`),
  getMentorProfile: (userId: number): Promise<AxiosResponse<Mentor>> =>
    api.get(`/mentor-service/api/v1/mentors/profile/${userId}`),
  getApplications: (): Promise<AxiosResponse<Mentor[]>> =>
    api.get('/mentor-service/api/v1/mentors/applications'),
  approveMentor: (mentorId: number): Promise<AxiosResponse<Mentor>> =>
    api.put(`/mentor-service/api/v1/mentors/${mentorId}/approve`),
};

// ---- SESSION API ----
export const sessionAPI = {
  createSession: (data: SessionBookingRequest): Promise<AxiosResponse<Session>> => 
    api.post('/session-service/api/v1/sessions/book', data),
  getAllSessions: (): Promise<AxiosResponse<Session[]>> => 
    api.get('/session-service/api/v1/sessions'),
  getSessionById: (id: number): Promise<AxiosResponse<Session>> => 
    api.get(`/session-service/api/v1/sessions/${id}`),
  getMentorSessions: (mentorId: number): Promise<AxiosResponse<Session[]>> =>
    api.get(`/session-service/api/v1/sessions/mentor/${mentorId}`),
  getLearnerSessions: (learnerId: number): Promise<AxiosResponse<Session[]>> =>
    api.get(`/session-service/api/v1/sessions/learner/${learnerId}`),
};

// ---- GROUP API ----
export const groupAPI = {
  createGroup: (data: Pick<Group, 'name' | 'description' | 'category'>): Promise<AxiosResponse<Group>> => 
    api.post('/group-service/api/v1/groups', data),
  getAllGroups: (): Promise<AxiosResponse<Group[]>> => 
    api.get('/group-service/api/v1/groups'),
  joinGroup: (groupId: number): Promise<AxiosResponse<ApiResponse<string>>> =>
    api.post(`/group-service/api/v1/groups/${groupId}/join`),
  getGroupMembers: (groupId: number): Promise<AxiosResponse<User[]>> =>
    api.get(`/group-service/api/v1/groups/${groupId}/members`),
};

export const reviewAPI = {
  submitReview: (data: Pick<Review, 'mentorId' | 'learnerId' | 'rating' | 'comment'>): Promise<AxiosResponse<Review>> =>
    api.post('/review-service/api/v1/reviews', data),
  getAllReviews: (): Promise<AxiosResponse<Review[]>> =>
    api.get('/review-service/api/v1/reviews'),
  getMentorReviews: (mentorId: number): Promise<AxiosResponse<Review[]>> =>
    api.get(`/review-service/api/v1/reviews/mentor/${mentorId}`),
};

// ---- PAYMENT API ----
export const paymentAPI = {
  processPayment: (data: {
    learnerId: number;
    mentorId: number;
    sessionId: number;
    hours: number;
    paymentMethod: string;
  }): Promise<AxiosResponse<Payment>> =>
    api.post('/payment-service/api/payments/process', data),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<AxiosResponse<Payment>> =>
    api.post('/payment-service/api/payments/verify', data),
  getLearnerPayments: (learnerId: number): Promise<AxiosResponse<Payment[]>> =>
    api.get(`/payment-service/api/payments/learner/${learnerId}`),
  getMentorPayments: (mentorId: number): Promise<AxiosResponse<Payment[]>> =>
    api.get(`/payment-service/api/payments/mentor/${mentorId}`),
  getAllPayments: (): Promise<AxiosResponse<Payment[]>> =>
    api.get('/payment-service/api/payments'),
};

// ---- SKILL API ----
export const skillAPI = {
  getAllSkills: (): Promise<AxiosResponse<ApiResponse<Skill[]>>> =>
    api.get('/skill-service/api/v1/skills'),
  getSkillsByCategory: (categoryId: number): Promise<AxiosResponse<ApiResponse<Skill[]>>> =>
    api.get(`/skill-service/api/v1/skills/category/${categoryId}`),
  createSkill: (data: { name: string; categoryId?: number }): Promise<AxiosResponse<ApiResponse<Skill>>> =>
    api.post('/skill-service/api/v1/skills', data),
  addMentorSkill: (skillId: number): Promise<AxiosResponse<ApiResponse<string>>> =>
    api.post(`/mentor-service/api/v1/mentors/self/skills`, { skillId }),
};

export default api;
