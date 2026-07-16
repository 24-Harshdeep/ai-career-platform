# CareerOS v1.0 — Platform Architecture & CTO Blueprint

This document defines the product vision, database schemas, API specifications, and algorithmic mechanics for **CareerOS**, an AI-powered Career Intelligence Platform.

---

## 1. Product Vision & Philosophy

CareerOS is **not** a generic resume builder, ATS checker, or standalone AI chatbot. It is a **Career Intelligence Platform** that acts as a developer's career operating system. It continuously indexes user credentials and outputs the single highest-impact next action to move them closer to their career goals.

```
                  [ User Artifacts: Resume / GitHub / Projects ]
                                         │
                                         ▼
                            [ Career Intelligence Engine ]
                                         │
                                         ▼
                             [ Next Best Action Engine ]
                                         │
                                         ▼
                            [ Targeted Career Growth ]
```

### Complete User Journey
1. **Onboarding / DNA Setup**: Define target engineering goals and target experience levels.
2. **Analysis Sweep**: Perform automated ATS resume analysis and GitHub repository index scanning.
3. **Roadmap & Learning**: Receive a personalized checklist of skills, sub-skills, and daily challenges.
4. **Next Best Action**: Execute the dynamically generated priority task to increase the Career Score.
5. **Interview Simulation**: Practice technical mock interviews and secure target offer status.

---

## 2. System Architecture

```
                                  [ Client (Next.js) ]
                                           │
                                           ▼
                                   [ API Router Gateway ]
                                           │
                                           ▼
                                 [ Express Server Core ]
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
           [ Career Intelligence Engine ]            [ AI Specialists Router ]
                        │                                     │
                        ▼                                     ▼
                 [ MongoDB Atlas ]                     [ LLM API Gateway ]
```

### Workspace Structure
```
careeros/
├── client/                     # Next.js Frontend Layer
│   ├── src/
│   │   ├── app/                # Route pages
│   │   ├── components/         # Layout & UI Primitives (Button, Card, Badge)
│   │   ├── lib/                # Auth context providers
│   │   └── store/              # Zustand state manager
│
└── server/                     # Express Backend Layer
    ├── src/
    │   ├── config/             # DB connection managers
    │   ├── models/             # Mongoose schemas
    │   ├── routes/             # API routes
    │   └── career-engine/      # Score, Action, and Readiness calculators
```

---

## 3. Database Schema Specification

### User Schema (`users`)
Stores credentials, core goals, and cumulative career metrics.
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique index)
- `passwordHash`: String
- `goal`: String (Target role, e.g. Full Stack Developer)
- `experience`: String (Beginner, Intermediate, Advanced)
- `score`: Number (Dynamic aggregate score)
- `hasResumeScanned`: Boolean
- `hasGithubScanned`: Boolean
- `projectsCount`: Number
- `skillsCount`: Number
- `masteredQuestionsCount`: Number
- `streakDays`: Number

### Roadmap Schema (`roadmaps`)
Tracks progress across primary modules.
- `userId`: ObjectId (Ref User)
- `moduleId`: String (rm-1, rm-2, rm-3)
- `title`: String
- `progress`: Number (0-100)
- `skills`: Array [String]

### Daily Challenges Schema (`missions`)
Daily checklist tasks.
- `userId`: ObjectId (Ref User)
- `title`: String
- `completed`: Boolean
- `scoreReward`: Number

### Applications Schema (`applications`)
Pipeline job tracker.
- `userId`: ObjectId (Ref User)
- `company`: String
- `role`: String
- `matchScore`: Number
- `status`: String (Applied, Interview, Offer, Rejected)
- `dateApplied`: String

---

## 4. API Endpoints Specification

### Auth & Settings
- `POST /api/auth/login`: Verifies user credentials and returns JWT.
- `GET /api/user/profile`: Fetches goal metadata.
- `PUT /api/user/profile`: Modifies goal parameters.

### Career Analytics
- `GET /api/career/stats`: Dynamically computes Career Score, Next Action, Readiness index, and Timeline milestones.

### Roadmap & LMS
- `GET /api/roadmap`: Returns learning modules and progress variables.
- `PUT /api/roadmap/progress`: Modifies sub-skill progress.
- `GET /api/missions`: Lists challenges.
- `POST /api/missions/complete`: Toggles task completion and triggers score updates.

### Job Tracker
- `GET /api/applications`: Lists applications pipeline.
- `POST /api/applications`: Adds a new application.
- `PUT /api/applications/status`: Promotes interview statuses and handles offer score bonuses.

---

## 5. Career Score Engine

Rather than hardcoding ratings, the score is calculated by the backend by weighting user data parameters:

| Category | Weight | Description |
| :--- | :--- | :--- |
| **Projects** | 20% | Number of projects in the portfolio (max score at 3 projects). |
| **Resume ATS** | 15% | Granted when the resume has been scanned and optimized. |
| **GitHub Sync** | 15% | Granted when code repos and READMEs are indexed. |
| **SkillsDNA** | 15% | Proportional progress up to 7 possessed skills in Career DNA. |
| **Learning Roadmap** | 10% | Average progress across all learning tracks. |
| **Applications** | 10% | Pipeline tracking engagement (max score at 3 entries). |
| **Interview Prep** | 10% | Proportional metrics up to 3 mastered technical questions. |
| **Consistency** | 5% | Streak consistency score (max score at 7-day streak). |

---

## 6. Next Best Action Engine

Evaluates user gaps using a strict dependency hierarchy to recommend the highest-impact action:

1. **Verify Base Artifacts**: If `hasResumeScanned` is false -> recommend **ATS Resume Scan** (+2 impact).
2. **Index Repositories**: If `hasGithubScanned` is false -> recommend **Sync GitHub Portfolio** (+3 impact).
3. **Close Primary Gaps**: If backend mission `m-1` is incomplete -> recommend **Complete JWT Auth Module** (+3 impact).
4. **Polish Weaknesses**: If backend mission `m-2` is incomplete -> recommend **Optimize PostgreSQL Indexing Queries** (+2 impact).
5. **Conduct Mock practice**: Fallback recommendation -> recommend **Conduct AI Mock Interview** (+2 impact).

---

## 7. AI Specialist Router

Client prompts are routed to specific AI assistants, each configured with an isolated system instruction context:

*   **Career Coach**: Explains roadmap dependencies and prioritizes skill gaps.
*   **Resume Specialist**: Provides action verbs (e.g. "Architected") and missing keyword alerts.
*   **Interview Coach**: Simulates behavioral, technical, and system design Q&A loops.
*   **Learning Coach**: Breaks down complex algorithms and generates checkmark code questions.
*   **Project Specialist**: Identifies weak README files, missing deployment configs, and testing suites.
*   **Weekly Report Generator**: Summarizes score progression, streak achievements, and timeline records.
