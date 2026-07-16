const REPOSITORY_RULES = {
  readmeKeywords: ["overview", "installation", "usage", "license", "screenshots", "contribution"],
  testingKeywords: ["test", "jest", "cypress", "mocha", "vitest", "assert", "coverage"],
  devopsKeywords: ["docker", "dockerfile", "github/workflows", "nginx", "k8s", "kubernetes", "jenkins"],
  projectFiles: [".gitignore", ".env.example", "package.json", "tsconfig.json", "eslint.config.js"]
};

module.exports = { REPOSITORY_RULES };
