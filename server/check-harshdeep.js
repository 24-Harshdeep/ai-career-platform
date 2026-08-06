const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    // 1. Find User
    const user = await db.collection("users").findOne({ email: "harshdeep@gmail.com" });
    if (!user) {
      console.log("User harshdeep@gmail.com not found!");
      return;
    }
    console.log("User Document:", JSON.stringify(user, null, 2));

    const userId = user._id;

    // 2. Find Profile
    const profile = await db.collection("careerprofiles").findOne({ userId });
    console.log("\nCareer Profile Document:", JSON.stringify(profile, null, 2));

    // 3. Find Developer Profile
    const devProfile = await db.collection("developerprofiles").findOne({ userId });
    console.log("\nDeveloper Profile Document:", JSON.stringify(devProfile, null, 2));

    // 4. Find Repositories
    const repos = await db.collection("githubrepositories").find({ userId }).toArray();
    console.log(`\nFound ${repos.length} Repositories:`);
    repos.forEach(r => console.log(`- ID: ${r._id}, Name: ${r.name}, IsActive: ${r.isActive}, Language: ${r.language}`));

    // 5. Find Project Audits
    const audits = await db.collection("projectaudits").find({ userId }).toArray();
    console.log(`\nFound ${audits.length} Project Audits:`);
    audits.forEach(a => console.log(`- ID: ${a._id}, Title: ${a.title}, URL: ${a.url}, Status: ${a.status}`));

    // 6. Find Project Analyses
    const analyses = await db.collection("projectanalyses").find({ userId }).toArray();
    console.log(`\nFound ${analyses.length} Project Analyses:`);
    analyses.forEach(an => console.log(`- ProjectID: ${an.projectId}, Score: ${an.overallScore}, TechEvidence: ${JSON.stringify(an.technologyEvidence)}, MissingPractices: ${JSON.stringify(an.missingPractices)}`));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
