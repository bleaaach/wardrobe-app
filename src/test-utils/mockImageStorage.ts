class MemoryImageStore {
  private images = new Map<string, string>();
  async storeImage(id: string, base64: string): Promise<void> { this.images.set(id, base64); }
  async getImageUrl(id: string): Promise<string | null> { return this.images.has(id) ? `memory://${id}` : null; }
  async imageExists(id: string): Promise<boolean> { return this.images.has(id); }
  async getImageBlob(id: string): Promise<Blob | null> { return null; }
  clear() { this.images.clear(); }
}
export const mockImageStore = new MemoryImageStore();
