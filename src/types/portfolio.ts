export type SceneId = 'kinetic-core' | 'basalt-pavilion' | 'optical-rig';

export type MaterialFinishId = 'titanium' | 'obsidian' | 'brass' | 'aurora';

export type CameraPresetId = 'hero' | 'macro' | 'top';

export type WorkCategory = 'All' | '3D Animation' | 'Lookdev & Shaders' | 'Real-Time WebGL';

export interface ProjectWork {
  id: string;
  title: string;
  category: Exclude<WorkCategory, 'All'>;
  year: string;
  resolution: string;
  frameRate: string;
  engine: string;
  polycount: string;
  duration: string;
  client: string;
  imageUrl: string;
  summary: string;
  breakdown: string[];
  linkedScene?: SceneId;
}

export interface ExperienceItem {
  id: string;
  role: string;
  studio: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  detail: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  bullets: string[];
}

export interface ResumeProfile {
  fullName: string;
  brandTitle: string;
  roleTitle: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location: string;
  availability: string;
  summary: string;
  careerObjective?: string;
  website: string;
  metrics: {
    label: string;
    value: string;
  }[];
  experience: ExperienceItem[];
  resumeProjects?: ResumeProjectItem[];
  education: EducationItem[];
  skillGroups: SkillGroup[];
  coreStrengths?: string[];
  awards: string[];
}
