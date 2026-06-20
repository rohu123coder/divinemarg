import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

async function resizeImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    // If manipulation fails for any reason, fall back to original uri
    return uri;
  }
}

async function copyToStableUri(sourceUri: string): Promise<string> {
  try {
    const ext = sourceUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
    const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!cacheDir) {
      return sourceUri;
    }
    const destUri = `${cacheDir}reading-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch {
    // If copy fails for any reason, fall back to original uri rather than breaking the flow
    return sourceUri;
  }
}

export async function pickImage(source: "camera" | "gallery"): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1.0,
    });
    if (result.canceled || !result.assets[0]?.uri) {
      return null;
    }
    const resizedUri = await resizeImage(result.assets[0].uri);
    const stableUri = await copyToStableUri(resizedUri);
    return stableUri;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }
  const resizedUri = await resizeImage(result.assets[0].uri);
  const stableUri = await copyToStableUri(resizedUri);
  return stableUri;
}
