import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("expense.db");

// =========================
// INIT DATABASE
// =========================
export const initDB = () => {
  // Plan items table (items within an instance)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS plan_items (
      id TEXT PRIMARY KEY NOT NULL,
      instance_id TEXT,
      name TEXT,
      budget REAL,
      spent REAL,
      isExtra INTEGER
    );
  `);

  // Add instance_id column if it doesn't exist (migration)
  try {
    db.execSync(`ALTER TABLE plan_items ADD COLUMN instance_id TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Expenses history table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT,
      amount REAL,
      note TEXT,
      created_at INTEGER
    );
  `);

  // Templates table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      created_at INTEGER
    );
  `);

  // Template items table (items within a template)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS template_items (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT,
      name TEXT,
      budget REAL,
      isExtra INTEGER
    );
  `);

  // Instances table (created budget buckets)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT,
      name TEXT,
      created_at INTEGER
    );
  `);
};

// =========================
// PLAN ITEMS (Instance Items)
// =========================
export const saveItems = (items: any[]) => {
  db.execSync("DELETE FROM plan_items;");

  items.forEach((item) => {
    db.runSync(
      `INSERT INTO plan_items (id, instance_id, name, budget, spent, isExtra)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.instance_id ?? null,
        item.name,
        item.budget ?? null,
        item.spent,
        item.isExtra ? 1 : 0,
      ]
    );
  });
};

export const loadItems = () => {
  const result = db.getAllSync(`SELECT * FROM plan_items`);

  return result.map((row: any) => ({
    id: row.id,
    instance_id: row.instance_id,
    name: row.name,
    budget: row.budget ?? undefined,
    spent: row.spent,
    isExtra: !!row.isExtra,
  }));
};

export const loadItemsByInstance = (instanceId: string) => {
  const result = db.getAllSync(
    `SELECT * FROM plan_items WHERE instance_id = ?`,
    [instanceId]
  );

  return result.map((row: any) => ({
    id: row.id,
    instance_id: row.instance_id,
    name: row.name,
    budget: row.budget ?? undefined,
    spent: row.spent,
    isExtra: !!row.isExtra,
  }));
};

export const saveItemsForInstance = (instanceId: string, items: any[]) => {
  // First delete existing items only (keep expenses for history)
  db.runSync("DELETE FROM plan_items WHERE instance_id = ?", [instanceId]);

  items.forEach((item) => {
    db.runSync(
      `INSERT INTO plan_items (id, instance_id, name, budget, spent, isExtra)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        instanceId,
        item.name,
        item.budget ?? null,
        item.spent,
        item.isExtra ? 1 : 0,
      ]
    );
  });
};

// =========================
// EXPENSE HISTORY
// =========================
export const insertExpense = (
  itemId: string,
  amount: number,
  note: string
) => {
  db.runSync(
    `INSERT INTO expenses (item_id, amount, note, created_at)
     VALUES (?, ?, ?, ?)`,
    [itemId, amount, note, Date.now()]
  );
};

export const getExpenses = (itemId: string) => {
  return db.getAllSync(
    `SELECT * FROM expenses
     WHERE item_id = ?
     ORDER BY created_at DESC`,
    [itemId]
  );
};

export const deleteExpense = (expenseId: number) => {
  db.runSync(
    `DELETE FROM expenses WHERE id = ?`,
    [expenseId]
  );
};

// =========================
// TEMPLATES
// =========================
export const createTemplate = (id: string, name: string) => {
  db.runSync(
    `INSERT INTO templates (id, name, created_at) VALUES (?, ?, ?)`,
    [id, name, Date.now()]
  );
};

export const getTemplates = () => {
  return db.getAllSync(`SELECT * FROM templates ORDER BY created_at DESC`);
};

export const deleteTemplate = (templateId: string) => {
  // First delete template items
  const items = db.getAllSync("SELECT id FROM template_items WHERE template_id = ?", [templateId]);
  items.forEach(() => {
    db.runSync("DELETE FROM template_items WHERE template_id = ?", [templateId]);
  });
  db.runSync("DELETE FROM templates WHERE id = ?", [templateId]);
};

// =========================
// TEMPLATE ITEMS
// =========================
export const saveTemplateItems = (templateId: string, items: any[]) => {
  // First delete existing
  const existing = db.getAllSync("SELECT id FROM template_items WHERE template_id = ?", [templateId]);
  existing.forEach(() => {
    db.runSync("DELETE FROM template_items WHERE template_id = ?", [templateId]);
  });

  items.forEach((item) => {
    db.runSync(
      `INSERT INTO template_items (id, template_id, name, budget, isExtra)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.id,
        templateId,
        item.name,
        item.budget ?? null,
        item.isExtra ? 1 : 0,
      ]
    );
  });
};

export const getTemplateItems = (templateId: string) => {
  const result = db.getAllSync(
    `SELECT * FROM template_items WHERE template_id = ?`,
    [templateId]
  );

  return result.map((row: any) => ({
    id: row.id,
    template_id: row.template_id,
    name: row.name,
    budget: row.budget ?? undefined,
    isExtra: !!row.isExtra,
  }));
};

// =========================
// INSTANCES
// =========================
export const createInstance = (id: string, templateId: string | null, name: string) => {
  db.runSync(
    `INSERT INTO instances (id, template_id, name, created_at) VALUES (?, ?, ?, ?)`,
    [id, templateId, name, Date.now()]
  );
};

export const getInstances = () => {
  return db.getAllSync(`SELECT * FROM instances ORDER BY created_at DESC`);
};

export const getInstance = (instanceId: string) => {
  const result = db.getAllSync(
    `SELECT * FROM instances WHERE id = ?`,
    [instanceId]
  );
  return result.length > 0 ? result[0] : null;
};

export const deleteInstance = (instanceId: string) => {
  // Delete all expenses for items in this instance
  const items = loadItemsByInstance(instanceId);
  items.forEach((item) => {
    db.runSync("DELETE FROM expenses WHERE item_id = ?", [item.id]);
  });
  
  // Delete all items in the instance
  db.runSync("DELETE FROM plan_items WHERE instance_id = ?", [instanceId]);
  
  // Delete the instance
  db.runSync("DELETE FROM instances WHERE id = ?", [instanceId]);
};
