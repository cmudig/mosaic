// export function hybrid_cost_lru_cache(cache_size = 10 * 1024 * 1024, lruWeight = 0.2) {
//     let cache = new Map();
//     let currentSize = 0;

//     function evict() {
//         let evictKey = null;
//         let bestScore = Infinity;
//         console.log("weight: ", lruWeight)
//         // First pass: find the oldest timestamp
//         let oldest = Infinity;
//         for (const [, entry] of cache) {
//             oldest = Math.min(oldest, entry.timestamp);
//         }

//         let scores = [];

//         for (const [key, entry] of cache) {
//             const latency = parseInt(entry.value.Latency, 10) || 1;
//             const size = parseInt(entry.size, 10) || 1;
//             const age = entry.timestamp; // relative age

//             const costScore = latency / size;
//             const lruScore = age;
//             const combinedScore = (1 - lruWeight) * costScore + lruWeight * lruScore

//             scores.push({ key, combinedScore });
//         }

//         for (const { key, combinedScore } of scores) {

//             if (combinedScore < bestScore) {
//                 bestScore = combinedScore;
//                 evictKey = key;
//             }
//         }

//         if (evictKey) {
//             const { size } = cache.get(evictKey);
//             cache.delete(evictKey);
//             currentSize -= size;
//             return true;
//         }

//         return false;
//     }

//     return {
//         get(key) {
//             const entry = cache.get(key);
//             if (entry) {
//                 entry.timestamp = performance.now(); // update access time
//                 return entry.value;
//             }
//             return null;
//         },
//         set(key, value, size) {
//             if (typeof size !== 'number' || size <= 0) {
//                 throw new Error("Size must be a positive number");
//             }

//             while (currentSize + size > cache_size) {
//                 if (!evict()) break;
//             }

//             if (currentSize + size > cache_size) return;

//             cache.set(key, { timestamp: performance.now(), value, size });
//             currentSize += size;
//         },
//         clear() {
//             cache = new Map();
//             currentSize = 0;
//         },
//         get_used_size() {
//             return currentSize;
//         },
//         get_cache_size() {
//             return cache_size;
//         }
//     };
// }

// normalized version, which is unstable due to floating points

export function hybrid_cost_lru_cache(cache_size = 10 * 1024 * 1024, lruWeight = 0.2) {
    let cache = new Map();
    let currentSize = 0;

    function evict() {
        let evictKey = null;
        let bestScore = Infinity;


        // First pass: calculate min/max values for normalization
        let minCost = Infinity, maxCost = -Infinity;
        let minTime = Infinity, maxTime = -Infinity;
        
        for (const [, entry] of cache) {
            const latency = parseInt(entry.value.Latency, 10) || 1;
            const size = parseInt(entry.size, 10) || 1;
            const costScore = latency / size;
            const timestamp = entry.timestamp;
            
            minCost = Math.min(minCost, costScore);
            maxCost = Math.max(maxCost, costScore);
            minTime = Math.min(minTime, timestamp);
            maxTime = Math.max(maxTime, timestamp);
        }
        
        // Avoid division by zero with fallbacks
        const costRange = (maxCost - minCost) || 1;
        const timeRange = (maxTime - minTime) || 1;
        
        // Second pass: calculate normalized scores and find best eviction candidate
        for (const [key, entry] of cache) {
            const latency = parseInt(entry.value.Latency, 10) || 1;
            const size = parseInt(entry.size, 10) || 1;
            const timestamp = entry.timestamp;
            
            const rawCostScore = latency / size;
            
            // Normalize both factors to 0-1 range
            // For cost: higher cost = lower normalized score (we want to keep high value items)
            // For time: higher timestamp = higher normalized score (we want to keep recent items)
            const normCost = (rawCostScore - minCost) / costRange;
            const normTime = (timestamp - minTime) / timeRange;
            
            // Combine scores: low combined score = evict first
            const combinedScore = 
                (1 - lruWeight) * normCost + lruWeight * normTime;
            
            if (combinedScore < bestScore) {
                bestScore = combinedScore;
                evictKey = key;
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
                entry.timestamp = performance.now(); // update access time
                return entry.value;
            }
            return null;
        },
        set(key, value, size) {
            if (typeof size !== 'number' || size <= 0) {
                throw new Error("Size must be a positive number");
            }

            while (currentSize + size > cache_size) {
                if (!evict()) break;
            }

            if (currentSize + size > cache_size) return;

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