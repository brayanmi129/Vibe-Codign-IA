import {
  db,
  collection,
  collectionGroup,
  doc,
  getDocs,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from './firebase';
import { Store, StoreMember, AdminStoreView, SuperAdminRecord } from '../types';

// Document ID is the email address — works regardless of auth provider (Google OAuth or email/password)
export async function checkIsSuperAdmin(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'superadmins', email));
    return snap.exists();
  } catch {
    return false;
  }
}

// Returns the full super admin record (with authMethod / tempPassword if set).
// Older docs seeded without these fields default to authMethod='google'.
export async function getSuperAdminRecord(email: string): Promise<SuperAdminRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'superadmins', email));
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<SuperAdminRecord>;
    return {
      email,
      authMethod: data.authMethod ?? 'google',
      tempPassword: data.tempPassword,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function deleteSubcollection(storeId: string, sub: string): Promise<void> {
  const snap = await getDocs(collection(db, 'stores', storeId, sub));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function getAllStores(): Promise<AdminStoreView[]> {
  const storesSnap = await getDocs(collection(db, 'stores'));
  const results: AdminStoreView[] = [];

  await Promise.all(
    storesSnap.docs.map(async storeDoc => {
      const store = { ...storeDoc.data(), id: storeDoc.id } as Store;

      const [membersSnap, productsSnap, salesSnap] = await Promise.all([
        getDocs(collection(db, 'stores', store.id, 'members')),
        getDocs(collection(db, 'stores', store.id, 'products')),
        getDocs(collection(db, 'stores', store.id, 'sales')),
      ]);

      results.push({
        id: store.id,
        name: store.name,
        businessType: store.businessType,
        ownerId: store.ownerId,
        createdAt: store.createdAt,
        logoUrl: store.logoUrl,
        branding: store.branding,
        members: membersSnap.docs.map(d => d.data() as StoreMember),
        productCount: productsSnap.size,
        saleCount: salesSnap.size,
      });
    })
  );

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteStoreTenant(storeId: string, members: StoreMember[]): Promise<void> {
  await Promise.all([
    deleteSubcollection(storeId, 'products'),
    deleteSubcollection(storeId, 'sales'),
    deleteSubcollection(storeId, 'restocks'),
    deleteSubcollection(storeId, 'branches'),
    deleteSubcollection(storeId, 'members'),
  ]);

  await deleteDoc(doc(db, 'stores', storeId));

  await Promise.all(
    members
      .filter(m => m.userId)
      .map(m =>
        deleteDoc(doc(db, 'users', m.userId, 'userStores', storeId)).catch(() => {})
      )
  );
}

export async function removeMemberFromStore(storeId: string, member: StoreMember): Promise<void> {
  const memberId = member.email.replace(/\./g, '_');
  await deleteDoc(doc(db, 'stores', storeId, 'members', memberId));

  if (member.userId) {
    await deleteDoc(doc(db, 'users', member.userId, 'userStores', storeId)).catch(() => {});
  }
}

export async function getSuperAdmins(): Promise<string[]> {
  const snap = await getDocs(collection(db, 'superadmins'));
  return snap.docs.map(d => d.id);
}

export async function addSuperAdmin(
  email: string,
  authMethod: 'google' | 'email',
  tempPassword?: string
): Promise<void> {
  const record: SuperAdminRecord = {
    email,
    authMethod,
    createdAt: new Date().toISOString(),
    ...(authMethod === 'email' && tempPassword ? { tempPassword } : {}),
  };
  await setDoc(doc(db, 'superadmins', email), record);
}

export async function removeSuperAdmin(email: string): Promise<void> {
  await deleteDoc(doc(db, 'superadmins', email));
}

// ── Cross-tenant lookups (for "1 user = 1 store / 1 role" enforcement) ─────

// Find ANY existing membership for this email across all stores. Used both to
// link a user on first login and to refuse duplicate registrations.
export async function findMembershipByEmail(email: string): Promise<StoreMember | null> {
  const q = query(collectionGroup(db, 'members'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as StoreMember;
}

// Refuses if the email is already a super admin or owns/belongs to any store.
// Returns the reason as a user-facing string when blocked, null when free.
export async function emailFreeReason(email: string): Promise<string | null> {
  const sa = await checkIsSuperAdmin(email);
  if (sa) return 'Ese email ya es Super Admin.';

  const membership = await findMembershipByEmail(email);
  if (membership) {
    return membership.role === 'admin'
      ? 'Ese email ya es admin de otra tienda.'
      : 'Ese email ya pertenece al equipo de otra tienda.';
  }
  return null;
}

// Mark a member as bound to a Firebase UID and clear the temp password.
// Called the first time a pre-registered user actually authenticates.
export async function bindMemberToUser(
  storeId: string,
  emailKey: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, 'stores', storeId, 'members', emailKey), {
    userId,
    tempPassword: null, // delete the cleartext password — auth account now exists
    joinedAt: new Date().toISOString(),
  });
}

// Same idea for super admins that were added with method='email' + tempPassword.
export async function clearSuperAdminTempPassword(email: string): Promise<void> {
  await updateDoc(doc(db, 'superadmins', email), { tempPassword: null });
}
