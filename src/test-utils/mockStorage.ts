class MemoryStorage {
  private data = new Map<string, string>();
  async getItem(key: string): Promise<string | null> { return this.data.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> { this.data.set(key, value); }
  async removeItem(key: string): Promise<void> { this.data.delete(key); }
  clear() { this.data.clear(); }
}
export const mockStorage = new MemoryStorage();
