import * as Plot from "npm:@observablehq/plot";

export function prase_logs_with_cache(logs_promise, cache) {

    return logs_promise.then(logs => {
        return logs.map(log => {
            if (cache.get(log.Query)) {
                log.CacheStatus = "Hit"
            } else {
                cache.set(log.Query, log, parseInt(log.Size, 10))
                log.CacheStatus = "Miss"
            }
            return log
        })
    })
}

export function cache_hit(logs_promise, cache, limit=null) {
    
    return logs_promise.then(logs => {
        let total_get_queries = 0;
        let cached_get_queries = 0;
        for (const log of logs) {
            if (cache.get(log.Query)) {
                cached_get_queries += 1;
            } else {
                cache.set(log.Query, log, parseInt(log.Size, 10))
            }
            total_get_queries += 1;
        }
        if (!limit) {
            return cached_get_queries / total_get_queries
        } else {
            return (cached_get_queries / total_get_queries).toFixed(limit)
        }
        
    })
    
}

export function find_max_cache_size(logs_promise) {

    return logs_promise.then(logs => {
        let seen = new Map();
        let total_size = 0;
        for (const log of logs) {
            let size = parseInt(log.Size, 10);
            if (!seen.get(log.Query)) {
                seen.set(log.Query, log, size);
                total_size += size;
            }
        }
        return total_size
    })
}

export async function cache_hit_graph(jsonfile, size, {width, height} = {}) {
    let x_axis = Array.from({ length: 11 }, (_, i) => Math.floor((i * size) / 10));
    let data = await Promise.all(
        x_axis.map(async (xValue) => {
          const rate = await cache_hit(jsonfile, lru_cache(xValue));
          return { x: xValue, y: rate };
        })
    );
      
    return Plot.plot({
        width,
        height,
        marginTop: 30,
        x: {
            label: "Cache Size",
            nice: true,
            tickFormat: ".0f",
          },
          y: {
            label: "Cache Hit Rate",
            nice: true,
            tickFormat: ".2f",
          },
        marks: [
            Plot.line(data, {x: "x", y: "y", stroke: "steelblue", strokeWidth: 2}),
            Plot.dot(data, {x: "x", y: "y", r: 5, fill: "red", tip: true}),
        ]
    });
}

export async function cache_used_graph(jsonfile, cache, {width, height} = {}) {
    let log_entries = await jsonfile;
    let data = log_entries.map((log) => {
        if (!cache.get(log.Query)) {
            cache.set(log.Query, log, parseInt(log.Size, 10));
        }
        return { x: log.Index + 1, y: cache.get_used_size() / cache.get_cache_size()};
    })

    return Plot.plot({
        width,
        height,
        marginTop: 30,
        x: {
            label: "Log Index",
            nice: true,
            tickFormat: ".0f",
        },
        y: {
            label: "Cache Occupied Rate",
            nice: true,
            tickFormat: ".2f",
        },
        marks: [
            Plot.line(data, {x: "x", y: "y", stroke: "steelblue", strokeWidth: 2}),
            Plot.dot(data, {x: "x", y: "y", r: 5, fill: "red", tip: true}),
        ]
    });
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
        },
        get_used_size() {
            return currentSize;
        },
        get_cache_size() {
            return cache_size;
        }
    };
}