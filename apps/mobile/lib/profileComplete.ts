import api from "./api";
import { useAppStore } from "./store";

export async function checkProfileComplete(): Promise<boolean> {
  try {
    const res = await api.get("/api/users/birth-details");
    const data = res.data?.data;
    const complete = !!(
      data?.dateOfBirth &&
      data?.lat != null &&
      data?.lng != null &&
      data?.placeName
    );
    useAppStore.getState().setProfileComplete(complete);
    return complete;
  } catch {
    useAppStore.getState().setProfileComplete(true);
    return true;
  }
}
