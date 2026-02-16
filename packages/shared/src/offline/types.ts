export enum NetworkStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export interface Mutation<T = any> {
    id: string;
    type: string;
    payload: T;
    createdAt: number;
    retryCount: number;
}

export interface QueueConfig {
    maxRetries?: number;
    processInterval?: number; // ms
}
