import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { getExpenses } from "../../src/db/database";
import { usePlanStore } from "../../src/store/planStore";

// Color palette
const colors = {
  primary: "#1A1A2E",
  secondary: "#16213E",
  highlight: "#E94560",
  success: "#00C897",
  warning: "#FFB800",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1A1A2E",
  textSecondary: "#6C757D",
  border: "#E9ECEF",
  danger: "#DC3545",
};

export default function ItemScreen() {
  const { id } = useLocalSearchParams();

  const instances = usePlanStore((state) => state.instances);
  const { currentItems: items, addExpense, clearAll, removeExpense } = usePlanStore();
  const item = items.find((i: any) => i.id === id);
  
  // Get bucket name from instance_id
  const bucketName = item?.instance_id ? instances.find(inst => inst.id === item.instance_id)?.name : "";

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

  const progress = item.budget ? Math.min((item.spent / item.budget) * 100, 100) : 0;

  // Load history whenever spent changes
  useEffect(() => {
    const data = getExpenses(id as string);
    setHistory(data);
  }, [item.spent, id]);

  // Add Expense
  const handleAddExpense = () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (remaining !== null && value > remaining) {
      Alert.alert("Budget Exceeded!", "Use the Extras category for overspending");
      return;
    }

    addExpense(id as string, value, note);
    setAmount("");
    setNote("");
  };

  // Clear All
  const handleClearAll = () => {
    if (!item.budget) return;
    if (remaining === null || remaining <= 0) {
      Alert.alert("Already Cleared", "This item has no remaining budget");
      return;
    }

    Alert.alert(
      "Clear All?",
      `This will mark the remaining ₹${remaining} as spent and mark this item as complete.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => clearAll(id as string)
        },
      ]
    );
  };

  const handleDelete = (expense: any) => {
    Alert.alert(
      "Delete Expense",
      `Delete this expense of ₹${expense.amount}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => removeExpense(expense.id, id as string, expense.amount)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{bucketName ? `📦 ${bucketName}` : 'Track your spending'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Budget Card - Minimal Height */}
        <View style={styles.budgetCard}>
          {!item.isExtra && (
            <>
              <View style={styles.budgetRow}>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetAmount}>₹{item.budget?.toLocaleString()}</Text>
                </View>
                <View style={styles.budgetDivider} />
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetLabel}>Spent</Text>
                  <Text style={[styles.budgetAmount, { color: colors.highlight }]}>₹{item.spent.toLocaleString()}</Text>
                </View>
                <View style={styles.budgetDivider} />
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetLabel}>Remaining</Text>
                  <Text style={[styles.budgetAmount, { color: remaining !== null && remaining < 0 ? colors.danger : colors.success }]}>
                    ₹{remaining?.toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progress}%`,
                        backgroundColor: progress > 100 ? colors.danger : progress > 80 ? colors.warning : colors.success 
                      }
                    ]} 
                  />
                </View>
              </View>
            </>
          )}

          {item.isExtra && (
            <View style={styles.extraCard}>
              <Text style={styles.extraIcon}>💸</Text>
              <View style={styles.extraStat}>
                <Text style={styles.extraLabel}>Total Spent</Text>
                <Text style={styles.extraAmount}>₹{item.spent.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Add Expense Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Expense</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
          />

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
              (!amount || Number(amount) <= 0) && styles.addButtonDisabled
            ]}
            onPress={handleAddExpense}
            disabled={!amount || Number(amount) <= 0}
          >
            <Text style={styles.addButtonText}>+ Add Expense</Text>
          </Pressable>

          {!item.isExtra && remaining !== null && remaining > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleClearAll}
            >
              <Text style={styles.clearButtonText}>Clear Remaining (₹{remaining.toLocaleString()})</Text>
            </Pressable>
          )}
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No expenses yet</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(h) => h.id.toString()}
              scrollEnabled={false}
              renderItem={({ item: h }) => (
                <Pressable 
                  style={({ pressed }) => [
                    styles.historyItem,
                    pressed && styles.historyItemPressed
                  ]}
                  onLongPress={() => handleDelete(h)}
                >
                  <View style={styles.historyContent}>
                    <Text style={styles.historyAmount}>₹{h.amount.toLocaleString()}</Text>
                    <Text style={styles.historyNote}>
                      {h.note || "No note"}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(h.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(h)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: colors.text,
    marginTop: -2,
  },
  headerContent: {
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  // Minimal Budget Card
  budgetCard: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  budgetStat: {
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  budgetDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  // Extra Card - Minimal
  extraCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  extraIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  extraStat: {
    alignItems: "flex-start",
  },
  extraLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  extraAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.warning,
  },
  formCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    paddingVertical: 14,
    paddingLeft: 8,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.highlight,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  addButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  clearButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.danger,
    borderRadius: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  historySection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  emptyHistoryText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyItemPressed: {
    backgroundColor: colors.border,
  },
  historyContent: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  historyNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
});
