import path from "path";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import express from "express";

import "dotenv/config";

const app = express();

app.use(clerkMiddleware());

// Serve the static Docusaurus build
// In Vercel serverless functions, process.cwd() points to /var/task
// We need to use a relative path from the server.js file to the build directory
const docusaurusBuildDir = path.join(__dirname, "..", "build");

// Log the build directory path for debugging
console.log("Build directory path:", docusaurusBuildDir);

app.get("/login", (req, res) => {
  res.sendFile(path.join(docusaurusBuildDir, "login.html"));
});

app.get("/logout", (req, res) => {
  res.sendFile(path.join(docusaurusBuildDir, "logout.html"));
});

app.use(
  requireAuth({ signInUrl: "/login" }),
  express.static(docusaurusBuildDir),
);

// For SPA routing, serve index.html for all non-file requests
app.get("*", requireAuth({ signInUrl: "/login" }), (req, res) => {
  res.sendFile(path.join(docusaurusBuildDir, "index.html"));
});

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
