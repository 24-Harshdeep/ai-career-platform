const backendTrack = {
  id: "backend-v1",
  title: "Backend Engineering Track",
  reasoning: "Secure API design, schema validation with Zod, and JWT authentication are core backend engineering benchmarks.",
  modules: [
    {
      id: "be-m1",
      title: "API Design & Routing",
      subSkills: [
        {
          id: "be-sub-1",
          title: "Express REST Router endpoints",
          xpReward: 40,
          time: "2 Hours",
          scoreGain: 3,
          prerequisite: "Node.js Basics",
          unlocks: "Zod validation schema rules",
          explanation: "Structured routers map request endpoints clean of controller logic, enforcing solid microservice architectures.",
          tip: "Group endpoint paths under separate sub-routers with logical REST method names.",
          resources: ["https://expressjs.com/en/guide/routing.html"]
        },
        {
          id: "be-sub-2",
          title: "Zod request schema validation",
          xpReward: 30,
          time: "1.5 Hours",
          scoreGain: 3,
          prerequisite: "Express REST Router",
          unlocks: "Bcrypt secure password hashing",
          explanation: "Zod runtime object parsing filters unexpected request body properties before controllers execute business logic.",
          tip: "Create reusable middleware to validate headers, queries, and bodies against target schemas.",
          resources: ["https://zod.dev/"]
        }
      ]
    },
    {
      id: "be-m2",
      title: "Authentication & Security",
      subSkills: [
        {
          id: "be-sub-3",
          title: "Bcrypt secure password hashing",
          xpReward: 50,
          time: "1 Hour",
          scoreGain: 4,
          prerequisite: "Zod request schema validation",
          unlocks: "JWT token verification middleware",
          explanation: "Bcrypt cryptographically salts and hashes plain-text credentials to ensure safe authentication storage.",
          tip: "Use a salt factor of 10-12 to strike the optimal balance between security limits and request latency.",
          resources: ["https://github.com/kelektiv/node.bcrypt.js"]
        },
        {
          id: "be-sub-4",
          title: "JWT token verification & middleware",
          xpReward: 50,
          time: "2 Hours",
          scoreGain: 4,
          prerequisite: "Bcrypt secure hashing",
          unlocks: "Rate limiting and Helmet security",
          explanation: "JSON Web Tokens verify secure user identity assertions stateless, eliminating complex session tables in databases.",
          tip: "Store tokens in HTTP-only, secure, SameSite cookies to protect transactions against XSS and CSRF vector strikes.",
          resources: ["https://jwt.io/introduction/"]
        },
        {
          id: "be-sub-5",
          title: "Rate limiting and Helmet headers",
          xpReward: 40,
          time: "2 Hours",
          scoreGain: 3,
          prerequisite: "JWT token verification",
          unlocks: "Backend Track Completion",
          explanation: "Rate limiting prevents brute force vector floods. Helmet sets HTTP headers to block security vulnerability leaks.",
          tip: "Configure distinct rate limit limits on login routes compared to public assets.",
          resources: ["https://github.com/helmetjs/helmet", "https://github.com/express-rate-limit/express-rate-limit"]
        }
      ]
    }
  ]
};

module.exports = backendTrack;
