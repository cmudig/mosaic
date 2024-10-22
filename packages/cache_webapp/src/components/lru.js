export function lru_cache(cache_size = 10 * 1024 * 1024) {
    
    let cache = new Map();
    let currentSize = 0; // Track the current size of the cache

    function evict() {
        let lruKey = null;
        let lruLast = Infinity;

        for (const [key, value] of cache) {
            const { last } = value;

            // Track the least recently used entry for eviction
            if (last < lruLast) {
                lruKey = key;
                lruLast = last;
            }
        }

        // Remove least recently used entry if cache exceeds max size
        if (lruKey) {
            const { size } = cache.get(lruKey);
            cache.delete(lruKey);
            currentSize -= size;
            return true;
        }

        return false;
    }

    return {
        get(key) {
            const entry = cache.get(key);
            if (entry) {
                entry.last = performance.now(); // Update access time
                return entry.value;
            }
        },
        set(key, value, size) {
            if (typeof size !== 'number' || size <= 0) {
                throw new Error("Size must be a positive number");
            }

            // If adding this entry would exceed the max size, evict until it fits
            while (currentSize + size > cache_size) {
                if (!evict()) {
                    break;
                };
            }

            if (currentSize + size > cache_size) {
                return;
            }
            // Add the new entry
            cache.set(key, { last: performance.now(), value, size });
            currentSize += size;

            return value;
        },
        clear() { 
            cache = new Map();
            currentSize = 0;
        },
        get_used_size() {
            return currentSize;
        },
        get_cache_size() {
            return cache_size;
        }
    };
}