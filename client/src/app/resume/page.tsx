"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCareerStore, ResumeVersionContent } from "@/store/careerStore";
import Card from "@/components/ui/Card/Card";
import Button from "@/components/ui/Button/Button";
import Badge from "@/components/ui/Badge/Badge";
import { 
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  FileSearch,
  Sparkles,
  Zap,
  Layout,
  Gauge,
  Printer,
  Download,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Layers,
  Search,
  CheckSquare,
  X,
  Edit3,
  Link as LinkIcon,
  Globe,
  MapPin,
  Calendar,
  UserCheck
} from "lucide-react";
import { PageTransition, StaggerItem } from "@/components/ui/PageTransition";
import PageHeader from "@/components/ui/PageHeader";

type WizardStep = "scan" | "ats" | "review" | "job_match" | "suggestions" | "builder";

export default function ResumePage() {
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const fetchResumeAnalysis = useCareerStore((state) => state.fetchResumeAnalysis);
  const uploadResume = useCareerStore((state) => state.uploadResume);
  const saveResumeEdits = useCareerStore((state) => state.saveResumeEdits);
  const optimizeResume = useCareerStore((state) => state.optimizeResume);
  const reviewChangeLog = useCareerStore((state) => state.reviewChangeLog);
  const applyChangeLogs = useCareerStore((state) => state.applyChangeLogs);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Guided wizard step state machine
  const [wizardStep, setWizardStep] = useState<WizardStep>("scan");

  // File upload & scanning state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");

  // Verified Resume Data State
  const [formState, setFormState] = useState<ResumeVersionContent | null>(null);

  // Change log editing inline state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogText, setEditingLogText] = useState("");

  // Optional Job Description Matching
  const [targetGoal, setTargetGoal] = useState("ATS Optimization");
  const [targetDescription, setTargetDescription] = useState("");
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [jdOptimizationResult, setJdOptimizationResult] = useState<any>(null);

  // Resume Builder Canvas Settings
  const [selectedTemplate, setSelectedTemplate] = useState<"minimal" | "executive">("minimal");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");

  // A4 Page Model & Pagination Indicator
  const previewRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState<number>(1);

  useEffect(() => {
    if (wizardStep === "builder" && previewRef.current) {
      const contentH = previewRef.current.scrollHeight;
      // Standard A4 height at 96 DPI is ~1122.5px
      const pages = Math.max(1, Math.ceil((contentH - 5) / 1122));
      setPageCount(pages);
    }
  }, [formState, selectedTemplate, wizardStep, fontFamily]);

  // Load initial analysis from database on mount
  useEffect(() => {
    fetchResumeAnalysis();
  }, [fetchResumeAnalysis]);

  // Sync state when resumeAnalysis updates
  useEffect(() => {
    if (resumeAnalysis && resumeAnalysis.activeVersionContent) {
      setFormState(JSON.parse(JSON.stringify(resumeAnalysis.activeVersionContent)));
    }
  }, [resumeAnalysis]);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatusText("Uploading document...");

    try {
      setUploadStatusText("Extracting text buffer, PDF annotations & hyperlinks...");
      const success = await uploadResume(file);

      if (success) {
        addNotification("Resume uploaded and parsed successfully! Links & credentials extracted.", "success");
        setWizardStep("ats");
      } else {
        addNotification("Failed to parse resume file. Supported formats: PDF, DOCX, TXT.", "warning");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      addNotification(`Upload failed: ${err.message || "Unknown error"}`, "warning");
    } finally {
      setIsUploading(false);
      setUploadStatusText("");
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handlers for Personal Info & Summary
  const handlePersonalInfoChange = (field: string, val: string) => {
    if (!formState) return;
    setFormState({
      ...formState,
      personalInfo: { ...formState.personalInfo, [field]: val }
    });
  };

  const handleSummaryChange = (val: string) => {
    if (!formState) return;
    setFormState({ ...formState, summary: val });
  };

  // Work Experience Handlers
  const handleWorkChange = (index: number, field: string, val: any) => {
    if (!formState) return;
    const updatedWork = [...formState.workExperience];
    updatedWork[index] = { ...updatedWork[index], [field]: val };
    setFormState({ ...formState, workExperience: updatedWork });
  };

  const addWorkEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      workExperience: [
        ...formState.workExperience,
        {
          company: "Company Name",
          position: "Job Title",
          location: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          description: "",
          bulletPoints: ["Engineered scalable solution using modern technologies."],
          experienceUrl: ""
        }
      ]
    });
  };

  const deleteWorkEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      workExperience: formState.workExperience.filter((_, i) => i !== idx)
    });
  };

  // Education Handlers
  const handleEducationChange = (index: number, field: string, val: any) => {
    if (!formState) return;
    const updatedEdu = [...(formState.education || [])];
    updatedEdu[index] = { ...updatedEdu[index], [field]: val };
    setFormState({ ...formState, education: updatedEdu });
  };

  const addEducationEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      education: [
        ...(formState.education || []),
        {
          institution: "University / Institute Name",
          degree: "Bachelor of Technology",
          fieldOfStudy: "Computer Science & Engineering",
          major: "Computer Science",
          location: "",
          startDate: "",
          endDate: "",
          currentlyStudying: false,
          gpa: "",
          description: "",
          institutionUrl: ""
        }
      ]
    });
  };

  const deleteEducationEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      education: (formState.education || []).filter((_, i) => i !== idx)
    });
  };

  // Project Handlers
  const handleProjectChange = (index: number, field: string, val: any) => {
    if (!formState) return;
    const updatedProjects = [...formState.projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: val };
    setFormState({ ...formState, projects: updatedProjects });
  };

  const addProjectEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      projects: [
        ...formState.projects,
        {
          title: "New Project",
          technologies: [],
          description: "",
          bulletPoints: ["Architected full stack web service."],
          link: "",
          githubUrl: "",
          liveUrl: "",
          startDate: "",
          endDate: ""
        }
      ]
    });
  };

  const deleteProjectEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      projects: formState.projects.filter((_, i) => i !== idx)
    });
  };

  // Skills Handlers
  const handleSkillsChange = (category: string, listStr: string) => {
    if (!formState || !formState.skills) return;
    const arr = listStr.split(",").map(s => s.trim()).filter(Boolean);
    setFormState({
      ...formState,
      skills: { ...formState.skills, [category]: arr }
    });
  };

  // Certification Handlers
  const handleCertificationChange = (index: number, field: string, val: string) => {
    if (!formState) return;
    const updatedCerts = [...(formState.certifications || [])];
    updatedCerts[index] = { ...updatedCerts[index], [field]: val } as any;
    setFormState({ ...formState, certifications: updatedCerts });
  };

  const addCertificationEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      certifications: [
        ...(formState.certifications || []),
        { name: "New Certification", issuer: "", issueDate: "", credentialId: "", credentialUrl: "", evidenceText: "", source: "user", confidence: 100, isRelevant: true }
      ]
    });
  };

  const deleteCertificationEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      certifications: (formState.certifications || []).filter((_, i) => i !== idx)
    });
  };

  // Achievements Handlers
  const handleAchievementChange = (idx: number, val: string) => {
    if (!formState) return;
    const updated = [...(formState.achievements || [])];
    updated[idx] = val;
    setFormState({ ...formState, achievements: updated });
  };

  const addAchievementEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      achievements: [...(formState.achievements || []), "Awarded top performer in regional engineering hackathon."]
    });
  };

  const deleteAchievementEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      achievements: (formState.achievements || []).filter((_, i) => i !== idx)
    });
  };

  // Leadership Handlers
  const handleLeadershipChange = (idx: number, field: string, val: any) => {
    if (!formState) return;
    const updated = [...(formState.leadership || [])];
    updated[idx] = { ...updated[idx], [field]: val } as any;
    setFormState({ ...formState, leadership: updated });
  };

  const addLeadershipEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      leadership: [
        ...(formState.leadership || []),
        { title: "Technical Coordinator", organization: "Computer Society Chapter", location: "", startDate: "", endDate: "", description: "", bulletPoints: ["Coordinated tech symposium for 500+ participants."], url: "" }
      ]
    });
  };

  const deleteLeadershipEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      leadership: (formState.leadership || []).filter((_, i) => i !== idx)
    });
  };

  // Links Handlers
  const handleLinkChange = (idx: number, field: string, val: string) => {
    if (!formState) return;
    const updated = [...(formState.links || [])];
    updated[idx] = { ...updated[idx], [field]: val } as any;
    setFormState({ ...formState, links: updated });
  };

  const addLinkEntry = () => {
    if (!formState) return;
    setFormState({
      ...formState,
      links: [
        ...(formState.links || []),
        { label: "Project Demo Link", url: "https://", type: "project", source: "user" }
      ]
    });
  };

  const deleteLinkEntry = (idx: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      links: (formState.links || []).filter((_, i) => i !== idx)
    });
  };

  const handleSaveVerifiedEdits = async (nextStep: WizardStep = "job_match") => {
    if (!formState) return;
    const success = await saveResumeEdits(formState);
    if (success) {
      addNotification("Verified resume data saved to MongoDB & synced to CareerContext!", "success");
      setWizardStep(nextStep);
    } else {
      addNotification("Failed to save resume edits.", "warning");
    }
  };

  const handleAnalyzeJobDescription = async () => {
    if (!targetDescription.trim()) {
      addNotification("Please paste a job description first or click Skip.", "info");
      return;
    }

    setIsAnalyzingJd(true);
    addNotification("Analyzing resume match against target Job Description...", "info");

    try {
      const result = await optimizeResume(targetGoal, targetDescription);
      if (result) {
        setJdOptimizationResult(result);
        addNotification("Job Description Analysis Complete! AI Improvements generated.", "success");
        setWizardStep("suggestions");
      } else {
        addNotification("Could not complete JD analysis.", "warning");
      }
    } catch (err) {
      console.error("JD Analysis error:", err);
      addNotification("JD analysis failed.", "warning");
    } finally {
      setIsAnalyzingJd(false);
    }
  };

  const handleLogAction = async (logId: string, status: "accepted" | "rejected" | "edited", editedText: string = "") => {
    const ok = await reviewChangeLog(logId, status, editedText);
    if (ok) {
      addNotification(`Change suggestion marked as ${status}.`, "success");
      setEditingLogId(null);
    } else {
      addNotification("Failed to update change log status.", "warning");
    }
  };

  const handleApplyAllChanges = async () => {
    const ok = await applyChangeLogs(targetGoal);
    if (ok) {
      addNotification("Accepted AI improvements applied to active resume!", "success");
      setWizardStep("builder");
    } else {
      addNotification("Failed to apply change logs.", "warning");
    }
  };

  const handlePrint = () => {
    const previewEl = document.getElementById("resume-paper-preview");
    if (!previewEl) {
      window.print();
      return;
    }

    const parent = previewEl.parentNode;
    const sibling = previewEl.nextSibling;

    document.body.classList.add("print-mode-active");
    document.body.appendChild(previewEl);

    setTimeout(() => {
      window.print();
      if (sibling) {
        parent?.insertBefore(previewEl, sibling);
      } else {
        parent?.appendChild(previewEl);
      }
      document.body.classList.remove("print-mode-active");
    }, 50);
  };

  const downloadMarkdown = () => {
    if (!formState) return;
    const md = `# ${formState.personalInfo.name || "Candidate Name"}
${formState.personalInfo.email || ""} | ${formState.personalInfo.phone || ""} | ${formState.personalInfo.location || ""}
GitHub: ${formState.personalInfo.githubUrl || "N/A"} | LinkedIn: ${formState.personalInfo.linkedinUrl || "N/A"} | Portfolio: ${formState.personalInfo.portfolioUrl || "N/A"}

## Professional Summary
${formState.summary || ""}

## Work Experience
${formState.workExperience.map(w => `### ${w.position} - ${w.company}
*${w.startDate || ""} - ${w.endDate || (w.currentlyWorking ? "Present" : "")}* | ${w.location || ""}
${w.experienceUrl ? `Link: ${w.experienceUrl}` : ""}
${(w.bulletPoints || []).map(b => `- ${b}`).join("\n")}`).join("\n\n")}

## Education
${(formState.education || []).map(e => `### ${e.degree} - ${e.institution}
*${e.startDate || ""} - ${e.endDate || ""}* | GPA: ${e.gpa || "N/A"}`).join("\n\n")}

## Projects
${formState.projects.map(p => `### ${p.title} ${p.link ? `(${p.link})` : ""}
Tech: ${(p.technologies || []).join(", ")}
${(p.bulletPoints || []).map(b => `- ${b}`).join("\n")}`).join("\n\n")}

## Skills
- **Languages**: ${(formState.skills.languages || []).join(", ")}
- **Frontend**: ${(formState.skills.frontend || []).join(", ")}
- **Backend**: ${(formState.skills.backend || []).join(", ")}
- **Database**: ${(formState.skills.database || []).join(", ")}
- **Tools**: ${(formState.skills.tools || []).join(", ")}

${(formState.certifications || []).length > 0 ? `## Certifications\n${formState.certifications.map(c => `- ${c.name} (${c.issuer || "N/A"}) ${c.credentialUrl ? `[Credential](${c.credentialUrl})` : ""}`).join("\n")}` : ""}`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(formState.personalInfo.name || "Resume").replace(/\s+/g, "_")}_Resume.md`;
    a.click();
  };

  const fontClass = fontFamily === "serif" ? "font-serif" : (fontFamily === "mono" ? "font-mono" : "font-sans");

  const changeLogsList = resumeAnalysis?.changeLogs || [];
  const pendingLogs = changeLogsList.filter((l: any) => l.status === "pending" || l.status === "edited");

  return (
    <PageTransition className="space-y-6 pb-12 print:p-0 print:m-0">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      {/* Universal A4 Print Engine CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
          }
          body.print-mode-active > *:not(#resume-paper-preview) {
            display: none !important;
          }
          body.print-mode-active #resume-paper-preview {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 12mm 14mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            float: none !important;
          }
        }
      ` }} />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5 print:hidden">
        <StaggerItem className="w-full">
          <PageHeader
            icon={FileText}
            title="Resume Intelligence & Builder"
            description="Guided resume scanning, canonical ATS scoring, URL disambiguation, complete section verification, and ATS-safe PDF export."
          />
        </StaggerItem>

        <div className="flex items-center gap-3 shrink-0">
          <Button type="button" variant="secondary" size="sm" onClick={handleBoxClick} disabled={isUploading}>
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>Upload New Resume</span>
          </Button>
        </div>
      </div>

      {/* 6-STEP GUIDED WIZARD PROGRESS BAR */}
      <div className="bg-card border border-border rounded-2xl p-4 print:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setWizardStep("scan")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              wizardStep === "scan"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                : "border-border/60 text-muted hover:text-foreground"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 1</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <UploadCloud className="w-3.5 h-3.5" /> Resume Scan
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("ats")}
            disabled={!resumeAnalysis}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              wizardStep === "ats"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm cursor-pointer"
                : resumeAnalysis
                ? "border-border/60 text-muted hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted/40 cursor-not-allowed"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 2</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Gauge className="w-3.5 h-3.5" /> ATS Analysis
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("review")}
            disabled={!formState}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              wizardStep === "review"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm cursor-pointer"
                : formState
                ? "border-border/60 text-muted hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted/40 cursor-not-allowed"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 3</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Review & Verify
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("job_match")}
            disabled={!formState}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              wizardStep === "job_match"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm cursor-pointer"
                : formState
                ? "border-border/60 text-muted hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted/40 cursor-not-allowed"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 4</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <FileSearch className="w-3.5 h-3.5" /> Target Job Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("suggestions")}
            disabled={!formState}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              wizardStep === "suggestions"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm cursor-pointer"
                : formState
                ? "border-border/60 text-muted hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted/40 cursor-not-allowed"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 5</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> AI ChangeLog
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("builder")}
            disabled={!formState}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              wizardStep === "builder"
                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm cursor-pointer"
                : formState
                ? "border-border/60 text-muted hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted/40 cursor-not-allowed"
            }`}
          >
            <span className="text-[9px] font-mono uppercase tracking-wider">Step 6</span>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Printer className="w-3.5 h-3.5" /> ATS Builder
            </span>
          </button>
        </div>
      </div>

      {/* STEP 1: RESUME SCAN */}
      {wizardStep === "scan" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-foreground">Upload Your Resume</h3>
              <p className="text-xs text-muted leading-relaxed">
                Supports PDF, DOCX, and TXT files up to 5MB. CareerOS extracts contact info, work experiences, skills, projects, certifications, and embedded hyperlinks.
              </p>
            </div>

            <div
              onClick={handleBoxClick}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-8 cursor-pointer transition-all duration-200 bg-accent/5 hover:bg-accent/10"
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Sparkles className="w-8 h-8 text-primary mx-auto animate-spin" />
                  <p className="text-xs font-bold text-foreground">{uploadStatusText || "Analyzing document..."}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Click to browse or drag and drop resume file</p>
                  <p className="text-[10px] text-muted">PDF • DOCX • TXT (Max 5MB)</p>
                </div>
              )}
            </div>

            {resumeAnalysis && (
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="text-left">
                  <span className="text-xs font-bold text-foreground block">Existing Active Upload: {resumeAnalysis.filename || "resume.pdf"}</span>
                  <span className="text-[10px] text-muted">ATS Score: {resumeAnalysis.atsScore}%</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setWizardStep("review")}>
                  <span>Continue with Existing Data →</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* STEP 2: CANONICAL ATS SCORECARD */}
      {wizardStep === "ats" && resumeAnalysis && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="space-y-1">
                <Badge variant="primary">Canonical ATS Engine</Badge>
                <h3 className="text-xl font-black text-foreground">General ATS Scorecard</h3>
                <p className="text-xs text-muted">Evaluated against target role screening standards without requiring a specific job description.</p>
              </div>

              <div className="flex items-center gap-6 bg-accent/10 border border-border p-4 rounded-2xl">
                <div className="text-center">
                  <span className="text-3xl font-black text-primary">{resumeAnalysis.atsScore}</span>
                  <span className="text-[9px] font-bold text-muted uppercase block">ATS Score</span>
                </div>
                {resumeAnalysis.jobMatchScore && (
                  <div className="text-center border-l border-border pl-6">
                    <span className="text-3xl font-black text-emerald-500">{resumeAnalysis.jobMatchScore}%</span>
                    <span className="text-[9px] font-bold text-muted uppercase block">JD Match Score</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metric Breakdown Bars */}
            {resumeAnalysis.breakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Keyword Match</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.keywords || 70}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.keywords || 70}%` }} />
                  </div>
                </div>

                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Section Completeness</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.completeness || 85}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.completeness || 85}%` }} />
                  </div>
                </div>

                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Project & Evidence Quality</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.evidence || 75}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.evidence || 75}%` }} />
                  </div>
                </div>

                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Action Verbs</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.actionVerbs || 70}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.actionVerbs || 70}%` }} />
                  </div>
                </div>

                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Quantified Impact</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.quantifiedImpact || 60}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.quantifiedImpact || 60}%` }} />
                  </div>
                </div>

                <div className="bg-accent/5 border border-border p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted uppercase text-[10px]">Formatting / Parseability</span>
                    <span className="text-foreground">{resumeAnalysis.breakdown.formatting || 90}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${resumeAnalysis.breakdown.formatting || 90}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Keyword Evidence Classification Table */}
            {resumeAnalysis.missingKeywords && resumeAnalysis.missingKeywords.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Missing & Underrepresented Keywords</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resumeAnalysis.missingKeywords.map((kw: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-accent/5 border border-border rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">{kw.keyword || kw}</span>
                        <Badge variant={kw.category === "supported_but_missing" ? "success" : "warning"} className="text-[9px]">
                          {kw.category === "supported_but_missing" ? "Supported in Text" : "Potential Skill Gap"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed">{kw.reason || "Recommended for target role."}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Button variant="secondary" size="md" onClick={() => setWizardStep("scan")}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Re-scan Document
              </Button>

              <Button variant="primary" size="md" onClick={() => setWizardStep("review")}>
                <span>Proceed to Review & Verify →</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: REVIEW & VERIFY VERIFIED DATA (COMPREHENSIVE ALL-SECTION EDITOR) */}
      {wizardStep === "review" && formState && (
        <div className="space-y-6">
          <Card className="p-6 space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Review & Verify Extracted Resume</h3>
                <p className="text-xs text-muted">Verify all extracted resume sections, contact details, dates, URLs, and skills before proceeding.</p>
              </div>
              <Badge variant="success">All Sections Extracted</Badge>
            </div>

            {/* 1. Personal Info & Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-primary" /> 1. Personal Information & Contact Links
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">Full Name</label>
                  <input
                    type="text"
                    value={formState.personalInfo?.name || ""}
                    onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">Email Address</label>
                  <input
                    type="email"
                    value={formState.personalInfo?.email || ""}
                    onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={formState.personalInfo?.phone || ""}
                    onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">Location (City, State / Country)</label>
                  <input
                    type="text"
                    value={formState.personalInfo?.location || ""}
                    onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={formState.personalInfo?.githubUrl || ""}
                    onChange={(e) => handlePersonalInfoChange("githubUrl", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold block uppercase">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formState.personalInfo?.linkedinUrl || ""}
                    onChange={(e) => handlePersonalInfoChange("linkedinUrl", e.target.value)}
                    className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground focus:border-primary/50"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" /> 2. Professional Summary
              </h4>
              <textarea
                rows={3}
                value={formState.summary || ""}
                onChange={(e) => handleSummaryChange(e.target.value)}
                className="w-full bg-accent/5 border border-border rounded-xl p-3 text-xs text-foreground outline-none resize-y focus:border-primary/50"
                placeholder="Brief high-impact career overview..."
              />
            </div>

            {/* 3. Work Experience */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> 3. Work Experience
                </h4>
                <Button variant="secondary" size="sm" onClick={addWorkEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Experience
                </Button>
              </div>

              {formState.workExperience.map((w, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Position / Job Title</label>
                      <input
                        type="text"
                        value={w.position || ""}
                        onChange={(e) => handleWorkChange(idx, "position", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Company Name</label>
                      <input
                        type="text"
                        value={w.company || ""}
                        onChange={(e) => handleWorkChange(idx, "company", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Location</label>
                      <input
                        type="text"
                        value={w.location || ""}
                        onChange={(e) => handleWorkChange(idx, "location", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. San Francisco, CA or Remote"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Start Date</label>
                      <input
                        type="text"
                        value={w.startDate || ""}
                        onChange={(e) => handleWorkChange(idx, "startDate", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. Jan 2024"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">End Date</label>
                      <input
                        type="text"
                        value={w.endDate || ""}
                        onChange={(e) => handleWorkChange(idx, "endDate", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. Present or Dec 2025"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Experience Link URL</label>
                      <input
                        type="text"
                        value={w.experienceUrl || ""}
                        onChange={(e) => handleWorkChange(idx, "experienceUrl", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="https://company.com..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-[9px] text-muted font-bold block uppercase">Bullet Points (comma separated)</label>
                    <textarea
                      rows={2}
                      value={(w.bulletPoints || []).join("\n")}
                      onChange={(e) => handleWorkChange(idx, "bulletPoints", e.target.value.split("\n").filter(Boolean))}
                      className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground resize-y"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => deleteWorkEntry(idx)} className="text-xs text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Experience
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Education History */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> 4. Education
                </h4>
                <Button variant="secondary" size="sm" onClick={addEducationEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Education
                </Button>
              </div>

              {(formState.education || []).map((e, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Institution / University</label>
                      <input
                        type="text"
                        value={e.institution || ""}
                        onChange={(val) => handleEducationChange(idx, "institution", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Degree</label>
                      <input
                        type="text"
                        value={e.degree || ""}
                        onChange={(val) => handleEducationChange(idx, "degree", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. Bachelor of Science"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Field of Study / Major</label>
                      <input
                        type="text"
                        value={e.fieldOfStudy || e.major || ""}
                        onChange={(val) => handleEducationChange(idx, "fieldOfStudy", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Start Date</label>
                      <input
                        type="text"
                        value={e.startDate || ""}
                        onChange={(val) => handleEducationChange(idx, "startDate", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">End Date</label>
                      <input
                        type="text"
                        value={e.endDate || ""}
                        onChange={(val) => handleEducationChange(idx, "endDate", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">GPA / Grade</label>
                      <input
                        type="text"
                        value={e.gpa || ""}
                        onChange={(val) => handleEducationChange(idx, "gpa", val.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. 3.8 / 4.0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => deleteEducationEntry(idx)} className="text-xs text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Education
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Key Projects */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-primary" /> 5. Key Projects
                </h4>
                <Button variant="secondary" size="sm" onClick={addProjectEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
                </Button>
              </div>

              {formState.projects.map((p, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Project Name</label>
                      <input
                        type="text"
                        value={p.title || ""}
                        onChange={(e) => handleProjectChange(idx, "title", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">GitHub URL</label>
                      <input
                        type="text"
                        value={p.githubUrl || (p.link && p.link.includes("github.com") ? p.link : "") || ""}
                        onChange={(e) => handleProjectChange(idx, "githubUrl", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Live Demo URL</label>
                      <input
                        type="text"
                        value={p.liveUrl || (p.link && !p.link.includes("github.com") ? p.link : "") || ""}
                        onChange={(e) => handleProjectChange(idx, "liveUrl", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="https://myproject.com..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="text-[9px] text-muted font-bold block uppercase">Technologies (comma separated)</label>
                    <input
                      type="text"
                      value={(p.technologies || []).join(", ")}
                      onChange={(e) => handleProjectChange(idx, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                      className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => deleteProjectEntry(idx)} className="text-xs text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Project
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 6. Technical Skills Inventory */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> 6. Technical Skills Inventory
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {["languages", "frontend", "backend", "database", "tools", "other"].map((cat) => (
                  <div key={cat} className="space-y-1">
                    <label className="text-[10px] text-muted font-bold block uppercase">{cat}</label>
                    <input
                      type="text"
                      value={((formState.skills as any)?.[cat] || []).join(", ")}
                      onChange={(e) => handleSkillsChange(cat, e.target.value)}
                      className="w-full bg-accent/5 border border-border rounded-xl p-2.5 outline-none text-foreground"
                      placeholder="Comma separated skills..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Certifications & Credentials */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" /> 7. Certifications & Credentials
                </h4>
                <Button variant="secondary" size="sm" onClick={addCertificationEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Certification
                </Button>
              </div>

              {(formState.certifications || []).map((c, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Certification Name</label>
                      <input
                        type="text"
                        value={c.name || ""}
                        onChange={(e) => handleCertificationChange(idx, "name", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Issuer</label>
                      <input
                        type="text"
                        value={c.issuer || ""}
                        onChange={(e) => handleCertificationChange(idx, "issuer", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="e.g. AWS, Coursera"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Credential URL</label>
                      <input
                        type="text"
                        value={c.credentialUrl || ""}
                        onChange={(e) => handleCertificationChange(idx, "credentialUrl", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => deleteCertificationEntry(idx)} className="text-xs text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Certification
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 8. Achievements & Awards */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" /> 8. Achievements & Honors
                </h4>
                <Button variant="secondary" size="sm" onClick={addAchievementEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Achievement
                </Button>
              </div>

              {(formState.achievements || []).map((ach, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={ach || ""}
                    onChange={(e) => handleAchievementChange(idx, e.target.value)}
                    className="flex-1 bg-accent/5 border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                  />
                  <button onClick={() => deleteAchievementEntry(idx)} className="text-red-400 hover:text-red-500 p-2 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 9. Leadership & Positions of Responsibility */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" /> 9. Leadership & Campus Positions
                </h4>
                <Button variant="secondary" size="sm" onClick={addLeadershipEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Leadership Role
                </Button>
              </div>

              {(formState.leadership || []).map((lead, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-2xl space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Role Title</label>
                      <input
                        type="text"
                        value={lead.title || ""}
                        onChange={(e) => handleLeadershipChange(idx, "title", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted font-bold block uppercase">Organization</label>
                      <input
                        type="text"
                        value={lead.organization || ""}
                        onChange={(e) => handleLeadershipChange(idx, "organization", e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => deleteLeadershipEntry(idx)} className="text-xs text-red-400 hover:text-red-500 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove Leadership Role
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 10. Detected Links Verification Table */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" /> 10. Detected Professional Links Verification
                </h4>
                <Button variant="secondary" size="sm" onClick={addLinkEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                </Button>
              </div>

              {(formState.links || []).map((l, idx) => (
                <div key={idx} className="bg-card border border-border p-3 rounded-xl flex items-center gap-3 text-xs">
                  <input
                    type="text"
                    value={l.label || ""}
                    onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                    placeholder="Label (e.g. GitHub)"
                    className="w-1/3 bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                  />
                  <input
                    type="text"
                    value={l.url || ""}
                    onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                    placeholder="URL (https://...)"
                    className="flex-1 bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                  />
                  <button onClick={() => deleteLinkEntry(idx)} className="text-red-400 hover:text-red-500 p-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Save & Continue */}
            <div className="flex justify-between items-center pt-6 border-t border-border">
              <Button variant="secondary" size="md" onClick={() => setWizardStep("ats")}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to ATS Scorecard
              </Button>
              <Button variant="primary" size="md" onClick={() => handleSaveVerifiedEdits("job_match")}>
                <Check className="w-4 h-4 mr-1.5" /> Save Verified Data & Next →
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: TARGET JOB MATCHING (OPTIONAL) */}
      {wizardStep === "job_match" && formState && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Optional Step</span>
                <h3 className="text-lg font-bold text-foreground mt-1">Target Job Description Matching</h3>
                <p className="text-xs text-muted">Paste a specific Job Description to calculate a role-specific match score and generate targeted AI wording improvements.</p>
              </div>
              <Badge variant="info">Optional</Badge>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Target Job Description</label>
              <textarea
                rows={6}
                value={targetDescription || ""}
                onChange={(e) => setTargetDescription(e.target.value)}
                placeholder="Paste target job specification details here..."
                className="w-full bg-accent/5 border border-border rounded-2xl p-4 text-xs text-foreground outline-none resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleAnalyzeJobDescription}
                disabled={isAnalyzingJd || !targetDescription.trim()}
              >
                <Sparkles className="w-4 h-4 mr-1.5 animate-spin" />
                <span>{isAnalyzingJd ? "Analyzing Match..." : "Analyze Job Match & Generate ChangeLogs"}</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setWizardStep("suggestions")}
              >
                <span>Skip for Now → Proceed to AI ChangeLog</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 5: AI IMPROVEMENTS / CHANGELOG REVIEW */}
      {wizardStep === "suggestions" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">AI ChangeLog & Wording Improvements</h3>
                <p className="text-xs text-muted">Review, Accept, Edit, or Reject proposed AI resume enhancements. Accepted changes will modify your active resume and recalculate your ATS score.</p>
              </div>
              <Badge variant="primary">{pendingLogs.length} Suggestions Pending</Badge>
            </div>

            {pendingLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted border border-dashed border-border rounded-2xl bg-accent/5 space-y-4">
                <p>
                  No pending AI suggestions available. Click <strong>Analyze Job Match</strong> in Step 4 to generate target-specific change suggestions or proceed directly to the Resume Builder.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="secondary" size="md" onClick={() => setWizardStep("job_match")}>
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Job Match
                  </Button>
                  <Button variant="primary" size="md" onClick={() => setWizardStep("builder")}>
                    <span>Proceed to Resume Builder →</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLogs.map((log: any) => (
                  <div key={log._id} className="p-4 bg-card border border-border rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-primary uppercase tracking-wider text-[10px]">{log.section || "Work Experience"}</span>
                      <Badge variant={log.status === "accepted" ? "success" : log.status === "edited" ? "info" : "muted"}>
                        {log.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <span className="text-[9px] font-bold text-red-400 uppercase block">Original Text</span>
                        <p className="text-foreground/80 mt-0.5">{log.originalText}</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase block">AI Proposed Enhancement</span>
                        {editingLogId === log._id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              rows={2}
                              value={editingLogText || ""}
                              onChange={(e) => setEditingLogText(e.target.value)}
                              className="w-full bg-accent/10 border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setEditingLogId(null)}>Cancel</Button>
                              <Button variant="primary" size="sm" onClick={() => handleLogAction(log._id, "edited", editingLogText)}>Save Edit</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-foreground mt-0.5">{log.editedText || log.rewrittenText}</p>
                        )}
                      </div>

                      <p className="text-[10px] text-muted italic">Reason: {log.reason}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                      <Button variant="secondary" size="sm" onClick={() => handleLogAction(log._id, "rejected")}>
                        <X className="w-3.5 h-3.5 mr-1 text-red-400" /> Reject
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingLogId(log._id);
                          setEditingLogText(log.editedText || log.rewrittenText);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Custom Edit
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleLogAction(log._id, "accepted")}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Accept Suggestion
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                  <Button variant="secondary" size="md" onClick={() => setWizardStep("job_match")}>
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Job Match
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button variant="primary" size="md" onClick={handleApplyAllChanges}>
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Apply Accepted Changes
                    </Button>
                    <Button variant="primary" size="md" onClick={() => setWizardStep("builder")}>
                      <span>Next: Resume Builder →</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* STEP 6: RESUME BUILDER & EXPORT */}
      {wizardStep === "builder" && formState && (
        <div className="space-y-6">
          {/* Builder Control Bar */}
          <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-muted uppercase">Template:</span>
              <button
                onClick={() => setSelectedTemplate("minimal")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedTemplate === "minimal"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card border-border text-muted hover:text-foreground"
                }`}
              >
                Minimal ATS (1-Column Linear)
              </button>
              <button
                onClick={() => setSelectedTemplate("executive")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedTemplate === "executive"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card border-border text-muted hover:text-foreground"
                }`}
              >
                Executive ATS (1-Column Classic)
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-border text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Doc Size: {pageCount} A4 {pageCount === 1 ? "Page" : "Pages"}</span>
                <Badge variant={pageCount === 1 ? "success" : "info"} className="text-[10px]">
                  {pageCount === 1 ? "Fits 1 Page" : "2 Page PDF"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={downloadMarkdown}>
                <Download className="w-3.5 h-3.5 mr-1" /> Markdown
              </Button>

              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Download ATS PDF
              </Button>
            </div>
          </Card>

          {/* Interactive Document Preview (Strict 210mm A4 Canvas - Centered) */}
          <div className="w-full overflow-x-auto py-8 sm:py-12 flex items-center justify-center print:p-0 print:m-0 print:overflow-visible min-h-[calc(100vh-250px)]">
            <div
              ref={previewRef}
              id="resume-paper-preview"
              className="w-[210mm] min-h-[297mm] bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-sm px-[14mm] py-[12mm] box-sizing-border relative print:shadow-none print:border-none print:p-0 print:m-0"
            >
              {/* Page Break Guide Line on screen preview */}
              {pageCount > 1 && (
                <div className="absolute left-0 right-0 top-[297mm] border-b-2 border-dashed border-red-500/50 pointer-events-none print:hidden flex items-center justify-end pr-4">
                  <span className="bg-red-500 text-white text-[9px] font-mono px-2 py-0.5 rounded-b shadow-sm uppercase tracking-wider">
                    A4 Page 1 Boundary
                  </span>
                </div>
              )}
              <div className={`space-y-4 text-sm ${fontClass}`}>
              {/* Document Header */}
              <div className={`border-b pb-4 ${selectedTemplate === "executive" ? "border-slate-800 text-center" : "border-slate-300"}`}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{formState.personalInfo?.name || "Candidate Name"}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2">
                  {formState.personalInfo?.email && <span>{formState.personalInfo.email}</span>}
                  {formState.personalInfo?.phone && <span>• {formState.personalInfo.phone}</span>}
                  {formState.personalInfo?.location && <span>• {formState.personalInfo.location}</span>}
                  {formState.personalInfo?.linkedinUrl && (
                    <span>• <a href={formState.personalInfo.linkedinUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">LinkedIn</a></span>
                  )}
                  {formState.personalInfo?.githubUrl && (
                    <span>• <a href={formState.personalInfo.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">GitHub</a></span>
                  )}
                  {formState.personalInfo?.portfolioUrl && (
                    <span>• <a href={formState.personalInfo.portfolioUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Portfolio</a></span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {formState.summary && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Professional Summary</h2>
                  <p className="text-xs text-slate-700 leading-relaxed pt-1">{formState.summary}</p>
                </div>
              )}

              {/* Work Experience */}
              {formState.workExperience && formState.workExperience.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Work Experience</h2>
                  {formState.workExperience.map((w, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                        <span>{w.position} — <span className="font-semibold text-slate-700">{w.company}</span></span>
                        <span className="text-[11px] font-normal text-slate-600">{w.startDate} {w.endDate ? `- ${w.endDate}` : (w.currentlyWorking ? "- Present" : "")}</span>
                      </div>
                      {w.bulletPoints && w.bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-0.5">
                          {w.bulletPoints.map((bullet, bIdx) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {formState.education && formState.education.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Education</h2>
                  {formState.education.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-baseline text-xs text-slate-700">
                      <div>
                        <strong className="font-semibold text-slate-900">{e.degree}</strong> {e.fieldOfStudy || e.major ? `in ${e.fieldOfStudy || e.major}` : ""} — {e.institution}
                      </div>
                      <span className="text-[11px] text-slate-600">{e.startDate} {e.endDate ? `- ${e.endDate}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {formState.projects && formState.projects.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Key Projects</h2>
                  {formState.projects.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                        <span>
                          {p.title}
                          {(p.githubUrl || p.link?.includes("github.com")) && (
                            <a href={p.githubUrl || p.link} target="_blank" rel="noreferrer" className="ml-2 font-normal text-indigo-600 hover:underline">
                              [GitHub]
                            </a>
                          )}
                          {(p.liveUrl || (p.link && !p.link.includes("github.com"))) && (
                            <a href={p.liveUrl || p.link} target="_blank" rel="noreferrer" className="ml-2 font-normal text-indigo-600 hover:underline">
                              [Live Demo]
                            </a>
                          )}
                        </span>
                        {p.technologies && p.technologies.length > 0 && (
                          <span className="text-[11px] font-normal text-slate-600">{p.technologies.join(", ")}</span>
                        )}
                      </div>
                      {p.bulletPoints && p.bulletPoints.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                          {p.bulletPoints.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {formState.skills && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Technical Skills</h2>
                  <div className="text-xs text-slate-700 space-y-1">
                    {formState.skills.languages?.length > 0 && (
                      <div><strong className="font-semibold text-slate-900">Languages:</strong> {formState.skills.languages.join(", ")}</div>
                    )}
                    {formState.skills.frontend?.length > 0 && (
                      <div><strong className="font-semibold text-slate-900">Frontend:</strong> {formState.skills.frontend.join(", ")}</div>
                    )}
                    {formState.skills.backend?.length > 0 && (
                      <div><strong className="font-semibold text-slate-900">Backend:</strong> {formState.skills.backend.join(", ")}</div>
                    )}
                    {formState.skills.database?.length > 0 && (
                      <div><strong className="font-semibold text-slate-900">Database:</strong> {formState.skills.database.join(", ")}</div>
                    )}
                    {formState.skills.tools?.length > 0 && (
                      <div><strong className="font-semibold text-slate-900">Tools:</strong> {formState.skills.tools.join(", ")}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {formState.certifications && formState.certifications.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1">Certifications & Credentials</h2>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {formState.certifications.map((c, idx) => (
                      <li key={idx}>
                        <strong className="font-semibold text-slate-900">{c.name}</strong> {c.issuer ? `— ${c.issuer}` : ""}
                        {c.credentialUrl && (
                          <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline">
                            [Credential URL]
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </PageTransition>
  );
}
