// Tests that every JSON spec round-trips correctly:
// 1. JSON -> parseSpec -> toJSON produces identical JSON (parse roundtrip)
// 2. JSON -> parseSpec -> astToESM matches the ESM fixture in specs/esm/
// 3. JSON, ESM, and Python example sets stay in sync (same filenames)
//
// This mirrors the Python roundtrip test in:
//   packages/vgplot/vgplot-python/test/test_full_round_trip.py
//
// Run: pnpm --filter @uwdata/mosaic-spec test

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { astToESM, parseSpec } from '../src/index.js';

const BASE = join(__dirname, '../../../../specs');
const JSON_DIR = join(BASE, 'json');
const ESM_DIR = join(BASE, 'esm');
const PYTHON_DIR = join(BASE, 'python');

async function listNames(dir, ext) {
  const files = await readdir(dir);
  return files
    .filter(f => f.endsWith(ext))
    .map(f => f.slice(0, -ext.length))
    .sort();
}

const jsonNames = await listNames(JSON_DIR, '.json');
const esmNames = await listNames(ESM_DIR, '.js');
const pythonNames = await listNames(PYTHON_DIR, '.py');

async function loadJSONSpec(name) {
  const text = await readFile(join(JSON_DIR, `${name}.json`), 'utf8');
  return JSON.parse(text);
}

async function loadESMFixture(name) {
  return readFile(join(ESM_DIR, `${name}.js`), 'utf8');
}

describe('Generated examples stay in sync', () => {
  it('ESM and JSON directories have the same specs', () => {
    expect(esmNames).toEqual(jsonNames);
  });

  it('Python and JSON directories have the same specs', () => {
    expect(pythonNames).toEqual(jsonNames);
  });
});

describe('JSON round-trip', () => {
  for (const name of jsonNames) {
    it(`${name}: JSON -> parseSpec -> toJSON matches original`, async () => {
      const original = await loadJSONSpec(name);
      const ast = parseSpec(original);
      const roundTripped = ast.toJSON();

      expect(roundTripped).toEqual(original);
    });
  }
});

describe('JSON -> ESM generation', () => {
  for (const name of jsonNames) {
    it(`${name}: JSON -> parseSpec -> astToESM matches ESM fixture`, async () => {
      const spec = await loadJSONSpec(name);
      const ast = parseSpec(spec);
      const generatedESM = astToESM(ast);
      const expectedESM = await loadESMFixture(name);

      expect(generatedESM).toBe(expectedESM);
    });
  }
});
