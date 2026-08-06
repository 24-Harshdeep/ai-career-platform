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
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  BookOpen,
  GitBranch,
  Settings,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldCheck,
  Check,
  Copy,
  ArrowRight,
  ListFilter
} from "lucide-react";
import PoweredBy from "@/components/ui/PoweredBy";

type WizardStep = "upload" | "review" | "analysis" | "generating" | "editor";

export default function ResumePage() {
  const resumeAnalysis = useCareerStore((state) => state.resumeAnalysis);
  const fetchResumeAnalysis = useCareerStore((state) => state.fetchResumeAnalysis);
  const uploadResume = useCareerStore((state) => state.uploadResume);
  const saveResumeEdits = useCareerStore((state) => state.saveResumeEdits);
  const forkResumeVersion = useCareerStore((state) => state.forkResumeVersion);
  const restoreResumeVersion = useCareerStore((state) => state.restoreResumeVersion);
  const getCrossSyncSuggestions = useCareerStore((state) => state.getCrossSyncSuggestions);
  const optimizeResume = useCareerStore((state) => state.optimizeResume);
  const addNotification = useCareerStore((state) => state.addNotification);

  // Wizard state machine
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  
  // File pick references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Form editable states
  const [formState, setFormState] = useState<ResumeVersionContent | null>(null);
  const [editorTab, setEditorTab] = useState<"summary" | "work" | "projects" | "skills" | "education" | "achievements" | "certifications" | "cover">("summary");

  // Advanced customization toggle (collapsible advanced panel)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optimization targets
  const [targetGoal, setTargetGoal] = useState("ATS Optimization");
  const [targetDescription, setTargetDescription] = useState("");
  const [forkTitle, setForkTitle] = useState("");
  const [showForkModal, setShowForkModal] = useState(false);

  // Canvas Styles (Canva customizations)
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [canvasFont, setCanvasFont] = useState("sans"); // sans, serif, mono
  const [canvasSpacing, setCanvasSpacing] = useState("normal"); // tight, normal, loose
  const [canvasMargin, setCanvasMargin] = useState("normal"); // tight, normal, wide
  const [canvasColor, setCanvasColor] = useState("indigo"); // indigo, emerald, amber, slate
  const [canvasSize, setCanvasSize] = useState("a4"); // a4, letter

  // Cross sync and fact check states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [factCheckList, setFactCheckList] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Wizard generating steps simulation list
  const [genPhase, setGenPhase] = useState(0);

  // Load initial analysis from database on mount
  useEffect(() => {
    fetchResumeAnalysis();
  }, [fetchResumeAnalysis]);

  // Handle routing step based on resume analysis load state
  useEffect(() => {
    if (resumeAnalysis) {
      // If we already have a customized/optimized version, jump straight to editor
      if (resumeAnalysis.activeVersionId > 1) {
        setWizardStep("editor");
      } else {
        // If it's a raw parse and user hasn't confirmed it yet, show the review step
        setWizardStep("review");
      }
      setFormState(JSON.parse(JSON.stringify(resumeAnalysis.activeVersionContent)));
      loadCrossSync();
    } else {
      setWizardStep("upload");
    }
  }, [resumeAnalysis]);

  const loadCrossSync = async () => {
    setLoadingSuggestions(true);
    const data = await getCrossSyncSuggestions();
    setSuggestions(data || []);
    setLoadingSuggestions(false);
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWizardStep("upload");
    setScanProgress(0);

    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanProgress(100);

        try {
          const success = await uploadResume(file);
          if (success) {
            addNotification("Resume uploaded and parsed successfully!", "success");
          } else {
            setWizardStep("upload");
            addNotification("Failed to analyze resume. Make sure it is a valid PDF.", "warning");
          }
        } catch (err) {
          console.error(err);
          setWizardStep("upload");
          addNotification("Upload failed.", "warning");
        }
      } else {
        setScanProgress(currentProgress);
      }
    }, 150);
  };

  const proceedToAnalysisStep = async () => {
    if (formState) {
      await saveResumeEdits(formState);
      setWizardStep("analysis");
      addNotification("Parsed structure verified!", "success");
    }
  };

  const triggerWizardOptimization = async () => {
    setWizardStep("generating");
    setGenPhase(0);

    // Simulate progress check logs for magical look
    const phaseInt = setInterval(() => {
      setGenPhase(prev => Math.min(prev + 1, 5));
    }, 900);

    const result = await optimizeResume(targetGoal, targetDescription);
    clearInterval(phaseInt);

    if (result) {
      addNotification(`AI Optimization Complete! Created Version ${result.activeVersionId}.`, "success");
      if (result.unquantifiedStatements && result.unquantifiedStatements.length > 0) {
        setFactCheckList(result.unquantifiedStatements);
      }
      setWizardStep("editor");
    } else {
      setWizardStep("analysis");
      addNotification("AI Optimization call failed. Please check credentials.", "warning");
    }
  };

  // Form value change handlers
  const handlePersonalInfoChange = (field: string, val: string) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.personalInfo = { ...updated.personalInfo, [field]: val };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const handleSummaryChange = (val: string) => {
    if (!formState) return;
    const updated = { ...formState, summary: val };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const handleWorkChange = (index: number, field: string, val: any) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.workExperience[index] = { ...updated.workExperience[index], [field]: val };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const handleProjectChange = (index: number, field: string, val: any) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.projects[index] = { ...updated.projects[index], [field]: val };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const handleSkillsChange = (category: string, listStr: string) => {
    if (!formState) return;
    const updated = { ...formState };
    const arr = listStr.split(",").map(s => s.trim()).filter(Boolean);
    updated.skills = { ...updated.skills, [category]: arr };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const handleEducationChange = (index: number, field: string, val: string) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.education[index] = { ...updated.education[index], [field]: val };
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const addWorkEntry = () => {
    if (!formState) return;
    const updated = { ...formState };
    updated.workExperience.push({
      company: "New Company",
      position: "Role Title",
      location: "Remote",
      startDate: "",
      endDate: "",
      description: "",
      bulletPoints: ["Accomplished target milestone."]
    });
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const deleteWorkEntry = (idx: number) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.workExperience.splice(idx, 1);
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const addProjectEntry = () => {
    if (!formState) return;
    const updated = { ...formState };
    updated.projects.push({
      title: "New Project",
      technologies: [],
      description: "",
      bulletPoints: ["Implemented core features."],
      link: ""
    });
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const deleteProjectEntry = (idx: number) => {
    if (!formState) return;
    const updated = { ...formState };
    updated.projects.splice(idx, 1);
    setFormState(updated);
    saveResumeEdits(updated);
  };

  const triggerRewriteBullet = async (sectionType: "work" | "project", index: number, bulletIdx: number) => {
    if (!formState) return;
    const textToRewrite = sectionType === "work" 
      ? formState.workExperience[index].bulletPoints[bulletIdx]
      : formState.projects[index].bulletPoints[bulletIdx];
      
    addNotification("AI is rewriting bullet point...", "info");
    
    const prompt = `Rewrite this single resume bullet point for a developer targeting ${targetGoal}. Use a strong action verb, emphasize tech, keep it 100% factual.
Bullet: "${textToRewrite}"
Respond with only the rewritten text, no commentary.`;
    
    try {
      const token = localStorage.getItem("careeros_token");
      const res = await fetch(`/api/interview/hints`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question: prompt })
      });
      if (res.ok) {
        const payload = await res.json();
        const rewrittenText = payload.data?.hint || payload.data;
        
        const updated = { ...formState };
        if (sectionType === "work") {
          updated.workExperience[index].bulletPoints[bulletIdx] = rewrittenText;
        } else {
          updated.projects[index].bulletPoints[bulletIdx] = rewrittenText;
        }
        setFormState(updated);
        saveResumeEdits(updated);
        addNotification("Bullet point optimized!", "success");
      }
    } catch (e) {
      addNotification("Could not contact rewrite agent.", "warning");
    }
  };

  const applyCrossSyncItem = (item: any) => {
    if (!formState) return;
    const updated = { ...formState };

    if (item.action === "add_skill") {
      const category = item.data.category as keyof typeof formState.skills;
      const skillName = item.data.skill;
      if (!updated.skills[category].includes(skillName)) {
        updated.skills[category].push(skillName);
        addNotification(`Added verified skill "${skillName}" to ${category}!`, "success");
      }
    } else if (item.action === "add_project") {
      updated.projects.push({
        title: item.data.title,
        technologies: item.data.technologies,
        description: item.data.description,
        bulletPoints: ["Configured live repository structure and deployment pipelines."],
        link: item.data.link
      });
      addNotification(`Added project "${item.data.title}" to resume!`, "success");
    }

    setFormState(updated);
    saveResumeEdits(updated);
    setSuggestions(suggestions.filter(s => s.title !== item.title));
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
    const md = `# ${formState.personalInfo.name}
${formState.personalInfo.email} | ${formState.personalInfo.phone} | ${formState.personalInfo.location}
GitHub: ${formState.personalInfo.githubUrl} | LinkedIn: ${formState.personalInfo.linkedinUrl}

## Summary
${formState.summary}

## Work Experience
${formState.workExperience.map(w => `### ${w.position} - ${w.company}
*${w.startDate} - ${w.endDate}*
${w.bulletPoints.map(b => `- ${b}`).join("\n")}`).join("\n\n")}

## Projects
${formState.projects.map(p => `### ${p.title} (${p.technologies.join(", ")})
${p.bulletPoints.map(b => `- ${b}`).join("\n")}`).join("\n\n")}

## Skills
- **Languages**: ${formState.skills.languages.join(", ")}
- **Frontend**: ${formState.skills.frontend.join(", ")}
- **Backend**: ${formState.skills.backend.join(", ")}
- **Database**: ${formState.skills.database.join(", ")}
- **Tools**: ${formState.skills.tools.join(", ")}

${formState.certifications?.length > 0 ? `## Certifications\n${formState.certifications.map(c => `- ${c}`).join("\n")}` : ""}`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formState.personalInfo.name.replace(/\s+/g, "_")}_Resume.md`;
    a.click();
  };

  const handleVersionChange = async (vNum: number) => {
    addNotification(`Restoring Version ${vNum}...`, "info");
    await restoreResumeVersion(vNum);
    addNotification(`Version ${vNum} restored!`, "success");
  };

  const handleFork = async () => {
    if (!forkTitle) return;
    await forkResumeVersion(forkTitle, targetGoal);
    setShowForkModal(false);
    setForkTitle("");
    addNotification("New resume version snapshot created!", "success");
  };

  // Layout Styles mappings
  const fontClass = canvasFont === "serif" ? "font-serif" : (canvasFont === "mono" ? "font-mono" : "font-sans");
  const spacingClass = canvasSpacing === "tight" ? "leading-tight space-y-2" : (canvasSpacing === "loose" ? "leading-relaxed space-y-4" : "leading-normal space-y-3");
  const marginClass = canvasMargin === "tight" ? "p-8" : (canvasMargin === "wide" ? "p-16" : "p-12");
  const colorHex = canvasColor === "emerald" ? "text-emerald-600 border-emerald-600" : (canvasColor === "amber" ? "text-amber-600 border-amber-600" : (canvasColor === "slate" ? "text-slate-700 border-slate-700" : "text-primary border-primary"));

  return (
    <div className="space-y-6 animate-fade-in-up pb-12 print:p-0 print:m-0">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt"
        className="hidden"
      />

      {/* CSS Stylesheet to override margins and hide headers during browser print downloads */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0 !important;
          }

          /* Hide all other direct children of body during print mode */
          body.print-mode-active > * {
            display: none !important;
          }

          /* Force body scroll parameters */
          body.print-mode-active {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          /* Render the active preview element in isolation */
          body.print-mode-active > #resume-paper-preview {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 8.5in !important; /* Standard US Letter width */
            height: 11in !important; /* Standard US Letter height */
            padding: 0.75in !important; /* Premium document margins */
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Header and Sync Control bar (Hidden during print) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-border/60 pb-5 print-hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">CareerOS Resume Intelligence</h2>
            <p className="text-xs text-muted">Linear optimization wizard, factual AI bullet auditing, and Canvas page rendering.</p>
          </div>
        </div>

        {wizardStep !== "upload" && wizardStep !== "generating" && (
          <div className="flex items-center gap-3 print-hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBoxClick}
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              <span>Upload New PDF</span>
            </Button>
          </div>
        )}
      </div>

      {/* STEP 1: UPLOAD RESUME */}
      {wizardStep === "upload" && (
        <Card className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 mt-12">
          <div className="p-4 bg-primary/10 text-primary rounded-full">
            <UploadCloud className="w-12 h-12 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Upload your Resume</h3>
            <p className="text-xs text-muted mt-2 max-w-sm">
              Upload your raw resume document (PDF / TXT) to evaluate your current ATS Score and prepare for single-click AI optimization.
            </p>
          </div>

          {scanProgress === 0 ? (
            <Button variant="primary" size="md" onClick={handleBoxClick}>
              Select PDF File
            </Button>
          ) : (
            <div className="w-full space-y-2 max-w-xs">
              <div className="flex justify-between text-[10px] font-bold text-muted">
                <span>Scanning document structure...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: REVIEW & CONFIRM PARSED STRUCTURE */}
      {wizardStep === "review" && formState && (
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Review & Verify Parsed Resume</h3>
              </div>
              <Badge variant="success">Raw Extract Check</Badge>
            </div>
            
            <p className="text-xs text-muted leading-relaxed">
              We parsed your resume. To keep the AI honest and prevent hallucinations, please look over the sections below. Check dates, delete any parsing garbage (e.g. contact details read as companies), and click confirm.
              {" "}Wrong file? <button type="button" onClick={handleBoxClick} className="text-primary hover:underline font-bold cursor-pointer">Click here to upload a different PDF/TXT file</button>
            </p>

            {/* Personal Info Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-accent/5 p-4 border border-border rounded-2xl text-xs">
              <div className="col-span-1 md:col-span-2 font-bold text-foreground mb-1">Contact Headers</div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase font-bold block">Name</label>
                <input
                  type="text"
                  value={formState.personalInfo.name || ""}
                  onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 outline-none text-foreground text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase font-bold block">Email</label>
                <input
                  type="text"
                  value={formState.personalInfo.email || ""}
                  onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 outline-none text-foreground text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase font-bold block">Phone</label>
                <input
                  type="text"
                  value={formState.personalInfo.phone || ""}
                  onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 outline-none text-foreground text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted uppercase font-bold block">Location</label>
                <input
                  type="text"
                  value={formState.personalInfo.location || ""}
                  onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 outline-none text-foreground text-xs"
                />
              </div>
            </div>

            {/* Parsed Work Experience List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-muted uppercase">Parsed Work Experience ({formState.workExperience.length})</span>
                <Button variant="secondary" size="sm" onClick={addWorkEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Position
                </Button>
              </div>

              {formState.workExperience.length === 0 ? (
                <div className="text-center py-4 bg-accent/5 rounded-2xl text-xs text-muted">No experience entries found.</div>
              ) : (
                <div className="space-y-3">
                  {formState.workExperience.map((w, idx) => (
                    <div key={idx} className="bg-card border border-border p-4 rounded-2xl flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted uppercase font-bold block">Company</label>
                          <input
                            type="text"
                            value={w.company || ""}
                            onChange={(e) => handleWorkChange(idx, "company", e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted uppercase font-bold block">Role / Position</label>
                          <input
                            type="text"
                            value={w.position || ""}
                            onChange={(e) => handleWorkChange(idx, "position", e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted uppercase font-bold block">Start Date</label>
                          <input
                            type="text"
                            placeholder="e.g. 2024"
                            value={w.startDate || ""}
                            onChange={(e) => handleWorkChange(idx, "startDate", e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted uppercase font-bold block">End Date</label>
                          <input
                            type="text"
                            placeholder="e.g. Present"
                            value={w.endDate || ""}
                            onChange={(e) => handleWorkChange(idx, "endDate", e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteWorkEntry(idx)}
                        className="p-2 text-red-400 hover:text-red-500 bg-red-400/10 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parsed Projects List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-muted uppercase">Parsed Projects ({formState.projects.length})</span>
                <Button variant="secondary" size="sm" onClick={addProjectEntry}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
                </Button>
              </div>

              {formState.projects.length === 0 ? (
                <div className="text-center py-4 bg-accent/5 rounded-2xl text-xs text-muted">No projects found.</div>
              ) : (
                <div className="space-y-3">
                  {formState.projects.map((p, idx) => (
                    <div key={idx} className="bg-card border border-border p-4 rounded-2xl flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted uppercase font-bold block">Project Title</label>
                          <input
                            type="text"
                            value={p.title || ""}
                            onChange={(e) => handleProjectChange(idx, "title", e.target.value)}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] text-muted uppercase font-bold block">Technologies (comma separated)</label>
                          <input
                            type="text"
                            value={p.technologies?.join(", ") || ""}
                            onChange={(e) => {
                              const arr = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                              handleProjectChange(idx, "technologies", arr);
                            }}
                            className="w-full bg-accent/5 border border-border rounded-lg p-2 outline-none text-foreground"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteProjectEntry(idx)}
                        className="p-2 text-red-400 hover:text-red-500 bg-red-400/10 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications and Courses */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Parsed Certifications</span>
              <div className="bg-accent/5 p-4 border border-border rounded-2xl space-y-2">
                {formState.certifications?.map((c, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-card p-2 border border-border rounded-xl">
                    <input
                      type="text"
                      value={c || ""}
                      onChange={(e) => {
                        const updated = { ...formState };
                        updated.certifications[idx] = e.target.value;
                        setFormState(updated);
                      }}
                      className="flex-1 bg-transparent border-none text-xs text-foreground outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = { ...formState };
                        updated.certifications.splice(idx, 1);
                        setFormState(updated);
                      }}
                      className="text-red-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const updated = { ...formState };
                    if (!updated.certifications) updated.certifications = [];
                    updated.certifications.push("New Certificate Course");
                    setFormState(updated);
                  }}
                  className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Plus className="w-4 h-4" /> Add Certification
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full font-bold text-xs"
              onClick={proceedToAnalysisStep}
            >
              <span>Confirm & Proceed to ATS Analysis</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Card>
        </div>
      )}

      {/* STEP 3: ATS ANALYSIS (ORIGINAL) */}
      {wizardStep === "analysis" && resumeAnalysis && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 text-center space-y-6">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Your Verified ATS Rating</h3>

            {/* ATS Score Ring */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-border fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-red-500 fill-transparent transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 - (resumeAnalysis.atsScore / 100) * (2 * Math.PI * 56)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-foreground">{resumeAnalysis.atsScore}%</span>
                <span className="text-[10px] text-red-400 font-bold mt-0.5">Needs Work</span>
              </div>
            </div>

            {/* Checklist of what is missing */}
            <div className="text-left bg-accent/5 border border-border p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-foreground">Scanning Gaps Checklist:</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Missing core target keywords in skills directory.</span>
                </li>
                <li className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Unquantified experience achievements (missing metric stats).</span>
                </li>
                <li className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Weak verbs usage in project descriptions.</span>
                </li>
              </ul>
            </div>

            {/* Target inputs and Optimization trigger */}
            <div className="border-t border-border pt-6 space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase block">Target Strategy</label>
                  <select
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="w-full bg-card border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
                  >
                    <option value="ATS Optimization">ATS Optimization</option>
                    <option value="FAANG Optimization">FAANG Optimization</option>
                    <option value="Startup Optimization">Startup Optimization</option>
                    <option value="Remote Jobs">Remote Jobs</option>
                    <option value="Senior Roles">Senior / Lead Roles</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-muted font-bold uppercase block">Target Job Description (for custom tailoring & matching)</label>
                  <textarea
                    value={targetDescription}
                    onChange={(e) => setTargetDescription(e.target.value)}
                    placeholder="Paste the full job requirements text or target role details here to tailor your resume & generate matching cover letters..."
                    rows={4}
                    className="w-full bg-card border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50 custom-scrollbar resize-none"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full font-bold text-xs"
                onClick={triggerWizardOptimization}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Optimize Resume Content</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: AI OPTIMIZING PROGRESS (LOADING STATE) */}
      {wizardStep === "generating" && (
        <Card className="p-8 max-w-lg mx-auto text-center space-y-6 mt-12">
          <div className="flex justify-center">
            <Cpu className="w-12 h-12 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Generating Optimized Resume...</h3>
            <p className="text-xs text-muted mt-2">
              CareerOS is restructuring your experiences and resolving ATS grading loops.
            </p>
          </div>

          <div className="text-left space-y-2 bg-accent/5 p-4 border border-border rounded-2xl max-w-sm mx-auto text-xs">
            <div className="flex items-center space-x-2 text-success font-semibold">
              <Check className="w-4 h-4" />
              <span>Checking synced GitHub language matrices</span>
            </div>
            <div className="flex items-center space-x-2 text-success font-semibold">
              <Check className="w-4 h-4" />
              <span>Analyzing portfolio audits and active links</span>
            </div>
            <div className="flex items-center space-x-2 text-success font-semibold">
              <Check className="w-4 h-4" />
              <span>Rewriting summary targeting {targetGoal}</span>
            </div>
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              {genPhase >= 3 ? <Check className="w-4 h-4 text-success" /> : <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
              <span>Structuring bullet points and action verbs</span>
            </div>
            <div className="flex items-center space-x-2 text-muted">
              {genPhase >= 4 ? <Check className="w-4 h-4 text-success" /> : (genPhase === 3 ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" /> : <div className="w-4 h-4 border-2 border-border rounded-full shrink-0" />)}
              <span>Validating factual metrics checks</span>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: EDITABLE WORKSPACE AND PREVIEW CANVAS */}
      {wizardStep === "editor" && resumeAnalysis && (
        <div className="space-y-6">
          
          {/* Collapsible Advanced Customization Section */}
          <div className="print-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between bg-accent/15 border border-border rounded-2xl p-4 text-xs font-bold text-foreground cursor-pointer hover:bg-accent/25 transition-colors duration-150"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-primary" />
                <span>⚙ Customize Page Layout & Snapshots (Advanced Settings)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-card border border-border p-5 rounded-2xl text-xs space-y-2 animate-fade-in-up">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-muted text-[10px] uppercase font-bold">Font Family</span>
                      <select
                        value={canvasFont}
                        onChange={(e) => setCanvasFont(e.target.value)}
                        className="w-full bg-accent/15 border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                      >
                        <option value="sans">Inter (Sans)</option>
                        <option value="serif">Playfair (Serif)</option>
                        <option value="mono">JetBrains (Mono)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted text-[10px] uppercase font-bold">Line Spacing</span>
                      <select
                        value={canvasSpacing}
                        onChange={(e) => setCanvasSpacing(e.target.value)}
                        className="w-full bg-accent/15 border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                      >
                        <option value="tight">Compact</option>
                        <option value="normal">Normal</option>
                        <option value="loose">Relaxed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-muted text-[10px] uppercase font-bold">Document Margins</span>
                      <select
                        value={canvasMargin}
                        onChange={(e) => setCanvasMargin(e.target.value)}
                        className="w-full bg-accent/15 border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                      >
                        <option value="tight">Compact</option>
                        <option value="normal">Normal</option>
                        <option value="wide">Wide</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted text-[10px] uppercase font-bold">Theme Style</span>
                      <div className="flex space-x-1 pt-2">
                        {["indigo", "emerald", "amber", "slate"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setCanvasColor(c)}
                            className={`w-6 h-6 rounded-full border border-border cursor-pointer ${
                              c === "indigo" ? "bg-indigo-500" : (c === "emerald" ? "bg-emerald-500" : (c === "amber" ? "bg-amber-500" : "bg-slate-400"))
                            } ${canvasColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-5">
                  <div className="space-y-1">
                    <span className="text-muted text-[10px] uppercase font-bold">Active Snapshot</span>
                    <select
                      value={resumeAnalysis.activeVersionId}
                      onChange={(e) => handleVersionChange(Number(e.target.value))}
                      className="w-full bg-accent/15 border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                    >
                      {resumeAnalysis.versionsList?.map(v => (
                        <option key={v.versionNumber} value={v.versionNumber}>
                          v{v.versionNumber} - {v.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowForkModal(true)}>
                      <GitBranch className="w-3.5 h-3.5 mr-1" />
                      <span>Fork Snapshot</span>
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full" onClick={loadCrossSync}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Sync Modules</span>
                    </Button>
                  </div>
                </div>

                {/* Cross Sync Suggestion Badges */}
                {suggestions.length > 0 && (
                  <div className="col-span-1 md:col-span-2 border-t border-border/50 pt-4 space-y-2">
                    <div className="text-muted text-[10px] uppercase font-bold">Verified Cross-Sync Recommendations ({suggestions.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-primary/5 border border-primary/20 hover:border-primary/45 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs max-w-sm"
                        >
                          <div>
                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded block w-fit mb-1">{item.module}</span>
                            <p className="font-bold text-foreground">{item.title}</p>
                            <p className="text-[10px] text-muted leading-tight mt-1">{item.description}</p>
                          </div>
                          <button
                            onClick={() => applyCrossSyncItem(item)}
                            className="p-1 bg-primary text-white rounded-lg hover:bg-primary-dark cursor-pointer shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Core editor grid splits */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Side: Editor (Hidden during print) */}
            <div className="xl:col-span-5 space-y-6 print-hidden">
              <Card className="p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-border pb-3">
                  <Layout className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Optimized Resume Editor</h3>
                </div>

                {/* Editor Tabs list */}
                <div className="flex flex-wrap gap-1 bg-accent/10 p-1 rounded-xl">
                  {(["summary", "skills", "projects", "work", "education", "certifications", "cover"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setEditorTab(tab)}
                      className={`flex-1 text-[10px] font-bold uppercase rounded-lg py-1.5 px-2 cursor-pointer transition-all duration-150 ${
                        editorTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Always-editable Contact Header cards */}
                <div className="grid grid-cols-2 gap-3 bg-accent/5 border border-border/60 p-3 rounded-2xl text-xs space-y-1">
                  <div className="col-span-2 font-bold text-foreground mb-1">Contact Headers</div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted font-bold uppercase">Name</span>
                    <input
                      type="text"
                      value={formState?.personalInfo?.name || ""}
                      onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2 text-xs text-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted font-bold uppercase">Email</span>
                    <input
                      type="text"
                      value={formState?.personalInfo?.email || ""}
                      onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2 text-xs text-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted font-bold uppercase">Phone</span>
                    <input
                      type="text"
                      value={formState?.personalInfo?.phone || ""}
                      onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2 text-xs text-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted font-bold uppercase">Location</span>
                    <input
                      type="text"
                      value={formState?.personalInfo?.location || ""}
                      onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2 text-xs text-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[9px] text-muted font-bold uppercase">GitHub Profile URL</span>
                    <input
                      type="text"
                      value={formState?.personalInfo?.githubUrl || ""}
                      onChange={(e) => handlePersonalInfoChange("githubUrl", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-2 text-xs text-foreground focus:border-primary/50 outline-none"
                    />
                  </div>
                </div>

                {/* Form Tabs content */}
                <div className="space-y-4 pt-2">
                  {editorTab === "summary" && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted font-bold uppercase">Summary text</span>
                      <textarea
                        value={formState?.summary || ""}
                        onChange={(e) => handleSummaryChange(e.target.value)}
                        rows={4}
                        className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:border-primary/50 outline-none resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {editorTab === "work" && (
                    <div className="space-y-4">
                      {formState?.workExperience?.map((w, idx) => (
                        <div key={idx} className="border border-border/80 p-3.5 rounded-2xl space-y-3 bg-accent/5">
                          <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <span className="text-xs font-bold text-foreground">Position #{idx + 1}</span>
                            <button
                              onClick={() => deleteWorkEntry(idx)}
                              className="text-red-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1 col-span-2">
                              <span className="text-[9px] text-muted uppercase font-bold">Company</span>
                              <input
                                type="text"
                                value={w.company}
                                onChange={(e) => handleWorkChange(idx, "company", e.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <span className="text-[9px] text-muted uppercase font-bold">Position</span>
                              <input
                                type="text"
                                value={w.position}
                                onChange={(e) => handleWorkChange(idx, "position", e.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-muted uppercase font-bold">Start Date</span>
                              <input
                                type="text"
                                value={w.startDate || ""}
                                onChange={(e) => handleWorkChange(idx, "startDate", e.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-muted uppercase font-bold">End Date</span>
                              <input
                                type="text"
                                value={w.endDate || ""}
                                onChange={(e) => handleWorkChange(idx, "endDate", e.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-muted font-bold uppercase">Bullet Highlights</span>
                              <button
                                onClick={() => {
                                  const bPoints = [...w.bulletPoints, "Accomplished target milestone."];
                                  handleWorkChange(idx, "bulletPoints", bPoints);
                                }}
                                className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Bullet
                              </button>
                            </div>
                            {w.bulletPoints.map((bp, bIdx) => (
                              <div key={bIdx} className="space-y-1 bg-card p-2 border border-border rounded-xl">
                                <textarea
                                  value={bp}
                                  onChange={(e) => {
                                    const bPoints = [...w.bulletPoints];
                                    bPoints[bIdx] = e.target.value;
                                    handleWorkChange(idx, "bulletPoints", bPoints);
                                  }}
                                  className="w-full bg-transparent border-none text-xs text-foreground outline-none resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-between pt-1 border-t border-border/50">
                                  <button
                                    onClick={() => triggerRewriteBullet("work", idx, bIdx)}
                                    className="text-[9px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" /> AI Rewrite
                                  </button>
                                  <button
                                    onClick={() => {
                                      const bPoints = [...w.bulletPoints];
                                      bPoints.splice(bIdx, 1);
                                      handleWorkChange(idx, "bulletPoints", bPoints);
                                    }}
                                    className="text-[9px] text-red-400 hover:text-red-500 font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <Button variant="secondary" size="sm" onClick={addWorkEntry} className="w-full">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Experience Position
                      </Button>
                    </div>
                  )}

                  {editorTab === "projects" && (
                    <div className="space-y-4">
                      {formState?.projects?.map((p, idx) => (
                        <div key={idx} className="border border-border/80 p-3.5 rounded-2xl space-y-3 bg-accent/5">
                          <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <span className="text-xs font-bold text-foreground">Project #{idx + 1}</span>
                            <button
                              onClick={() => deleteProjectEntry(idx)}
                              className="text-red-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[9px] text-muted uppercase font-bold">Project Title</span>
                                <input
                                  type="text"
                                  value={p.title}
                                  onChange={(e) => handleProjectChange(idx, "title", e.target.value)}
                                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] text-muted uppercase font-bold">Link</span>
                                <input
                                  type="text"
                                  value={p.link}
                                  onChange={(e) => handleProjectChange(idx, "link", e.target.value)}
                                  className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-muted uppercase font-bold">Technologies</span>
                              <input
                                type="text"
                                value={p.technologies?.join(", ") || ""}
                                onChange={(e) => {
                                  const arr = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                                  handleProjectChange(idx, "technologies", arr);
                                }}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-muted font-bold uppercase">Bullet Highlights</span>
                              <button
                                onClick={() => {
                                  const bPoints = [...p.bulletPoints, "Built application services."];
                                  handleProjectChange(idx, "bulletPoints", bPoints);
                                }}
                                className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Bullet
                              </button>
                            </div>
                            {p.bulletPoints.map((bp, bIdx) => (
                              <div key={bIdx} className="space-y-1 bg-card p-2 border border-border rounded-xl">
                                <textarea
                                  value={bp}
                                  onChange={(e) => {
                                    const bPoints = [...p.bulletPoints];
                                    bPoints[bIdx] = e.target.value;
                                    handleProjectChange(idx, "bulletPoints", bPoints);
                                  }}
                                  className="w-full bg-transparent border-none text-xs text-foreground outline-none resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-between pt-1 border-t border-border/50">
                                  <button
                                    onClick={() => triggerRewriteBullet("project", idx, bIdx)}
                                    className="text-[9px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" /> AI Rewrite
                                  </button>
                                  <button
                                    onClick={() => {
                                      const bPoints = [...p.bulletPoints];
                                      bPoints.splice(bIdx, 1);
                                      handleProjectChange(idx, "bulletPoints", bPoints);
                                    }}
                                    className="text-[9px] text-red-400 hover:text-red-500 font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <Button variant="secondary" size="sm" onClick={addProjectEntry} className="w-full">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Project Entry
                      </Button>
                    </div>
                  )}

                  {editorTab === "skills" && formState?.skills && (
                    <div className="space-y-3 bg-accent/5 border border-border/60 p-4 rounded-2xl text-xs">
                      {Object.keys(formState.skills).map((cat) => (
                        <div key={cat} className="space-y-1">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">{cat}</span>
                          <input
                            type="text"
                            value={(formState.skills as any)[cat]?.join(", ") || ""}
                            onChange={(e) => handleSkillsChange(cat, e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {editorTab === "education" && (
                    <div className="space-y-4">
                      {formState?.education?.map((e, idx) => (
                        <div key={idx} className="border border-border/80 p-3.5 rounded-2xl space-y-3 bg-accent/5">
                          <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <span className="text-xs font-bold text-foreground">Education #{idx + 1}</span>
                            <button
                              onClick={() => {
                                if (!formState) return;
                                const updated = { ...formState };
                                updated.education.splice(idx, 1);
                                setFormState(updated);
                                saveResumeEdits(updated);
                              }}
                              className="text-red-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1 col-span-2">
                              <span className="text-[9px] text-muted uppercase font-bold">Institution</span>
                              <input
                                type="text"
                                value={e.institution}
                                onChange={(eVal) => handleEducationChange(idx, "institution", eVal.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-muted uppercase font-bold">Degree</span>
                              <input
                                type="text"
                                value={e.degree}
                                onChange={(eVal) => handleEducationChange(idx, "degree", eVal.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-muted uppercase font-bold">Major</span>
                              <input
                                type="text"
                                value={e.major}
                                onChange={(eVal) => handleEducationChange(idx, "major", eVal.target.value)}
                                className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {editorTab === "certifications" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted font-bold uppercase">Certifications</span>
                        <button
                          onClick={() => {
                            if (!formState) return;
                            const updated = { ...formState };
                            if (!updated.certifications) updated.certifications = [];
                            updated.certifications.push("Certified Developer");
                            setFormState(updated);
                            saveResumeEdits(updated);
                          }}
                          className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      {formState?.certifications?.map((cert, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-card border border-border p-2 rounded-xl">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => {
                              if (!formState) return;
                              const updated = { ...formState };
                              updated.certifications[idx] = e.target.value;
                              setFormState(updated);
                              saveResumeEdits(updated);
                            }}
                            className="flex-1 bg-transparent border-none text-xs text-foreground outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!formState) return;
                              const updated = { ...formState };
                              updated.certifications.splice(idx, 1);
                              setFormState(updated);
                              saveResumeEdits(updated);
                            }}
                            className="text-red-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {editorTab === "cover" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted font-bold uppercase">Tailored Cover Letter</span>
                        <button
                          type="button"
                          onClick={() => {
                            const name = formState?.personalInfo?.name || "Candidate";
                            const company = targetDescription || "Target Company";
                            const letter = `Dear Hiring Manager at ${company},

I am writing to express my strong interest in the open position matching my background at ${company}. As an experienced professional with key expertise in ${formState?.skills?.frontend?.join(", ") || "Frontend"} and ${formState?.skills?.backend?.join(", ") || "Backend"} technologies, I am confident in my ability to make a significant contribution to your team.

My background includes:
- Summary profile: ${formState?.summary || "software developer"}
- Core skills: ${[...(formState?.skills?.languages || []), ...(formState?.skills?.frontend || [])].slice(0, 5).join(", ")}

I am eager to apply my practical execution mindset and contribute to your engineering goals. Thank you for your time and consideration.

Sincerely,
${name}`;

                            navigator.clipboard.writeText(letter);
                            addNotification("Cover letter copied to clipboard!", "success");
                          }}
                          className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Letter
                        </button>
                      </div>
                      
                      <div className="bg-accent/5 border border-border p-4 rounded-2xl text-xs space-y-3 leading-relaxed text-foreground/90 font-sans whitespace-pre-wrap">
                        {(() => {
                          const name = formState?.personalInfo?.name || "Candidate";
                          const company = targetDescription || "Target Company";
                          return `Dear Hiring Manager at ${company},

I am writing to express my strong interest in the open position matching my background at ${company}. As an experienced professional with key expertise in ${formState?.skills?.frontend?.join(", ") || "Frontend"} and ${formState?.skills?.backend?.join(", ") || "Backend"} technologies, I am confident in my ability to make a significant contribution to your team.

My background includes:
- Summary profile: ${formState?.summary || "software developer"}
- Core skills: ${[...(formState?.skills?.languages || []), ...(formState?.skills?.frontend || [])].slice(0, 5).join(", ")}

I am eager to apply my practical execution mindset and contribute to your engineering goals. Thank you for your time and consideration.

Sincerely,
${name}`;
                        })()}
                      </div>
                    </div>
                  )}

                  {editorTab === "achievements" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted font-bold uppercase">Achievements</span>
                        <button
                          onClick={() => {
                            if (!formState) return;
                            const updated = { ...formState };
                            updated.achievements.push("AWS Certified Solutions Architect");
                            setFormState(updated);
                            saveResumeEdits(updated);
                          }}
                          className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      {formState?.achievements?.map((ach, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-card border border-border p-2 rounded-xl">
                          <input
                            type="text"
                            value={ach}
                            onChange={(e) => {
                              if (!formState) return;
                              const updated = { ...formState };
                              updated.achievements[idx] = e.target.value;
                              setFormState(updated);
                              saveResumeEdits(updated);
                            }}
                            className="flex-1 bg-transparent border-none text-xs text-foreground outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!formState) return;
                              const updated = { ...formState };
                              updated.achievements.splice(idx, 1);
                              setFormState(updated);
                              saveResumeEdits(updated);
                            }}
                            className="text-red-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Fact Checker panel */}
              {factCheckList.length > 0 && (
                <Card className="p-5 border-l-4 border-l-warning space-y-4">
                  <div className="flex items-center space-x-2 text-warning">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">AI Fact-Checker & Metric Validator</h4>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    We found claims that lack measurable impact. You can add metrics below:
                  </p>
                  <div className="space-y-3">
                    {factCheckList.map((item, idx) => (
                      <div key={idx} className="bg-card border border-border p-3 rounded-2xl text-xs space-y-2">
                        <p className="text-foreground italic">"{item.originalText}"</p>
                        <p className="text-primary font-semibold text-[10px]">{item.promptQuestion}</p>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="e.g. 40%"
                            className="flex-1 bg-accent/10 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground outline-none"
                            onBlur={(e) => {
                              if (!e.target.value || !formState) return;
                              const val = e.target.value;
                              const updated = { ...formState };
                              
                              updated.workExperience.forEach((w, wIdx) => {
                                w.bulletPoints.forEach((b, bIdx) => {
                                  if (b.includes(item.originalText)) {
                                    updated.workExperience[wIdx].bulletPoints[bIdx] = b.replace(item.originalText, `${item.originalText} by ${val}`);
                                  }
                                });
                              });

                              updated.projects.forEach((p, pIdx) => {
                                p.bulletPoints.forEach((b, bIdx) => {
                                  if (b.includes(item.originalText)) {
                                    updated.projects[pIdx].bulletPoints[bIdx] = b.replace(item.originalText, `${item.originalText} by ${val}`);
                                  }
                                });
                              });

                              setFormState(updated);
                              saveResumeEdits(updated);
                              setFactCheckList(factCheckList.filter(f => f.originalText !== item.originalText));
                              addNotification("Metric appended successfully!", "success");
                            }}
                          />
                          <button
                            onClick={() => setFactCheckList(factCheckList.filter(f => f.originalText !== item.originalText))}
                            className="text-[10px] text-muted hover:underline font-bold"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Side: Canva preview Page */}
            <div className="xl:col-span-7 flex flex-col items-center space-y-6">
              
              {/* Score breakdown metrics and download actions (Hidden during print) */}
              <div className="w-full grid grid-cols-3 gap-4 print-hidden">
                <Card className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-bold uppercase block">ATS Score</span>
                    <span className="text-xl font-black text-foreground">{resumeAnalysis.atsScore}%</span>
                  </div>
                </Card>
                <Card className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-bold uppercase block">AI Confidence</span>
                    <span className="text-xl font-black text-foreground">{resumeAnalysis.aiConfidence}%</span>
                  </div>
                </Card>
                <Card className="p-4 flex items-center justify-between gap-2">
                  <Button size="sm" variant="secondary" onClick={handlePrint} className="flex-1">
                    <Printer className="w-4 h-4 mr-1" />
                    <span>PDF</span>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={downloadMarkdown} className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    <span>MD</span>
                  </Button>
                </Card>
              </div>

              {/* Document rendering sheet */}
              <div 
                className="w-full flex justify-center overflow-x-auto p-4 bg-accent/5 border border-border rounded-3xl"
                style={{ minHeight: "842px" }}
              >
                <div
                  id="resume-paper-preview"
                  className={`bg-white text-slate-800 shadow-2xl border border-slate-200 transition-all duration-300 ${fontClass} ${marginClass} text-left`}
                  style={{
                    width: canvasSize === "letter" ? "8.5in" : "210mm",
                    minHeight: canvasSize === "letter" ? "11in" : "297mm",
                    transform: `scale(${canvasZoom / 100})`,
                    transformOrigin: "top center",
                    marginBottom: `calc((1 - ${canvasZoom / 100}) * -100%)`
                  }}
                >
                  {formState ? (
                    <div className={spacingClass}>
                      {/* Personal contact banner */}
                      <div className="text-center border-b pb-5 border-slate-200">
                        <h1 className={`text-2xl font-black uppercase tracking-tight ${colorHex}`}>
                          {formState.personalInfo?.name || "Candidate Name"}
                        </h1>
                        <div className="text-[10px] text-slate-500 font-semibold mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                          {formState.personalInfo?.email && <span>{formState.personalInfo.email}</span>}
                          {formState.personalInfo?.phone && <span>• {formState.personalInfo.phone}</span>}
                          {formState.personalInfo?.location && <span>• {formState.personalInfo.location}</span>}
                          {formState.personalInfo?.githubUrl && <span>• GitHub</span>}
                          {formState.personalInfo?.linkedinUrl && <span>• LinkedIn</span>}
                        </div>
                      </div>

                      {/* Summary */}
                      {formState.summary && (
                        <div className="space-y-1.5">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Professional Summary</h3>
                          <p className="text-[10px] text-slate-600 leading-relaxed text-justify">{formState.summary}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {formState.skills && (
                        <div className="space-y-1.5">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Skills Inventory</h3>
                          <div className="text-[10px] text-slate-600 space-y-1 pl-1">
                            {Object.keys(formState.skills).map((cat) => {
                              const list = (formState.skills as any)[cat];
                              if (!list || list.length === 0) return null;
                              return (
                                <div key={cat} className="flex">
                                  <span className="w-24 font-bold uppercase text-slate-500 shrink-0">{cat}:</span>
                                  <span className="text-slate-700">{list.join(", ")}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {formState.projects?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Key Projects</h3>
                          <div className="space-y-3">
                            {formState.projects.map((p, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[11px] font-extrabold text-slate-800">{p.title}</span>
                                  {p.technologies?.length > 0 && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 rounded px-2 py-0.5 font-bold">
                                      {p.technologies.join(", ")}
                                    </span>
                                  )}
                                </div>
                                <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1 leading-relaxed pl-2">
                                  {p.bulletPoints?.map((bp, bIdx) => (
                                    <li key={bIdx} className="marker:text-slate-400">{bp}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Work history */}
                      {formState.workExperience?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Employment History</h3>
                          <div className="space-y-3">
                            {formState.workExperience.map((w, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[11px] font-extrabold text-slate-800">{w.position}</span>
                                  <span className="text-[9px] text-slate-500 font-bold">{w.startDate} - {w.endDate}</span>
                                </div>
                                <div className="flex justify-between items-baseline text-[10px] text-slate-500 italic">
                                  <span>{w.company}</span>
                                  <span>{w.location}</span>
                                </div>
                                <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1 leading-relaxed pl-2">
                                  {w.bulletPoints?.map((bp, bIdx) => (
                                    <li key={bIdx} className="marker:text-slate-400">{bp}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {formState.education?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Education</h3>
                          <div className="space-y-2">
                            {formState.education.map((e, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-baseline text-[10px]">
                                  <div>
                                    <span className="font-extrabold text-slate-800">{e.institution}</span>
                                    {e.degree && <span className="text-slate-600"> — {e.degree} in {e.major}</span>}
                                  </div>
                                  <span className="text-slate-500 font-bold">{e.startDate} {e.endDate ? `- ${e.endDate}` : ""}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {formState.certifications?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className={`text-[12px] font-black uppercase tracking-widest ${colorHex} border-b pb-1`}>Certifications & Training</h3>
                          <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1 pl-2">
                            {formState.certifications.map((c, idx) => {
                              const urlRegex = /(https?:\/\/[^\s]+)/g;
                              const parts = c.split(urlRegex);
                              return (
                                <li key={idx} className="marker:text-slate-400">
                                  {parts.map((part, pIdx) => {
                                    if (part.match(urlRegex)) {
                                      return (
                                        <a key={pIdx} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold ml-1 print:hidden">
                                          [View Link]
                                        </a>
                                      );
                                    }
                                    return part;
                                  })}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-400">Loading optimized resume templates...</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* AI Explanation Changelog list (Hidden during print) */}
          {resumeAnalysis.changeLogs && resumeAnalysis.changeLogs.length > 0 && (
            <Card className="p-6 print-hidden space-y-4 w-full text-left">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Optimizer Explanation Change Log</h3>
              </div>
              <div className="space-y-3">
                {resumeAnalysis.changeLogs.map((item, idx) => (
                  <div key={idx} className="bg-accent/5 border border-border p-4 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{item.section}</span>
                      <span className="text-[10px] text-muted font-semibold font-mono">Change Log Explanation</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-border/40">
                      <div className="space-y-1">
                        <span className="text-[9px] text-red-400 font-bold uppercase">Original Text</span>
                        <p className="text-muted italic">"{item.originalText}"</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-success font-bold uppercase">Rewritten Text</span>
                        <p className="text-foreground italic">"{item.rewrittenText}"</p>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] text-primary font-semibold flex items-start gap-1">
                      <Zap className="w-3.5 h-3.5 mt-0.5 text-primary" />
                      <span>Reasoning: {item.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Fork Modal dialog */}
      {showForkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center print-hidden">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-foreground">Fork Current Resume Version</h4>
            <div className="space-y-1">
              <span className="text-[9px] text-muted font-bold uppercase">Version Snapshot Title</span>
              <input
                type="text"
                required
                value={forkTitle}
                onChange={(e) => setForkTitle(e.target.value)}
                placeholder="e.g. Google SWE Target"
                className="w-full bg-accent/15 border border-border outline-none rounded-xl p-2.5 text-xs text-foreground focus:border-primary/50"
              />
            </div>
            <div className="flex space-x-2 pt-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowForkModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleFork} disabled={!forkTitle}>
                Fork Snapshot
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
