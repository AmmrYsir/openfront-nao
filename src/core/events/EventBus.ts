export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventBus<TEvents extends object> {
  private listeners: {
    [K in keyof TEvents]?: Set<EventHandler<TEvents[K]>>;
  } = {};

  on<TKey extends keyof TEvents>(
    eventName: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const existing = this.listeners[eventName];
    if (existing) {
      existing.add(handler);
    } else {
      this.listeners[eventName] = new Set<EventHandler<TEvents[TKey]>>([
        handler,
      ]);
    }

    return () => {
      this.off(eventName, handler);
    };
  }

  once<TKey extends keyof TEvents>(
    eventName: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): () => void {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });

    return unsubscribe;
  }

  off<TKey extends keyof TEvents>(
    eventName: TKey,
    handler: EventHandler<TEvents[TKey]>,
  ): void {
    const existing = this.listeners[eventName];
    if (!existing) {
      return;
    }

    existing.delete(handler);
    if (existing.size === 0) {
      delete this.listeners[eventName];
    }
  }

  emit<TKey extends keyof TEvents>(
    eventName: TKey,
    payload: TEvents[TKey],
  ): void {
    const existing = this.listeners[eventName];
    if (!existing || existing.size === 0) {
      return;
    }

    for (const handler of existing) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners = {};
  }
}
