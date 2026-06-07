import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { authMiddleware } from "./auth.js";
import { getColor, configure } from "colorthief";
import { pipeline, env } from "@xenova/transformers";
import { mapHexToChineseColor } from "../utils/colorMapper.js";
import { mapImageNetLabelToCategory } from "../utils/categoryMapper.js";
import { decodeImage } from "../utils/imageDecoder.js";
import { createNodeLoader } from "colorthief/internals";

// Use pure-JS decoder instead of sharp
configure({ loader: createNodeLoader({ decoder: decodeImage }) });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "..", "..", "temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Configure Transformers.js for Node.js
env.allowLocalModels = false;
env.cacheDir = path.join(process.cwd(), ".cache", "transformers");

const router = Router();

// Lazy-load image classifier to avoid downloading on startup
let classifierPromise = null;
function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      "image-classification",
      "Xenova/vit-base-patch16-224",
      { quantized: true }
    );
  }
  return classifierPromise;
}

router.post("/try-on", authMiddleware, async (req, res) => {
  const { personImage, clothingImage, clothingId } = req.body || {};

  if (!personImage || typeof personImage !== "string") {
    return res.status(400).json({ error: "personImage is required" });
  }
  if (!clothingImage || typeof clothingImage !== "string") {
    return res.status(400).json({ error: "clothingImage is required" });
  }
  if (!clothingId || typeof clothingId !== "string") {
    return res.status(400).json({ error: "clothingId is required" });
  }

  try {
    const id = uuid();
    const personBuffer = Buffer.from(
      personImage.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const clothingBuffer = Buffer.from(
      clothingImage.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const personPath = path.join(TEMP_DIR, `${id}_person.jpg`);
    const clothingPath = path.join(TEMP_DIR, `${id}_clothing.jpg`);

    await fs.promises.writeFile(personPath, personBuffer);
    await fs.promises.writeFile(clothingPath, clothingBuffer);

    // TODO: integrate with AI model (Stable Diffusion / ControlNet / IDM-VTON)
    // For now, return mock response
    res.json({
      status: "mock",
      message: "AI 试衣功能即将上线，当前为演示模式",
      resultImage: clothingImage,
    });
  } catch (err) {
    res.status(500).json({ error: "处理失败: " + (err.message || String(err)) });
  }
});

/**
 * POST /api/ai/analyze
 * Body: { data: "data:image/jpeg;base64,..." }
 * Response: { color, hex, category, confidence }
 */
router.post("/analyze", authMiddleware, async (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== "string") {
    return res.status(400).json({ error: "No image data" });
  }

  let imgPath = null;
  try {
    const id = uuid();
    const buffer = Buffer.from(
      data.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    imgPath = path.join(TEMP_DIR, `${id}.jpg`);
    await fs.promises.writeFile(imgPath, buffer);

    // 1. Extract dominant color
    const dominantColor = await getColor(imgPath);
    const hex = dominantColor.hex();

    // 2. Classify image
    const classifier = await getClassifier();
    const results = await classifier(imgPath);
    const top = results[0];
    const category = mapImageNetLabelToCategory(top.label);

    res.json({
      color: mapHexToChineseColor(hex),
      hex,
      category,
      confidence: Math.round(top.score * 100) / 100,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "分析失败: " + (err.message || String(err)) });
  } finally {
    if (imgPath) {
      try { await fs.promises.unlink(imgPath); } catch {}
    }
  }
});

export default router;
