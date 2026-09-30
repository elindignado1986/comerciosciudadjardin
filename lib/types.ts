export type Adhesion = "ADHERIDO" | "SIN_ADHESION";
export type QrStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";
export type PublicBusiness = {
  id: string;
  code: string;
  name: string;
  address_normalized: string;
  lat: number;
  lng: number;
  category: string;
  adhesion: Adhesion;
  qr_status: QrStatus;
  adhesion_date: string | null;
};
export type SearchResult = {
  label: string;
  lat: number;
  lng: number;
  source: string;
  confidence?: number;
  inside: boolean;
};
