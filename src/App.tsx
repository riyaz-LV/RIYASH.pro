import { useEffect, useState } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { ProjectWork, ResumeProfile, SceneId } from './types/portfolio';
import { DEFAULT_RESUME_PROFILE, PORTFOLIO_WORKS } from './data/defaultPortfolio';
import { HeaderNav } from './components/HeaderNav';
import { AuroraViewport } from './components/AuroraViewport';
import { WorksSection } from './components/WorksSection';
import { ResumeSection } from './components/ResumeSection';
import { WorkLightboxModal } from './components/WorkLightboxModal';
import { ResumeEditorModal } from './components/ResumeEditorModal';

const STORAGE_KEY = 'aurora_portfolio_resume_v2_riyash';

export default function App() {
  const [profile, setProfile] = useState<ResumeProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ResumeProfile;
        if (parsed && parsed.fullName) return parsed;
      }
    } catch {
      // Ignore storage access errors
    }
    return DEFAULT_RESUME_PROFILE;
  });

  const [isCustomized, setIsCustomized] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const [activeScene, setActiveScene] = useState<SceneId>('kinetic-core');
  const [selectedWork, setSelectedWork] = useState<ProjectWork | null>(null);
  const [resumeEditorOpen, setResumeEditorOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = `${profile.brandTitle} — 4K 3D Animation Portfolio`;
  }, [profile.brandTitle]);

  const handleApplyProfile = (nextProfile: ResumeProfile) => {
    setProfile(nextProfile);
    setIsCustomized(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // Ignore quota errors
    }
  };

  const handleResetProfile = () => {
    setProfile(DEFAULT_RESUME_PROFILE);
    setIsCustomized(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const handleInspectScene = (sceneId: SceneId) => {
    setActiveScene(sceneId);
    const stageEl = document.getElementById('stage');
    if (stageEl) {
      stageEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#04070d] text-[#e8eef5]">
      <HeaderNav
        brandTitle={profile.brandTitle}
        onOpenResumeEditor={() => setResumeEditorOpen(true)}
      />

      <main>
        {/* Interactive 3D Aurora Studio Stage */}
        <AuroraViewport
          fullName={profile.fullName}
          roleTitle={profile.roleTitle}
          summary={profile.summary}
          activeScene={activeScene}
          onChangeScene={setActiveScene}
        />

        {/* Full-Width 4-Column Quantitative Production & Resume Metrics Strip */}
        <section
          aria-label="Production and resume highlights"
          className="border-t border-white/10 bg-[#060b14]"
        >
          <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
            {profile.metrics.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="font-display text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                  {metric.value}
                </p>
                <p className="text-xs text-slate-400">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4K Rendered Portfolio Showcases */}
        <WorksSection
          works={PORTFOLIO_WORKS}
          onSelectWork={(work) => setSelectedWork(work)}
          onInspectScene={handleInspectScene}
        />

        {/* Editorial About Me, Experience & Downloadable PDF Resume Section */}
        <ResumeSection
          profile={profile}
          isCustomized={isCustomized}
          onOpenEditor={() => setResumeEditorOpen(true)}
        />

        {/* Contact & Direct Links Section */}
        <section id="contact" className="border-t border-white/10 bg-[#04070d] py-20">
          <div className="mx-auto flex max-w-[1380px] flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-xs text-emerald-300">
                03 · Direct Inquiry &amp; Profiles
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Connect for Internships, AI Engineering &amp; 3D Projects
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {profile.careerObjective || profile.availability}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${profile.email}?subject=Portfolio%20%26%20Opportunity%20Inquiry`}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
                >
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#080d18] px-4 py-3 text-sm font-medium text-white hover:border-emerald-400/60 transition-colors whitespace-nowrap tabular-nums"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>{profile.phone}</span>
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{profile.location}</span>
                </span>
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-300 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-300 transition-colors"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#04070d] py-6">
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-4 px-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {profile.fullName}. Aurora 3D Animation Portfolio.
          </span>
          <div className="flex items-center gap-6">
            <a href="#stage" className="hover:text-white transition-colors">
              3D Stage
            </a>
            <a href="#portfolio" className="hover:text-white transition-colors">
              Portfolio
            </a>
            <a href="#resume" className="hover:text-white transition-colors">
              Experience
            </a>
          </div>
        </div>
      </footer>

      <WorkLightboxModal
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onInspectScene={handleInspectScene}
      />

      <ResumeEditorModal
        open={resumeEditorOpen}
        currentProfile={profile}
        onClose={() => setResumeEditorOpen(false)}
        onApplyProfile={handleApplyProfile}
        onResetProfile={handleResetProfile}
      />
    </div>
  );
}
