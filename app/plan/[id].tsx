import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { usePlanStore } from "../../src/store/planStore";

type PlanItem = {
  id: string;
  name: string;
  budget?: number;
  spent: number;
  isExtra?: boolean;
};

export default function PlanScreen() {
  const { id } = useLocalSearchParams();
  const { currentItems, instances, loadInstanceItems } = usePlanStore();

  // Find the instance name
  const instance = instances.find(i => i.id === id);
  const instanceName = instance?.name || "Plan";

  // Load items for this instance when navigating to this screen
  useEffect(() => {
    if (id) {
      loadInstanceItems(id as string);
    }
  }, [id]);

  const renderItem = ({ item }: { item: PlanItem }) => {
    const remaining =
      item.isExtra || item.budget === undefined
        ? null
        : item.budget - item.spent;

    const isDone = remaining === 0;

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
      >
        <Text style={styles.itemName}>{item.name}</Text>

        {item.isExtra ? (
          <Text style={styles.extraText}>Spent ₹{item.spent}</Text>
        ) : isDone ? (
          <Text style={styles.done}>✅ Done</Text>
        ) : (
          <Text style={styles.remaining}>₹{remaining} left</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{instanceName}</Text>

      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    padding: 18,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
  },
  remaining: {
    marginTop: 6,
    fontSize: 16,
  },
  done: {
    marginTop: 6,
    fontSize: 16,
    color: "green",
    fontWeight: "600",
  },
  extraText: {
    marginTop: 6,
    fontSize: 16,
    color: "#555",
  },
});
