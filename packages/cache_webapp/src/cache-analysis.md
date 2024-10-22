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
import {
 cache_hit,
 cache_hit_graph,
 cache_repeat_hit_graph,
 cache_used_graph,
 find_max_cache_size,
 prase_logs_with_cache
} from "./components/cache_analysis_helper.js";
```
<hr>

### Select/Upload Cache File

```js
let fileList = [
  FileAttachment("data/test1.json"),
  FileAttachment("data/test2.json"),
  FileAttachment("data/test3.json")
]

const jsonfile = view(Inputs.select(fileList, {
  format: (d) => d.name,
  label: "Currently File"
}));

// const jsonfile = view(Inputs.file({label: "Cache Log File", accept: ".json", required: true}));
```

```js
let max_cache_size = find_max_cache_size(jsonfile.json());
```

<div class="grid grid-cols-2">
 <div class="card">
   <h2>Cache Size v.s. Hit Rate</h2>
   <br></br>
   ${resize((width) => cache_hit_graph(jsonfile.json(), max_cache_size, lru_cache, {width}))}
 </div>
 <div class="card">
   <h2>Cache Size v.s. Repeated Query Hit Rate</h2>
   <br></br>
   ${resize((width) => cache_repeat_hit_graph(jsonfile.json(), max_cache_size, lru_cache, {width}))}
 </div>
</div>

<hr>

### Plots Based On Cache Size

```js
const cache_size = view(Inputs.range([0, max_cache_size], {step: 1, label: "Cache Size (kb)", value: max_cache_size}));
```

```js
Inputs.table(prase_logs_with_cache(jsonfile.json(), lru_cache(cache_size)), {
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
   <span class="big">${cache_hit(jsonfile.json(), lru_cache(cache_size), 2)}</span>
 </div>
</div>

<div class="grid grid-cols-1">
 <div class="card">
   <h2>Cache Used Rate:</h2>
   <span class="big">${cache_used_graph(jsonfile.json(), lru_cache(cache_size))}</span>
 </div>
</div>