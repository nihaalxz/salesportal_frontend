export interface NotificationEnvelope {
    eventId: string;
    correlationId: string;
    eventName: string;
    referenceType: string;
    referenceId: string;
    headId?: number | null;
    agentId?: number | null;
    priority?: string;
    producer: string;
    timestamp: string;
    targetGroup?: string | null;
}

type NotificationHandler = (envelope: NotificationEnvelope) => void;

class NotificationDispatcher {
    private handlers: Map<string, Set<NotificationHandler>> = new Map();
    private processedCorrelationIds: Set<string> = new Set();
    private maxBufferSize = 50;

    public on(eventName: string, handler: NotificationHandler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, new Set());
        }
        this.handlers.get(eventName)!.add(handler);
    }

    public off(eventName: string, handler: NotificationHandler) {
        const set = this.handlers.get(eventName);
        if (set) {
            set.delete(handler);
        }
    }

    public dispatch(envelope: NotificationEnvelope) {
        if (!envelope || !envelope.correlationId) return;

        if (this.processedCorrelationIds.has(envelope.correlationId)) {
            return;
        }

        this.processedCorrelationIds.add(envelope.correlationId);
        if (this.processedCorrelationIds.size > this.maxBufferSize) {
            const firstKey = this.processedCorrelationIds.values().next().value;
            if (firstKey) this.processedCorrelationIds.delete(firstKey);
        }

        const set = this.handlers.get(envelope.eventName);
        if (set) {
            set.forEach((handler) => {
                try {
                    handler(envelope);
                } catch (err) {
                    console.error('Error executing notification handler for event:', envelope.eventName, err);
                }
            });
        }
    }
}

export const notificationDispatcher = new NotificationDispatcher();
