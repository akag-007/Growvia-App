import { Mutation, NetworkStatus, QueueConfig } from './types';
import { StorageAdapter, InMemoryStorageAdapter } from './storage';

export class OfflineQueue {
    private queue: Mutation[] = [];
    private storage: StorageAdapter;
    private storageKey = 'growth_offline_queue';
    private isProcessing = false;
    private networkStatus = NetworkStatus.ONLINE;
    private config: QueueConfig = {
        maxRetries: 3,
        processInterval: 5000,
    };
    private processor: ((mutation: Mutation) => Promise<void>) | null = null;

    constructor(storage?: StorageAdapter, config?: QueueConfig) {
        this.storage = storage || new InMemoryStorageAdapter();
        if (config) this.config = { ...this.config, ...config };
        this.loadQueue();
    }

    // Set the processor function that will handle the mutations
    setProcessor(processor: (mutation: Mutation) => Promise<void>) {
        this.processor = processor;
    }

    // Update network status
    setNetworkStatus(status: NetworkStatus) {
        this.networkStatus = status;
        if (status === NetworkStatus.ONLINE) {
            this.process();
        }
    }

    // Add a mutation to the queue
    async add<T>(type: string, payload: T) {
        const mutation: Mutation<T> = {
            id: crypto.randomUUID(),
            type,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
        };

        this.queue.push(mutation);
        await this.persist();

        // Try to process immediately if online
        if (this.networkStatus === NetworkStatus.ONLINE) {
            this.process();
        }
    }

    // Process the queue
    async process() {
        if (this.isProcessing || this.networkStatus === NetworkStatus.OFFLINE || !this.processor) {
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const mutation = this.queue[0]; // Peek

        try {
            await this.processor(mutation);

            // Success: Remove from queue
            this.queue.shift();
            await this.persist();

            this.isProcessing = false;

            // Process next
            if (this.queue.length > 0) {
                this.process();
            }

        } catch (error) {
            console.error(`Failed to process mutation ${mutation.id}`, error);

            mutation.retryCount++;

            if (mutation.retryCount >= (this.config.maxRetries || 3)) {
                // Max retries reached: Move to Dead Letter Queue (or just remove for now to unblock)
                // For now, we'll remove it but log it as failed.
                // In a real prod app, we'd move this to a separate "failed" list.
                this.queue.shift();
            }

            await this.persist();
            this.isProcessing = false;
        }
    }

    private async persist() {
        await this.storage.setItem(this.storageKey, JSON.stringify(this.queue));
    }

    private async loadQueue() {
        const data = await this.storage.getItem(this.storageKey);
        if (data) {
            try {
                this.queue = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse offline queue', e);
                this.queue = [];
            }
        }
    }

    getQueueLength() {
        return this.queue.length;
    }
}
