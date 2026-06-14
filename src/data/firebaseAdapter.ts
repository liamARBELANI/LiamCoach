import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import type { Client, CoachUser } from '@/types';
import { formatILMobile } from '@/lib/phone';
import { firebaseAuth, firebaseDb, firebaseStorage } from '@/lib/firebase';
import type { AuthAdapter, ClientRepository, CreateClientInput } from './adapter';

const COLLECTION = 'clients';

function clientsCol() {
  return collection(firebaseDb(), COLLECTION);
}

function toClient(id: string, data: Record<string, unknown>): Client {
  return { id, ...(data as Omit<Client, 'id'>) };
}

export const firebaseClientRepository: ClientRepository = {
  async list() {
    const snap = await getDocs(query(clientsCol(), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => toClient(d.id, d.data()));
  },

  async get(id) {
    const snap = await getDoc(doc(firebaseDb(), COLLECTION, id));
    return snap.exists() ? toClient(snap.id, snap.data()) : null;
  },

  async findByPhone(phone) {
    // Note: public intake users cannot read by security rules — callers treat a
    // rejection here as "no match" and proceed.
    const snap = await getDocs(
      query(clientsCol(), where('intake.phone', '==', formatILMobile(phone))),
    );
    const first = snap.docs[0];
    return first ? toClient(first.id, first.data()) : null;
  },

  async create(input: CreateClientInput) {
    const ref = doc(clientsCol());
    const now = Date.now();
    const client: Client = {
      id: ref.id,
      intake: input.intake,
      nutrition: input.nutrition,
      coachNotes: input.coachNotes ?? '',
      status: input.status ?? 'completed',
      createdAt: now,
      updatedAt: now,
    };
    const { id: _id, ...data } = client;
    void _id;
    await setDoc(ref, data);
    return client;
  },

  async update(id, patch) {
    const ref = doc(firebaseDb(), COLLECTION, id);
    await updateDoc(ref, { ...patch, updatedAt: Date.now() });
    const snap = await getDoc(ref);
    return toClient(snap.id, snap.data() as Record<string, unknown>);
  },

  async uploadGoalImage(clientId, file) {
    const ref = storageRef(firebaseStorage(), `goalImages/${clientId}`);
    await uploadBytes(ref, file, { contentType: file.type });
    return getDownloadURL(ref);
  },
};

export const firebaseAuthAdapter: AuthAdapter = {
  async signIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(firebaseAuth(), provider);
    
    const email = cred.user.email?.toLowerCase();
    
    if (!email) {
      await fbSignOut(firebaseAuth());
      throw new Error('Unauthorized');
    }

    // Check if the email exists in the admin_users collection
    const adminDocRef = doc(firebaseDb(), 'admin_users', email);
    const adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      await fbSignOut(firebaseAuth());
      throw new Error('Unauthorized');
    }
    
    return { uid: cred.user.uid, email: cred.user.email };
  },

  async signOut() {
    await fbSignOut(firebaseAuth());
  },

  current() {
    const u = firebaseAuth().currentUser;
    return u ? { uid: u.uid, email: u.email } : null;
  },

  onChange(cb: (user: CoachUser | null) => void) {
    return onAuthStateChanged(firebaseAuth(), (u) =>
      cb(u ? { uid: u.uid, email: u.email } : null),
    );
  },
};
