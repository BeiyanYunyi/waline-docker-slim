import thinkInstance from "think-instance";
import { DatabaseSync } from "node:sqlite";
import assert from "assert";
import helper from "think-helper";
import path from "path";
import Debounce from "think-debounce";

interface ISqlOptions {
  execute: boolean;
  sql: string;
  debounce?: boolean;
}

const defaultOptions = {
  logger:
    console.log.bind(
      console
    ) /* eslint no-console: ["error", { allow: ["log"] }] */,
  logConnect: true,
};

class SQLiteSocket {
  debounceInstance: Debounce;
  config: Record<string, unknown>;
  savePath: string;
  db: DatabaseSync;

  constructor(config = {}) {
    // different socket may connect to different db,so use independent debounce instance
    this.debounceInstance = new Debounce();
    this.config = Object.assign({}, defaultOptions, config);
    let savePath = this.config.path as string | boolean;
    if (savePath === true || savePath === ":memory:") {
      savePath = ":memory:";
    } else {
      assert(savePath, "config.path must be set");
      helper.mkdir(savePath);
      savePath = path.join(savePath, `${this.config.database}.sqlite`);
    }
    this.savePath = savePath;
    this.db = new DatabaseSync(this.savePath);
    if (this.config.logConnect) {
      this.config.logger(`sqlite:${this.savePath}`);
    }
  }

  /**
   * query data
   */
  private _query(sqlOptions: ISqlOptions, startTime: number) {
    const connection = this.db;

    let data = null;
    if (sqlOptions.execute) {
      const result = connection.prepare(sqlOptions.sql).run();
      data = {
        insertId: result.lastInsertRowid,
        affectedRows: result.changes,
      };
    } else {
      const stmt = connection.prepare(sqlOptions.sql);
      data = stmt.all();
    }

    // log sql
    if (this.config.logSql) {
      const endTime = Date.now();
      this.config.logger(
        `SQL: ${sqlOptions.sql}, Time: ${endTime - startTime}ms`
      );
    }

    return Promise.resolve(data);
  }

  /**
   * query
   * @param {Object} sqlOptions
   */
  query(sqlOptions: ISqlOptions) {
    if (helper.isString(sqlOptions)) {
      sqlOptions = { sql: sqlOptions };
    }
    if (sqlOptions.debounce === undefined) {
      if (this.config.debounce !== undefined) {
        sqlOptions.debounce = this.config.debounce as boolean;
      } else {
        sqlOptions.debounce = true;
      }
    }
    const startTime = Date.now();
    if (sqlOptions.debounce) {
      const key = JSON.stringify(sqlOptions);
      return this.debounceInstance.debounce(key, () => {
        return this._query(sqlOptions, startTime);
      });
    } else {
      return this._query(sqlOptions, startTime);
    }
  }

  /**
   * execute
   * @returns {Promise}
   */
  execute(sqlOptions: ISqlOptions | string) {
    console.log(sqlOptions);

    let sqlo: ISqlOptions = sqlOptions as ISqlOptions;
    if (helper.isString(sqlOptions)) {
      sqlo = { sql: sqlOptions as string };
    }
    sqlo.debounce = false;
    sqlo.execute = true;
    return Promise.resolve(this.query(sqlo));
  }
}

export default thinkInstance(SQLiteSocket);
