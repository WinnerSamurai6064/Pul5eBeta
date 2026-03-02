import express from "express";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;

// Admin credentials (server-side backup/logging)
const adminUser = process.env.VITE_ADMIN_USERNAME || "PUL5E";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Configure Supabase for ping bot
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log(`Server: Supabase client initialized for ping bot. Target: ${supabaseUrl}`);
  
  // Ping bot to keep Supabase awake (runs every 10 minutes)
  setInterval(async () => {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      console.log(`[${new Date().toISOString()}] Supabase Ping Bot: Success. Instance is awake.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Supabase Ping Bot: Failed to ping.`, err);
    }
  }, 10 * 60 * 1000);
} else {
  console.warn("Server: Supabase credentials missing. Ping bot disabled.");
}

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API Routes
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!apiKey || !apiSecret || !cloudName) {
      console.error("Server: Cloudinary config missing during upload attempt.");
      return res.status(500).json({ error: "Cloudinary API credentials not configured on server." });
    }

    const { caption, userId, type } = req.body;
    const folder = type === 'story' ? 'pul5e_stories' : 'pul5e_posts';

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto",
      folder: folder,
      context: `caption=${caption || ''}|userId=${userId || 'admin-1'}`
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    if (!apiKey || !apiSecret || !cloudName) {
      return res.json([]); 
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'pul5e_posts/',
      context: true,
      max_results: 100,
      direction: 'desc'
    });

    const posts = result.resources.map((res: any) => {
      const context = res.context?.custom || {};
      return {
        id: res.public_id,
        userId: context.userId || 'admin-1',
        imageUrl: res.secure_url,
        caption: context.caption || '',
        createdAt: res.created_at,
        likes: 0,
        hashtags: []
      };
    });

    res.json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.get("/api/stories", async (req, res) => {
  try {
    if (!apiKey || !apiSecret || !cloudName) {
      return res.json([]); 
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'pul5e_stories/',
      context: true,
      max_results: 50,
      direction: 'desc'
    });

    const stories = result.resources.map((res: any) => {
      const context = res.context?.custom || {};
      return {
        id: res.public_id,
        userId: context.userId || 'admin-1',
        imageUrl: res.secure_url,
        createdAt: res.created_at,
        expiresAt: new Date(new Date(res.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    });

    res.json(stories);
  } catch (error) {
    console.error("Fetch stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

app.post("/api/delete-image", express.json(), async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: "No publicId provided" });
    
    if (!apiKey || !apiSecret || !cloudName) {
      return res.status(500).json({ error: "Cloudinary API credentials not configured on server." });
    }

    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.get("/api/health", async (req, res) => {
  let supabaseStatus = "Not Configured";
  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      supabaseStatus = error ? "Error: " + error.message : "Connected";
    } catch (e: any) {
      supabaseStatus = "Error: " + e.message;
    }
  }

  res.json({ 
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    cloudinary: (apiKey && apiSecret && cloudName) ? "Configured" : "Not Configured",
    supabase: supabaseStatus,
    adminConfigured: !!process.env.VITE_ADMIN_PASSWORD,
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // Handle SPA routing
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
