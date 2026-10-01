import { Medicine, Pharmacy, PharmacyMedicine } from '../types';

export interface CachedMedicineView {
  medicine: Medicine;
  stocks: {
    pharmacy: Pharmacy;
    stock: PharmacyMedicine;
  }[];
  viewedAt: string;
}

export interface CachedPharmacyView {
  pharmacy: Pharmacy;
  availableMedicinesCount: number;
  viewedAt: string;
}

const STORAGE_KEY_RECENT_MEDICINES = 'farmalink_offline_recent_medicines_v1';
const STORAGE_KEY_RECENT_PHARMACIES = 'farmalink_offline_recent_pharmacies_v1';

export class OfflineHistoryService {
  /**
   * Records a medicine view along with all currently known pharmacy stocks for offline retrieval
   */
  static recordMedicineView(
    medicine: Medicine,
    stocksWithPharmacy: { pharmacy: Pharmacy; stock: PharmacyMedicine }[]
  ): void {
    try {
      const existing = this.getRecentMedicines();
      const filtered = existing.filter((item) => item.medicine.id !== medicine.id);
      const newEntry: CachedMedicineView = {
        medicine,
        stocks: stocksWithPharmacy,
        viewedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...filtered].slice(0, 30); // Keep last 30 for fast offline access
      localStorage.setItem(STORAGE_KEY_RECENT_MEDICINES, JSON.stringify(updated));
      window.dispatchEvent(new Event('farmalink_offline_cache_updated'));
    } catch (e) {
      console.warn('Offline cache record medicine failed:', e);
    }
  }

  /**
   * Retrieves all cached medicines viewed by the user
   */
  static getRecentMedicines(): CachedMedicineView[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_MEDICINES);
      if (!raw) return [];
      return JSON.parse(raw) as CachedMedicineView[];
    } catch {
      return [];
    }
  }

  /**
   * Records a pharmacy view
   */
  static recordPharmacyView(pharmacy: Pharmacy, availableMedicinesCount = 0): void {
    try {
      const existing = this.getRecentPharmacies();
      const filtered = existing.filter((item) => item.pharmacy.id !== pharmacy.id);
      const newEntry: CachedPharmacyView = {
        pharmacy,
        availableMedicinesCount,
        viewedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...filtered].slice(0, 30);
      localStorage.setItem(STORAGE_KEY_RECENT_PHARMACIES, JSON.stringify(updated));
      window.dispatchEvent(new Event('farmalink_offline_cache_updated'));
    } catch (e) {
      console.warn('Offline cache record pharmacy failed:', e);
    }
  }

  /**
   * Retrieves all cached pharmacies viewed by the user
   */
  static getRecentPharmacies(): CachedPharmacyView[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_PHARMACIES);
      if (!raw) return [];
      return JSON.parse(raw) as CachedPharmacyView[];
    } catch {
      return [];
    }
  }

  /**
   * Clear offline history
   */
  static clearOfflineCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_RECENT_MEDICINES);
      localStorage.removeItem(STORAGE_KEY_RECENT_PHARMACIES);
      window.dispatchEvent(new Event('farmalink_offline_cache_updated'));
    } catch {}
  }
}
