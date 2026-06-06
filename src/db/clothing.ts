import { getDatabase } from "./database";
import { Clothing } from "../types";
import { v4 as uuid } from "uuid";

export async function getAllClothing(): Promise<Clothing[]> {
  const db = await getDatabase();
  return db.getAllAsync<Clothing>(
    "SELECT * FROM clothing WHERE deleted = 0 ORDER BY created_at DESC"
  );
}

export async function getClothingByCategory(categoryId: string): Promise<Clothing[]> {
  const db = await getDatabase();
  return db.getAllAsync<Clothing>(
    "SELECT * FROM clothing WHERE category_id = ? AND deleted = 0 ORDER BY created_at DESC",
    [categoryId]
  );
}

export async function getClothingById(id: string): Promise<Clothing | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Clothing>(
    "SELECT * FROM clothing WHERE id = ? AND deleted = 0",
    [id]
  );
}

export async function addClothing(data: Omit<Clothing, "id" | "createdAt" | "updatedAt" | "deleted" | "favorite">): Promise<Clothing> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO clothing (id, category_id, name, image_uri, image_nobg_uri, brand, color, season, notes, favorite, created_at, updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
    [id, data.categoryId, data.name || "", data.imageUri, data.imageNoBgUri || null, data.brand || "", data.color || "", data.season || "", data.notes || "", now, now]
  );
  return { ...data, id, favorite: 0, createdAt: now, updatedAt: now, deleted: 0 };
}

export async function updateClothing(id: string, data: Partial<Clothing>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.categoryId !== undefined) { fields.push("category_id = ?"); values.push(data.categoryId); }
  if (data.imageUri !== undefined) { fields.push("image_uri = ?"); values.push(data.imageUri); }
  if (data.imageNoBgUri !== undefined) { fields.push("image_nobg_uri = ?"); values.push(data.imageNoBgUri); }
  if (data.brand !== undefined) { fields.push("brand = ?"); values.push(data.brand); }
  if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
  if (data.season !== undefined) { fields.push("season = ?"); values.push(data.season); }
  if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }
  if (data.favorite !== undefined) { fields.push("favorite = ?"); values.push(data.favorite); }
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  await db.runAsync(`UPDATE clothing SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteClothing(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE clothing SET deleted = 1, updated_at = ? WHERE id = ?", [new Date().toISOString(), id]);
}
