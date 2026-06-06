import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { execFile } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname || ".png")),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: "/sync/uploads/" + req.file.filename });
});

router.post("/base64", (req, res) => {
  const { data, name } = req.body || {};
  if (!data) return res.status(400).json({ error: "No data" });
  const filename = (name || uuid()) + ".jpg";
  const buffer = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  res.json({ url: "/sync/uploads/" + filename });
});

router.post("/remove-bg", (req, res) => {
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: "No data" });

  const id = uuid();
  const inFile = path.join(UPLOADS_DIR, id + "_in.png");

  const buffer = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  fs.writeFileSync(inFile, buffer);

  const script = path.join(__dirname, "..", "remove_bg.py");
  execFile("python3.8", [script, inFile], { timeout: 30000 }, (err, stdout) => {
    if (err) {
      try { fs.unlinkSync(inFile); } catch {}
      return res.status(500).json({ error: "Remove bg failed: " + err.message });
    }
    // The script outputs raw PNG bytes to stdout
    const base64 = stdout.toString("base64");
    try { fs.unlinkSync(inFile); } catch {}
    res.json({ data: "data:image/png;base64," + base64 });
  });
});

export default router;
