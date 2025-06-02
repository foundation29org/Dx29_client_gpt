import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UuidService {
  private uuid: string;
  private readonly STORAGE_KEY = 'dxgpt_session_uuid';

  constructor() {
    this.initializeUuid();
  }

  private initializeUuid(): void {
    const storedUuid = sessionStorage.getItem(this.STORAGE_KEY);
    if (storedUuid) {
      this.uuid = storedUuid;
    } else {
      this.uuid = uuidv4();
      sessionStorage.setItem(this.STORAGE_KEY, this.uuid);
    }
  }

  getUuid(): string {
    return this.uuid;
  }
} 