// Manages the player's in-session and persistent material inventory.
// Emits events when inventory changes or approaches the repair threshold.

import { EventTarget } from 'cc';

export interface MaterialItem {
  type: string;
  amount: number;
}

export const MATERIAL_EVENT = {
  INVENTORY_UPDATED: 'inventoryUpdated',
  INVENTORY_FULL: 'inventoryFull',
} as const;

/** Total material count at which we prompt the player to repair. */
const INVENTORY_FULL_THRESHOLD = 100;

export class MaterialCollector extends EventTarget {
  private inventory: Record<string, number> = {};

  // ---------------------------------------------------------------------------
  // Inventory mutation
  // ---------------------------------------------------------------------------

  /** Add one or more material items to the inventory. Emits inventoryUpdated. */
  add(materials: MaterialItem[]): void {
    for (const item of materials) {
      if (!item.type || item.amount <= 0) continue;
      this.inventory[item.type] = (this.inventory[item.type] ?? 0) + item.amount;
    }
    this.emit(MATERIAL_EVENT.INVENTORY_UPDATED, { ...this.inventory });

    if (this.totalCount() >= INVENTORY_FULL_THRESHOLD) {
      this.emit(MATERIAL_EVENT.INVENTORY_FULL, this.totalCount());
    }
  }

  // ---------------------------------------------------------------------------
  // Inventory queries
  // ---------------------------------------------------------------------------

  /** Return the current count of a specific material type. */
  get(type: string): number {
    return this.inventory[type] ?? 0;
  }

  /** Return a shallow copy of the entire inventory. */
  getAll(): Record<string, number> {
    return { ...this.inventory };
  }

  /** Sum of all material quantities. */
  totalCount(): number {
    return Object.values(this.inventory).reduce((sum, v) => sum + v, 0);
  }

  // ---------------------------------------------------------------------------
  // Repair helpers
  // ---------------------------------------------------------------------------

  /**
   * Check whether the current inventory satisfies a repair recipe.
   * Recipe format: { "浮木": 20, "铁钉": 5 }
   */
  canRepair(recipe: Record<string, number>): boolean {
    for (const [type, required] of Object.entries(recipe)) {
      if ((this.inventory[type] ?? 0) < required) return false;
    }
    return true;
  }

  /**
   * Consume materials according to the recipe.
   * Returns false (and makes no changes) if any ingredient is insufficient.
   */
  consume(recipe: Record<string, number>): boolean {
    if (!this.canRepair(recipe)) return false;

    for (const [type, required] of Object.entries(recipe)) {
      this.inventory[type] -= required;
      if (this.inventory[type] === 0) {
        delete this.inventory[type];
      }
    }

    this.emit(MATERIAL_EVENT.INVENTORY_UPDATED, { ...this.inventory });
    return true;
  }

  // ---------------------------------------------------------------------------
  // Persistence helpers (localStorage)
  // ---------------------------------------------------------------------------

  /** Serialize inventory to localStorage under the given key. */
  save(storageKey: string = 'glow_island_materials'): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.inventory));
    } catch (e) {
      console.warn('[MaterialCollector] Failed to save inventory:', e);
    }
  }

  /** Restore inventory from localStorage. Does not emit events. */
  restore(storageKey: string = 'glow_island_materials'): void {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        // Sanitize: only accept string keys and positive numbers.
        this.inventory = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number' && v > 0) {
            this.inventory[k] = v;
          }
        }
      }
    } catch (e) {
      console.warn('[MaterialCollector] Failed to restore inventory:', e);
    }
  }
}
