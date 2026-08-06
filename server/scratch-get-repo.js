const mongoose = require("mongoose");
const { connectDB } = require("./src/config/db");
const GithubRepository = require("./src/models/GithubRepository");

async function run() {
  await connectDB();
  const repo = await GithubRepository.findOne({ name: "commitpulse" });
  console.log("Repo details:", JSON.stringify(repo, null, 2));
  process.exit(0);
}

run();
