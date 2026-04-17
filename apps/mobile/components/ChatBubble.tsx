import { StyleSheet, Text, View } from "react-native";

type Props = {
  message: string;
  timestamp: string;
  mine?: boolean;
};

export function ChatBubble({ message, timestamp, mine = false }: Props) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
        <Text style={[styles.message, mine ? styles.mineText : styles.otherText]}>
          {message}
        </Text>
        <Text style={[styles.time, mine ? styles.mineTime : styles.otherTime]}>
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mine: { backgroundColor: "#7C3AED" },
  other: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  message: { fontSize: 15, lineHeight: 20 },
  mineText: { color: "#FFFFFF" },
  otherText: { color: "#1A1A2E" },
  time: { marginTop: 6, fontSize: 11, textAlign: "right" },
  mineTime: { color: "rgba(255,255,255,0.8)" },
  otherTime: { color: "#6B7280" },
});
