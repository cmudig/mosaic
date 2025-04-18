// latency per size
export function cost_based_lru_cache(cache_size = 10 * 1024 * 1024) {
    
    let cache = new Map();
    let currentSize = 0;

    function evict() {
        let evictKey = null;
        let minEfficiency = Infinity; // Lower efficiency means better eviction candidate

        for (const [key, entry] of cache) {
            const efficiency = (parseInt(entry.value.Latency, 10) || 1) / parseInt(entry.size, 10); // Cost efficiency metric

            if (efficiency < minEfficiency) {
                evictKey = key;
                minEfficiency = efficiency;
            }
        }

        if (evictKey) {
            const { size } = cache.get(evictKey);
            cache.delete(evictKey);
            currentSize -= size;
            return true;
        }

        return false;
    }

    return {
        get(key) {
            const entry = cache.get(key);
            if (entry) {
                entry.timestamp = performance.now(); // Update last access time
                return entry.value;
            }
            return null;
        },
        set(key, value, size) {
            if (typeof size !== 'number' || size <= 0) {
                throw new Error("Size must be a positive number");
            }

            // If adding this entry would exceed the max size, evict until it fits
            while (currentSize + size > cache_size) {
                if (!evict()) {
                    break;
                }
            }

            if (currentSize + size > cache_size) {
                return; // Skip adding if it still doesn't fit
            }

            // Add the new entry (latency is inside value)
            cache.set(key, { timestamp: performance.now(), value, size });
            currentSize += size;
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
