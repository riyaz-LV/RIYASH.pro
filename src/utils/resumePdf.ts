import type { ResumeProfile } from '../types/portfolio';

function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, (ch) => {
      if (ch === '–' || ch === '—') return '-';
      if (ch === '·') return '|';
      if (ch === '×') return 'x';
      return ' ';
    })
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateResumePdfContent(profile: ResumeProfile): string {
  const ops: string[] = [];
  let y = 754;

  const addLine = (text: string, size: number, bold = false, indent = 48, spacing = 13) => {
    if (y < 42) return;
    const fontKey = bold ? '/F2' : '/F1';
    ops.push(`BT ${fontKey} ${size} Tf 1 0 0 1 ${indent} ${y} Tm (${escapePdfText(text)}) Tj ET`);
    y -= spacing;
  };

  addLine(profile.fullName, 18, true, 48, 20);
  addLine(profile.roleTitle, 10.5, false, 48, 14);
  const contactParts = [profile.location, profile.phone ? `Phone: ${profile.phone}` : '', `Email: ${profile.email}`].filter(Boolean);
  addLine(contactParts.join(' | '), 8.5, false, 48, 12);
  const linkParts = [
    profile.linkedin ? `LinkedIn: ${profile.linkedin}` : '',
    profile.github ? `GitHub: ${profile.github}` : '',
  ].filter(Boolean);
  if (linkParts.length > 0) {
    addLine(linkParts.join(' | '), 8.5, false, 48, 16);
  } else {
    y -= 4;
  }

  addLine('PROFESSIONAL SUMMARY', 10.5, true, 48, 14);
  for (const line of wrapText(profile.summary, 94)) {
    addLine(line, 9, false, 48, 12);
  }
  y -= 6;

  addLine('EDUCATION', 10.5, true, 48, 14);
  for (const edu of profile.education) {
    addLine(`${edu.degree} | ${edu.institution} (${edu.year})`, 9, true, 48, 12);
    for (const line of wrapText(edu.detail, 90)) {
      addLine(line, 8.5, false, 58, 11);
    }
  }
  y -= 6;

  addLine('TECHNICAL SKILLS', 10.5, true, 48, 14);
  for (const group of profile.skillGroups) {
    const combined = `${group.category}: ${group.items.join(', ')}`;
    for (const line of wrapText(combined, 92)) {
      addLine(line, 8.5, false, 48, 11.5);
    }
  }
  y -= 6;

  addLine('PROJECTS & EXPERIENCE', 10.5, true, 48, 14);
  for (const exp of profile.experience) {
    addLine(`${exp.role} - ${exp.studio} (${exp.period})`, 9.5, true, 48, 12.5);
    for (const bullet of exp.highlights) {
      for (const wl of wrapText(`- ${bullet}`, 88)) {
        addLine(wl, 8.5, false, 58, 11);
      }
    }
    y -= 3;
  }

  if (profile.awards.length > 0) {
    y -= 3;
    addLine('CERTIFICATIONS', 10.5, true, 48, 13);
    for (const award of profile.awards) {
      addLine(award, 8.5, false, 48, 11.5);
    }
  }

  if (profile.coreStrengths && profile.coreStrengths.length > 0) {
    y -= 3;
    addLine('CORE STRENGTHS', 10.5, true, 48, 13);
    addLine(profile.coreStrengths.join(' | '), 8.5, false, 48, 12);
  }

  if (profile.careerObjective) {
    y -= 3;
    addLine('CAREER OBJECTIVE', 10.5, true, 48, 13);
    for (const line of wrapText(profile.careerObjective, 94)) {
      addLine(line, 8.5, false, 48, 11.5);
    }
  }

  const stream = ops.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

export function createResumePdfBlobUrl(profile: ResumeProfile): string {
  const pdfString = generateResumePdfContent(profile);
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export function getResumePdfFilename(fullName: string): string {
  const slug = fullName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${slug || 'Portfolio'}_Resume.pdf`;
}
