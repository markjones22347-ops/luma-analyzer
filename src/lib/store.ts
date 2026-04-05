import { ScanReport } from '@/types';

// Simple in-memory store for reports
// In production, use Redis, PostgreSQL, or similar
class ReportStore {
  private store = new Map<string, ScanReport>();
  private maxSize = 1000; // Keep last 1000 reports

  set(id: string, report: ScanReport): void {
    // Clean up old reports if store is too large
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(id, report);
  }

  get(id: string): ScanReport | undefined {
    return this.store.get(id);
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// Export singleton instance
export const reportStore = new ReportStore();
