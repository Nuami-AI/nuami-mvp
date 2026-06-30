export interface KakaoLocalPlace {
  id: string;
  placeName: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  placeUrl: string;
  phone: string;
  category: string;
  distanceMeters?: number;
}
