export interface PublicFacility {
  name: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  category?: string;
  provider: string;
  dataset: string;
  datasetUrl?: string;
  live: boolean;
}

export interface OpenDataResult {
  live: boolean;
  queriedAt: string;
  facilities: PublicFacility[];
  errors: string[];
}
