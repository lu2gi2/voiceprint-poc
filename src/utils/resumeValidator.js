/**
 * Deterministic Resume Validator Engine
 * Evaluates structural resume signals without external APIs or non-deterministic LLMs.
 * Uses pdfjs-dist for client-side PDF text extraction and mammoth for DOCX extraction.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

// Initialize PDF.js worker
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
} catch (e) {
  console.warn('PDF.js worker configuration note:', e);
}

// Common power action verbs expected in impactful resume bullet points
const ACTION_VERBS = [
  'built', 'engineered', 'optimized', 'developed', 'designed', 'created',
  'implemented', 'spearheaded', 'orchestrated', 'led', 'managed', 'architected',
  'automated', 'reduced', 'increased', 'improved', 'delivered', 'launched',
  'analyzed', 'deployed', 'refactored', 'collaborated', 'established', 'executed',
  'initiated', 'transformed', 'scaled', 'programmed', 'formulated', 'streamlined',
  'achieved', 'accelerated', 'authored', 'resolved', 'monitored', 'integrated',
  'administered', 'boosted', 'curated', 'devised', 'mentored', 'pioneered',
  'conducted', 'spearheaded', 'facilitated', 'constructed', 'maintained'
];

/**
 * Validates extracted text against canonical resume standards.
 * @param {string} rawText
 * @returns {{ isValid: boolean, score: number, missingChecks: string[] }}
 */
export function validateResume(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
    return {
      isValid: false,
      score: 0,
      missingChecks: [
        'Insufficient document text (minimum 50 characters required for evaluation)',
        'Missing contact information (Email, Phone, LinkedIn/GitHub)',
        'Missing canonical resume headings (Experience, Education, Skills, Projects)',
        'Missing chronological date ranges and timelines (e.g., "2022 - Present")',
        'Missing action verbs (e.g., built, engineered, optimized)',
      ],
    };
  }

  const text = rawText;
  const missingChecks = [];
  let score = 0;

  // 1. Contact details evaluation (Email, Phone, LinkedIn/GitHub)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
  const profileRegex = /(?:linkedin\.com\/(?:in|company)\/[\w-]+|github\.com\/[\w-]+)/i;

  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasProfile = profileRegex.test(text);

  if (hasEmail) {
    score += 12;
  } else {
    missingChecks.push('Missing valid email address');
  }

  if (hasPhone) {
    score += 8;
  } else {
    missingChecks.push('Missing phone number');
  }

  if (hasProfile) {
    score += 5;
  } else {
    missingChecks.push('Missing professional profile link (LinkedIn or GitHub URL)');
  }

  // 2. Canonical resume headings (Experience, Education, Skills, Projects)
  const headings = [
    {
      name: 'Experience',
      label: 'Missing Experience section heading (e.g., "Experience", "Work History", "Professional Experience")',
      regex: /\b(?:experience|work\s+history|employment|work\s+experience|professional\s+experience)\b/i,
      weight: 10,
    },
    {
      name: 'Education',
      label: 'Missing Education section heading (e.g., "Education", "Academics", "Academic Background")',
      regex: /\b(?:education|academic\s+background|academics|qualifications|degrees?)\b/i,
      weight: 10,
    },
    {
      name: 'Skills',
      label: 'Missing Skills section heading (e.g., "Skills", "Technical Skills", "Technologies")',
      regex: /\b(?:skills|technical\s+skills|core\s+competencies|technologies|tools)\b/i,
      weight: 8,
    },
    {
      name: 'Projects',
      label: 'Missing Projects section heading (e.g., "Projects", "Academic Projects", "Personal Projects")',
      regex: /\b(?:projects|personal\s+projects|academic\s+projects|key\s+projects|portfolio)\b/i,
      weight: 7,
    },
  ];

  let foundHeadingsCount = 0;
  for (const h of headings) {
    if (h.regex.test(text)) {
      score += h.weight;
      foundHeadingsCount++;
    } else {
      missingChecks.push(h.label);
    }
  }

  // 3. Date ranges and timelines (e.g. 2022 - Present, May 2024)
  const dateRangeRegex = /\b(?:(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current|now))\b/i;
  const monthYearRegex = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19|20)\d{2})\b/i;
  const yearRegex = /\b(?:19|20)\d{2}\b/;

  const hasDateRange = dateRangeRegex.test(text);
  const hasMonthYear = monthYearRegex.test(text);
  const hasYear = yearRegex.test(text);

  if (hasDateRange) {
    score += 15;
  } else if (hasMonthYear) {
    score += 10;
  } else if (hasYear) {
    score += 6;
  }

  if (!hasDateRange && !hasMonthYear) {
    missingChecks.push('Missing chronological date ranges or timelines (e.g., "2022 - Present", "May 2024")');
  }

  // 4. Action verb density (e.g. built, engineered, optimized)
  const lower = text.toLowerCase();
  const matchedVerbs = ACTION_VERBS.filter((verb) => {
    const r = new RegExp(`\\b${verb}\\b`, 'i');
    return r.test(lower);
  });

  if (matchedVerbs.length >= 5) {
    score += 20;
  } else if (matchedVerbs.length >= 3) {
    score += 14;
  } else if (matchedVerbs.length >= 1) {
    score += 6;
    missingChecks.push(`Low action verb density (found only ${matchedVerbs.length} power verbs: "${matchedVerbs.join(', ')}". Target 3+ power verbs)`);
  } else {
    missingChecks.push('Missing strong action verbs (e.g., built, engineered, optimized, spearheaded)');
  }

  // Additional length / substance check
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 40) {
    missingChecks.push('Document text is too brief to represent a complete resume (fewer than 40 words)');
  } else {
    score = Math.min(100, score + 5);
  }

  /* Deterministic validity gate.

     The job here is to catch the wrong file — a cover letter, a transcript, a
     photo of a cat — not to grade the resume. Real resumes are wildly varied:
     plenty of good ones put the phone number in a header PDF.js drops, skip
     "Experience" entirely in favour of "Internships", or list dates in a column
     that extracts out of order. Requiring every anchor rejected those, so the
     gate asks only that the document look like a resume from two directions at
     once. The per-check shortfalls still ride along in missingChecks — the
     score is advice, not a bouncer. */
  const corroborating = [
    hasEmail || hasPhone || hasProfile,        // reachable by some means
    hasDateRange || hasMonthYear || hasYear,   // carries a timeline
    matchedVerbs.length >= 1,                  // written in resume voice
  ].filter(Boolean).length;

  const isValid = wordCount >= 40 && foundHeadingsCount >= 1 && corroborating >= 1;

  return {
    isValid,
    score: Math.min(100, Math.max(0, score)),
    missingChecks,
  };
}

