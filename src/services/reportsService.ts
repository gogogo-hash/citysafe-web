import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/services/firebase";
import type { Report } from "@/types/report";

const reportsCollection = collection(db, "reports");

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function getReportsInBounds(bounds: Bounds): Promise<Report[]> {
  const reportsQuery = query(
    reportsCollection,
    where("lat", ">=", bounds.south),
    where("lat", "<=", bounds.north),
    where("lng", ">=", bounds.west),
    where("lng", "<=", bounds.east)
  );

  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Report);
}

export type CreateReportInput = Omit<Report, "id" | "createdAt">;

export async function createReport(input: CreateReportInput): Promise<string> {
  const docRef = await addDoc(reportsCollection, {
    ...input,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}
