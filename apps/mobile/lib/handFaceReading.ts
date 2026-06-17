import api from "./api";

export interface HandFaceReading {
  id: string;
  category: string;
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

export async function submitReading(params: {
  category: string;
  palmImageUri?: string;
  faceImageUri?: string;
}): Promise<HandFaceReading> {
  const form = new FormData();
  form.append("category", params.category);

  if (params.palmImageUri) {
    const { name, type } = fileMetaFromUri(params.palmImageUri);
    form.append("palm", { uri: params.palmImageUri, name, type } as unknown as Blob);
  }
  if (params.faceImageUri) {
    const { name, type } = fileMetaFromUri(params.faceImageUri);
    form.append("face", { uri: params.faceImageUri, name, type } as unknown as Blob);
  }

  const res = await api.post<{ success: boolean; data: HandFaceReading }>(
    "/api/readings/hand-face",
    form
  );
  return res.data.data;
}

export async function getReadingHistory(): Promise<HandFaceReading[]> {
  const res = await api.get<{ success: boolean; data: HandFaceReading[] }>(
    "/api/readings/hand-face"
  );
  return res.data.data;
}

export async function getReadingById(id: string): Promise<HandFaceReading> {
  const res = await api.get<{ success: boolean; data: HandFaceReading }>(
    `/api/readings/hand-face/${id}`
  );
  return res.data.data;
}
