import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { CallScreen } from "../../components/CallScreen";
import { useAppStore } from "../../lib/store";

export default function ActiveCallScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const astrologers = useAppStore((state) => state.astrologers);
  const astro = astrologers.find((item) => item.id === sessionId) ?? astrologers[0];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CallScreen name={astro?.name ?? "Astrologer"} photo={astro?.profile_photo} onEnd={() => router.back()} />
    </SafeAreaView>
  );
}
