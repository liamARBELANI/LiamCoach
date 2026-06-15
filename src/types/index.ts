export type YesNo = 'כן' | 'לא';

export const TRAINING_LOCATIONS = ['חדר כושר', 'סטודיו', 'בית', 'פארק', 'אחר'] as const;
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export const OCCUPATION_STATUSES = ['עובד', 'לומד', 'גם עובד וגם לומד'] as const;
export type OccupationStatus = (typeof OCCUPATION_STATUSES)[number];

export const WORK_NATURES = ['יושב רוב היום', 'משולב', 'עבודה פיזית'] as const;
export type WorkNature = (typeof WORK_NATURES)[number];

export const EATING_AT_WORK = ['מהבית', 'חדר אוכל', 'קונה בחוץ', 'משולב'] as const;
export type EatingAtWork = (typeof EATING_AT_WORK)[number];

export const DIET_TYPES = ['לא', 'צמחוני', 'טבעוני'] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const PRIMARY_GOALS = [
  'מסה',
  'חיטוב',
  'כוח',
  'ירידה במשקל',
  'עלייה במשקל',
  'אחר',
] as const;
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

/** Questionnaire 1 — קליטה ואימונים */
export interface IntakeForm {
  fullName: string;
  phone: string;
  medicallyFit: YesNo;
  takesMedication: YesNo;
  medicationDetails?: string; // shown only if takesMedication === 'כן'
  injuriesLimitations: string;
  athleticBackground: string;
  sportLastYear: string;
  whyChangeNow: string;
  goal: string;
  goalImageUrl?: string; // Firebase Storage URL
  daysPerWeek: number;
  trainingLocation: TrainingLocation;
  homeEquipmentDetails?: string; // shown only if trainingLocation === 'בית'
  cardioPreference: string;
  specialNotes: string;
  referralSource: string;
  whyMe: string;
  followDuration: string;
  termsAccepted: boolean; // must be true to submit
  nutritionDisclaimerAccepted: boolean; // must be true: program/menu are a recommendation only
}

/** Questionnaire 2 — תזונה */
export interface NutritionForm {
  age: number;
  height: number; // cm
  weight: number; // kg
  hobbies: string;
  occupationStatus: OccupationStatus;
  // Studies — shown if occupationStatus includes studying
  studyField?: string;
  studyYear?: string;
  // Work — shown if occupationStatus includes working
  workField?: string;
  workNature?: WorkNature;
  eatingAtWork?: EatingAtWork;
  microwaveAtWork?: YesNo;
  fridgeAtWork?: YesNo;
  dailyActivityLevel: string;
  sleepWakeTimes: string;
  sleepHours: number;
  mealsPerDay: number;
  whenHungry: string;
  waterPerDay: string;
  keepsKosher: YesNo;
  dietType: DietType;
  enjoyedFoods?: string; // shown if dietType !== 'לא'
  dislikedFoods?: string; // shown if dietType !== 'לא'
  allergies: string;
  primaryGoal: PrimaryGoal;
  primaryGoalOther?: string; // shown if primaryGoal === 'אחר'
  hasBodyScale: YesNo;
  hasFoodScale: YesNo;
  hasBlender: YesNo;
  dailyNutritionRoutine: string;
  foodsWontEat: string;
  mustHaveFoods: string;
  eatingOut: string;
  snacking: string;
  supplements: string;
}

export type ClientStatus = 'completed' | 'pending';

export interface Client {
  id: string;
  intake: IntakeForm;
  nutrition: NutritionForm;
  coachNotes: string; // editable by coach only
  status: ClientStatus;
  createdAt: number; // epoch ms
  updatedAt: number;
}

export interface CoachUser {
  uid: string;
  email: string | null;
}
