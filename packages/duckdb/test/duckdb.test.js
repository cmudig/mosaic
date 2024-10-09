import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path'
import { db } from './db.js';
import { loadArrow, loadJSON } from '../src/index.js';

describe('DuckDB', () => {
  beforeAll(async () => {
    const file = path.resolve(__dirname, '../../../data/penguins.csv');
    await db.exec(`CREATE TEMP TABLE penguins AS SELECT * FROM '${file}'`);
  });

  afterAll(async () => {
    await db.exec('DROP TABLE penguins');
  });

  describe('arrowBuffer', () => {
    it('returns arrow ipc buffers', async () => {
      const buf = await db.arrowBuffer('SELECT * FROM penguins');
      expect(buf.length).toBe(22052);
    });
  });

  describe('loadArrow', () => {
    it('loads an arrow ipc buffer', async () => {
      await loadArrow(db, 'arrow', await db.arrowBuffer('SELECT * FROM penguins'));
      const res = await db.query('SELECT count()::INTEGER AS count FROM arrow');
      expect(res[0]?.count).toBe(342);
      await db.exec('DROP VIEW arrow');
    });
  });

  describe('loadJSON', () => {
    it('loads a json file', async () => {
      await loadJSON(db, 'json', path.resolve(__dirname, '../../../data/penguins.json'));
      const res = await db.query('SELECT count()::INTEGER AS count FROM json');
      expect(res[0]?.count).toBe(342);
      await db.exec('DROP TABLE json');
    });
  });

	describe('prepare', () => {
	it('can run a prepared statement', async () => {
		const statement = db.prepare('SELECT ?+? AS foo');
		const res0 = await statement.query([1,2]);
		expect(res0[0]?.foo).toBe(3);

		const res1 = await statement.query([2,3]);
		expect(res1[0]?.foo).toBe(5);
	});

	it('can run a prepared arrow statement', async () => {
		const buf0 = await db.arrowBuffer('SELECT 1+2 AS foo');
		const buf1 = await db.arrowBuffer('SELECT 2+3 AS foo');

		const statement = db.prepare('SELECT ?+? AS foo');
		const res0 = await statement.arrowBuffer([1,2]);
		expect(res0).toStrictEqual(buf0);

		const res1 = await statement.arrowBuffer([2,3]);
		expect(res1).toStrictEqual(buf1);
	});
  });
});
