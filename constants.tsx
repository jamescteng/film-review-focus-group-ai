import { Persona } from './types';

const INTERNATIONAL_NAMES = [
  { first: 'Amara', last: 'Okonkwo' },
  { first: 'Yuki', last: 'Tanaka' },
  { first: 'Elena', last: 'Vasquez' },
  { first: 'Priya', last: 'Sharma' },
  { first: 'Fatima', last: 'Al-Rashid' },
  { first: 'Sofia', last: 'Andersen' },
  { first: 'Mei', last: 'Zhang' },
  { first: 'Aisha', last: 'Mbeki' },
  { first: 'Isabella', last: 'Romano' },
  { first: 'Nadia', last: 'Petrov' },
  { first: 'Ling', last: 'Chen' },
  { first: 'Zara', last: 'Hussain' },
  { first: 'Chioma', last: 'Eze' },
  { first: 'Hana', last: 'Kim' },
  { first: 'Leila', last: 'Moradi' },
  { first: 'Nina', last: 'Johansson' },
  { first: 'Riya', last: 'Patel' },
  { first: 'Chloe', last: 'Dubois' },
  { first: 'Ananya', last: 'Reddy' },
  { first: 'Thandi', last: 'Ndlovu' },
  { first: 'Sana', last: 'Nakamura' },
  { first: 'Ava', last: 'O\'Brien' },
  { first: 'Ingrid', last: 'Berg' },
  { first: 'Carmen', last: 'Reyes' },
  { first: 'Olga', last: 'Volkov' },
  { first: 'Emeka', last: 'Adeyemi' },
  { first: 'Kenji', last: 'Watanabe' },
  { first: 'Marco', last: 'Silva' },
  { first: 'Raj', last: 'Gupta' },
  { first: 'Omar', last: 'Farouk' },
  { first: 'Lars', last: 'Nielsen' },
  { first: 'Wei', last: 'Liu' },
  { first: 'Kwame', last: 'Asante' },
  { first: 'Alessandro', last: 'Bianchi' },
  { first: 'Dmitri', last: 'Kozlov' },
  { first: 'Jin', last: 'Park' },
  { first: 'Hassan', last: 'Mahmoud' },
  { first: 'Chidi', last: 'Okwu' },
  { first: 'Takeshi', last: 'Yamamoto' },
  { first: 'Arjun', last: 'Nair' },
  { first: 'Erik', last: 'Lindqvist' },
  { first: 'Vikram', last: 'Singh' },
  { first: 'Pierre', last: 'Laurent' },
  { first: 'Kofi', last: 'Mensah' },
  { first: 'Andrei', last: 'Popescu' },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomNames(count: number): string[] {
  const shuffled = shuffleArray(INTERNATIONAL_NAMES);
  return shuffled.slice(0, count).map(n => `${n.first} ${n.last}`);
}

const randomNames = getRandomNames(2);

export const PERSONAS: Persona[] = [
  {
    id: 'acquisitions_director',
    name: randomNames[0],
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
    name: randomNames[1],
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
