import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '../../src/util/decode-ipc.js';

export function nodeConnector(db = new DuckDB()) {
  return {
    /**
     * Query an in-process DuckDB instance.
     * @param {object} query
     * @param {string} [query.type] The query type: 'exec', 'arrow', or 'json'.
     * @param {string} query.sql A SQL query string.
     * @returns the query result
     */
    query: async query => {
      const { type, sql, params } = query;
			let statement;
			if (params) {
				statement = db.prepare(sql);
			}
      switch (type) {
        case 'exec':
          return db.exec(sql);
        case 'arrow':
					if (statement) {
						return decodeIPC(await statement.arrowBuffer(params));
					} else {
						return decodeIPC(await db.arrowBuffer(sql));
					}
          // return decodeIPC(await statement?.arrowBuffer.bind(statement, params) ?? db.arrowBuffer.bind(db, sql));
        default:
          return db.query(sql);
      }
    }
  };
}
