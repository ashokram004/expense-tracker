import { create } from "zustand";
import {
  createInstance,
  createTemplate,
  deleteExpense,
  deleteInstance,
  deleteTemplate,
  getInstances,
  getTemplateItems,
  getTemplates,
  insertExpense,
  loadItemsByInstance,
  saveItemsForInstance,
  saveTemplateItems,
} from "../db/database";

export type PlanItem = {
  id: string;
  instance_id?: string;
  name: string;
  budget?: number;
  spent: number;
  isExtra?: boolean;
};

export type Template = {
  id: string;
  name: string;
  created_at: number;
};

export type TemplateItem = {
  id: string;
  template_id: string;
  name: string;
  budget?: number;
  isExtra?: boolean;
};

export type Instance = {
  id: string;
  template_id: string | null;
  name: string;
  created_at: number;
};

type PlanState = {
  instances: Instance[];
  templates: Template[];
  templateItems: Record<string, TemplateItem[]>;
  currentItems: PlanItem[];

  hydrate: () => void;

  // Instance actions
  loadInstances: () => void;
  addInstance: (name: string, templateId: string | null) => void;
  removeInstance: (id: string) => void;
  loadInstanceItems: (instanceId: string) => void;

  // Template actions
  loadTemplates: () => void;
  addTemplate: (name: string, items: Omit<TemplateItem, "template_id">[]) => void;
  removeTemplate: (id: string) => void;
  loadTemplateItems: (templateId: string) => void;

  // Item actions (for current instance)
  addExpense: (id: string, amount: number, note?: string) => void;
  clearAll: (id: string) => void;
  removeExpense: (expenseId: number, itemId: string, amount: number) => void;
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const usePlanStore = create<PlanState>((set, get) => ({
  instances: [],
  templates: [],
  templateItems: {},
  currentItems: [],

  // Load instances and templates on app start
  hydrate: () => {
    get().loadInstances();
    get().loadTemplates();
  },

  // =========================
  // INSTANCE ACTIONS
  // =========================
  loadInstances: () => {
    const instances = getInstances() as Instance[];
    set({ instances });
  },

  addInstance: (name: string, templateId: string | null) => {
    const id = generateId();
    createInstance(id, templateId, name);

    // If template selected, copy items from template
    let items: PlanItem[] = [];
    if (templateId) {
      const templateItems = getTemplateItems(templateId);
      items = templateItems.map((item) => ({
        id: generateId(),
        instance_id: id,
        name: item.name,
        budget: item.budget,
        spent: 0,
        isExtra: item.isExtra,
      }));
    }

    // Always add "Extras" item to every bucket (unlimited spending)
    items.push({
      id: generateId(),
      instance_id: id,
      name: "Extras",
      spent: 0,
      isExtra: true,
    });

    saveItemsForInstance(id, items);
    get().loadInstances();
    get().loadInstanceItems(id);
  },

  removeInstance: (id: string) => {
    deleteInstance(id);
    set({ currentItems: [] });
    get().loadInstances();
  },

  loadInstanceItems: (instanceId: string) => {
    const items = loadItemsByInstance(instanceId);
    set({ currentItems: items });
  },

  // =========================
  // TEMPLATE ACTIONS
  // =========================
  loadTemplates: () => {
    const templates = getTemplates() as Template[];
    set({ templates });
  },

  addTemplate: (name: string, items: Omit<TemplateItem, "template_id">[]) => {
    const id = generateId();
    createTemplate(id, name);

    const templateItems = items.map((item) => ({
      ...item,
      id: generateId(),
      template_id: id,
    }));

    saveTemplateItems(id, templateItems);
    get().loadTemplates();
  },

  removeTemplate: (id: string) => {
    deleteTemplate(id);
    get().loadTemplates();
  },

  loadTemplateItems: (templateId: string) => {
    const items = getTemplateItems(templateId);
    set((state) => ({
      templateItems: { ...state.templateItems, [templateId]: items },
    }));
  },

  // =========================
  // ITEM ACTIONS
  // =========================
  addExpense: (id, amount, note = "") => {
    const updated = get().currentItems.map((item) => {
      if (item.id !== id) return item;

      const newSpent = Math.max(0, item.spent + amount);

      return {
        ...item,
        spent: newSpent,
      };
    });

    set({ currentItems: updated });
    insertExpense(id, amount, note);
    saveItemsForInstance(
      get().currentItems[0]?.instance_id || "",
      updated
    );
  },

  clearAll: (id) => {
    const item = get().currentItems.find((i) => i.id === id);
    if (!item || !item.budget) return;

    const remaining = item.budget - item.spent;
    if (remaining <= 0) return;

    const updated = get().currentItems.map((i) =>
      i.id === id
        ? { ...i, spent: item.budget! }
        : i
    );

    set({ currentItems: updated });
    insertExpense(id, remaining, "Cleared");
    saveItemsForInstance(
      get().currentItems[0]?.instance_id || "",
      updated
    );
  },

  removeExpense: (expenseId, itemId, amount) => {
    deleteExpense(expenseId);

    const updated = get().currentItems.map((item) =>
      item.id === itemId
        ? { ...item, spent: Math.max(0, item.spent - amount) }
        : item
    );

    set({ currentItems: updated });
    saveItemsForInstance(
      get().currentItems[0]?.instance_id || "",
      updated
    );
  },
}));
