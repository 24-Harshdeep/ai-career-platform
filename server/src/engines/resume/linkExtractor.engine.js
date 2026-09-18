const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

/**
 * Clean & normalize URL strings
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let clean = rawUrl.trim().replace(/[\s\)\],;."']+$/g, "");
  if (!clean) return "";
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("mailto:")) {
    clean = "https://" + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.href;
  } catch (e) {
    return clean;
  }
}

/**
 * Categorize link based on domain & anchor label
 */
function categorizeLink(url, label = "") {
  const norm = (url || "").toLowerCase();
  const lbl = (label || "").toLowerCase();

  if (norm.includes("github.com") || lbl.includes("github")) {
    return "github";
  }
  if (norm.includes("linkedin.com") || lbl.includes("linkedin")) {
    return "linkedin";
  }
  if (
    norm.includes("coursera.org") ||
    norm.includes("udemy.com") ||
    norm.includes("credly.com") ||
    norm.includes("verify") ||
    lbl.includes("certificate") ||
    lbl.includes("credential")
  ) {
    return "certificate";
  }
  if (
    norm.includes("vercel.app") ||
    norm.includes("netlify.app") ||
    norm.includes("render.com") ||
    lbl.includes("demo") ||
    lbl.includes("project")
  ) {
    return "project";
  }
  if (lbl.includes("portfolio") || lbl.includes("website") || lbl.includes("personal")) {
    return "portfolio";
  }
  return "other";
}

/**
 * Extract plain-text visible URLs
 */
function extractVisibleUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<>\)\]"']+)|((?:[a-zA-Z0-9-]+\.)+(?:com|org|io|dev|app|net|in|me|co)\/[^\s<>\)\]"']*)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map(normalizeUrl))).filter(Boolean);
}

/**
 * Extract DOCX embedded hyperlinks using Mammoth HTML conversion
 */
async function extractDocxLinks(docxBuffer) {
  try {
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    const html = result.value || "";
    const links = [];

    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = normalizeUrl(match[1]);
      const label = match[2].replace(/<[^>]+>/g, "").trim();
      if (href) {
        links.push({
          url: href,
          label: label || "Hyperlink",
          type: categorizeLink(href, label),
          source: "embedded_docx"
        });
      }
    }
    return links;
  } catch (err) {
    console.warn("[Link Extractor] DOCX embedded link extraction warning:", err.message);
    return [];
  }
}

/**
 * Custom PDF page renderer for pdf-parse to collect link annotations
 */
async function parsePdfWithLinks(pdfBuffer) {
  const annotationLinks = [];

  const pagerender = async (pageData) => {
    try {
      const annotations = await pageData.getAnnotations();
      if (Array.isArray(annotations)) {
        for (const annot of annotations) {
          if (annot.subtype === "Link" && (annot.url || annot.unsafeUrl)) {
            const raw = annot.url || annot.unsafeUrl;
            const norm = normalizeUrl(raw);
            if (norm) {
              annotationLinks.push({
                url: norm,
                label: annot.title || "PDF Hyperlink",
                type: categorizeLink(norm, annot.title),
                source: "pdf_annotation"
              });
            }
          }
        }
      }
    } catch (e) {
      // Ignore annotation extraction failures on scanned pages
    }

    const textContent = await pageData.getTextContent();
    let lastY, text = "";
    for (let item of textContent.items) {
      if (lastY == item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  };

  const pdfResult = await pdfParse(pdfBuffer, { pagerender });

  return {
    text: pdfResult.text || "",
    annotationLinks
  };
}

/**
 * Combine and normalize all extracted links into structured object
 */
function buildStructuredLinks(rawText, extractedLinks = []) {
  const visible = extractVisibleUrls(rawText).map(url => ({
    url,
    label: url,
    type: categorizeLink(url),
    source: "visible_text"
  }));

  const combined = [...extractedLinks, ...visible];

  // Deduplicate by normalized URL
  const uniqueMap = new Map();
  for (const item of combined) {
    if (!uniqueMap.has(item.url)) {
      uniqueMap.set(item.url, item);
    }
  }

  const all = Array.from(uniqueMap.values());

  const result = {
    linkedin: all.find(l => l.type === "linkedin")?.url || "",
    github: all.find(l => l.type === "github")?.url || "",
    portfolio: all.find(l => l.type === "portfolio")?.url || "",
    projects: all.filter(l => l.type === "project" || (l.type === "other" && l.url.includes("github.com"))).map(l => ({
      label: l.label || "Project Demo",
      url: l.url,
      type: l.url.includes("github.com") ? "github" : "demo"
    })),
    certifications: all.filter(l => l.type === "certificate").map(l => ({
      name: l.label || "Certification Credential",
      url: l.url
    })),
    allDetected: all
  };

  return result;
}

module.exports = {
  normalizeUrl,
  categorizeLink,
  extractVisibleUrls,
  extractDocxLinks,
  parsePdfWithLinks,
  buildStructuredLinks
};
