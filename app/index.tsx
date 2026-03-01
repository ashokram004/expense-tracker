import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TemplateItem, usePlanStore } from "../src/store/planStore";

// Color palette - Professional and modern
const colors = {
  primary: "#1A1A2E",
  secondary: "#16213E",
  accent: "#0F3460",
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

export default function HomeScreen() {
  const { instances, templates, addInstance, removeInstance, addTemplate, removeTemplate } = usePlanStore();

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateFromTemplateModal, setShowCreateFromTemplateModal] = useState(false);
  
  const [instanceName, setInstanceName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const [templateName, setTemplateName] = useState("");
  const [templateItems, setTemplateItems] = useState<Omit<TemplateItem, "template_id">[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemBudget, setNewItemBudget] = useState("");

  const handleCreateInstance = () => {
    if (!instanceName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    addInstance(instanceName.trim(), selectedTemplateId);
    setInstanceName("");
    setSelectedTemplateId(null);
    setShowCreateFromTemplateModal(false);
  };

  const handleDeleteInstance = (id: string, name: string) => {
    Alert.alert(
      "Delete Bucket",
      `Are you sure you want to delete "${name}"? This will delete all expenses.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeInstance(id) },
      ]
    );
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeTemplate(id) },
      ]
    );
  };

  const handleAddTemplateItem = () => {
    if (!newItemName.trim()) return;
    
    const budget = newItemBudget ? parseFloat(newItemBudget) : undefined;
    const isExtra = newItemName.toLowerCase() === "extras";
    
    setTemplateItems([
      ...templateItems,
      { id: Date.now().toString(), name: newItemName.trim(), budget: isExtra ? undefined : budget, isExtra }
    ]);
    
    setNewItemName("");
    setNewItemBudget("");
  };

  const handleRemoveTemplateItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      Alert.alert("Error", "Please enter a template name");
      return;
    }
    if (templateItems.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }
    
    addTemplate(templateName.trim(), templateItems);
    
    setTemplateName("");
    setTemplateItems([]);
    setShowTemplateModal(false);
  };

  const handleCreateBucketPress = () => {
    if (templates.length === 0) {
      Alert.alert(
        "No Templates",
        "Please create a template first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Template", onPress: () => setShowTemplateModal(true) },
        ]
      );
    } else {
      setInstanceName("");
      setSelectedTemplateId(null);
      setShowCreateFromTemplateModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget Buckets</Text>
        <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
      </View>

      {/* Buckets List */}
      <FlatList
        data={instances}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
              { backgroundColor: colors.card }
            ]}
            onPress={() => router.push({ pathname: "/plan/[id]", params: { id: item.id } })}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📦</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>{item.name}</Text>
              <Text style={styles.cardSubtext}>Tap to view details</Text>
            </View>
            <Pressable 
              style={styles.deleteCardButton}
              onPress={() => handleDeleteInstance(item.id, item.name)}
            >
              {/* White 2D dustbin icon using shapes */}
              <View style={styles.dustbinContainer}>
                <View style={styles.dustbinTop} />
                <View style={styles.dustbinBody}>
                  <View style={styles.dustbinLine} />
                  <View style={styles.dustbinLine} />
                  <View style={styles.dustbinLine} />
                </View>
              </View>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No Buckets Yet</Text>
            <Text style={styles.emptyText}>Create your first budget bucket to start tracking expenses</Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed
          ]}
          onPress={handleCreateBucketPress}
        >
          <Text style={styles.primaryButtonIcon}>+</Text>
          <Text style={styles.primaryButtonText}>Create Bucket</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed
          ]}
          onPress={() => setShowTemplateModal(true)}
        >
          <Text style={styles.secondaryButtonText}>Manage Templates</Text>
        </Pressable>
      </View>

      {/* Create from Template Modal */}
      <Modal visible={showCreateFromTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateFromTemplateModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Bucket</Text>
              <Text style={styles.modalSubtitle}>Select a template to get started</Text>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Bucket name (e.g., Goa Trip)"
              placeholderTextColor={colors.textSecondary}
              value={instanceName}
              onChangeText={setInstanceName}
            />
            
            <Text style={styles.label}>Choose Template:</Text>
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              style={styles.templateList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.templateOption,
                    selectedTemplateId === item.id && styles.templateOptionSelected,
                    pressed && styles.templateOptionPressed
                  ]}
                  onPress={() => setSelectedTemplateId(item.id)}
                >
                  <Text style={[
                    styles.templateOptionText,
                    selectedTemplateId === item.id && styles.templateOptionTextSelected
                  ]}>{item.name}</Text>
                  {selectedTemplateId === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              )}
            />
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={styles.cancelButton} 
                onPress={() => setShowCreateFromTemplateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.createButton, 
                  !selectedTemplateId && styles.disabledButton
                ]} 
                onPress={handleCreateInstance}
                disabled={!selectedTemplateId}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Templates Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTemplateModal(false)} />
          <View style={[styles.modalContent, styles.modalContentLarge]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Templates</Text>
              <Text style={styles.modalSubtitle}>Create reusable budget templates</Text>
            </View>
            
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              style={styles.templateList}
              renderItem={({ item }) => (
                <View style={styles.templateItemRow}>
                  <View style={styles.templateCard}>
                    <Text style={styles.templateCardText}>{item.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(item.id, item.name)}
                    style={styles.deleteButton}
                  >
                    <View style={styles.dustbinContainer}>
                      <View style={styles.dustbinTop} />
                      <View style={styles.dustbinBody}>
                        <View style={styles.dustbinLine} />
                        <View style={styles.dustbinLine} />
                        <View style={styles.dustbinLine} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No templates yet</Text>
              }
            />
            
            <View style={styles.divider} />
            
            <Text style={styles.label}>New Template:</Text>
            <TextInput
              style={styles.input}
              placeholder="Template name"
              placeholderTextColor={colors.textSecondary}
              value={templateName}
              onChangeText={setTemplateName}
            />
            
            <View style={styles.itemInputRow}>
              <TextInput
                style={[styles.input, styles.itemNameInput]}
                placeholder="Item name"
                placeholderTextColor={colors.textSecondary}
                value={newItemName}
                onChangeText={setNewItemName}
              />
              <TextInput
                style={[styles.input, styles.itemBudgetInput]}
                placeholder="₹0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={newItemBudget}
                onChangeText={setNewItemBudget}
              />
            </View>
            
            <Pressable 
              style={styles.addItemButton} 
              onPress={handleAddTemplateItem}
            >
              <Text style={styles.addItemButtonText}>+ Add Item</Text>
            </Pressable>
            
            {templateItems.map((item, index) => (
              <View key={item.id} style={styles.templateItemChip}>
                <View style={styles.chipContent}>
                  <Text style={styles.chipName}>{item.name}</Text>
                  <Text style={styles.chipBudget}>
                    {item.budget ? `₹${item.budget}` : 'Unlimited'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveTemplateItem(index)}>
                  <Text style={styles.removeChipText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => {
                setShowTemplateModal(false);
                setTemplateName("");
                setTemplateItems([]);
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.createButton} onPress={handleCreateTemplate}>
                <Text style={styles.createButtonText}>Save Template</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
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
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.highlight}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  cardSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteCardButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  dustbinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dustbinTop: {
    width: 14,
    height: 3,
    backgroundColor: "white",
    borderRadius: 1,
    marginBottom: 1,
  },
  dustbinBody: {
    width: 12,
    height: 14,
    backgroundColor: "white",
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
  },
  dustbinLine: {
    width: 8,
    height: 1,
    backgroundColor: colors.danger,
    marginVertical: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.highlight,
    borderRadius: 14,
    marginBottom: 10,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  primaryButtonIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
  secondaryButton: {
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "75%",
  },
  modalContentLarge: {
    maxHeight: "90%",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: colors.background,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  templateList: {
    maxHeight: 180,
    marginBottom: 16,
  },
  templateOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  templateOptionPressed: {
    backgroundColor: colors.border,
  },
  templateOptionSelected: {
    borderColor: colors.highlight,
    backgroundColor: `${colors.highlight}10`,
  },
  templateOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  templateOptionTextSelected: {
    fontWeight: "600",
    color: colors.highlight,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.highlight,
  },
  templateItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  templateCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  templateCardText: {
    fontSize: 16,
    color: colors.text,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  emptyListText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 15,
    paddingVertical: 20,
  },
  itemInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  itemNameInput: {
    flex: 2,
  },
  itemBudgetInput: {
    flex: 1,
  },
  addItemButton: {
    padding: 12,
    backgroundColor: `${colors.success}15`,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  addItemButtonText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: 15,
  },
  templateItemChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chipName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  chipBudget: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeChipText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 14,
    padding: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: colors.highlight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
});
