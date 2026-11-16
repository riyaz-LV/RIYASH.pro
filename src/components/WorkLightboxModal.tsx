import { useEffect, type FC } from 'react';
import { Box, X } from 'lucide-react';
import type { ProjectWork, SceneId } from '../types/portfolio';

interface WorkLightboxModalProps {
  work: ProjectWork | null;
  onClose: () => void;
  onInspectScene: (sceneId: SceneId) => void;
}

export const WorkLightboxModal: FC<WorkLightboxModalProps> = ({
  work,
  onClose,
  onInspectScene,
}) => {
  useEffect(() => {
    if (!work) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [work, onClose]);

  if (!work) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/15 bg-[#080d18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-emerald-300 tabular-nums">
              {work.category} · {work.resolution} · {work.frameRate} · {work.year}
            </p>
            <h2 id="lightbox-title" className="mt-1 font-display text-2xl font-semibold text-white">
              {work.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close 4K still viewer"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* High-res image */}
        <div className="bg-[#04070d]">
          <img
            src={work.imageUrl}
            alt={`${work.title} 4K render`}
            referrerPolicy="no-referrer"
            className="max-h-[56vh] w-full object-contain"
          />
        </div>

        {/* Specs & Production Breakdown */}
        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-12">
          <div className="md:col-span-7 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">
              Lookdev &amp; Animation Breakdown
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">{work.summary}</p>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
              {work.breakdown.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-white/10 bg-[#050911] p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <dt className="text-slate-400">Client / Study</dt>
                <dd className="font-medium text-white">{work.client}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <dt className="text-slate-400">Render Engine</dt>
                <dd className="font-mono text-xs text-slate-200">{work.engine}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <dt className="text-slate-400">Output Spec</dt>
                <dd className="font-mono text-xs text-emerald-300 tabular-nums">
                  {work.resolution} · {work.frameRate}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <dt className="text-slate-400">Geometry Budget</dt>
                <dd className="font-mono text-xs text-slate-200 tabular-nums">{work.polycount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Sequence Length</dt>
                <dd className="font-mono text-xs text-slate-200 tabular-nums">{work.duration}</dd>
              </div>
            </dl>

            {work.linkedScene && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInspectScene(work.linkedScene!);
                }}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Box className="h-4 w-4" />
                <span>Inspect Live 3D Rig on Stage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
