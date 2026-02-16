export interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

export class InMemoryStorageAdapter implements StorageAdapter {
    private store: Map<string, string> = new Map();

    async getItem(key: string): Promise<string | null> {
        return this.store.get(key) || null;
    }

    async setItem(key: string, value: string): Promise<void> {
        this.store.set(key, value);
    }

    async removeItem(key: string): Promise<void> {
        this.store.delete(key);
    }
}

// Web LocalStorage Adapter
export class WebLocalStorageAdapter implements StorageAdapter {
    async getItem(key: string): Promise<string | null> {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
    }

    async removeItem(key: string): Promise<void> {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
    }
}
