const fs = require("fs");
const path = require("path");

const loginFilePath = path.join(__dirname, "../build/login.html");
let content = fs.readFileSync(loginFilePath, "utf8");

// Replace environment variables
content = content.replace(
  "%%CLERK_PUBLISHABLE_KEY%%",
  process.env.CLERK_PUBLISHABLE_KEY || "",
);

content = content.replace(
  "%%CLERK_FRONTEND_URL%%",
  process.env.CLERK_FRONTEND_URL || "",
);

fs.writeFileSync(loginFilePath, content);
console.log("Environment variables replaced in login.html");

const logoutFilePath = path.join(__dirname, "../build/logout.html");
content = fs.readFileSync(logoutFilePath, "utf8");

// Replace environment variables
content = content.replace(
  "%%CLERK_PUBLISHABLE_KEY%%",
  process.env.CLERK_PUBLISHABLE_KEY || "",
);

content = content.replace(
  "%%CLERK_FRONTEND_URL%%",
  process.env.CLERK_FRONTEND_URL || "",
);

fs.writeFileSync(logoutFilePath, content);
console.log("Environment variables replaced in logout.html");
