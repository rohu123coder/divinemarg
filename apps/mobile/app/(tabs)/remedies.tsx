import { FlatList, Image, SafeAreaView, StyleSheet, Text, View } from "react-native";

const remedies = [
  { id: "r1", name: "7 Mukhi Rudraksha", price: "₹799", image: "https://picsum.photos/200/200?1" },
  { id: "r2", name: "Money Magnet Bracelet", price: "₹999", image: "https://picsum.photos/200/200?2" },
  { id: "r3", name: "Vastu Copper Pyramid", price: "₹1,299", image: "https://picsum.photos/200/200?3" },
  { id: "r4", name: "Navgraha Ring", price: "₹1,499", image: "https://picsum.photos/200/200?4" },
];

export default function RemediesTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Remedies Store</Text>
      <FlatList
        data={remedies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  heading: { margin: 16, fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  column: { gap: 10 },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: 10, marginBottom: 8 },
  name: { color: "#1A1A2E", fontWeight: "700", fontSize: 13 },
  price: { marginTop: 4, color: "#7C3AED", fontWeight: "700" },
});
