export class PersistentClientRegistry {
  private readonly persistentToClient = new Map<string, string>();
  private readonly kickedPersistentIds = new Set<string>();

  register(persistentID: string, clientID: string): void {
    if (this.kickedPersistentIds.has(persistentID)) {
      return;
    }
    this.persistentToClient.set(persistentID, clientID);
  }

  resolveClientID(persistentID: string): string | null {
    if (this.kickedPersistentIds.has(persistentID)) {
      return null;
    }
    return this.persistentToClient.get(persistentID) ?? null;
  }

  markKicked(persistentID: string): void {
    this.kickedPersistentIds.add(persistentID);
    this.persistentToClient.delete(persistentID);
  }

  isKicked(persistentID: string): boolean {
    return this.kickedPersistentIds.has(persistentID);
  }

  clear(): void {
    this.persistentToClient.clear();
    this.kickedPersistentIds.clear();
  }
}
