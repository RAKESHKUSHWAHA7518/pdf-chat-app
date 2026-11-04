import { z } from "zod";
const text = z.string().max(30000);
const list = z.array(text).max(100);
const project = z.object({ title: text, desc: text, link: text.optional(), liveUrl: text.optional() });
export const resumeSchema = z.object({ name: text, title: text, bio: text, location: text.optional(), tech: list, projects: z.array(project).max(20), socials: z.record(z.string(), text).optional() });
export const atsSchema = z.object({ matchScore: z.number().int().min(0).max(100), summary: text, matchedSkills: list, missingKeywords: list, strengths: list, recommendations: z.array(z.object({ area: text, advice: text })).max(50), starRewrites: z.array(z.object({ original: text, improved: text })).max(20) });
export const profileSchema = z.object({ title: text, bio: text, typingLines: list, aboutMe: z.record(z.string(), z.union([text, list])), suggestedTech: list, suggestedProjects: z.array(project).max(20) });
export const bioSchema = z.object({ enhanced: text.min(1) });
export const diagramSchema = z.object({ title: text, mermaidCode: text.min(1), explanation: text, components: z.array(z.object({ name: text, role: text })).max(100), recommendations: list });
