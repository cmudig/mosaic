---
theme: dashboard
title: Cache Analysis
toc: false
---

# Cache Log Analysis

<!-- Allow users to upload Json file -->
```js
import {cache_hit, find_max_cache_size, lru_cache, cache_used_graph, cache_hit_graph} from "./components/lru.js";
```

```js
const jsonfile = view(Inputs.file({label: "Cache Log File", accept: ".json", required: true}));
```

```js
Inputs.table(jsonfile.json(), {
  width: {
    Index: 50,
    Type: 50,
    Timestamp: 200,
    Latency: 50,
    Size: 50
  }
})
```

```js
const cache_size = view(Inputs.number([0, Infinity], {step: 1, label: "Cache Size (kb)", value: 10240}));
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


```js
let max_cache_size = find_max_cache_size(jsonfile.json());
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Cache Size v.s. Hit Rate</h2>
    <br></br>
    ${resize((width) => cache_hit_graph(jsonfile.json(), max_cache_size, {width}))}
  </div>
</div>