import { expect, describe, it } from 'vitest';
import {
  column, desc, gt, lt, max, min, relation, sql, Query
} from '../src/index.js';
import { stubParam } from './stub-param.js';
import { NonPreparedVisitor, PreparedVisitor } from '../src/visitor.js'



describe('Query', () => {
  it('selects column name strings', () => {
    const query = { query: 'SELECT "foo", "bar", "baz" FROM "data"', params: [] };

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .from(relation('data'))
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select(['foo', 'bar', 'baz'])
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select({ foo: 'foo', bar: 'bar', baz: 'baz' })
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select('foo')
        .select('bar')
        .select('baz')
        .from('data')
        .toSQL()
    ).toStrictEqual(query);
  });

  it('selects column ref objects', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');
    const query = { query: 'SELECT "foo", "bar", "baz" FROM "data"', params: [] };

    expect(
      Query
        .select(foo, bar, baz)
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select([foo, bar, baz])
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select({ foo, bar, baz })
        .from('data')
        .toSQL()
    ).toStrictEqual(query);

    expect(
      Query
        .select(foo)
        .select(bar)
        .select(baz)
        .from('data')
        .toSQL()
    ).toStrictEqual(query);
  });

  it('selects only the most recent reference', () => {
    const query = { query: 'SELECT "baz", "foo" + 1 AS "bar" FROM "data"', params: [] };

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .select({ bar: sql`"foo" + 1`, foo: null })
        .from('data')
        .toSQL()
    ).toStrictEqual(query);
  });

  it('selects distinct columns', () => {
    expect(
      Query
        .select('foo', 'bar', 'baz')
        .distinct()
        .from('data')
        .toSQL()
        .query
    ).toBe('SELECT DISTINCT "foo", "bar", "baz" FROM "data"');
  });

  it('selects aggregates', () => {
    const foo = column('foo');

    expect(
      Query
        .select({ min: min('foo'), max: max('foo') })
        .from('data')
        .toSQL()
        .query
    ).toBe('SELECT MIN("foo") AS "min", MAX("foo") AS "max" FROM "data"');

    expect(
      Query
        .select({ min: min(foo), max: max(foo) })
        .from('data')
        .toSQL()
        .query
    ).toBe('SELECT MIN("foo") AS "min", MAX("foo") AS "max" FROM "data"');

    expect(
      Query
        .select({ min: min('foo').where(gt('bar', 5)) })
        .from('data')
        .toSQL()
        .query
    ).toBe('SELECT MIN("foo") FILTER (WHERE ("bar" > 5)) AS "min" FROM "data"');
  });

  it('selects grouped aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT MIN("foo") AS "min", MAX("foo") AS "max", "bar", "baz"',
      'FROM "data"',
      'GROUP BY "bar", "baz"'
    ].join(' ');

    expect(
      Query
        .select({ min: min('foo'), max: max('foo'), bar: 'bar', baz: 'baz' })
        .from('data')
        .groupby('bar', 'baz')
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar: bar, baz: baz })
        .from('data')
        .groupby(bar, baz)
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby([bar, baz])
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby(bar)
        .groupby(baz)
        .toSQL()
        .query
    ).toBe(query);
  });

  it('selects filtered aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT MIN("foo") AS "min", "bar"',
      'FROM "data"',
      'GROUP BY "bar"',
      'HAVING ("min" > 50) AND ("min" < 100)'
    ].join(' ');

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50), lt('min', 100))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having([gt('min', 50), lt('min', 100)])
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50))
        .having(lt('min', 100))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(sql`("min" > 50) AND ("min" < 100)`)
        .toSQL()
        .query
    ).toBe(query);
  });

  it('selects filtered rows', () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT "foo"',
      'FROM "data"',
      'WHERE ("bar" > 50) AND ("bar" < 100)'
    ].join(' ');

    // const obj_query = Query
    // .select(foo)
    // .from('data')
    // .where(gt(bar, 50), lt(bar, 100))
    // obj_query.toString()
    // obj_query.toString()
    // obj_query.toString()

    expect(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50), lt(bar, 100))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where([gt(bar, 50), lt(bar, 100)])
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50))
        .where(lt(bar, 100))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where(sql`("bar" > 50) AND ("bar" < 100)`)
        .toSQL()
        .query
    ).toBe(query);
  });

  it('selects ordered rows', () => {
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT *',
      'FROM "data"',
      'ORDER BY "bar", "baz" DESC NULLS LAST'
    ].join(' ');

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(bar, desc(baz))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby([bar, desc(baz)])
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(bar)
        .orderby(desc(baz))
        .toSQL()
        .query
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(sql`"bar", "baz" DESC NULLS LAST`)
        .toSQL()
        .query
    ).toBe(query);
  });

  it('selects sampled rows', () => {
    expect(
      Query
        .select('*')
        .from('data')
        .sample(10)
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 10 ROWS');

    expect(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 10 })
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 10 ROWS');

    expect(
      Query
        .select('*')
        .from('data')
        .sample(0.3)
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 30 PERCENT');

    expect(
      Query
        .select('*')
        .from('data')
        .sample({ perc: 30 })
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 30 PERCENT');

    expect(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 100, method: 'bernoulli' })
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 100 ROWS (bernoulli)');

    expect(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 100, method: 'bernoulli', seed: 12345 })
        .toSQL()
        .query
    ).toBe('SELECT * FROM "data" USING SAMPLE 100 ROWS (bernoulli, 12345)');
  });

  it('selects from multiple relations', () => {
    const query = [
      'SELECT "a"."foo" AS "foo", "b"."bar" AS "bar"',
      'FROM "data1" AS "a", "data2" AS "b"'
    ].join(' ');

    expect(
      Query
        .select({
          foo: column('a', 'foo'),
          bar: column('b', 'bar')
        })
        .from({ a: 'data1', b: 'data2' })
        .toSQL()
        .query
    ).toBe(query);
  });

  it('selects over windows', () => {
    expect(
      Query
        .select({ lead: sql`lead("foo") OVER "win"` })
        .from('data')
        .window({ win: sql`ORDER BY "foo" ASC` })
        .toSQL()
        .query
    ).toBe('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo" ASC)');
  });

  it('selects from subqueries', () => {
    expect(
      Query
        .select('foo', 'bar')
        .from(Query.select('*').from('data'))
        .toSQL()
        .query
    ).toBe('SELECT "foo", "bar" FROM (SELECT * FROM "data")');

    expect(
      Query
        .select('foo', 'bar')
        .from({ a: Query.select('*').from('data') })
        .toSQL()
        .query
    ).toBe('SELECT "foo", "bar" FROM (SELECT * FROM "data") AS "a"');
  });

  it('selects with common table expressions', () => {
    expect(
      Query
        .with({ a: Query.select('*').from('data') })
        .select('foo', 'bar')
        .from('a')
        .toSQL()
        .query
    ).toBe('WITH "a" AS (SELECT * FROM "data") SELECT "foo", "bar" FROM "a"');

    expect(
      Query
        .with({
          a: Query.select('foo').from('data1'),
          b: Query.select('bar').from('data2')
        })
        .select('*')
        .from('a', 'b')
        .toSQL()
        .query
    ).toBe([
      'WITH "a" AS (SELECT "foo" FROM "data1"),',
           '"b" AS (SELECT "bar" FROM "data2")',
      'SELECT * FROM "a", "b"'
    ].join(' '));
  });

  it('performs set operations', () => {
    const q = [
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
    ];
    const qstr = [ Query.select('foo', 'bar', 'baz').from('data1').toSQL().query,
      Query.select('foo', 'bar', 'baz').from('data2').toSQL().query]

    expect(Query.union(q).toSQL().query).toBe(qstr.join(' UNION '));
    expect(Query.union(...q).toSQL().query).toBe(qstr.join(' UNION '));

    expect(Query.unionAll(q).toSQL().query).toBe(qstr.join(' UNION ALL '));
    expect(Query.unionAll(...q).toSQL().query).toBe(qstr.join(' UNION ALL '));

    expect(Query.intersect(q).toSQL().query).toBe(qstr.join(' INTERSECT '));
    expect(Query.intersect(...q).toSQL().query).toBe(qstr.join(' INTERSECT '));

    expect(Query.except(q).toSQL().query).toBe(qstr.join(' EXCEPT '));
    expect(Query.except(...q).toSQL().query).toBe(qstr.join(' EXCEPT '));
  });

  it('supports describe queries', () => {
    const q = Query.select('foo', 'bar').from('data');
    expect(Query.describe(q).toSQL().query).toBe(`DESCRIBE ${q.toSQL().query}`);

    const u = Query.unionAll(
      Query.select('foo', 'bar').from('data1'),
      Query.select('foo', 'bar').from('data2')
    );
    expect(Query.describe(u).toSQL().query).toBe(`DESCRIBE ${u.toSQL().query}`);
  });
});

