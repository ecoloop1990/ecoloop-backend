import { UserRole, MaterialType, ListingStatus, TransactionStatus } from '@prisma/client';

export { UserRole, MaterialType, ListingStatus, TransactionStatus };


export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'seller' | 'buyer';
  username?: string;
  termsAccepted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateListingRequest {
  title: string;
  description?: string;
  materialType?: MaterialType;
  quantity?: number;
  unit?: string;
  price: number;
  currency?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  state?: string;
  notes?: string;
  imageUrl?: string;
  createType: 'ai' | 'manual';
  weight?: number; // For manual creation
  material?: string; // For manual creation
}

export interface FeedQueryParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  materialType?: MaterialType;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface RankingScore {
  listingId: string;
  score: number;
  materialMatch: number;
  proximity: number;
  recency: number;
}

export interface AIPredictionResponse {
  predicted_class: string;
  confidence: number;
}

export interface AIPredictionRequest {
  imageUrl: string;
}

export interface UpdateListingStatusRequest {
  status: ListingStatus;
}

export interface CreateTransactionRequest {
  listingId: string;
  quantity: number;
}

export interface UpdateTransactionRequest {
  status: TransactionStatus;
}

