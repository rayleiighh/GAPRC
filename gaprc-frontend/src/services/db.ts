import Dexie, { type Table } from 'dexie';

export interface OfflineReport {
  id?: number;
  shift_id: number;
  amount_cash: number;
  amount_card: number;
  comment: string;
  transactions: any[];
  timestamp: number;
}

export class GaprcDatabase extends Dexie {
  pendingReports!: Table<OfflineReport>;

  constructor() {
    super('GaprcOfflineDB');
    this.version(1).stores({
      pendingReports: '++id, shift_id, timestamp' // On indexe par ID et timestamp
    });
  }
}

export const db = new GaprcDatabase();