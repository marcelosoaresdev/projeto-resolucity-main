class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    subscribe(eventName, handler) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        const handlers = this.listeners.get(eventName);
        handlers.add(handler);

        return () => this.unsubscribe(eventName, handler);
    }

    unsubscribe(eventName, handler) {
        const handlers = this.listeners.get(eventName);

        if (!handlers) {
            return;
        }

        handlers.delete(handler);

        if (handlers.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    async publish(eventName, payload) {
        const handlers = this.listeners.get(eventName);

        if (!handlers || handlers.size === 0) {
            return;
        }

        const results = await Promise.allSettled(
            [...handlers].map(handler => Promise.resolve().then(() => handler(payload)))
        );

        const rejected = results.filter(result => result.status === 'rejected');

        if (rejected.length > 0) {
            console.error(`Erro ao processar evento ${eventName}:`, rejected[0].reason);
        }
    }
}

const eventBus = new EventBus();

export default eventBus;