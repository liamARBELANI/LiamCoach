import type { Client, CoachUser } from '@/types';
import { phoneKey } from '@/lib/phone';
import { buildSeed } from './mockSeed';
import type { AuthAdapter, ClientRepository, CreateClientInput } from './adapter';

const CLIENTS_KEY = 'liamcoach:clients';
const SEEDED_KEY = 'liamcoach:seeded';
const AUTH_KEY = 'liamcoach:auth';

/** Demo coach credentials for mock mode (removed since using SSO). */

function readClients(): Client[] {
  if (!localStorage.getItem(SEEDED_KEY)) {
    const seed = buildSeed();
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(seed));
    localStorage.setItem(SEEDED_KEY, '1');
    return seed;
  }
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    return raw ? (JSON.parse(raw) as Client[]) : [];
  } catch {
    return [];
  }
}

function writeClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function newId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockClientRepository: ClientRepository = {
  async list() {
    const clients = readClients().sort((a, b) => b.createdAt - a.createdAt);
    return delay(clients);
  },

  async get(id) {
    const found = readClients().find((c) => c.id === id) ?? null;
    return delay(found);
  },

  async findByPhone(phone) {
    const key = phoneKey(phone);
    const found =
      readClients().find((c) => phoneKey(c.intake.phone) === key) ?? null;
    return delay(found);
  },

  async create(input: CreateClientInput) {
    const now = Date.now();
    const client: Client = {
      id: newId(),
      intake: input.intake,
      nutrition: input.nutrition,
      coachNotes: input.coachNotes ?? '',
      status: input.status ?? 'completed',
      createdAt: now,
      updatedAt: now,
    };
    const clients = readClients();
    clients.push(client);
    writeClients(clients);
    return delay(client);
  },

  async update(id, patch) {
    const clients = readClients();
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('המתאמן לא נמצא');
    const updated: Client = { ...clients[idx], ...patch, id, updatedAt: Date.now() };
    clients[idx] = updated;
    writeClients(clients);
    return delay(updated);
  },

  async uploadGoalImage(_clientId, file) {
    // In mock mode we keep the image inline as a data URL.
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('שגיאה בקריאת התמונה'));
      reader.readAsDataURL(file);
    });
    return dataUrl;
  },
};

// --- Auth (mock) ---

const listeners = new Set<(user: CoachUser | null) => void>();

function readAuth(): CoachUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as CoachUser) : null;
  } catch {
    return null;
  }
}

function emit(user: CoachUser | null) {
  listeners.forEach((cb) => cb(user));
}

export const mockAuthAdapter: AuthAdapter = {
  async signIn() {
    await delay(null, 350);
    const user: CoachUser = { uid: 'demo-coach', email: 'liamgames35@gmail.com' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    emit(user);
    return user;
  },

  async signOut() {
    localStorage.removeItem(AUTH_KEY);
    emit(null);
    return delay(undefined);
  },

  current() {
    return readAuth();
  },

  onChange(cb) {
    listeners.add(cb);
    // Emit current state asynchronously so subscribers settle consistently.
    queueMicrotask(() => cb(readAuth()));
    return () => listeners.delete(cb);
  },
};