it('perpared test 1', () => {
  const foo = column('foo');
  const bar = column('bar');
  const param1 = stubParam(50);
  const param2 = stubParam(100);

  const query = [
    'SELECT MIN("foo") AS "min", "bar"',
    'FROM "data"',
    'GROUP BY "bar"',
    'HAVING ("min" > 50) AND ("min" < 100)'
  ].join(' ');

  const preparedQueryString = [
    'SELECT MIN("foo") AS "min", "bar"',
    'FROM "data"',
    'GROUP BY "bar"',
    'HAVING ("min" > ?) AND ("min" < ?)'
  ].join(' ');

  const preparedQuery = {
    query: preparedQueryString,
    params: [50, 100]
  }

  expect(
    Query
      .select({ min: min(foo), bar })
      .from('data')
      .groupby(bar)
      .having(gt('min', param1), lt('min', param2))
      .toSQL()
      .query
  ).toBe(query);

  // prepared set to true
  expect(
    Query
      .select({ min: min(foo), bar })
      .from('data')
      .groupby(bar)
      .having(gt('min', param1), lt('min', param2))
      .toSQL(new PreparedVisitor())
  ).toStrictEqual(preparedQuery);
})

it('nested prepared', () => {
  const foo = column('foo');
  const bar = column('bar');
  const param1 = stubParam(50);
  const param2 = stubParam(100);
  const param3 = stubParam(10);
  const param4 = stubParam(20);

  const query = [
    'SELECT MIN("foo") AS "min", "bar"',
    'FROM "data"',
    'GROUP BY "bar"',
    'HAVING ("min" > ?) AND ("min" < ?)'
  ].join(' ');

  const nestedQuery = [
    'SELECT MIN("foo") AS "min", "bar"',
    `FROM (${query})`,
    'GROUP BY "bar"',
    'HAVING ("min" > ?) AND ("min" < ?)'
  ].join(' ');

  const result = { query: nestedQuery, params: [50, 100, 10, 20] }

  expect(
    Query
      .select({ min: min(foo), bar })
      .from(Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', param1), lt('min', param2)))
      .groupby(bar)
      .having(gt('min', param3), lt('min', param4))
      .toSQL(new PreparedVisitor())
  ).toStrictEqual(result);

  expect(
    Query
      .select({ min: min(foo), bar })
      .from(Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', param1), lt('min', param2)))
      .groupby(bar)
      .having([gt('min', param3), lt('min', param4)])
      .toSQL(new PreparedVisitor())
  ).toStrictEqual(result);

})
