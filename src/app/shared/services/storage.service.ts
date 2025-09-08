import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  /**
   * Solicita persistencia de storage usando la API moderna
   */
  async requestStoragePersistence(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const granted = await navigator.storage.persist();
        console.log('Storage persistence granted:', granted);
        return granted;
      }
      return false;
    } catch (error) {
      console.error('Error requesting storage persistence:', error);
      return false;
    }
  }

  /**
   * Verifica si el storage es persistente
   */
  async isStoragePersistent(): Promise<boolean> {
    try {
      if ('storage' in navigator && 'persisted' in navigator.storage) {
        return await navigator.storage.persisted();
      }
      return false;
    } catch (error) {
      console.error('Error checking storage persistence:', error);
      return false;
    }
  }

  /**
   * Obtiene información del storage
   */
  async getStorageInfo(): Promise<any> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
      }
      return null;
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}
