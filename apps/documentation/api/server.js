import path from "path";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import express from "express";

import "dotenv/config";

const app = express();

app.use(clerkMiddleware());

// Serve the static Docusaurus build
const docusaurusBuildDir = path.join(process.cwd(), "build");

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
