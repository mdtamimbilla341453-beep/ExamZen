import { SubjectData } from './types';

export const MOCK_SUBJECTS: SubjectData[] = [
  {
    id: 'physics',
    name: 'Physics',
    topics: [
      { name: 'Thermodynamics', frequencyScore: 92, lastAppeared: '2023' },
      { name: 'Electromagnetism', frequencyScore: 88, lastAppeared: '2022' },
      { name: 'Quantum Mechanics', frequencyScore: 75, lastAppeared: '2021' },
      { name: 'Optics', frequencyScore: 60, lastAppeared: '2020' },
      { name: 'Kinematics', frequencyScore: 45, lastAppeared: '2019' },
    ]
  },
  {
    id: 'math',
    name: 'Mathematics',
    topics: [
      { name: 'Calculus (Integration)', frequencyScore: 95, lastAppeared: '2023' },
      { name: 'Linear Algebra', frequencyScore: 85, lastAppeared: '2023' },
      { name: 'Probability', frequencyScore: 70, lastAppeared: '2021' },
      { name: 'Trigonometry', frequencyScore: 55, lastAppeared: '2020' },
      { name: 'Complex Numbers', frequencyScore: 40, lastAppeared: '2018' },
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    topics: [
      { name: 'Organic Reaction Mechanisms', frequencyScore: 90, lastAppeared: '2023' },
      { name: 'Chemical Bonding', frequencyScore: 82, lastAppeared: '2022' },
      { name: 'Thermodynamics', frequencyScore: 78, lastAppeared: '2021' },
      { name: 'Electrochemistry', frequencyScore: 65, lastAppeared: '2020' },
      { name: 'Periodic Trends', frequencyScore: 50, lastAppeared: '2019' },
    ]
  }
];

export const WELLNESS_TIPS = [
  "Take a deep breath. Oxygen feeds your brain.",
  "Visualize yourself succeeding. Positive imagery boosts confidence.",
  "Drink water. Hydration improves concentration.",
  "Take a 5-minute break for every 25 minutes of study (Pomodoro).",
  "Stretch your neck and shoulders to release tension.",
  "Remember: This exam does not define your worth.",
  "Sleep is when your brain consolidates memory. Don't skip it.",
  "Break big topics into small, manageable chunks."
];

export const ALPHA_WAVES_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-impulse-30706.mp3"; 
// Using a royalty free ambient track from Pixabay as a placeholder for Alpha Waves
