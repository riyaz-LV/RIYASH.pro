import { useState, type FC } from 'react';
import { ArrowUpRight, Box, Maximize2 } from 'lucide-react';
import type { ProjectWork, SceneId, WorkCategory } from '../types/portfolio';

interface WorksSectionProps {
  works: ProjectWork[];
  onSelectWork: (work: ProjectWork) => void;
  onInspectScene: (sceneId: SceneId) => void;
}

const CATEGORIES: WorkCategory[] = ['All', '3D Animation', 'Lookdev & Shaders'];

export const WorksSection: FC<WorksSectionProps> = ({ works, onSelectWork, onInspectScene }) => {
  const [activeCategory, setActiveCategory] = useState<WorkCategory>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filtered =
    activeCategory === 'All' ? works : works.filter((w) => w.category === activeCategory);

  return (
    <section id="portfolio" className="aurora-section-glow border-t border-white/10 py-20">
      <div className="mx-auto max-w-[1380px] px-6">
        {/* Section header + interactive filter tabs */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs text-emerald-300 tabular-nums">
              01 · Selected 4K Showcases
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Portfolio
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter portfolio projects by discipline"
            className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#080d18] p-1"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Distinct 3-Project Aurora Showcase Layout: 1 Wide Flagship Split + 2 Side-by-Side 4K Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          {filtered.map((work, idx) => {
            const isLead = idx === 0 && filtered.length >= 2;
            const hasFailed = failedImages[work.id];

            if (isLead) {
              return (
                <article
                  key={work.id}
                  className="md:col-span-12 group grid grid-cols-1 items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#080d18] transition-colors hover:border-emerald-400/40 lg:grid-cols-12"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0b1220] lg:col-span-7 lg:aspect-auto lg:h-full">
                    {!hasFailed ? (
                      <img
                        src={work.imageUrl}
                        alt={`${work.title} — ${work.resolution} ${work.engine} 3D render`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [work.id]: true,
                          }))
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950/60 via-[#080d18] to-cyan-950/60 p-6 text-center">
                        <Box className="h-8 w-8 text-emerald-400/70" />
                        <p className="mt-2 font-display text-lg font-medium text-slate-200">
                          {work.title}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectWork(work)}
                      aria-label={`Open 4K still viewer for ${work.title}`}
                      className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#04070d]/90 px-3 py-1.5 text-xs font-medium text-white hover:border-emerald-400/70 hover:text-emerald-200 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Inspect 4K</span>
                    </button>
                  </div>

                  <div className="flex flex-col justify-between p-7 lg:col-span-5 lg:p-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400 tabular-nums">
                        <span className="text-emerald-300">01</span>
                        <span aria-hidden="true">·</span>
                        <span>{work.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{work.resolution}</span>
                        <span aria-hidden="true">·</span>
                        <span>{work.engine}</span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {work.title}
                      </h3>

                      <p className="mt-4 text-sm leading-relaxed text-slate-300">
                        {work.summary}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {work.client} · {work.polycount}
                      </span>

                      <div className="flex items-center gap-4">
                        {work.linkedScene && (
                          <button
                            type="button"
                            onClick={() => onInspectScene(work.linkedScene!)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <Box className="h-3.5 w-3.5" />
                            <span>Load 3D Rig</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectWork(work)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-emerald-300 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <span>Case Breakdown</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={work.id}
                className="md:col-span-6 group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#080d18] transition-colors hover:border-emerald-400/40"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0b1220]">
                  {!hasFailed ? (
                    <img
                      src={work.imageUrl}
                      alt={`${work.title} — ${work.resolution} ${work.engine} 3D render`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [work.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950/60 via-[#080d18] to-cyan-950/60 p-6 text-center">
                      <Box className="h-8 w-8 text-emerald-400/70" />
                      <p className="mt-2 font-display text-lg font-medium text-slate-200">
                        {work.title}
                      </p>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d18] via-transparent to-transparent opacity-75" />

                  <button
                    type="button"
                    onClick={() => onSelectWork(work)}
                    aria-label={`Open 4K still viewer for ${work.title}`}
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#04070d]/90 px-3 py-1.5 text-xs font-medium text-white hover:border-emerald-400/70 hover:text-emerald-200 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Inspect 4K</span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400 tabular-nums">
                      <span className="text-emerald-300">0{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.resolution}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.engine}</span>
                    </div>

                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">
                      {work.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {work.summary}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {work.client} · {work.polycount}
                    </span>

                    <div className="flex items-center gap-3">
                      {work.linkedScene && (
                        <button
                          type="button"
                          onClick={() => onInspectScene(work.linkedScene!)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Box className="h-3.5 w-3.5" />
                          <span>Load 3D Rig</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectWork(work)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-emerald-300 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>Case Breakdown</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
