import type { Client, CoachUser, IntakeForm, NutritionForm } from '@/types';

export interface CreateClientInput {
  intake: IntakeForm;
  nutrition: NutritionForm;
  coachNotes?: string;
  status?: Client['status'];
}

/** Storage/CRUD for trainee submissions. Implemented by both Firebase and mock adapters. */
export interface ClientRepository {
  list(): Promise<Client[]>;
  get(id: string): Promise<Client | null>;
  /** Lookup an existing completed submission by phone (for the "כבר נרשמת" check). */
  findByPhone(phone: string): Promise<Client | null>;
  create(input: CreateClientInput): Promise<Client>;
  update(id: string, patch: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client>;
  /** Uploads the goal image and returns its public URL. */
  uploadGoalImage(clientId: string, file: File): Promise<string>;
}

/** Coach authentication. Implemented by both Firebase and mock adapters. */
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<CoachUser>;
  signOut(): Promise<void>;
  current(): CoachUser | null;
  /** Subscribe to auth changes; returns an unsubscribe function. */
  onChange(cb: (user: CoachUser | null) => void): () => void;
}
