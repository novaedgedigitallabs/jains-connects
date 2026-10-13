export type PublicTemple = {
  id: string;
  name: string;
  slug: string;
  traditionOrLineage: string | null;
  description: string | null;
  history: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  timezone: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  darshanInformation: string | null;
  verificationStatus: 'VERIFIED';
  lastReviewedAt: string | null;
};

export type TempleListResponse = {
  data: PublicTemple[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};
