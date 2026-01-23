// Core domain models and shared types

import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// User Types
// ============================================================================

export interface User {
    uid: string;
    email: string;
    name: string;
    displayName?: string;
    photoURL?: string;
    role?: 'personal' | 'professional';
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    onboardingCompleted?: boolean;
    subscriptionStatus?: 'free' | 'premium' | 'trial';
    subscriptionEndDate?: Date | Timestamp;
}

export interface UserProfile extends User {
    bio?: string;
    profession?: string;
    interests?: string[];
    location?: string;
    dateOfBirth?: Date | Timestamp;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthResponse {
    success: boolean;
    error?: string;
    user?: FirebaseUser;
}

export interface LoginResult {
    success: boolean;
    error?: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: 'personal' | 'professional';
}

// ============================================================================
// Circle/Group Types
// ============================================================================

export interface Circle {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    createdBy: string;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    memberCount: number;
    isPublic: boolean;
    tags?: string[];
}

export interface SupportGroup extends Circle {
    meetingSchedule?: string;
    facilitator?: string;
    maxMembers?: number;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderPhotoURL?: string;
    timestamp: Date | Timestamp;
    type: 'text' | 'image' | 'voice' | 'system';
    imageUrl?: string;
    voiceUrl?: string;
    duration?: number;
    read?: boolean;
}

export interface Chat {
    id: string;
    participants: string[];
    participantNames: { [key: string]: string };
    participantPhotos?: { [key: string]: string };
    lastMessage?: string;
    lastMessageTime?: Date | Timestamp;
    unreadCount?: { [key: string]: number };
    type: 'direct' | 'group' | 'ai';
    createdAt: Date | Timestamp;
}

// ============================================================================
// Assessment Types
// ============================================================================

export interface AssessmentQuestion {
    id: string;
    question: string;
    type: 'scale' | 'multipleChoice' | 'text';
    options?: string[];
    category?: string;
}

export interface AssessmentResponse {
    questionId: string;
    answer: string | number;
    timestamp: Date;
}

export interface Assessment {
    id: string;
    userId: string;
    type: 'mood' | 'wellbeing' | 'nineIndex';
    responses: AssessmentResponse[];
    score?: number;
    completedAt: Date | Timestamp;
    createdAt: Date | Timestamp;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: 'message' | 'circle' | 'assessment' | 'system';
    read: boolean;
    data?: Record<string, any>;
    createdAt: Date | Timestamp;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    duration: 'monthly' | 'yearly';
    features: string[];
    popular?: boolean;
}

export interface UserSubscription {
    userId: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: Date | Timestamp;
    endDate: Date | Timestamp;
    autoRenew: boolean;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'article' | 'video' | 'audio' | 'exercise';
    category: string;
    url?: string;
    thumbnailUrl?: string;
    duration?: number;
    createdAt: Date | Timestamp;
}

// ============================================================================
// Huddle Types
// ============================================================================

export interface Huddle {
    id: string;
    title: string;
    description: string;
    hostId: string;
    hostName: string;
    scheduledTime: Date | Timestamp;
    duration: number;
    participants: string[];
    maxParticipants?: number;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    meetingUrl?: string;
    circleId?: string;
    createdAt: Date | Timestamp;
}

// ============================================================================
// Toast Types
// ============================================================================

export interface ToastConfig {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

// ============================================================================
// Navigation Types (using @react-navigation types)
// ============================================================================

export type RootStackParamList = {
    Splash: undefined;
    SignIn: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    ResetPassword: { email: string };
    Verification: { email: string };
    Onboarding: undefined;
    ProfileSetup: undefined;
    Main: undefined;
    CircleDetail: { circleId: string };
    SupportGroupDetail: { groupId: string };
    ChatDetail: { chatId: string; participantId?: string };
    ActivityDetail: { activityId: string };
    LearningSession: { sessionId: string };
    CreateCircle: undefined;
    Huddle: { huddleId: string };
    CircleSettings: { circleId: string };
};

export type MainTabParamList = {
    Home: undefined;
    Explore: undefined;
    Community: undefined;
    Profile: undefined;
    Dashboard: undefined;
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PersonalProfile: undefined;
    PersonalInformation: undefined;
    Security: undefined;
    NotificationsSettings: undefined;
    Subscription: undefined;
    FAQ: undefined;
    Settings: undefined;
    TellAFriend: undefined;
};

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
