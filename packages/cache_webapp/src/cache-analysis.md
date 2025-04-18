---
theme: dashboard
title: Cache Analysis
toc: false
---

# Cache Log Analysis

<!-- Allow users to upload Json file -->
```js
import { FileAttachment } from "observablehq:stdlib";
import { lru_cache } from "./components/lru.js";
import { cost_based_lru_cache } from "./components/costlru.js"
import { latency_based_cache } from "./components/latencycache.js"
import { size_based_cache } from "./components/sizecache.js"
import { hybrid_cost_lru_cache } from "./components/cost+age.js"
import {
 cache_hit,
 cache_repeat_hit,
 cache_hit_graph,
 cache_repeat_hit_graph,
 cache_repeat_latency_saved_graph,
 cache_used_graph,
 find_max_cache_size,
 prase_logs_with_cache
} from "./components/cache_analysis_helper.js";
```
<hr>

### Select/Upload Cache File

```js

const algoList = [
  ["LRU Cache", lru_cache],
  ["Cost-Based Cache (latency per size)", cost_based_lru_cache],
  ["Size-based Cache", size_based_cache],
  ["Latency-based Cache", latency_based_cache],
  ["Cost + LRU cache", hybrid_cost_lru_cache]
]

let fileList = [
  FileAttachment("data/test1.json"),
  FileAttachment("data/test2.json"),
  FileAttachment("data/test3.json"),
  FileAttachment("data/cache.json"),
  FileAttachment("data/cache_singlePage.json"),
  FileAttachment("data/cache_multiplePage.json"),
  FileAttachment("data/cache_single+multiple.json"),
  FileAttachment("data/cache_multitplePage2.json"),

]

const jsonfile = view(Inputs.select(fileList, {
  format: (d) => d.name,
  label: "Currently File"
}));

// const jsonfile = view(Inputs.file({label: "Cache Log File", accept: ".json", required: true}));
```

```js

const cacheTypes = {
  "LRU Cache": lru_cache,
  "Cost-Based Cache (latency per size)": cost_based_lru_cache,
  "Size-based Cache": size_based_cache,
  "Latency-based Cache": latency_based_cache
};

const selectedCache = view(Inputs.select(Object.keys(cacheTypes), {
  label: "Cache Algorithm"}));

```

```js
let max_cache_size = find_max_cache_size(jsonfile.json());
```

```js

const cacheAlgo = cacheTypes[selectedCache]
```

<hr>

### weights

```js
const lruWeight = view(Inputs.range([0, 1], {step: 0.01, label: "lru weight", value: 0.2}));
```

<div class="grid grid-cols-2">
 <div class="card">
   <h2>Cache Size v.s. Hit Rate (${selectedCache})</h2>
   <br></br>
   ${resize((width) => cache_hit_graph(jsonfile.json(), max_cache_size, algoList, {width}, lruWeight))}
 </div>

 <div class="card">
   <h2>Cache Size v.s. Repeated Query Hit Rate</h2>
   <br></br>
   ${resize((width) => cache_repeat_hit_graph(jsonfile.json(), max_cache_size, algoList, {width}, lruWeight))}
 </div>

  <div class="card">
   <h2>Cache Size v.s. Time saved</h2>
   <br></br>
   ${resize((width) => cache_repeat_latency_saved_graph(jsonfile.json(), max_cache_size, algoList, {width}, lruWeight))}
 </div>
</div>

<hr>

### Plots Based On Cache Size

```js
const cache_size = view(Inputs.range([0, max_cache_size], {step: 1, label: "Cache Size (kb)", value: max_cache_size}));
```

```js
Inputs.table(prase_logs_with_cache(jsonfile.json(), cacheAlgo(cache_size)), {
 width: {
   Index: 50,
   Type: 50,
   Timestamp: 200,
   Latency: 50,
   Size: 50,
   CacheStatus: 100
 }
})
```

<div class="grid grid-cols-3">
 <div class="card">
   <h2>Hit Rate:</h2>
   <span class="big"> --total hit rate (hit/total query): ${cache_hit(jsonfile.json(), cacheAlgo(cache_size), 2)} </span> </br> </br>
   <span class="big">--repeated hit rate (repeat query hit/total repeat query) ${cache_repeat_hit(jsonfile.json(), cacheAlgo(cache_size), 2)}</span>
 </div>
</div>

<div class="grid grid-cols-1">
 <div class="card">
   <h2>Cache Used Rate:</h2>
   <span class="big">${cache_used_graph(jsonfile.json(), cacheAlgo(cache_size))}</span>
 </div>
</div>