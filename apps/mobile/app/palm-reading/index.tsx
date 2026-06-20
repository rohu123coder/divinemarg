import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InAppCamera } from "../../components/InAppCamera";
import { pickImage, processPickedImage } from "../../lib/imagePicker";
import { PROBLEM_AREAS } from "../../lib/problemAreas";
import { submitPalmReading } from "../../lib/readings";

export default function PalmReadingScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [palmUri, setPalmUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  async function handleGalleryPick() {
    const uri = await pickImage("gallery");
    if (!uri) {
      return;
    }
    setPalmUri(uri);
  }

  async function handleCameraCapture(rawUri: string) {
    setShowCamera(false);
    setProcessingPhoto(true);
    try {
      const finalUri = await processPickedImage(rawUri);
      setPalmUri(finalUri);
    } finally {
      setProcessingPhoto(false);
    }
  }

  async function handleSubmit() {
    if (!category) {
      Alert.alert("Required", "Please select a category");
      return;
    }
    if (!palmUri) {
      Alert.alert("Required", "Please add a palm photo");
      return;
    }

    setSubmitting(true);
    try {
      const reading = await submitPalmReading({ category, imageUri: palmUri });
      router.push({
        pathname: "/palm-reading/result",
        params: { id: reading.id },
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e instanceof Error ? e.message : "Something went wrong");
      Alert.alert("Reading failed", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: () => void handleSubmit() },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Palm Reading</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ marginBottom: 8, fontWeight: "600" }}>Category (select one)</Text>
        {PROBLEM_AREAS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setCategory(p.value)}
            style={{
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: category === p.value ? "#7C3AED" : "#ddd",
              borderRadius: 8,
              backgroundColor: category === p.value ? "#F3E8FF" : "#fff",
            }}
          >
            <Text>
              {p.emoji} {p.label}
            </Text>
          </Pressable>
        ))}

        <ImageSlot
          label="Palm Photo"
          uri={palmUri}
          onCamera={() => setShowCamera(true)}
          onGallery={() => void handleGalleryPick()}
          onClear={() => setPalmUri(null)}
          busy={processingPhoto}
        />

        <Pressable
          onPress={() => void handleSubmit()}
          disabled={submitting}
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: submitting ? "#9CA3AF" : "#7C3AED",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Analyzing your photo… (may take up to 15 sec)
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>Get Reading</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <InAppCamera
          onCapture={(rawUri) => void handleCameraCapture(rawUri)}
          onCancel={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

function ImageSlot({
  label,
  uri,
  onCamera,
  onGallery,
  onClear,
  busy,
}: {
  label: string;
  uri: string | null;
  onCamera: () => void;
  onGallery: () => void;
  onClear: () => void;
  busy?: boolean;
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontWeight: "600", marginBottom: 8 }}>{label}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={{ width: 160, height: 160, borderRadius: 8 }} />
          <Pressable onPress={onClear} style={{ marginTop: 8 }}>
            <Text style={{ color: "#EF4444" }}>Clear / Retake</Text>
          </Pressable>
        </View>
      ) : null}
      {busy ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
          <ActivityIndicator />
          <Text>Processing photo…</Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={onCamera}
            style={{ padding: 10, backgroundColor: "#E5E7EB", borderRadius: 6 }}
          >
            <Text>Camera</Text>
          </Pressable>
          <Pressable
            onPress={onGallery}
            style={{ padding: 10, backgroundColor: "#E5E7EB", borderRadius: 6 }}
          >
            <Text>Gallery</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
