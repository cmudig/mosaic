---
theme: dashboard
title: Cache Analysis
toc: false
---

# Cache Log Analysis

<!-- Allow users to upload Json file -->
```js
import {cache_analysis, lru_cache} from "./components/lru.js";
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
let analysis_result = cache_analysis(jsonfile.json(), lru_cache(cache_size));
```

<div class="grid grid-cols-3">
  <div class="card">
    <h2>Hit Rate:</h2>
    <span class="big">${cache_analysis(jsonfile.json(), lru_cache(cache_size))}</span>
  </div>
</div>