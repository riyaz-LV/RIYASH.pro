import type { ExperienceItem, ResumeProfile } from '../types/portfolio';

export interface ParseResumeResult {
  ok: boolean;
  error?: string;
  profile?: ResumeProfile;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DATE_RANGE_RE =
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|20\d{2}|19\d{2})\s*(?:[-–—]|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|20\d{2}|19\d{2}|Present|Current|Now)\b/i;

export function dampValue(current: number, target: number, lambda: number, delta: number): number {
  const safeDelta = Math.max(0, Math.min(delta, 0.1));
  return current + (target - current) * (1 - Math.exp(-lambda * safeDelta));
}

export function computeExplodedOffset(
  base: [number, number, number],
  explodeVec: [number, number, number],
  amount: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, amount));
  return [
    base[0] + explodeVec[0] * clamped,
    base[1] + explodeVec[1] * clamped,
    base[2] + explodeVec[2] * clamped,
  ];
}

export function formatResolutionSpec(width: number, height: number, fps: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const f = Math.max(1, Math.round(fps));
  return `${w} × ${h} · ${f} FPS`;
}

function splitNonEmptyLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractBrandTitle(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Aurora Studio';
  if (parts.length === 1) return `${parts[0]} Studio`;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function extractSkills(lines: string[]): string[] {
  const knownTools = [
    'Maya',
    'Blender',
    'Houdini',
    'Cinema 4D',
    'ZBrush',
    'Substance Painter',
    'Substance Designer',
    'Unreal Engine',
    'Unreal Engine 5',
    'Three.js',
    'WebGL',
    'GLSL',
    'Octane',
    'Redshift',
    'Arnold',
    'Karma',
    'Nuke',
    'After Effects',
    'DaVinci Resolve',
    'Python',
    'USD',
    'TypeScript',
    'React',
    'Marvelous Designer',
  ];

  const joined = lines.join(' ');
  const found = new Set<string>();
  for (const tool of knownTools) {
    const escaped = tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(joined)) {
      found.add(tool);
    }
  }

  const skillSectionIdx = lines.findIndex((l) => /^(skills|technical skills|tools|software|stack)\b[:\s-]*$/i.test(l));
  if (skillSectionIdx >= 0) {
    for (let i = skillSectionIdx + 1; i < Math.min(lines.length, skillSectionIdx + 6); i++) {
      const line = lines[i];
      if (/^(experience|education|projects|awards|summary)\b/i.test(line)) break;
      const tokens = line
        .replace(/^[-•*]\s*/, '')
        .split(/[,|·/]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && t.length <= 28);
      for (const tok of tokens) {
        found.add(tok);
      }
    }
  }

  return Array.from(found).slice(0, 16);
}

function extractExperience(lines: string[], fallback: ExperienceItem[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let current: ExperienceItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(education|skills|awards|certifications)\b/i.test(line)) {
      if (current) {
        items.push(current);
        current = null;
      }
      if (items.length > 0) break;
    }

    const dateMatch = line.match(DATE_RANGE_RE);
    if (dateMatch) {
      if (current) {
        items.push(current);
      }
      const period = `${dateMatch[1]} – ${dateMatch[2]}`;
      const cleaned = line.replace(DATE_RANGE_RE, '').replace(/[|·,]+$/, '').trim();
      const parts = cleaned.split(/\s*[—–|@-]\s*/).filter(Boolean);
      const prevLine = i > 0 ? lines[i - 1] : '';
      const role =
        parts[0] ||
        (!DATE_RANGE_RE.test(prevLine) && prevLine.length < 70 && !/^(experience|work)/i.test(prevLine)
          ? prevLine
          : '3D Artist & Animator');
      const studio = parts[1] || 'Production Studio';
      current = {
        id: `exp-${items.length + 1}`,
        role,
        studio,
        location: parts[2] || 'Remote',
        period,
        highlights: [],
      };
      continue;
    }

    if (current && (/^[-•*]/.test(line) || current.highlights.length < 3)) {
      const cleanBullet = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanBullet.length >= 12 && !EMAIL_RE.test(cleanBullet)) {
        current.highlights.push(cleanBullet);
      }
    }
  }

  if (current) {
    items.push(current);
  }

  return items.length > 0 ? items.slice(0, 5) : fallback;
}

export function parseResumeText(rawInput: string, baseProfile: ResumeProfile): ParseResumeResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Please paste your resume text or upload a resume file before applying.',
    };
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<ResumeProfile>;
      if (!parsed.fullName || typeof parsed.fullName !== 'string') {
        return {
          ok: false,
          error: 'JSON resume must include a valid "fullName" string field.',
        };
      }
      return {
        ok: true,
        profile: {
          ...baseProfile,
          ...parsed,
          brandTitle: parsed.brandTitle || extractBrandTitle(parsed.fullName),
        },
      };
    } catch {
      return {
        ok: false,
        error: 'Invalid JSON syntax. Paste plain text or valid JSON resume data.',
      };
    }
  }

  const lines = splitNonEmptyLines(trimmed);
  if (lines.length < 2) {
    return {
      ok: false,
      error: 'Resume text is too short. Include at least your name, role, and experience or skills.',
    };
  }

  const emailMatch = trimmed.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0] : baseProfile.email;

  const firstLine = lines[0].replace(/^#+\s*/, '').trim();
  const fullName = firstLine.length <= 50 && !EMAIL_RE.test(firstLine) ? firstLine : baseProfile.fullName;

  const secondLine = lines[1].replace(/^#+\s*/, '').trim();
  const roleTitle =
    secondLine.length <= 80 && !EMAIL_RE.test(secondLine) && !DATE_RANGE_RE.test(secondLine)
      ? secondLine
      : baseProfile.roleTitle;

  const summaryCandidates = lines.filter(
    (l, idx) =>
      idx >= 2 &&
      idx <= 8 &&
      l.length > 45 &&
      !DATE_RANGE_RE.test(l) &&
      !/^[-•*]/.test(l) &&
      !/^(experience|education|skills|projects)/i.test(l)
  );
  const summary = summaryCandidates.length > 0 ? summaryCandidates.slice(0, 2).join(' ') : baseProfile.summary;

  const extractedSkills = extractSkills(lines);
  const skillGroups =
    extractedSkills.length > 0
      ? [
          {
            category: 'Extracted Pipeline & Tools',
            items: extractedSkills,
          },
          ...baseProfile.skillGroups.slice(1),
        ]
      : baseProfile.skillGroups;

  const experience = extractExperience(lines, baseProfile.experience);

  return {
    ok: true,
    profile: {
      ...baseProfile,
      fullName,
      brandTitle: extractBrandTitle(fullName),
      roleTitle,
      email,
      summary,
      experience,
      skillGroups,
    },
  };
}
