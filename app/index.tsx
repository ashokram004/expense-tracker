import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TemplateItem, usePlanStore } from "../src/store/planStore";

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
      `Are you sure you want to delete "${name}"? This will delete all expenses for this bucket.`,
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
        "Please create a template first using 'Manage Templates'.",
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
      <Text style={styles.title}>Expense Tracker</Text>

      <Text style={styles.sectionTitle}>Budget Buckets</Text>
      
      <FlatList
        data={instances}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: "/plan/[id]", params: { id: item.id } })}
            onLongPress={() => handleDeleteInstance(item.id, item.name)}
          >
            <Text style={styles.cardText}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No budget buckets yet. Create one below!</Text>}
      />

      <Pressable
        style={styles.addButton}
        onPress={handleCreateBucketPress}
      >
        <Text style={styles.addText}>+ Create Bucket</Text>
      </Pressable>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowTemplateModal(true)}
        >
          <Text style={styles.menuButtonText}>Manage Templates</Text>
        </TouchableOpacity>
      </View>

      {/* Create from Template Modal */}
      <Modal visible={showCreateFromTemplateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Bucket from Template</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Bucket name (e.g., Goa Trip)"
              value={instanceName}
              onChangeText={setInstanceName}
            />
            
            <Text style={styles.label}>Select Template:</Text>
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              style={styles.templateList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.templateOption,
                    selectedTemplateId === item.id && styles.templateOptionSelected
                  ]}
                  onPress={() => setSelectedTemplateId(item.id)}
                >
                  <Text style={styles.templateOptionText}>{item.name}</Text>
                </Pressable>
              )}
            />
            
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowCreateFromTemplateModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.createButton, !selectedTemplateId && styles.disabledButton]} 
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
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Manage Templates</Text>
            
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              style={styles.templateList}
              renderItem={({ item }) => (
                <View style={styles.templateItemRow}>
                  <Pressable
                    style={styles.templateCard}
                    onPress={() => {}}
                  >
                    <Text style={styles.templateCardText}>{item.name}</Text>
                  </Pressable>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(item.id, item.name)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No templates. Create one below!</Text>}
            />
            
            <Text style={styles.label}>Create New Template:</Text>
            <TextInput
              style={styles.input}
              placeholder="Template name"
              value={templateName}
              onChangeText={setTemplateName}
            />
            
            <View style={styles.itemInputRow}>
              <TextInput
                style={[styles.input, styles.itemNameInput]}
                placeholder="Item name"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              <TextInput
                style={[styles.input, styles.itemBudgetInput]}
                placeholder="Budget"
                keyboardType="numeric"
                value={newItemBudget}
                onChangeText={setNewItemBudget}
              />
            </View>
            
            <Pressable style={styles.addItemButton} onPress={handleAddTemplateItem}>
              <Text style={styles.addItemButtonText}>+ Add Item</Text>
            </Pressable>
            
            {templateItems.map((item, index) => (
              <View key={item.id} style={styles.templateItemChip}>
                <Text>{item.name} {item.budget ? `(₹${item.budget})` : '(Unlimited)'}</Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    padding: 18,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "500",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
    padding: 16,
    backgroundColor: "black",
    borderRadius: 12,
    alignItems: "center",
  },
  addText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  menuContainer: {
    marginTop: 10,
  },
  menuButton: {
    padding: 14,
    backgroundColor: "#333",
    borderRadius: 12,
    alignItems: "center",
  },
  menuButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxHeight: "70%",
  },
  modalContentLarge: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 5,
  },
  templateList: {
    maxHeight: 150,
    marginBottom: 10,
  },
  templateOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
  },
  templateOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E8F4FF",
  },
  templateOptionText: {
    fontSize: 16,
  },
  templateItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  templateCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  templateCardText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "red",
    fontWeight: "600",
  },
  itemInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  itemNameInput: {
    flex: 2,
  },
  itemBudgetInput: {
    flex: 1,
  },
  addItemButton: {
    padding: 10,
    backgroundColor: "#E8F4FF",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  addItemButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  templateItemChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 6,
  },
  removeChipText: {
    color: "red",
    fontWeight: "600",
    paddingLeft: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 15,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  createButton: {
    backgroundColor: "black",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});
