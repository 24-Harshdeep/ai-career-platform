const PDFDocument = require("pdfkit");

const C = {
  ink: "#0f172a", body: "#334155", muted: "#64748b", line: "#cbd5e1",
  panel: "#f8fafc", cyan: "#0284c7", cyanLight: "#e0f2fe",
  green: "#15803d", greenLight: "#f0fdf4", amber: "#a16207",
  amberLight: "#fffbeb", purple: "#6b21a8", purpleLight: "#faf5ff"
};

function clean(value, fallback = "Not available") {
  if (value === null || value === undefined) return fallback;
  const result = String(value).replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1").replace(/^#+\s*/gm, "")
    .replace(/^---\s*$/gm, "").replace(/`/g, "")
    .replace(/\b(he|she|him)\b/gi, "the candidate")
    .replace(/\b(his|her|hers)\b/gi, "the candidate's").trim();
  return result || fallback;
}

function joined(value, fallback = "Not available") {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.filter(Boolean).map(item => clean(item, "")).filter(Boolean).join(" · ") || fallback;
}

/**
 * PDFKit report renderer with measured document flow. Logical blocks move as a
 * unit; tables may split between rows and repeat their header on continuation.
 */
function buildCareerReportPdf(data = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const buffers = [];
      doc.on("data", chunk => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const W = doc.page.width;
      const H = doc.page.height;
      const margin = 42;
      const width = W - margin * 2;
      const top = 58;
      const bottom = H - 48;
      const shareable = data.mode !== "private";
      const name = clean(data.candidateName, "Candidate");
      const role = clean(data.targetRole);
      const date = new Date(data.generatedAt || Date.now()).toLocaleDateString();
      let y = top;
      let page = 1;

      const font = (size, face = "Helvetica", color = C.body) => {
        doc.font(face).fontSize(size).fillColor(color);
      };
      const heightOf = (value, boxWidth, size = 9, face = "Helvetica", lineGap = 2) => {
        font(size, face);
        return doc.heightOfString(clean(value, ""), { width: boxWidth, lineGap });
      };
      const footer = () => {
        doc.moveTo(margin, H - 31).lineTo(W - margin, H - 31).strokeColor(C.line).stroke();
        font(7, "Helvetica", C.muted);
        doc.text(`Page ${page}  |  CAREEROS Career Intelligence  |  ${shareable ? "Shareable professional report" : "Private diagnostic report"}`, margin, H - 23, { width, align: "center", lineBreak: false });
      };
      const header = () => {
        doc.rect(margin, 22, width, 22).fill(C.ink);
        font(8, "Helvetica-Bold", "#38bdf8");
        doc.text("CAREEROS", margin + 10, 29, { lineBreak: false });
        font(7.5, "Helvetica", "#cbd5e1");
        doc.text(`  |  ${name}  |  ${role}`, margin + 72, 29, { width: width - 170, lineBreak: false });
        font(7, "Helvetica", "#94a3b8");
        doc.text(date, W - margin - 70, 29, { width: 70, align: "right", lineBreak: false });
      };
      const addPage = () => {
        footer();
        doc.addPage({ size: "A4", margin: 0 });
        page += 1;
        y = top;
        header();
      };
      const ensure = (height, reserve = 0) => { if (y + height + reserve > bottom) addPage(); };
      const paragraph = (value, opts = {}) => {
        const text = clean(value, "");
        if (!text) return;
        const boxWidth = opts.width || width;
        const size = opts.size || 9;
        const face = opts.face || "Helvetica";
        const lineGap = opts.lineGap === undefined ? 2 : opts.lineGap;
        const spacing = opts.spacing === undefined ? 7 : opts.spacing;
        let words = text.split(/\s+/);
        while (words.length) {
          if (bottom - y < size + lineGap + 4) addPage();
          let count = 0;
          let best = "";
          for (let i = 1; i <= words.length; i += 1) {
            const candidate = words.slice(0, i).join(" ");
            if (heightOf(candidate, boxWidth, size, face, lineGap) > bottom - y - 4) break;
            best = candidate;
            count = i;
          }
          if (!count) {
            // Avoid an infinite loop for an unbroken token such as a very long
            // URL. Split the token into printable chunks before retrying.
            const token = words.shift();
            words = (token.match(/.{1,40}/g) || [token]).concat(words);
            continue;
          }
          const h = heightOf(best, boxWidth, size, face, lineGap);
          font(size, face, opts.color || C.body);
          doc.text(best, opts.x || margin, y, { width: boxWidth, lineGap, align: opts.align || "left" });
          y += h;
          words = words.slice(count);
          if (words.length) addPage();
          else y += spacing;
        }
      };
      const section = (title, subtitle = "") => {
        const th = heightOf(title, width, 13, "Helvetica-Bold", 1);
        const sh = subtitle ? heightOf(subtitle, width, 8, "Helvetica", 2) : 0;
        // Keep room for the first content line below the heading.
        ensure(th + sh + 24, 55);
        font(13, "Helvetica-Bold", C.ink);
        doc.text(clean(title), margin, y, { width });
        y += th + 3;
        if (subtitle) {
          font(8, "Helvetica", C.muted);
          doc.text(clean(subtitle), margin, y, { width });
          y += sh + 8;
        } else y += 8;
        doc.moveTo(margin, y).lineTo(W - margin, y).strokeColor(C.line).stroke();
        y += 12;
      };
      const box = (height, fill = C.panel, stroke = C.line) => {
        doc.roundedRect(margin, y, width, height, 5).fillAndStroke(fill, stroke);
      };
      const table = (headers, rows, widths) => {
        if (!rows.length) { paragraph("No verified data available.", { face: "Helvetica-Oblique", color: C.muted }); return; }
        const tableWidth = widths.reduce((sum, item) => sum + item, 0);
        const row = (cells, isHeader = false) => {
          const size = isHeader ? 7.5 : 7.8;
          const face = isHeader ? "Helvetica-Bold" : "Helvetica";
          const heights = cells.map((cell, i) => heightOf(cell, widths[i] - 12, size, face, 1));
          const h = Math.max(22, Math.max(...heights) + 10);
          if (y + h > bottom) { addPage(); section("Continued", "The table continues from the previous page."); row(headers, true); }
          doc.rect(margin, y, tableWidth, h).fillAndStroke(isHeader ? C.ink : "#ffffff", C.line);
          let x = margin;
          cells.forEach((cell, i) => {
            if (i) doc.moveTo(x, y).lineTo(x, y + h).strokeColor(C.line).stroke();
            font(size, face, isHeader ? "#ffffff" : C.body);
            doc.text(clean(cell), x + 6, y + 5, { width: widths[i] - 12, lineGap: 1 });
            x += widths[i];
          });
          y += h;
        };
        row(headers, true);
        rows.forEach(item => row(item));
        y += 9;
      };
      const metric = (title, value, cardWidth, fill, color) => {
        const h = Math.max(55, heightOf(value, cardWidth - 18, 16, "Helvetica-Bold", 1) + 31);
        ensure(h, 7);
        doc.roundedRect(margin, y, cardWidth, h, 5).fillAndStroke(fill, C.line);
        font(7, "Helvetica-Bold", C.muted); doc.text(title.toUpperCase(), margin + 9, y + 8, { width: cardWidth - 18 });
        font(16, "Helvetica-Bold", color); doc.text(clean(value), margin + 9, y + 21, { width: cardWidth - 18 });
        return h;
      };

      // Cover and candidate information.
      doc.rect(margin, 35, width, 62).fill(C.ink);
      font(19, "Helvetica-Bold", "#38bdf8"); doc.text("CAREEROS", margin + 14, 48);
      font(11, "Helvetica", "#ffffff"); doc.text(shareable ? "Career Growth & Professional Profile" : "Private Career Intelligence Report", margin + 14, 73, { width: 320 });
      font(7.5, "Helvetica", "#cbd5e1");
      doc.text(`Generated: ${date}`, W - margin - 155, 50, { width: 140, align: "right" });
      doc.text(`Target: ${role}`, W - margin - 155, 64, { width: 140, align: "right" });
      if (data.reportPeriod) doc.text(`Period: ${clean(data.reportPeriod)}`, W - margin - 155, 78, { width: 140, align: "right" });
      y = 116;

      const fields = [
        ["Candidate", name], ["Candidate email", shareable ? "Private" : clean(data.candidateEmail)],
        ["Target role", role], ["Career direction", clean(data.currentRole)],
        ["Experience level", clean(data.experienceLevel)]
      ];
      const cellWidth = width / 3;
      const gridRows = [fields.slice(0, 3), fields.slice(3)];
      const rowHeights = gridRows.map(row => Math.max(38, ...row.map(field => heightOf(field[1], cellWidth - 20, 9, "Helvetica-Bold", 1) + 22)));
      const gridHeight = rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + 22;
      ensure(gridHeight); box(gridHeight); y += 11;
      fields.forEach((field, index) => {
        const col = index % 3; const rowIndex = Math.floor(index / 3);
        const x = margin + 10 + col * cellWidth;
        const yy = y + rowHeights.slice(0, rowIndex).reduce((sum, rowHeight) => sum + rowHeight, 0);
        font(7, "Helvetica-Bold", C.muted); doc.text(field[0].toUpperCase(), x, yy, { width: cellWidth - 20, lineBreak: false });
        font(9, "Helvetica-Bold", field[0] === "Target role" ? C.cyan : C.ink); doc.text(clean(field[1]), x, yy + 11, { width: cellWidth - 20 });
      });
      y += gridHeight + 8;

      const links = Object.entries({ GitHub: data.personalInfo?.githubUrl, LinkedIn: data.personalInfo?.linkedinUrl, Portfolio: data.personalInfo?.portfolioUrl }).filter(([, value]) => value);
      if (links.length) {
        ensure(20); font(7, "Helvetica-Bold", C.muted); doc.text("VERIFIED LINKS", margin, y);
        let x = margin + 78;
        links.forEach(([label, url]) => { font(8, "Helvetica-Bold", C.cyan); doc.text(label, x, y, { link: url, underline: true, lineBreak: false }); x += doc.widthOfString(label) + 20; });
        y += 20;
      }

      section("Career Readiness Snapshot", "Current indicators calculated from the CareerOS intelligence context.");
      const gap = 9; const cardWidth = (width - gap * 3) / 4;
      const cards = [
        ["Career score", `${data.careerScore ?? "Not available"}/100`, C.cyanLight, "#1d4ed8"],
        ["Job readiness", `${data.jobReadiness ?? "Not available"}%`, C.greenLight, C.green],
        ["Growth trend", clean(data.growth?.growthText), C.amberLight, C.amber],
        ["Confidence", `${data.confidence ?? "Not available"}%`, C.purpleLight, C.purple]
      ];
      const cardHeights = cards.map(item => metric(item[0], item[1], cardWidth, item[2], item[3])); y += Math.max(...cardHeights) + 10;

      section("Professional Profile", "Evidence-based summary of the candidate's current direction and development focus.");
      paragraph(data.executiveSummary);
      const trajectory = Array.isArray(data.careerDirectionVisual) ? data.careerDirectionVisual.filter(Boolean) : [];
      if (trajectory.length) { section("Career Direction", "Recorded progression toward the target role."); paragraph(trajectory.map(item => clean(item)).join("  →  "), { face: "Helvetica-Bold", color: C.cyan }); }

      section("Technology & Capability Evidence", "Capabilities derived from verified resume, profile, project, and repository evidence.");
      const matrix = data.skillsMatrix || {};
      [["Frontend & client side", matrix.frontend], ["Backend & systems", matrix.backend], ["Databases & data stores", matrix.database], ["Languages & runtimes", matrix.languages], ["Engineering practices & tools", matrix.engineering]].forEach(([title, items]) => {
        if (!Array.isArray(items) || !items.length) return;
        ensure(32); font(9, "Helvetica-Bold", C.ink); doc.text(title, margin, y); y += 13;
        table(["Capability", "Level", "Evidence"], items.map(item => [clean(item.name), clean(item.level), joined(item.evidence)]), [180, 105, width - 285]);
      });
      if (!Object.values(matrix).some(value => Array.isArray(value) && value.length)) paragraph("No verified capability data available.", { face: "Helvetica-Oblique", color: C.muted });

      section("Projects & Experience Evidence", "Only projects and experience present in CareerOS source data are included.");
      const projects = Array.isArray(data.projects) ? data.projects : [];
      table(["Project", "Role / stack", "Verified evidence"], projects.map(item => [clean(item.name), `${clean(item.role)}\n${joined(item.techStack)}`, clean(item.evidence)]), [180, 175, width - 355]);
      const experience = Array.isArray(data.workExperience) ? data.workExperience : [];
      if (experience.length) table(["Position", "Organization / period", "Description"], experience.map(item => [clean(item.position), `${clean(item.company)}\n${clean(item.startDate)} – ${clean(item.endDate)}`, clean(item.description)]), [170, 155, width - 325]);
      else paragraph("No verified professional experience available.", { face: "Helvetica-Oblique", color: C.muted });

      const education = Array.isArray(data.education) ? data.education : [];
      if (education.length) {
        section("Education Evidence", "Education records available in the selected CareerOS context.");
        table(["Qualification", "Institution / period", "Field"], education.map(item => [clean(item.degree), `${clean(item.institution)}\n${clean(item.startDate)} – ${clean(item.endDate)}`, clean(item.fieldOfStudy || item.major)]), [170, 175, width - 345]);
      }
      const certifications = Array.isArray(data.certifications) ? data.certifications : [];
      if (certifications.length) {
        section("Certification Evidence", "Certification records available in the selected CareerOS context.");
        table(["Certification", "Issuer / date", "Credential"], certifications.map(item => [clean(item.name), `${clean(item.issuer)}\n${clean(item.issueDate)}`, clean(item.credentialId || item.credentialUrl)]), [210, 150, width - 360]);
      }

      const timeline = Array.isArray(data.trajectoryTimeline) ? data.trajectoryTimeline : [];
      if (timeline.length) {
        section("Growth Trajectory", "Recorded milestones derived from CareerOS evidence.");
        table(["Milestone", "Recorded detail"], timeline.map(item => [clean(item.title), clean(item.detail)]), [180, width - 180]);
      }

      section("Growth Lifecycle & Learning Progress", "Development stages and milestones recorded by CareerOS.");
      const lifecycles = Array.isArray(data.shareableLifecycles) ? data.shareableLifecycles : [];
      table(["Skill", "Current state", "Action / next milestone"], lifecycles.map(item => [clean(item.skill), clean(item.currentState), `${clean(item.actionTaken)}\nNext: ${clean(item.nextMilestone)}`]), [150, 105, width - 255]);
      const roadmap = data.roadmapIntelligence || {};
      paragraph(`Roadmap completion: ${roadmap.completionPercentage ?? "Not available"}%  |  Completed modules: ${roadmap.completedModulesCount ?? "Not available"}  |  Streak: ${roadmap.streak ?? "Not available"} days`, { face: "Helvetica-Bold", color: C.cyan });

      section("Interview Intelligence", "Technical assessment history and observed development areas.");
      const interview = data.interviewIntelligence || {};
      table(["Indicator", "Recorded value", "Topics / focus areas"], [
        ["Completed assessments", `${interview.completedCount ?? 0}`, joined(interview.topicsCovered, "No completed interviews yet")],
        ["Average score", interview.averageScore === null || interview.averageScore === undefined ? "No completed interviews yet" : `${interview.averageScore}%`, joined(interview.repeatingMistakes, "No repeating focus areas recorded")]
      ], [155, 145, width - 300]);
      if (interview.statusText) paragraph(interview.statusText, { color: C.muted });

      if (!shareable) {
        section("Private Diagnostics", "Internal diagnostic information; not intended for recruiter sharing.");
        const gaps = Array.isArray(data.skillGapLifecycle) ? data.skillGapLifecycle : [];
        table(["Skill", "Status", "Evidence"], gaps.map(item => [clean(item.skill), clean(item.status), clean(item.evidence)]), [170, 110, width - 280]);
        const resume = data.resumeIntelligence || {};
        paragraph(`ATS score: ${resume.atsScore ?? "Not available"}  |  Missing keywords: ${joined(resume.missingKeywords)}`, { color: C.muted });
      }

      section("Recommended Next Actions", "Actions returned by the CareerOS recommendation engine.");
      const actions = Array.isArray(data.nextBestActions) ? data.nextBestActions : [];
      table(["Action", "Priority / time", "Reason"], actions.map(item => [clean(item.title), `${clean(item.priority)}\n${clean(item.estimatedTime)}`, clean(item.reason || item.description)]), [190, 120, width - 310]);

      ensure(75); box(66, "#ffffff", C.ink); font(8.5, "Helvetica-Bold", C.ink); doc.text("CAREEROS REPORT INTEGRITY", margin + 10, y + 10);
      y += 26;
      paragraph("This report presents information available in the selected CareerOS reporting context. Missing information is shown as unavailable and is not inferred as a professional claim.", { x: margin + 10, width: width - 20, size: 8, color: C.muted, spacing: 0 });
      footer();
      doc.end();
    } catch (error) { reject(error); }
  });
}

module.exports = { buildCareerReportPdf };
