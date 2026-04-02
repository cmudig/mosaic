# vgplot-python

Python API package for Mosaic, including:

- schema wrapper generation from the Mosaic JSON schema
- API modules in `api/` for constructing Python specs
- tests for generated classes and spec round-tripping

## Prerequisites

- Python `>=3.9`
- `uv` installed
- run commands from `packages/vgplot-python`

## Install Dev Dependencies

```bash
uv sync --group dev
```

## Generate Schema Wrapper Classes

Regenerate `schema_wrapper/generated_classes.py` using the schema version pinned in `schema_wrapper/generate_schema_wrapper.py`:

```bash
uv run generate-schema-wrapper
```

## Run Tests

Run all tests (same scope as CI for this package):

```bash
uv run --group dev pytest test/ --cov=schema_wrapper --cov-report=term-missing
```

Run only the round-trip test:

```bash
uv run --group dev pytest test/test_full_round_trip.py -q
```

(round-trip tests import specs from `specs/python-new` and compare against `specs/json`)

## Lint and Format

```bash
uv run --group dev ruff check
uv run --group dev ruff format
```

## Type Checking

```bash
uv run --group dev mypy
```

## Notebook Exploration

```bash
uv run --group dev jupyter lab
```

If necessary, create a local notebook in this directory for interactive experimentation.