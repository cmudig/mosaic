import { describe, it, expect } from 'vitest';
import { Query, add, argmax, argmin, avg, corr, count, covarPop, covariance, geomean, gt, isNotDistinct, literal, loadObjects, max, min, mul, product, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSXX, regrSXY, regrSYY, regrSlope, stddev, stddevPop, sum, varPop, variance } from '@uwdata/mosaic-sql';
import { Coordinator, Selection, SelectionClause } from '../src/index.js';
import { nodeConnector } from './util/node-connector.js';
import { TestClient } from './util/test-client.js';

async function setup(loadQuery) {
  const mc = new Coordinator(nodeConnector(), {
    logger: null,
    cache: false,
    consolidate: false
  });
  await mc.exec(loadQuery);
  return mc;
}

type Datum = { measure: number };

async function run(measure): Promise<[number, boolean]> {
  const loadQuery = loadObjects('testData', [
    { dim: 'a', x: 1, y: 9 },
    { dim: 'a', x: 2, y: 8 },
    { dim: 'b', x: 3, y: 7 },
    { dim: 'b', x: 4, y: 6 },
    { dim: 'b', x: null, y: null }
  ]);
  const mc = await setup(loadQuery);
  const sel = Selection.single({ cross: true });

  return new Promise((resolve) => {
    let iter = 0;
    const client = new TestClient(null, sel, {
      query(filter = []) {
        return typeof measure === 'function'
          ? measure(filter)
          : Query.from('testData').select({ measure }).where(filter);
      },
      queryResult(data: unknown) {
        if (iter) {
          resolve([
            (Array.from(data as Iterable<Datum>))[0].measure, // query result
            !!mc.preaggregator.entries.get(this) // optimized?
          ]);
        }
        ++iter;
      }
    });
    mc.connect(client);
    client.pending.then(() => {
      sel.update({
        source: 'test',
        meta: { type: 'point' },
        predicate: isNotDistinct('dim', literal('b'))
      } as unknown as SelectionClause);
    });
  });
}

describe('PreAggregator', () => {
  it('supports count aggregate', async () => {
    expect(await run(count())).toStrictEqual([3, true]);
    expect(await run(count('x'))).toStrictEqual([2, true]);
  });

  it('supports empty count aggregate', async () => {
    const query = (predicate = []) => {
      return Query.from('testData')
        .select({ measure: count() })
        .where(predicate, false);
    };
    expect(await run(query)).toStrictEqual([0, true]);
  });

  it('supports sum aggregate', async () => {
    expect(await run(sum('x'))).toStrictEqual([7, true]);
  });

  it('supports avg aggregate', async () => {
    expect(await run(avg('x'))).toStrictEqual([3.5, true]);
  });

  it('supports geomean aggregate', async () => {
    const [result, optimized] = await run(geomean('x'));

    expect(result).toBeCloseTo(Math.sqrt(12), 10);
    expect(optimized).toBe(true);
  });

  it('supports min aggregate', async () => {
    expect(await run(min('x'))).toStrictEqual([3, true]);
  });

  it('supports max aggregate', async () => {
    expect(await run(max('x'))).toStrictEqual([4, true]);
  });

  it('supports product aggregate', async () => {
    expect(await run(product('x'))).toStrictEqual([12, true]);
  });

  it('supports argmax aggregate', async () => {
    expect(await run(argmax('dim', 'x'))).toStrictEqual(['b', true]);
  });

  it('supports argmin aggregate', async () => {
    expect(await run(argmin('dim', 'x'))).toStrictEqual(['b', true]);
  });

  it('supports variance aggregate', async () => {
    expect(await run(variance('x'))).toStrictEqual([0.5, true]);
  });

  it('supports varPop aggregate', async () => {
    expect(await run(varPop('x'))).toStrictEqual([0.25, true]);
  });

  it('supports stddev aggregate', async () => {
    expect(await run(stddev('x'))).toStrictEqual([Math.sqrt(0.5), true]);
  });

  it('supports stddevPop aggregate', async () => {
    expect(await run(stddevPop('x'))).toStrictEqual([Math.sqrt(0.25), true]);
  });

  it('supports covariance aggregate', async () => {
    expect(await run(covariance('x', 'y'))).toStrictEqual([-0.5, true]);
    expect(await run(covariance('y', 'x'))).toStrictEqual([-0.5, true]);
  });

  it('supports covarPop aggregate', async () => {
    expect(await run(covarPop('x', 'y'))).toStrictEqual([-0.25, true]);
    expect(await run(covarPop('y', 'x'))).toStrictEqual([-0.25, true]);
  });

  it('supports corr aggregate', async () => {
    expect(await run(corr('x', 'y'))).toStrictEqual([-1, true]);
    expect(await run(corr('y', 'x'))).toStrictEqual([-1, true]);
  });

  it('supports regression aggregates', async () => {
    expect(await run(regrCount('y', 'x'))).toStrictEqual([2, true]);
    expect(await run(regrAvgX('y', 'x'))).toStrictEqual([3.5, true]);
    expect(await run(regrAvgY('y', 'x'))).toStrictEqual([6.5, true]);
    expect(await run(regrSXX('y', 'x'))).toStrictEqual([0.5, true]);
    expect(await run(regrSYY('y', 'x'))).toStrictEqual([0.5, true]);
    expect(await run(regrSXY('y', 'x'))).toStrictEqual([-0.5, true]);
    expect(await run(regrSlope('y', 'x'))).toStrictEqual([-1, true]);
    expect(await run(regrIntercept('y', 'x'))).toStrictEqual([10, true]);
    expect(await run(regrR2('y', 'x'))).toStrictEqual([1, true]);
  });

  it('supports multi-aggregate expressions', async () => {
    expect(await run(add(sum('x'), product('x')))).toStrictEqual([19, true]);
  });

  it('supports aggregate filter clause', async () => {
    expect(await run(sum('x').where(gt('x', 2)))).toStrictEqual([7, true]);
    expect(await run(sum('x').where(gt('x', 3)))).toStrictEqual([4, true]);
    expect(await run(sum('x').where(gt('x', 4)))).toStrictEqual([null, true]);
  });

  it('does not support distinct aggregates', async () => {
    // should handle query, but through non-optimized route
    expect(await run(count('x').distinct())).toStrictEqual([2, false]);
  });

  it('supports subqueries with aggregates', async () => {
    const query = (predicate = []) => {
      const counts = Query.from('testData')
        .select({ item: 'x', freq: count() })
        .groupby('x')
        .where(predicate);
      return Query.with({ counts })
        .from('counts')
        .select({ measure: sum(mul(2, 'freq')) })
        .groupby('item');
    };
    expect(await run(query)).toStrictEqual([6, true]);

    const queryNoGroup = (predicate = []) => {
      const counts = Query.from('testData')
        .select({ freq: count() })
        .where(predicate);
      return Query.with({ counts })
        .from('counts')
        .select({ measure: add(1, sum('freq')) });
    };
    expect(await run(queryNoGroup)).toStrictEqual([4, true]);
  });
});
