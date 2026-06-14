import type { AuthAdapter, ClientRepository } from '@/data/adapter';
import {
  firebaseAuthAdapter,
  firebaseClientRepository,
} from '@/data/firebaseAdapter';
import { mockAuthAdapter, mockClientRepository } from '@/data/mockAdapter';
import { isFirebaseConfigured } from './firebase';

/** True when the app is backed by real Firebase; false when on the localStorage mock. */
export const usingFirebase = isFirebaseConfigured;

export const clientRepository: ClientRepository = usingFirebase
  ? firebaseClientRepository
  : mockClientRepository;

export const authAdapter: AuthAdapter = usingFirebase
  ? firebaseAuthAdapter
  : mockAuthAdapter;
