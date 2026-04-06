export type UserRole = 'ROLE_USER' | 'ROLE_LEARNER' | 'ROLE_MENTOR' | 'ROLE_ADMIN';

export interface User {
  userId: number;
  email: string;
  role: UserRole;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  headline?: string;
  location?: string;
  learningGoal?: string;
  bio?: string;
  emailNotifications?: boolean;
  sessionReminders?: boolean;
  marketingUpdates?: boolean;
  profileVisibility?: 'public' | 'learners' | 'private';
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
  email?: string;
  role?: UserRole;
}

export interface Mentor {
  id: number;
  userId: number;
  fullName: string;
  bio: string;
  expertise: string[];
  rating: number;
  profilePic?: string;
}

export interface Session {
  id: number;
  mentorId: number;
  learnerId: number;
  topic?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
}

export interface Payment {
  id: number;
  learnerId: number;
  mentorId: number;
  sessionId: number;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paidAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface Skill {
  id: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'SESSION_BOOKED' | 'SESSION_ACCEPTED' | 'SESSION_REJECTED' | 'SESSION_COMPLETED' | 'PAYMENT_SUCCESS' | 'REVIEW_RECEIVED' | 'GROUP_JOINED';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category: string;
}

export interface Review {
  id: number;
  mentorId: number;
  learnerId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SessionBookingRequest {
  mentorId: number;
  learnerId: number;
  topic: string;
  startTime: string;
  durationMinutes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserSettings {
  emailNotifications: boolean;
  sessionReminders: boolean;
  marketingUpdates: boolean;
  profileVisibility: 'public' | 'learners' | 'private';
  twoFactorEnabled: boolean;
}
