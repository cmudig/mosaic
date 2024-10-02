
export function cache_analysis(logs_promise, cache) {
    
    return logs_promise.then(logs => {
        let total_get_queries = 0;
        let cached_get_queries = 0;
        for (const log of logs) {
            if (log.Type == "GET") {
                if (cache.get(log.Query)) {
                    cached_get_queries += 1;
                }
                total_get_queries += 1;
            }
            else if (log.Type == "SET") {
                cache.set(log.Query, log, parseInt(log.Size, 10))
            }
        }
        return cached_get_queries / total_get_queries
    })
    
}


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
        }
    };
}