/**
 * Extracts plain text from a PDF file using PDF.js (pdfjs-dist).
 * Iterates each page and concatenates text items from getTextContent().
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(arrayBuffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    const textPieces = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      if (pageText.trim()) {
        textPieces.push(pageText.trim());
      }
    }

    return textPieces.join('\n\n');
  } catch (err) {
    console.warn('PDF.js text parsing error:', err);
    throw err;
  }
}

/**
 * Extracts plain text from a DOCX file using mammoth.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromDocx(arrayBuffer) {
  try {
    const extractFn = mammoth.extractRawText || mammoth.default?.extractRawText;
    if (typeof extractFn === 'function') {
      const result = await extractFn({ arrayBuffer });
      return result.value || '';
    }
    return '';
  } catch (err) {
    console.warn('Mammoth DOCX parsing error:', err);
    throw err;
  }
}

/**
 * Fallback binary text stream parser for PDFs if worker/canvas is unavailable.
 */
async function fallbackPdfExtract(file) {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(bytes);

    const pdfMatches = [];
    const tjRegex = /\(([^)]{2,})\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1]) pdfMatches.push(match[1]);
    }
    if (pdfMatches.length > 10) return pdfMatches.join(' ');

    const textRuns = raw.match(/[A-Za-z0-9@#\$\%\^\&\*\(\)\-_\+=\[\]\{\};:'",<\.>\/\?\\|\s]{4,}/g);
    if (textRuns && textRuns.length > 0) {
      return textRuns.map((s) => s.trim()).filter((s) => s.length > 2 && !/^[0-9a-f]{12,}$/i.test(s)).join(' ');
    }
  } catch (e) {
    console.warn('Fallback PDF extraction failed:', e);
  }
  return '';
}

/**
 * Extracts plain text from an uploaded file (.pdf, .docx, or plain text).
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  if (!file) return '';

  const fileName = file.name.toLowerCase();
  let extracted = '';

  // 1. Plain text or markdown
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type === 'text/plain') {
    try {
      extracted = await file.text();
    } catch (e) {
      console.warn('Error reading text file:', e);
    }
  }
  // 2. PDF Files: read as ArrayBuffer and parse with PDF.js
  else if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      extracted = await extractTextFromPdf(arrayBuffer);
    } catch (err) {
      console.warn('PDF.js primary extraction failed, trying stream fallback:', err);
      extracted = await fallbackPdfExtract(file);
    }
  }
  // 3. Word DOCX via mammoth
  else if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      extracted = await extractTextFromDocx(arrayBuffer);
    } catch (err) {
      console.warn('Mammoth extraction failed:', err);
    }
  } else {
    try {
      extracted = await file.text();
    } catch {
      extracted = '';
    }
  }

  return extracted;
}
