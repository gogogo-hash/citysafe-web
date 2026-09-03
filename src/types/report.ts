export interface Report {
  id: string;             // Firestore document ID
  lat: number;
  lng: number;
  category: IncidentCategory;
  description: string;
  createdBy: string;      // display name, or "anonymous"
  createdAt: string;      // ISO 8601 string (not a Firestore Timestamp)
}

export type IncidentCategory =
  | "Suspicious Person"
  | "Vandalism"
  | "Theft"
  | "Noise Complaint";
