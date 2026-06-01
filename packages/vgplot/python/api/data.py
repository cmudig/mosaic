from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


# ---------------------------------------------------------------------------
# Global data registry
# ---------------------------------------------------------------------------

_registry: Dict[str, Any] = {}
_default_connection: Any = None


def register(name: str, frame: Any) -> str:
    """Register an in-memory DataFrame under *name* and return that name.

    The returned string can be passed directly to marks as the ``data``
    argument.  ``MosaicWidget`` will pick it up automatically via
    ``get_registry()`` and register it with DuckDB.

    Supports polars, pandas, and pyarrow objects::

        athletes = vg.register("athletes", pl.read_parquet("athletes.parquet"))
        view = vg.plot(vg.dot(athletes, x="weight", y="height"), vg.width(600))
        MosaicWidget(view)
    """
    _registry[name] = frame
    return name


def get_registry() -> Dict[str, Any]:
    """Return a *copy* of all registered frames."""
    return dict(_registry)


def clear_registry() -> None:
    """Remove all registered frames."""
    _registry.clear()


def set_default_connection(con: Any) -> None:
    """Set the default DuckDB connection for widgets."""
    global _default_connection
    _default_connection = con


def get_default_connection() -> Any:
    """Return the default connection, or ``None``."""
    return _default_connection


# ---------------------------------------------------------------------------
# Data definitions (file-based / SQL-based)
# ---------------------------------------------------------------------------

@dataclass
class DataDef:
    payload: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return self.payload


def parquet(file: str, select: Any = None, where: Any = None, **kwargs: Any) -> DataDef:
    payload: Dict[str, Any] = {"type": "parquet", "file": file}
    if select is not None:
        payload["select"] = select
    if where is not None:
        payload["where"] = where
    payload.update(kwargs)
    return DataDef(payload)


def csv(file: str, **kwargs: Any) -> DataDef:
    return DataDef({"type": "csv", "file": file, **kwargs})


def spatial(file: str, layer: str | None = None, **kwargs: Any) -> DataDef:
    payload: Dict[str, Any] = {"type": "spatial", "file": file}
    if layer is not None:
        payload["layer"] = layer
    payload.update(kwargs)
    return DataDef(payload)


def table(query: str) -> DataDef:
    return DataDef({"type": "table", "query": query})


def data(**named_defs: DataDef) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in named_defs.items():
        out[k] = v.to_dict() if hasattr(v, "to_dict") else v
    return out
