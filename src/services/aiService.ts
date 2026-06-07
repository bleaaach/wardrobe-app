import { API_BASE_URL } from "../config/api";
import storage from "../utils/storage";

const TRY_ON_API = `${API_BASE_URL}/ai/try-on`;
const ANALYZE_API = `${API_BASE_URL}/ai/analyze`;

export interface TryOnResult {
  status: "success" | "mock";
  message?: string;
  resultImage?: string;
}

export interface AnalyzeResult {
  color: string;
  hex: string;
  category: string;
  confidence: number;
}

export async function tryOn(
  personImageBase64: string,
  clothingImageBase64: string,
  clothingId: string
): Promise<TryOnResult> {
  const token = await storage.getItem("auth_token");
  const res = await fetch(TRY_ON_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      personImage: personImageBase64,
      clothingImage: clothingImageBase64,
      clothingId,
    }),
  });

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const err = await res.json();
      if (err.error) msg = err.error;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return {
    status: data.status ?? "mock",
    message: data.message,
    resultImage: data.resultImage,
  };
}

export async function analyzeImage(imageBase64: string): Promise<AnalyzeResult> {
  const token = await storage.getItem("auth_token");
  const res = await fetch(ANALYZE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ data: imageBase64 }),
  });

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const err = await res.json();
      if (err.error) msg = err.error;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  return res.json();
}
