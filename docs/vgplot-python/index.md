---
title: Mosaic vgplot (Python)
---
<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# vgplot in Python

Mosaic vgplot is a grammar of interactive graphics: each mark is a Mosaic client that queries data through the coordinator. In Python, `import mosaic.vgplot as vg` gives you composable helpers for plots, attributes, marks, interactors, legends, and layout. Names use **snake_case**; Python keywords are escaped with a trailing underscore (`from_`, `as_`, `for_`).

The interactive figure below is driven by the same [declarative specification](/spec/) used across Mosaic (YAML in the docs site). In notebooks you usually pass an equivalent structure as a dict—built with `vg.*` helpers, loaded from YAML/JSON, or produced by your own tooling—to [`MosaicWidget`](/jupyter/) as `spec`.

More copy-paste examples live under [Examples](/examples/) (open the **Python** tab on each page).

::: tip
The fastest path in Jupyter is often YAML or JSON plus `MosaicWidget(spec=..., data=...)`. Use `mosaic.vgplot` when you want to assemble or adjust specs in code. Option names match the [specification format](/api/spec/format); builder helpers line up with those names in snake_case.
:::

## Plots

`vg.plot` takes a sequence of directives: [attributes](#attributes), [marks](#marks), [interactors](#interactors), and [legends](#legends).

Each plot uses [Observable Plot](https://observablehq.com/plot/)–style _channels_ (`x`, `y`, `fill`, `opacity`, …) and optional faceting scales `fx` and `fy`. The widget renders charts in the browser as SVG.

<Example spec="/specs/yaml/line.yaml" />


``` python
import mosaic.vgplot as vg

vg.plot(
    vg.line_y(data=vg.from_("aapl"), x="Date", y="Close"),
    vg.width(680),
    vg.height(200)
)
```


This chart uses three directives:

1. A `line_y` mark with `data=vg.from_("aapl")`.
2. `vg.width(680)`.
3. `vg.height(200)`.

[Plot reference](/api/vgplot/plot)

## Attributes

_Attributes_ set plot-level options: size, margins, and scales (`x_domain`, `color_range`, `y_tick_format`, …) via helpers such as `vg.x_domain(...)`, `vg.color_range(...)`, `vg.y_tick_format(...)`. Param references like `"$point"` tie encodings to widget state.

**`Fixed`** domains (e.g. `vg.x_domain(vg.Fixed)`) compute an initial domain from data, then freeze it so filtered views do not rescale in a distracting way.

[Attributes reference](/api/vgplot/attributes)

## Marks

_Marks_ are layers backed by Mosaic queries. They usually take `data=vg.from_("table")` plus channel options. Fields may be columns, SQL fragments, or param strings.

You can pass static rows instead of `from_` for annotations; that path skips the database and does not participate in linked filtering.

[Marks reference](/api/vgplot/marks)

::: warning
Interactive filtering requires data that flows through the coordinator (typically `from_` / registered tables), not ad hoc Python lists alone.
:::

### Basic marks

Primitives include `dot`, `bar`, `rect`, `cell`, `text`, `tick`, and `rule`, consistent with Observable Plot. Oriented variants appear as `bar_x`, `bar_y`, `rect_x`, `rect_y`, and so on—the YAML `mark` string (e.g. `barY`) corresponds to `vg.bar_y(...)`.

Query planning walks channels to build `SELECT`, adds `GROUP BY` when aggregates appear, and applies `WHERE` for active selections.

### Connected marks

`area` and `line` marks connect ordered samples (`vg.area_y`, `vg.line_y`, …). Large series can use M4-style pixel-aware downsampling so draw cost stays bounded.

`regression_y` computes fits and optional intervals in the database, then draws the line and band.

### Geography and geometry

`geo` draws GeoJSON geometry, either inlined or loaded through DuckDB (including the `spatial` extension).

### Density marks

`density_y` is 1D KDE. `density`, `contour`, `heatmap`, and `raster` cover 2D surfaces; `hexbin` aggregates hex cells in SQL; `dense_line` estimates density along polylines. Bandwidth and smoothing options follow the declarative spec.

## Interactors

_Interactors_ connect pointer input to [_selections_](/core/#selections). Helpers include `toggle`, `toggle_color`, `toggle_x`, `toggle_y`, `nearest_x`, `nearest_y`, `interval_x`, `interval_y`, `interval_xy` (with `pixel_size` where applicable), `pan_zoom`, and `highlight`.

Wiring `pan_zoom` selections into `x_domain` / `y_domain` (or equivalent scale bindings) implements pan and zoom.

[Interactors reference](/api/vgplot/interactors)

## Legends

Legends attach inside `vg.plot` or as separate elements. Naming a plot lets another legend reuse its scales, e.g. `vg.color_legend(for_="my_plot")` (the underscore avoids the Python keyword `for`).

Discrete color legends can drive the same toggle-style selection behavior as point interactors.

[Legends reference](/api/vgplot/legends)

## Layout

`vg.vconcat`, `vg.hconcat`, `vg.vspace`, and `vg.hspace` compose plots, [inputs](/inputs/), and spacing. The runtime lays out children with flexbox.

Full apps often call `vg.spec(meta=..., data=..., params=..., view=...)` so the result is a single top-level spec object (the same shape as JSON/YAML on disk).

[Layout reference](/api/vgplot/layout)

## Related documentation

- [Mosaic spec](/spec/) — portable JSON/YAML format shared by Python and the docs examples.
- [Specification format reference](/api/spec/format) — schema-oriented description of top-level keys and marks.
- [vgplot under **API Reference**](/api/) — detailed plot, mark, interactor, and layout pages. Option names there appear in **camelCase** (e.g. `lineY`, `xDomain`); in Python, use **snake_case** (`line_y`, `x_domain`).
