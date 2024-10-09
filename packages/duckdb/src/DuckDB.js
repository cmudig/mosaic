import duckdb from 'duckdb';
import { mergeBuffers } from './merge-buffers.js';

const TEMP_DIR = '.duckdb';

const DEFAULT_INIT_STATEMENTS = [
  `PRAGMA temp_directory='${TEMP_DIR}'`,
  `INSTALL arrow`,
  `INSTALL httpfs`,
  `LOAD arrow`,
  `LOAD httpfs`
].join(';\n');

export class DuckDB {
  constructor(
    path = ':memory:',
    config = {},
    initStatements = DEFAULT_INIT_STATEMENTS
  ) {
    this.db = new duckdb.Database(path, config);
		this.preparedStatements = new Map;
    this.con = this.db.connect();
    this.exec(initStatements);
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  prepare(sql) {
		let statement = this.preparedStatements.get(sql);
		if (statement) return statement;
		const query = "SELECT * FROM to_arrow_ipc((" + sql + "));";
		statement = new DuckDBStatement(this.con.prepare(sql), this.con.prepare(query));
		this.preparedStatements.set(sql, statement);
    return statement;
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.con.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  query(sql) {
    return new Promise((resolve, reject) => {
      this.con.all(sql, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  arrowBuffer(sql) {
    return new Promise((resolve, reject) => {
      this.con.arrowIPCAll(sql, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(mergeBuffers(result));
        }
      });
    });
  }
}

export class DuckDBStatement {
  constructor(statement, arrowStatement) {
    this.statement = statement;
		// We need another statement ot handle arrow calls, https://github.com/duckdb/duckdb-node/issues/113
		this.arrowStatement = arrowStatement;
  }

  finalize() {
    this.statement.finalize();
  }

  run(params) {
    this.statement.run(...params);
  }

  exec(params) {
    return new Promise((resolve, reject) => {
      this.statement.run(...params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  query(params) {
    return new Promise((resolve, reject) => {
      this.statement.all(...params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  arrowBuffer(params) {
    return new Promise((resolve, reject) => {
      this.arrowStatement.arrowIPCAll(...params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(mergeBuffers(result));
        }
      });
    });
  }
}
