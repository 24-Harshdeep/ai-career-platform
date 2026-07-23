# CareerOS — Know Your Next Best Step

**CareerOS** is a comprehensive **AI Career Operating System** designed to continuously observe, analyze, predict, and guide a candidate's complete career journey.

---

## 🎯 Core Motto & Tagline

> **"Know Your Next Best Step."**

Unlike typical platforms that focus on static resume parsing, CareerOS reduces career confusion by constantly computing and recommending the single next highest impact action for the candidate.

---

## 👥 Who Created It
CareerOS was designed and architected by a team of principal AI engineers, senior product designers, and technical career coaches. It is built as a flagship portfolio piece demonstrating how modern LLMs (Google Gemini, OpenAI), reactive client-side stores, and structured fallback algorithms can combine to create a SaaS-grade command center.

---

## 💎 Why Use CareerOS? (The Value Proposition)

Most career management software is highly fragmented:
- **Resume builders** (like Rezi) help you format PDF lines but don't check if your code compiles.
- **Job boards** (like Simplify) help you submit applications but don't prepare you for the coding review.
- **Mock prep sites** (like Interviewing.io) evaluate questions but don't sync with your roadmap.

**CareerOS solves this by building a Unified AI Pipeline.** Every module is connected:
1. Your **Resume scan** detects missing keywords (e.g., Docker).
2. The **Project Auditor** scans your GitHub and finds you have no container configurations.
3. The **Dynamic Roadmap** places a Docker module next on your track list.
4. The **AI Coach** guides you through writing a custom Dockerfile.
5. The **Interview Reviewer** schedules a Docker mock technical review.
6. The **Job Matcher** audits job descriptions to confirm your matching percentage is now optimized.

This closed-loop system ensures you are always doing the most valuable task to maximize your market value.

---

## 🎨 Visual Aesthetics & Layout

CareerOS features a premium, state-of-the-art **Dark Mode Command Center** layout designed to look like a high-end engineering SaaS product:
- **Glassmorphism Panels**: Translucent dark surfaces with subtle glowing borders, utilizing modern HSL tailored colors.
- **Vibrant Indicator Gauges**: Circular match score rings, color-coded health diagnostic dots (Green/Yellow/Red), and interactive progress sliders.
- **Dashboard Charts**: Responsive Area charts showing Career Score progression, radar matrices showing skills distribution, and daily consistency check-in bar graphs.
- **Tabbed Interface Controls**: Stripe-like tabbed navigation panels (especially in Settings and Job Intelligence) to prevent layout clutter.

---

## 🔄 The User Journey Flow

```
   [1. Onboard Profile] ──► [2. Upload Resume] ──► [3. Audit GitHub Repos]
                                                           │
                                                           ▼
   [6. Match Job & Apply] ◄── [5. Mock Interview] ◄── [4. Skill-up Roadmap]
```

1. **Onboarding**: The user configures their target role (e.g. Backend Developer) and experience bracket in settings.
2. **Resume Scan**: Uploads their resume to identify baseline ATS scores and keyword gaps.
3. **Portfolio Sync**: Synces repositories to analyze code quality and structure.
4. **Skills Roadmap**: Completes checkpoints on an adaptive learning roadmap.
5. **Technical Interview**: Practices simulated mock reviews to address conceptual weak spots.
6. **Job Matching**: Paste JDs to check interview probability and tailor cover letters before applying.

---

## 🛠️ Step-by-Step User Guide

### Step 1: Initialize Your Profile
1. Navigate to **Settings** (`/settings`) from the sidebar.
2. Under **Profile & Career**, specify your Target Role (e.g. *DevOps Engineer*), Experience Bracket, Preferred Industry, and Country Locale.
3. Switch to **AI Configuration** and choose your AI Coach Personality (e.g. *Strict Interviewer* or *Encouraging Mentor*) and learning style.
4. Click **Save Preferences**. The central AI Engine immediately recalculates your roadmap track.

### Step 2: Upload Your Resume
1. Navigate to **Resume Intelligence** (`/resume`).
2. Upload your PDF resume file.
3. Review your ATS Score breakdown (Keywords, formatting, action verbs).
4. Note the list of **Missing Keywords** and read the AI suggested rewrites.

### Step 3: Run Repository Audits
1. Navigate to **Portfolio Intelligence** (`/portfolio`).
2. Sync your GitHub username to list your active repositories.
3. Audit your projects to detect missing engineering practices (e.g. missing Dockerfiles, lack of Jest unit tests, or incomplete Readme documentation).

### Step 4: Follow the Next Best Action
1. Navigate to the **Dashboard** (`/`).
2. Read the **Today's Priority** card. It lists your next best action (e.g., *"Build API Authentication"* or *"Complete Resume Upload"*).
3. Follow the study links or complete the roadmap module checkpoints to gain career score points.

### Step 5: Start a Mock Technical Interview
1. Navigate to **Interview Intelligence** (`/interview`).
2. Set your difficulty and click **Start Interview**.
3. Answer the technical questions.
4. Conclude the round and review your detailed scorecard (technical depth, communication, problem solving, code quality) and study recommendations.

### Step 6: Perform Job matching
1. Navigate to **Job Intelligence** (`/applications`).
2. Paste a job description or enter a job spec URL.
3. Review your overall matching probability, missing keywords, and project gaps.
4. Generate a tailored cover letter and submit your application.

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas cloud URI)
- A Google Gemini API Key or OpenAI API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ai-career-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/careeros
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development environment:
   ```bash
   # Start the API backend (in server/)
   npm run dev
   
   # Start the Next.js frontend (in client/)
   npm run dev
   ```

5. Access the dashboard on `http://localhost:3000`.
