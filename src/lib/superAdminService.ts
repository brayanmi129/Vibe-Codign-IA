import { db, collection, doc, getDocs, deleteDoc, getDoc, setDoc } from './firebase';
import { Store, StoreMember, AdminStoreView } from '../types';

// Document ID is the email address — works regardless of auth provider (Google OAuth or email/password)
export async function checkIsSuperAdmin(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'superadmins', email));
    return snap.exists();
  } catch {
    return false;
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

export async function addSuperAdmin(email: string): Promise<void> {
  await setDoc(doc(db, 'superadmins', email), { createdAt: new Date().toISOString() });
}

export async function removeSuperAdmin(email: string): Promise<void> {
  await deleteDoc(doc(db, 'superadmins', email));
}
