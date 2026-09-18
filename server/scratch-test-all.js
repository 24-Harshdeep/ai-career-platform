const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const JWT_SECRET = process.env.JWT_SECRET || "careeros-secret-key";

const userIds = [
  "6a880bc05ab4b2f48031ade1",
  "6a97fb95596a7384d3d798e8",
  "6aa6614d777440cccbda0e45",
  "6aa6618c777440cccbda0e92"
];

async function run() {
  for (const id of userIds) {
    const token = jwt.sign({ id, email: "test@test.com" }, JWT_SECRET, { expiresIn: "7d" });
    try {
      const res = await fetch("http://localhost:5000/api/career/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      console.log(`User ${id} status: ${res.status}`);
      const json = await res.json();
      console.log(`User ${id} response:`, JSON.stringify(json, null, 2));
    } catch (err) {
      console.error(`User ${id} error:`, err.message);
    }
  }
}

run();
