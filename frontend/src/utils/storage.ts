import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalEntry, Vision, Milestone, Course, SOP, WeeklyReview, AppSettings } from '../types';
import { DEFAULT_MILESTONES, DEFAULT_SOPS, DEFAULT_COURSES } from '../types';

const KEYS = {
  JOURNAL: 'phd_compass_journal',
  VISION: 'phd_compass_vision',
  MILESTONES: 'phd_compass_milestones',
  COURSES: 'phd_compass_courses',
  SOPS: 'phd_compass_sops',
  REVIEWS: 'phd_compass_reviews',
  SETTINGS: 'phd_compass_settings',
};

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Journal
export async function getJournalEntries(): Promise<JournalEntry[]> {
  return getJSON<JournalEntry[]>(KEYS.JOURNAL, []);
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const entries = await getJournalEntries();
  const idx = entries.findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    entries.push(entry);
  }
  await setJSON(KEYS.JOURNAL, entries);
}

// Vision
export async function getVision(): Promise<Vision> {
  return getJSON<Vision>(KEYS.VISION, {
    legacyStatement: '',
    phdContribution: '',
    postPhdDirection: '',
    identityGap: {
      mindset: { current: '', required: '' },
      skillSet: { current: '', required: '' },
      knowledge: { current: '', required: '' },
      systems: { current: '', required: '' },
    },
    lastReviewed: '',
  });
}

export async function saveVision(vision: Vision): Promise<void> {
  await setJSON(KEYS.VISION, vision);
}

// Milestones
export async function getMilestones(): Promise<Milestone[]> {
  return getJSON<Milestone[]>(KEYS.MILESTONES, []);
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  await setJSON(KEYS.MILESTONES, milestones);
}

// Courses
export async function getCourses(): Promise<Course[]> {
  return getJSON<Course[]>(KEYS.COURSES, []);
}

export async function saveCourses(courses: Course[]): Promise<void> {
  await setJSON(KEYS.COURSES, courses);
}

// SOPs
export async function getSOPs(): Promise<SOP[]> {
  return getJSON<SOP[]>(KEYS.SOPS, []);
}

export async function saveSOPs(sops: SOP[]): Promise<void> {
  await setJSON(KEYS.SOPS, sops);
}

// Reviews
export async function getReviews(): Promise<WeeklyReview[]> {
  return getJSON<WeeklyReview[]>(KEYS.REVIEWS, []);
}

export async function saveReview(review: WeeklyReview): Promise<void> {
  const reviews = await getReviews();
  const idx = reviews.findIndex(r => r.week === review.week && r.type === review.type);
  if (idx >= 0) {
    reviews[idx] = review;
  } else {
    reviews.push(review);
  }
  await setJSON(KEYS.REVIEWS, reviews);
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  return getJSON<AppSettings>(KEYS.SETTINGS, {
    theme: 'light',
    reminderTime: '20:00',
    welcomeDismissed: false,
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await setJSON(KEYS.SETTINGS, settings);
}

// Initialize default data on first load
export async function initializeDefaults(): Promise<void> {
  const milestones = await getMilestones();
  if (milestones.length === 0) {
    const defaults: Milestone[] = DEFAULT_MILESTONES.map((title, i) => ({
      id: generateId(),
      title,
      status: 'not_started' as const,
      notes: '',
      dateCompleted: null,
      order: i,
    }));
    await saveMilestones(defaults);
  }

  const sops = await getSOPs();
  if (sops.length === 0) {
    const defaults: SOP[] = DEFAULT_SOPS.map(s => ({
      id: generateId(),
      title: s.title,
      category: s.category,
      steps: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
    }));
    await saveSOPs(defaults);
  }

  const courses = await getCourses();
  if (courses.length === 0) {
    const defaults: Course[] = DEFAULT_COURSES.map(title => ({
      id: generateId(),
      title,
      keyConcepts: '',
    }));
    await saveCourses(defaults);
  }
}

// Export all data
export async function exportAllData(): Promise<Record<string, unknown>> {
  const [journal, vision, milestones, courses, sops, reviews, settings] = await Promise.all([
    getJournalEntries(),
    getVision(),
    getMilestones(),
    getCourses(),
    getSOPs(),
    getReviews(),
    getSettings(),
  ]);
  return { journal, vision, milestones, courses, sops, reviews, settings, exportedAt: new Date().toISOString() };
}

// Import all data
export async function importAllData(data: Record<string, unknown>): Promise<void> {
  const ops: Promise<void>[] = [];
  if (data.journal) ops.push(setJSON(KEYS.JOURNAL, data.journal));
  if (data.vision) ops.push(setJSON(KEYS.VISION, data.vision));
  if (data.milestones) ops.push(setJSON(KEYS.MILESTONES, data.milestones));
  if (data.courses) ops.push(setJSON(KEYS.COURSES, data.courses));
  if (data.sops) ops.push(setJSON(KEYS.SOPS, data.sops));
  if (data.reviews) ops.push(setJSON(KEYS.REVIEWS, data.reviews));
  if (data.settings) ops.push(setJSON(KEYS.SETTINGS, data.settings));
  await Promise.all(ops);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
