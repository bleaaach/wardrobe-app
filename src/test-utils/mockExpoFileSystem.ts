import { mockImageStore } from "./mockImageStorage";

export const documentDirectory = "file:///mock/";

export async function getInfoAsync(path: string) {
  const id = path.replace("file:///mock/wardrobe_images/", "").replace(".png", "");
  const exists = await mockImageStore.imageExists(id);
  return { exists, uri: path };
}

export async function makeDirectoryAsync(_path: string, _options?: any) {
  return;
}

export async function writeAsStringAsync(path: string, base64: string) {
  const id = path.replace("file:///mock/wardrobe_images/", "").replace(".png", "");
  await mockImageStore.storeImage(id, base64);
}

export const EncodingType = { Base64: "base64" };
