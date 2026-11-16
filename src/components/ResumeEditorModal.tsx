import { useEffect, useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { RotateCcw, Upload, X } from 'lucide-react';
import type { ResumeProfile } from '../types/portfolio';
import { parseResumeText } from '../utils/resumeParser';

interface ResumeEditorModalProps {
  open: boolean;
  currentProfile: ResumeProfile;
  onClose: () => void;
  onApplyProfile: (profile: ResumeProfile) => void;
  onResetProfile: () => void;
}

export const ResumeEditorModal: FC<ResumeEditorModalProps> = ({
  open,
  currentProfile,
  onClose,
  onApplyProfile,
  onResetProfile,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>(currentProfile.fullName);
  const [roleTitle, setRoleTitle] = useState<string>(currentProfile.roleTitle);
  const [email, setEmail] = useState<string>(currentProfile.email);

  useEffect(() => {
    if (open) {
      setFullName(currentProfile.fullName);
      setRoleTitle(currentProfile.roleTitle);
      setEmail(currentProfile.email);
      setError(null);
    }
  }, [open, currentProfile]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setRawText(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Unable to read the selected file. Please paste your resume text directly.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // If raw resume text is provided, parse it cleanly
    if (rawText.trim().length > 0) {
      const parsed = parseResumeText(rawText, currentProfile);
      if (!parsed.ok || !parsed.profile) {
        setError(parsed.error || 'Could not parse resume text.');
        return;
      }
      onApplyProfile(parsed.profile);
      setRawText('');
      onClose();
      return;
    }

    // Otherwise validate direct profile inputs
    if (!fullName.trim() || !roleTitle.trim() || !email.trim()) {
      setError('Please enter your Full Name, Role Title, and Email, or paste your resume text below.');
      return;
    }

    const brandParts = fullName.trim().split(/\s+/);
    const brandTitle =
      brandParts.length >= 2 ? `${brandParts[0]} ${brandParts[brandParts.length - 1]}` : `${fullName.trim()} 3D`;

    onApplyProfile({
      ...currentProfile,
      fullName: fullName.trim(),
      brandTitle,
      roleTitle: roleTitle.trim(),
      email: email.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#080d18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 id="resume-modal-title" className="font-display text-xl font-semibold text-white">
              Reference &amp; Customize Resume
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Paste your resume text, upload a .txt / .md / .json file, or edit profile details directly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resume editor"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:border-white/40 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          {/* Direct quick-edit fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#04070d] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profile-role" className="block text-xs font-medium text-slate-300">
                Role Title
              </label>
              <input
                id="profile-role"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#04070d] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-300">
                Contact Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#04070d] px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Resume Paste / Upload */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="resume-raw-input" className="text-xs font-medium text-slate-300">
                Paste Full Resume Text or JSON (Optional — parses Experience &amp; Skills automatically)
              </label>

              <label className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:border-emerald-400/50 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <textarea
              id="resume-raw-input"
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Example:\nRiyash Kumar\nSenior 3D Animator & Lookdev TD\nriyash0046@gmail.com\n\nExperience\nLead 3D Animator — Studio North | 2022 – Present\n- Directed 4K UHD product films in Houdini, Maya, and Unreal Engine 5.\n\nSkills\nMaya, Blender, Houdini, Redshift, Three.js, GLSL, Nuke`}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#04070d] p-3.5 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => {
                onResetProfile();
                setRawText('');
                setError(null);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Sample</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Apply Resume
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
