import { useEffect, useState, type FC } from 'react';
import { Download, FileUp, Printer } from 'lucide-react';
import type { ResumeProfile } from '../types/portfolio';
import { createResumePdfBlobUrl, getResumePdfFilename } from '../utils/resumePdf';

interface ResumeSectionProps {
  profile: ResumeProfile;
  isCustomized: boolean;
  onOpenEditor: () => void;
}

export const ResumeSection: FC<ResumeSectionProps> = ({
  profile,
  isCustomized,
  onOpenEditor,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    const url = createResumePdfBlobUrl(profile);
    setPdfUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [profile]);

  const pdfFilename = getResumePdfFilename(profile.fullName);

  return (
    <section id="resume" className="border-t border-white/10 bg-[#050911] py-20">
      <div className="mx-auto max-w-[1380px] px-6">
        {/* Header Row with Download PDF Link */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs text-emerald-300 tabular-nums">
              02 · About Me, Experience &amp; Resume
              {isCustomized ? ' · Customized Profile' : ''}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              About Me &amp; Experience
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {profile.fullName} · {profile.roleTitle} · {profile.location}
              {profile.phone ? ` · ${profile.phone}` : ''} · {profile.email}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-3">
            <a
              href={pdfUrl || '#resume'}
              download={pdfFilename}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Download className="h-4 w-4" />
              <span>Download Resume (PDF)</span>
            </a>

            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileUp className="h-4 w-4" />
              <span>Edit / Import Resume</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#080d18] px-4 py-2 text-xs font-medium text-slate-200 hover:border-white/40 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print View</span>
            </button>
          </div>
        </div>

        {/* Concise About Me & Career Objective */}
        <div className="mt-8 border-b border-white/10 pb-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-2">
              <h3 className="font-display text-xl font-semibold text-white">
                About Me
              </h3>
              <p className="font-mono text-xs text-slate-400">
                {profile.availability}
              </p>
              {profile.coreStrengths && profile.coreStrengths.length > 0 && (
                <p className="pt-2 text-xs leading-relaxed text-emerald-300">
                  {profile.coreStrengths.join(' · ')}
                </p>
              )}
            </div>
            <div className="lg:col-span-8 space-y-3">
              <p className="text-base leading-relaxed text-slate-200">
                {profile.summary}
              </p>
              {profile.careerObjective && (
                <p className="text-sm leading-relaxed text-slate-400">
                  <span className="font-medium text-slate-200">Career Objective: </span>
                  {profile.careerObjective}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Editorial Projects/Experience & Skills/Education Grid */}
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Projects & Work History */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="font-display text-xl font-semibold text-white">
              Projects &amp; Work History
            </h3>

            <div className="divide-y divide-white/10 border-t border-b border-white/10">
              {profile.experience.map((item) => (
                <article key={item.id} className="py-7 first:pt-6 last:pb-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="font-display text-lg font-semibold text-white">
                      {item.role}
                    </h4>
                    <span className="font-mono text-xs text-emerald-300 tabular-nums shrink-0">
                      {item.period}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-300">
                    {item.studio} · {item.location}
                  </p>

                  {item.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-300">
                      {item.highlights.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* Right Column: Technical Skills, Education, Certifications */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                Key Technical Skills
              </h3>
              <div className="mt-5 space-y-6 border-t border-white/10 pt-5">
                {profile.skillGroups.map((group) => (
                  <div key={group.category}>
                    <h4 className="font-mono text-xs font-medium text-emerald-300">
                      {group.category}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">
                      {group.items.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-white">
                Education
              </h3>
              <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="text-sm font-semibold text-white">{edu.degree}</h4>
                      <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                        {edu.year}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{edu.institution}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{edu.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {profile.awards.length > 0 && (
              <div>
                <h3 className="font-display text-xl font-semibold text-white">
                  Certifications
                </h3>
                <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4 text-sm text-slate-300">
                  {profile.awards.map((award, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                      <span>{award}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
