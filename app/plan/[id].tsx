import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
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

type PlanItem = {
  id: string;
  name: string;
  budget?: number;
  spent: number;
  isExtra?: boolean;
};

export default function PlanScreen() {
  const { id } = useLocalSearchParams();
  const instances = usePlanStore((state) => state.instances);
  const items = usePlanStore((state) => state.currentItems);
  const loadInstanceItems = usePlanStore((state) => state.loadInstanceItems);

  // Get current instance name
  const currentInstance = instances.find(inst => inst.id === id);
  const instanceName = currentInstance?.name || "Plan";

  // Load items when screen mounts
  useEffect(() => {
    if (id) {
      loadInstanceItems(id as string);
    }
  }, [id]);

  const getTotalBudget = () => {
    return items.reduce((sum, item) => sum + (item.budget || 0), 0);
  };

  const getTotalSpent = () => {
    return items.reduce((sum, item) => sum + item.spent, 0);
  };

  const getTotalRemaining = () => {
    return getTotalBudget() - getTotalSpent();
  };

  const getProgress = () => {
    const budget = getTotalBudget();
    if (budget === 0) return 0;
    return Math.min((getTotalSpent() / budget) * 100, 100);
  };

  const renderItem = ({ item, index }: { item: PlanItem; index: number }) => {
    const remaining =
      item.isExtra || item.budget === undefined
        ? null
        : item.budget - item.spent;

    const isDone = remaining === 0;
    const progress = item.budget ? Math.min((item.spent / item.budget) * 100, 100) : 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push({ pathname: "/item/[id]", params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: item.isExtra ? `${colors.warning}15` : `${colors.highlight}15` }]}>
            <Text style={styles.cardIconText}>
              {item.isExtra ? '💸' : '📊'}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.isExtra ? (
              <Text style={styles.spentText}>Spent: ₹{item.spent.toLocaleString()}</Text>
            ) : isDone ? (
              <Text style={styles.doneText}>✅ Completed</Text>
            ) : (
              <Text style={styles.remainingText}>₹{remaining?.toLocaleString()} left</Text>
            )}
          </View>
          <View style={styles.cardArrow}>
            <Text style={styles.cardArrowText}>›</Text>
          </View>
        </View>
        
        {!item.isExtra && item.budget && (
          <View style={styles.progressContainer}>
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
            <Text style={styles.progressText}>
              ₹{item.spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const progress = getProgress();
  const totalRemaining = getTotalRemaining();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{instanceName}</Text>
          <Text style={styles.subtitle}>Track your spending</Text>
        </View>
      </View>

      {/* Summary Card - Minimal Height */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryAmount}>₹{getTotalBudget().toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryAmount, { color: colors.highlight }]}>₹{getTotalSpent().toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryAmount, { color: totalRemaining < 0 ? colors.danger : colors.success }]}>
              ₹{totalRemaining.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.totalProgressBar}>
          <View 
            style={[
              styles.totalProgressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: progress > 100 ? colors.danger : progress > 80 ? colors.warning : colors.success 
              }
            ]} 
          />
        </View>
      </View>

      {/* Items List */}
      <Text style={styles.sectionTitle}>Budget Items</Text>
      <FlatList
        style={styles.flatList}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items in this plan</Text>
          </View>
        }
      />
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
  summaryCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  totalProgressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  totalProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  flatList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    marginLeft: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconText: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  bucketBadge: {
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  bucketBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.secondary,
  },
  remainingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spentText: {
    fontSize: 14,
    color: colors.warning,
    marginTop: 2,
  },
  doneText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: "600",
    marginTop: 2,
  },
  cardArrow: {
    padding: 4,
  },
  cardArrowText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
