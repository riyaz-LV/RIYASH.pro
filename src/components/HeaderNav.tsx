import type { FC } from 'react';

interface HeaderNavProps {
  brandTitle: string;
  onOpenResumeEditor: () => void;
}

export const HeaderNav: FC<HeaderNavProps> = ({ brandTitle, onOpenResumeEditor }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04070d]">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#stage"
          className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          {brandTitle}
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <a
            href="#stage"
            className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            3D Stage
          </a>
          <a
            href="#portfolio"
            className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            Portfolio
          </a>
          <a
            href="#resume"
            className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            Experience
          </a>
          <a
            href="#contact"
            className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenResumeEditor}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            Import Resume
          </button>
        </div>
      </div>
    </header>
  );
};
