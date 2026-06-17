import api from "./api";

export type ReadingType = "palm" | "face" | "combined";

export interface Reading {
  id: string;
  category: string;
  readingType: ReadingType;
  overview: string;
  samagri: string;
  vidhi: string;
  palmPhotoUrl: string | null;
  facePhotoUrl: string | null;
  createdAt: string;
}

function fileMetaFromUri(uri: string): { name: string; type: string } {
  const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase();
  if (ext === "png") {
    return { name: "photo.png", type: "image/png" };
  }
  if (ext === "webp") {
    return { name: "photo.webp", type: "image/webp" };
  }
  return { name: "photo.jpg", type: "image/jpeg" };
}

export async function submitPalmReading(params: {
  category: string;
  imageUri: string;
}): Promise<Reading> {
  const form = new FormData();
  form.append("category", params.category);
  const { name, type } = fileMetaFromUri(params.imageUri);
  form.append("palm", { uri: params.imageUri, name, type } as unknown as Blob);

  const res = await api.post<{ success: boolean; data: Reading }>("/api/readings/palm", form);
  return res.data.data;
}

export async function submitFaceReading(params: {
  category: string;
  imageUri: string;
}): Promise<Reading> {
  const form = new FormData();
  form.append("category", params.category);
  const { name, type } = fileMetaFromUri(params.imageUri);
  form.append("face", { uri: params.imageUri, name, type } as unknown as Blob);

  const res = await api.post<{ success: boolean; data: Reading }>("/api/readings/face", form);
  return res.data.data;
}

export async function getReadingHistory(): Promise<Reading[]> {
  const res = await api.get<{ success: boolean; data: Reading[] }>("/api/readings");
  return res.data.data;
}

export async function getReadingById(id: string): Promise<Reading> {
  const res = await api.get<{ success: boolean; data: Reading }>(`/api/readings/${id}`);
  return res.data.data;
}
