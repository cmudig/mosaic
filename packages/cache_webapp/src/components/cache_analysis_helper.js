import * as Plot from "npm:@observablehq/plot";

// For each logs from the input, based on the cache add another field inside the 
// dict to indicate whether the query is hit/miss
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

// Calculate the hit ratio for a list of queries and specific cache
// Note: in this case hit ratio = hit count / total count
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

// Calculate the hit ratio (only for repeated queries) for a list of queries
// and specific cache
export function cache_repeat_hit_2(logs_promise, cache, limit = null) {
    return logs_promise.then(logs => {
        let total_repeated_queries = 0;
        let cached_repeated_queries = 0;
        let latencySaved = 0;
        let seen = new Set();

        for (const log of logs) {
            let cached = cache.get(log.Query);

            if (seen.has(log.Query)) {
                total_repeated_queries += 1;
                if (cached) {
                    cached_repeated_queries += 1;
                    latencySaved += parseFloat(log.Latency) || 0; // Accumulate saved latency
                }
            }

            if (!cached) {
                cache.set(log.Query, log, parseInt(log.Size, 10));
            }
            seen.add(log.Query);
        }

        let hitRate = total_repeated_queries > 0 ? (cached_repeated_queries / total_repeated_queries) : 0;
        if (limit) {
            hitRate = parseFloat(hitRate.toFixed(limit));
        }

        return { hitRate, latencySaved };
    });
}


export function cache_repeat_hit(logs_promise, cache, limit = null) {
    return logs_promise.then(logs => {
        let total_repeated_queries = 0;
        let cached_repeated_queries = 0;
        let seen = new Set();
        for (const log of logs) {
            let cached = cache.get(log.Query);
            if (seen.has(log.Query)) {
                total_repeated_queries += 1;
                if (cached) {
                    cached_repeated_queries += 1;
                }
            }

            if (!cached) {
                cache.set(log.Query, log, parseInt(log.Size, 10))
            }
            seen.add(log.Query)
        }

        if (!limit) {
            return cached_repeated_queries / total_repeated_queries
        } else {
            return (cached_repeated_queries / total_repeated_queries).toFixed(limit)
        }
        
    })
    
}

// Calculate the min cache size to achieve best hit rate
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
        console.log(total_size)
        return total_size
    })
}

// Generate a graph with x axis as the cache size and y axis as the hit ratio
export async function cache_hit_graph(jsonfile, size, cacheAlgoList, {width, height} = {}, lruWeight) {
    const x_axis = Array.from({ length: 11 }, (_, i) => Math.floor((i * size) / 10));
    let allData = [];
  
    for (const [algoName, algoFn] of cacheAlgoList) {
      const data = await Promise.all(
        x_axis.map(async (xValue) => {
            if (algoName == "Cost + LRU cache") {
                const rate = await cache_hit(jsonfile, algoFn(xValue, lruWeight));
                return { x: xValue, y: rate, algo: algoName };
            }
          const rate = await cache_hit(jsonfile, algoFn(xValue));
          return { x: xValue, y: rate, algo: algoName };
        })
      );
      allData = allData.concat(data);
    }
  
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
      color: {
        legend: true,
        label: "Cache Algorithm",
      },
      marks: [
        Plot.line(allData, {x: "x", y: "y", stroke: "algo", strokeWidth: 2}),
        Plot.dot(allData, {x: "x", y: "y", fill: "algo", r: 4}),
      ]
    });
  }
  

// Generate a graph with x axis as the cache size and y axis as the hit ratio (only repeated queries)
export async function cache_repeat_hit_graph(jsonfile, size, cacheAlgoList, {width, height} = {}, lruWeight) {
    const x_axis = Array.from({ length: 11 }, (_, i) => Math.floor((i * size) / 10));
    let allData = [];

    for (const [algoName, algoFn] of cacheAlgoList) {
        const data = await Promise.all(
            x_axis.map(async (xValue) => {
                if (algoName == "Cost + LRU cache") {
                    const rate = await cache_repeat_hit(jsonfile, algoFn(xValue, lruWeight));
                    return { x: xValue, y: rate, algo: algoName };
                }
                const rate = await cache_repeat_hit(jsonfile, algoFn(xValue));
                return { x: xValue, y: rate, algo: algoName };
            })
        );
        allData = allData.concat(data);
    }

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
            label: "Cache Repeat Hit Rate",
            nice: true,
            tickFormat: ".2f",
        },
        color: {
            legend: true,
            label: "Cache Algorithm",
        },
        marks: [
            Plot.line(allData, { x: "x", y: "y", stroke: "algo", strokeWidth: 2 }),
            Plot.dot(allData, { x: "x", y: "y", fill: "algo", r: 4 }),
        ]
    });
}


// Generate a graph with x axis as the cache size and y axis as the hit ratio (only repeated queries)
// export async function cache_repeat_latency_saved_graph(jsonfile, size, lru_cache, {width, height} = {}) {
//     let x_axis = Array.from({ length: 11 }, (_, i) => Math.floor((i * size) / 10));
//     let data = await Promise.all(
//         x_axis.map(async (xValue) => {
//           const {rate, latencySaved} = await cache_repeat_hit_2(jsonfile, lru_cache(xValue));
//           return { x: xValue, y: latencySaved };
//         })
//     );
      
//     return Plot.plot({
//         width,
//         height,
//         marginTop: 30,
//         x: {
//             label: "Cache Size",
//             nice: true,
//             tickFormat: ".0f",
//           },
//           y: {
//             label: "latency saved",
//             nice: true,
//             tickFormat: ".2f",
//           },
//         marks: [
//             Plot.line(data, {x: "x", y: "y", stroke: "steelblue", strokeWidth: 2}),
//             Plot.dot(data, {x: "x", y: "y", r: 5, fill: "red", tip: true}),
//         ]
//     });
// }

export async function cache_repeat_latency_saved_graph(jsonfile, size, cacheAlgoList, {width, height} = {}, lruWeight) {
    const x_axis = Array.from({ length: 11 }, (_, i) => Math.floor((i * size) / 10));
    let allData = [];

    for (const [algoName, algoFn] of cacheAlgoList) {
        const data = await Promise.all(
            x_axis.map(async (xValue) => {
                if (algoName == "Cost + LRU cache") {
                    console.log("Weight passed: ", lruWeight, algoFn)
                    const { rate, latencySaved } = await cache_repeat_hit_2(jsonfile, algoFn(xValue, lruWeight));
                    return { x: xValue, y: latencySaved, algo: algoName };
                }
                const { rate, latencySaved } = await cache_repeat_hit_2(jsonfile, algoFn(xValue));
                return { x: xValue, y: latencySaved, algo: algoName };
            })
        );
        allData = allData.concat(data);
    }

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
            label: "Latency Saved",
            nice: true,
            tickFormat: ".2f",
        },
        color: {
            legend: true,
            label: "Cache Algorithm",
        },
        marks: [
            Plot.line(allData, { x: "x", y: "y", stroke: "algo", strokeWidth: 2 }),
            Plot.dot(allData, { x: "x", y: "y", fill: "algo", r: 4 }),
        ]
    });
}

// Generate a graph with x axis as the query index and y axis as the % of cache used
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
