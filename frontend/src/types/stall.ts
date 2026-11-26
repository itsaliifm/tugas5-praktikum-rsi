import type { PaginationMeta } from './api';

export interface Stall {
  id: number;
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  isPopular: boolean;
}

export interface StallPayload {
  name: string;
  category?: string;
  location?: string;
  description?: string;
}

// Query parameter GET /stalls (sesuai stallQuerySchema di backend)
export interface StallQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface StallListResult {
  stalls: Stall[];
  meta: PaginationMeta;
}
