/**
 * FarmaLink Tete - Firestore Cloud Data Sync Service
 * Bi-directional real-time cloud synchronizer & reactive listener
 */

import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from './firebase';
import { FarmaLinkDB } from './storage';
import {
  UserProfile,
  Pharmacy,
  Medicine,
  PharmacyMedicine,
  Order,
  NotificationItem,
  AuditLog,
  ChatMessage,
} from '../types';

/**
 * Recursively cleans objects to remove any keys with undefined values,
 * which Firestore strictly rejects with FirebaseError.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        res[key] = sanitizeForFirestore(value);
      }
    }
    return res as T;
  }
  return data;
}

class FirestoreSyncService {
  private isInitialized = false;
  private unsubscribers: Array<() => void> = [];

  /**
   * Initializes real-time Firestore listeners and auto-seeds initial data to Cloud
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Initial Cloud Sync / Seeding for essential collections (non-blocking)
      this.ensureCloudBootstrap().catch(() => {
        // Safe offline fallback
      });

      // 2. Attach real-time Firestore snapshot listeners
      this.listenToPharmacies();
      this.listenToMedicines();
      this.listenToStocks();
      this.listenToOrders();
    } catch {
      // Safe offline fallback
    }
  }

  /**
   * Seeds initial datasets to Firestore and ensures all local pharmacies/medicines/stocks are synced
   */
  private async ensureCloudBootstrap(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      const deletedPharmIds = FarmaLinkDB.getDeletedPharmacyIds();
      const deletedMedIds = FarmaLinkDB.getDeletedMedicineIds();

      // 1. Sync Pharmacies
      const localPharmacies = FarmaLinkDB.getPharmacies();
      const pharmSnap = await getDocs(collection(db, 'pharmacies'));
      const cloudPharmIds = new Set<string>();
      for (const d of pharmSnap.docs) {
        cloudPharmIds.add(d.id);
        const cloudData = d.data() as Pharmacy;
        if (deletedPharmIds.includes(cloudData.id) || deletedPharmIds.includes(d.id)) {
          try {
            await deleteDoc(d.ref);
          } catch {}
        } else {
          const currentList = FarmaLinkDB.getPharmacies();
          const existingIdx = currentList.findIndex((p) => p.id === cloudData.id);
          if (existingIdx < 0) {
            currentList.push(cloudData);
            try {
              localStorage.setItem('farmalink_pharmacies_v1', JSON.stringify(currentList));
            } catch {}
          }
        }
      }

      for (const p of localPharmacies) {
        if (!cloudPharmIds.has(p.id) && !deletedPharmIds.includes(p.id)) {
          try {
            await setDoc(doc(db, 'pharmacies', p.id), sanitizeForFirestore(p));
          } catch (err) {
            console.warn('Bootstrap pharmacy setDoc warning:', err);
          }
        }
      }

      // 2. Sync Medicines
      const localMedicines = FarmaLinkDB.getMedicines();
      const medSnap = await getDocs(collection(db, 'medicines'));
      const cloudMedIds = new Set<string>();
      medSnap.forEach((d) => {
        cloudMedIds.add(d.id);
        const cloudData = d.data() as Medicine;
        if (deletedMedIds.includes(cloudData.id)) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          FarmaLinkDB.saveMedicine(cloudData);
        }
      });

      for (const m of localMedicines) {
        if (!cloudMedIds.has(m.id) && !deletedMedIds.includes(m.id)) {
          try {
            await setDoc(doc(db, 'medicines', m.id), sanitizeForFirestore(m));
          } catch {}
        }
      }

      // 3. Sync Stocks
      const localStocks = FarmaLinkDB.getPharmacyMedicines();
      const stockSnap = await getDocs(collection(db, 'pharmacy_medicines'));
      const cloudStockIds = new Set<string>();
      stockSnap.forEach((d) => {
        cloudStockIds.add(d.id);
        const cloudData = d.data() as PharmacyMedicine;
        if (deletedPharmIds.includes(cloudData.pharmacy_id) || deletedMedIds.includes(cloudData.medicine_id)) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          FarmaLinkDB.savePharmacyMedicine(cloudData);
        }
      });

      for (const s of localStocks) {
        if (!cloudStockIds.has(s.id) && !deletedPharmIds.includes(s.pharmacy_id) && !deletedMedIds.includes(s.medicine_id)) {
          try {
            await setDoc(doc(db, 'pharmacy_medicines', s.id), sanitizeForFirestore(s));
          } catch {}
        }
      }

      // 4. Sync Profiles
      const localProfiles = FarmaLinkDB.getProfiles();
      const profileSnap = await getDocs(collection(db, 'profiles'));
      const cloudProfileIds = new Set<string>();
      profileSnap.forEach((d) => cloudProfileIds.add(d.id));
      for (const pr of localProfiles) {
        if (!cloudProfileIds.has(pr.id)) {
          try {
            await setDoc(doc(db, 'profiles', pr.id), sanitizeForFirestore(pr));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Firestore cloud bootstrap notice:', err);
    }
  }

  // --- Real-time Firestore Listeners ---

  private listenToPharmacies() {
    try {
      const unsub = onSnapshot(
        collection(db, 'pharmacies'),
        (snapshot) => {
          const deletedIds = FarmaLinkDB.getDeletedPharmacyIds();
          const list: Pharmacy[] = [];
          snapshot.forEach((d) => {
            const item = d.data() as Pharmacy;
            if (!deletedIds.includes(item.id)) {
              list.push(item);
            }
          });

          if (list.length > 0 || snapshot.empty) {
            FarmaLinkDB.clearMemoryCache();
            const local = FarmaLinkDB.getPharmacies();
            const map = new Map<string, Pharmacy>();
            local.forEach((p) => {
              if (!deletedIds.includes(p.id)) map.set(p.id, p);
            });
            list.forEach((cloudItem) => {
              if (!deletedIds.includes(cloudItem.id)) {
                const existing = map.get(cloudItem.id);
                if (!existing) {
                  map.set(cloudItem.id, cloudItem);
                } else {
                  // Protect local approval and recent local edits from being overwritten by stale cloud doc
                  const localApproved = existing.status === 'Aprovada' || existing.status === 'Aprovação Provisória';
                  const cloudApproved = cloudItem.status === 'Aprovada' || cloudItem.status === 'Aprovação Provisória';
                  const timeExisting = new Date(existing.updated_at || existing.created_at || 0).getTime();
                  const timeCloud = new Date(cloudItem.updated_at || cloudItem.created_at || 0).getTime();

                  if (localApproved && !cloudApproved) {
                    map.set(cloudItem.id, { ...cloudItem, ...existing, status: existing.status, is_verified: true });
                  } else if (timeExisting > timeCloud) {
                    map.set(cloudItem.id, { ...cloudItem, ...existing });
                  } else {
                    map.set(cloudItem.id, { ...existing, ...cloudItem });
                  }
                }
              }
            });
            const filtered = Array.from(map.values()).filter((p) => !deletedIds.includes(p.id));
            // Local save
            try {
              localStorage.setItem('farmalink_pharmacies_v1', JSON.stringify(filtered));
              FarmaLinkDB.clearMemoryCache();
              window.dispatchEvent(new Event('farmalink_storage_updated'));
            } catch {}
          }
        },
        () => {
          // Silent offline fallback
        }
      );
      this.unsubscribers.push(unsub);
    } catch (e) {}
  }

  private listenToMedicines() {
    try {
      const unsub = onSnapshot(
        collection(db, 'medicines'),
        (snapshot) => {
          const deletedIds = FarmaLinkDB.getDeletedMedicineIds();
          const list: Medicine[] = [];
          snapshot.forEach((d) => {
            const item = d.data() as Medicine;
            if (!deletedIds.includes(item.id)) {
              list.push(item);
            }
          });

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'removed') {
              const removedId = change.doc.id;
              if (!deletedIds.includes(removedId)) {
                deletedIds.push(removedId);
                try {
                  localStorage.setItem('farmalink_deleted_medicine_ids_v1', JSON.stringify(deletedIds));
                } catch {}
              }
            }
          });

          if (list.length > 0 || snapshot.empty) {
            const local = FarmaLinkDB.getMedicines();
            const map = new Map<string, Medicine>();
            local.forEach((m) => {
              if (!deletedIds.includes(m.id)) map.set(m.id, m);
            });
            list.forEach((cloudItem) => {
              if (!deletedIds.includes(cloudItem.id)) map.set(cloudItem.id, cloudItem);
            });
            const filtered = Array.from(map.values()).filter((m) => !deletedIds.includes(m.id));
            try {
              localStorage.setItem('farmalink_medicines_v1', JSON.stringify(filtered));
              window.dispatchEvent(new Event('farmalink_storage_updated'));
            } catch {}
          }
        },
        () => {
          // Silent offline fallback
        }
      );
      this.unsubscribers.push(unsub);
    } catch (e) {}
  }

  private listenToStocks() {
    try {
      const unsub = onSnapshot(
        collection(db, 'pharmacy_medicines'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PharmacyMedicine[] = [];
            snapshot.forEach((d) => list.push(d.data() as PharmacyMedicine));
            if (list.length > 0) {
              try {
                localStorage.setItem('farmalink_pharmacy_medicines_v1', JSON.stringify(list));
                window.dispatchEvent(new Event('farmalink_storage_updated'));
              } catch {}
            }
          }
        },
        () => {
          // Silent offline fallback
        }
      );
      this.unsubscribers.push(unsub);
    } catch (e) {}
  }

  private listenToOrders() {
    try {
      const unsub = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Order[] = [];
            snapshot.forEach((d) => list.push(d.data() as Order));
            if (list.length > 0) {
              try {
                localStorage.setItem('farmalink_orders_v1', JSON.stringify(list));
                window.dispatchEvent(new Event('farmalink_storage_updated'));
              } catch {}
            }
          }
        },
        () => {
          // Silent offline fallback
        }
      );
      this.unsubscribers.push(unsub);
    } catch (e) {}
  }

  // --- Real-time Chat / Messages for Prescriptions & Patient-Pharmacist ---
  async sendMessage(msg: Omit<ChatMessage, 'id' | 'created_at' | 'read'>): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      read: false,
    };

    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
    } catch (err) {
      console.warn('Saving message locally:', err);
    }

    return newMsg;
  }

  listenToPharmacyMessages(pharmacyId: string, callback: (messages: ChatMessage[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'messages'),
        where('pharmacy_id', '==', pharmacyId),
        orderBy('created_at', 'asc')
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const list: ChatMessage[] = [];
          snapshot.forEach((d) => list.push(d.data() as ChatMessage));
          callback(list);
        },
        () => {
          callback([]);
        }
      );
    } catch {
      callback([]);
      return () => {};
    }
  }

  // --- Cloud Mutators ---

  async syncPharmacy(pharmacy: Pharmacy): Promise<void> {
    try {
      await setDoc(doc(db, 'pharmacies', pharmacy.id), sanitizeForFirestore(pharmacy));
    } catch (err) {
      console.warn('Cloud sync error for pharmacy:', err);
    }
  }

  async deletePharmacy(pharmacyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pharmacies', pharmacyId));
      // Also delete stocks belonging to this pharmacy
      const snap = await getDocs(
        query(collection(db, 'pharmacy_medicines'), where('pharmacy_id', '==', pharmacyId))
      );
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Cloud sync delete error for pharmacy:', err);
    }
  }

  async clearAllPharmacies(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'pharmacies'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      const stocks = await getDocs(collection(db, 'pharmacy_medicines'));
      for (const d of stocks.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Cloud clear all pharmacies error:', err);
    }
  }

  async syncMedicine(medicine: Medicine): Promise<void> {
    try {
      await setDoc(doc(db, 'medicines', medicine.id), sanitizeForFirestore(medicine));
    } catch (err) {
      console.warn('Cloud sync error for medicine:', err);
    }
  }

  async deleteMedicine(medicineId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'medicines', medicineId));
      // Delete associated pharmacy stock in Firestore
      const snap = await getDocs(
        query(collection(db, 'pharmacy_medicines'), where('medicine_id', '==', medicineId))
      );
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Cloud sync delete error for medicine:', err);
    }
  }

  async clearAllMedicines(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'medicines'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      const stocks = await getDocs(collection(db, 'pharmacy_medicines'));
      for (const d of stocks.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Cloud clear all medicines error:', err);
    }
  }

  async deleteStock(stockId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'pharmacy_medicines', stockId));
    } catch (err) {
      console.warn('Cloud sync delete stock error:', err);
    }
  }

  async syncOrder(order: Order): Promise<void> {
    try {
      await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore(order));
    } catch (err) {
      console.warn('Cloud sync error for order:', err);
    }
  }

  async syncStock(stock: PharmacyMedicine): Promise<void> {
    try {
      await setDoc(doc(db, 'pharmacy_medicines', stock.id), sanitizeForFirestore(stock));
    } catch (err) {
      console.warn('Cloud sync error for stock:', err);
    }
  }

  async syncProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'profiles', profile.id), sanitizeForFirestore(profile));
    } catch (err) {
      console.warn('Cloud sync error for profile:', err);
    }
  }
}

export const CloudSync = new FirestoreSyncService();
if (typeof window !== 'undefined') {
  (window as any).__farmalink_cloud_sync = CloudSync;
}
