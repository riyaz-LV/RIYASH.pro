import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExplodedOffset,
  dampValue,
  formatResolutionSpec,
  parseResumeText,
} from './resumeParser';
import { generateResumePdfContent, getResumePdfFilename } from './resumePdf';
import { DEFAULT_RESUME_PROFILE } from '../data/defaultPortfolio';

test('parseResumeText rejects empty or whitespace-only input', () => {
  const result = parseResumeText('   \n  ', DEFAULT_RESUME_PROFILE);
  assert.equal(result.ok, false);
  assert.ok(result.error && result.error.length > 0);
});

test('parseResumeText extracts candidate name, role, email, experience, and skills', () => {
  const sample = `
Aria Vance
Lead 3D Lookdev & Animation TD
aria.vance@example.com

Creative 3D technical director crafting photorealistic 4K animations, procedural shaders, and WebGL showcases.

Experience
Senior 3D Animator — Polar Motion Studio | 2022 – Present
- Directed 4K product cinematics in Houdini Karma XPU and Unreal Engine 5.
- Engineered custom GLSL shaders and Three.js interactive stages.

Skills
Maya, Blender, Houdini, Three.js, GLSL, Redshift, Nuke
  `;

  const result = parseResumeText(sample, DEFAULT_RESUME_PROFILE);
  assert.equal(result.ok, true);
  assert.ok(result.profile);
  assert.equal(result.profile.fullName, 'Aria Vance');
  assert.equal(result.profile.brandTitle, 'Aria Vance');
  assert.equal(result.profile.roleTitle, 'Lead 3D Lookdev & Animation TD');
  assert.equal(result.profile.email, 'aria.vance@example.com');
  assert.equal(result.profile.experience[0].role, 'Senior 3D Animator');
  assert.equal(result.profile.experience[0].studio, 'Polar Motion Studio');
  assert.equal(result.profile.experience[0].period, '2022 – Present');
  assert.ok(result.profile.skillGroups[0].items.includes('Houdini'));
  assert.ok(result.profile.skillGroups[0].items.includes('Three.js'));
});

test('parseResumeText supports JSON resume import and validates required fields', () => {
  const invalidJson = '{"email":"only@example.com"}';
  const bad = parseResumeText(invalidJson, DEFAULT_RESUME_PROFILE);
  assert.equal(bad.ok, false);

  const validJson = JSON.stringify({
    fullName: 'Riyash Kumar',
    roleTitle: '4K 3D Animator',
    email: 'riyash0046@gmail.com',
  });
  const good = parseResumeText(validJson, DEFAULT_RESUME_PROFILE);
  assert.equal(good.ok, true);
  assert.equal(good.profile?.fullName, 'Riyash Kumar');
  assert.equal(good.profile?.brandTitle, 'Riyash Kumar');
});

test('computeExplodedOffset interpolates vectors smoothly and clamps bounds', () => {
  assert.deepEqual(computeExplodedOffset([1, 2, 3], [2, 0, -4], 0), [1, 2, 3]);
  assert.deepEqual(computeExplodedOffset([1, 2, 3], [2, 0, -4], 0.5), [2, 2, 1]);
  assert.deepEqual(computeExplodedOffset([1, 2, 3], [2, 0, -4], 2), [3, 2, -1]);
  assert.deepEqual(computeExplodedOffset([1, 2, 3], [2, 0, -4], -1), [1, 2, 3]);
});

test('dampValue approaches target smoothly over positive delta', () => {
  const next = dampValue(0, 10, 6, 0.016);
  assert.ok(next > 0 && next < 10);
  assert.equal(dampValue(5, 5, 6, 0.016), 5);
});

test('formatResolutionSpec formats 4K spec string cleanly', () => {
  assert.equal(formatResolutionSpec(3840, 2160, 60), '3840 × 2160 · 60 FPS');
});

test('generateResumePdfContent produces valid PDF 1.4 payload with profile details', () => {
  const pdf = generateResumePdfContent(DEFAULT_RESUME_PROFILE);
  assert.ok(pdf.startsWith('%PDF-1.4\n'));
  assert.ok(pdf.includes(DEFAULT_RESUME_PROFILE.fullName));
  assert.ok(pdf.includes(DEFAULT_RESUME_PROFILE.email));
  assert.ok(pdf.trimEnd().endsWith('%%EOF'));
  assert.equal(getResumePdfFilename('Riyash K.'), 'Riyash_K_Resume.pdf');
});
