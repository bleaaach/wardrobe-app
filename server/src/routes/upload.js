import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function findPython() {
  const candidates = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
  for (const cmd of candidates) {
    try {
      await execFileAsync(cmd, ["--version"]);
      return cmd;
    } catch {
      // try next
    }
  }
  return null;
}
import { authMiddleware } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname || ".png")),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: "/sync/uploads/" + req.file.filename });
});

router.post("/base64", async (req, res) => {
  const { data, name } = req.body || {};
  if (!data) return res.status(400).json({ error: "No data" });
  const filename = (name || uuid()) + ".jpg";
  const buffer = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  res.json({ url: "/sync/uploads/" + filename });
});

router.post("/remove-bg", async (req, res) => {
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: "No data" });

  const pythonCmd = await findPython();
  if (!pythonCmd) {
    return res.status(500).json({ error: "Python is not available on the server" });
  }

  const id = uuid();
  const inFile = path.join(UPLOADS_DIR, id + "_in.png");

  const buffer = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  await fs.promises.writeFile(inFile, buffer);

  const script = path.join(__dirname, "..", "remove_bg.py");
  execFile(pythonCmd, [script, inFile], { timeout: 60000, maxBuffer: 20 * 1024 * 1024, encoding: "buffer" }, async (err, stdout) => {
    if (err) {
      try { await fs.promises.unlink(inFile); } catch {}
      return res.status(500).json({ error: "Remove bg failed: " + err.message });
    }
    // The script outputs raw PNG bytes to stdout
    const base64 = stdout.toString("base64");
    try { await fs.promises.unlink(inFile); } catch {}
    res.json({ data: "data:image/png;base64," + base64 });
  });
});

export default router;
