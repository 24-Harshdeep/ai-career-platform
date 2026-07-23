# CareerOS Next.js Frontend Client Dashboard

This directory houses the frontend user interface for **CareerOS**, built on Next.js 16 (App Router) and Tailwind CSS, and wired to a global Zustand data store.

---

## 📂 Directory Structure

The frontend application code is organized as follows:

```
client/src/
├── app/                  # Next.js App Router Page layouts
│   ├── analytics/        # Executive Analytics Dashboard (benchmarks & curves)
│   ├── applications/     # Job Intelligence Matcher & pipeline tracking
│   ├── coach/            # Contextual AI Chat Coach interface
│   ├── dashboard/        # Main focus actions command board
│   ├── dna/              # Profile Target Roles, Milestones, and Skills Profiles
│   ├── interview/        # Interactive technical mock reviews and transcripts
│   ├── portfolio/        # Git repositories documentation and quality audits
│   ├── resume/           # ATS keywords comparison and resume scoring
│   ├── roadmap/          # Adaptive checkpoints roadmap tracks
│   └── settings/         # AI Preferences and Account control center
├── components/           # Reusable UI & Layout blocks
│   ├── layout/           # Sidebar navigation and desktop frames
│   └── ui/               # Badge, Button, Card, and PoweredBy engines indicators
├── hooks/                # Custom React hooks (useAuth authentication helper)
├── store/                # Zustand global state (careerStore.ts)
└── types/                # Core TypeScript interfaces (index.ts)
```

---

## ⚡ Setup & Development

### 1. Configure Environment Variables
Create a `.env.local` or `.env` file in the `client` directory to point to your backend API server:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### 2. Install Dependencies
Ensure you have run `npm install` inside the client folder:
```bash
npm install
```

### 3. Run Development Server
Start the Next.js server locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

### 4. Build Production Bundle
To compile and optimize the client application for deployment:
```bash
npm run build
```

---

## 🎨 Design Tokens & Theming

The application uses custom design themes declared in global stylesheets, featuring:
- **Glassmorphism panels**: Translucent background colors combined with border-glass variables for a premium SaaS feel.
- **Accents colors**: Deep custom gradients (`--primary` and `--secondary`) matching the dynamic dark-mode system configuration.
- **Typography**: Responsive, clean spacing utilizing sans-serif font families (Geist, Outfit).

---

## 🔄 Global Zustand Store (`careerStore.ts`)

State updates are managed through the central hook [careerStore.ts](file:///home/work/ai-career-platform/client/src/store/careerStore.ts). 
- It handles network synchronization with the Express backend APIs.
- Features automatic local state fallbacks when running in offline/sandbox modes, ensuring the application remains interactive and functional.
- Core actions:
  - `fetchDashboardData()`: Unifies profile progress, streak trackers, and recommendation actions.
  - `updateProfileSettings()`: Saves preferences to MongoDB and forces global re-calculations.
  - `uploadResume()`: Triggers ATS text scans and audits.
  - `syncDeveloperProfile()`: Runs repository audits.
  - `startMockInterview()` / `submitInterviewAnswer()`: Orchestrates mock transcripts.
