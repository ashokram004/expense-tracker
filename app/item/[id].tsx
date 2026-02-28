import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getExpenses } from "../../src/db/database";
import { usePlanStore } from "../../src/store/planStore";

export default function ItemScreen() {
  const { id } = useLocalSearchParams();

  const { currentItems, addExpense, clearAll, removeExpense } = usePlanStore();
  const item = currentItems.find((i) => i.id === id);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>Item not found</Text>
      </View>
    );
  }

  const remaining =
    item.isExtra || item.budget === undefined
      ? null
      : item.budget - item.spent;

  // Load history whenever spent changes
  useEffect(() => {
    const data = getExpenses(id as string);
    setHistory(data);
  }, [item.spent, id]);

  // Add Expense
  const handleAddExpense = () => {
    const value = Number(amount);

    if (!value || value <= 0) return;

    if (remaining !== null && value > remaining) {
      alert("Budget exceeded! Use Extras.");
      return;
    }

    addExpense(id as string, value, note);

    setAmount("");
    setNote("");
  };

  // Clear All
  const handleClearAll = () => {
    if (!item.budget) return;

    clearAll(id as string);
  };

  const handleDelete = (expense: any) => {
    removeExpense(expense.id, id as string, expense.amount);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.name}</Text>

      {!item.isExtra && (
        <>
          <Text style={styles.info}>Budget: ₹{item.budget}</Text>
          <Text style={styles.info}>Spent: ₹{item.spent}</Text>
          <Text style={styles.remaining}>
            Remaining: ₹{remaining}
          </Text>
        </>
      )}

      {item.isExtra && (
        <Text style={styles.remaining}>Spent: ₹{item.spent}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
      />

      <Pressable style={styles.button} onPress={handleAddExpense}>
        <Text style={styles.buttonText}>Add Expense</Text>
      </Pressable>

      {!item.isExtra && (
        <Pressable
          style={[styles.button, styles.clearButton]}
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </Pressable>
      )}

      {/* History Section */}
      <Text style={styles.historyTitle}>History</Text>

      {history.map((h) => (
        <View key={h.id} style={styles.historyItem}>
            <View>
            <Text style={styles.historyAmount}>₹{h.amount}</Text>
            <Text style={styles.historyNote}>
                {h.note || "—"}
            </Text>
            </View>

            <Pressable onPress={() => handleDelete(h)}>
            <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 6,
  },
  remaining: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  historyTitle: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "700",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  historyAmount: {
    fontWeight: "600",
  },
  historyNote: {
    color: "#555",
  },
  deleteText: {
    color: "red",
    fontWeight: "600",
  },
});
