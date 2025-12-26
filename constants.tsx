import { Persona } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'acquisitions_director',
    name: 'Sarah Chen',
    role: 'Senior Acquisitions Director',
    description: 'A sharp, no-nonsense executive looking for commercial viability and emotional "stickiness".',
    instruction: 'Evaluates films through the lens of a distributor. Cares about hooks, emotional payoffs, and whether cinematography feels premium enough for high-end platforms.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    color: 'border-slate-400',
    demographics: {
      age: '38',
      segment: 'Independent Film Market / A24-style Enthusiast',
      tastes: ['Arthouse Thrillers', 'Visual Metaphor', 'High-Stakes Character Dramas'],
      background: '15 years in film festivals and international sales. Lives in Brooklyn. Values subtext over exposition.'
    }
  },
  {
    id: 'cultural_editor',
    name: 'Maya Lin',
    role: 'Cultural Editor',
    description: 'A culturally literate young editor who shapes taste and conversation at a major publication.',
    instruction: 'Evaluates films through the lens of cultural relevance, emotional resonance, and authorship. Values originality, tonal control, and films that feel alive in the current moment.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    color: 'border-rose-400',
    demographics: {
      age: '28',
      segment: 'Festival-going, streaming-savvy cultural professionals',
      tastes: ['Global Cinema', 'Auteur Films', 'Contemporary Streaming Series'],
      background: 'Chief editor at a nationwide culture publication. Attends international film festivals regularly. Watches 5+ films per week.'
    }
  }
];

export const INITIAL_QUESTIONS = [
  "What was the most memorable moment of the film?",
  "Did the ending feel satisfying and earned?",
  "Which character was your favorite, and why?",
  "Is this film ready for a festival run?"
];
