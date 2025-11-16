import Abstract from 'think-model-abstract';
import SQLiteParser from './parser.ts';
import MysqlSchema from './schema.ts';
import SQLiteQuery from './query.ts';

// export { SQLiteParser as Parser, MysqlSchema as Schema, SQLiteQuery as Query };
class SQLiteAdapter extends Abstract {}

SQLiteAdapter.Parser = SQLiteParser;
SQLiteAdapter.Schema = MysqlSchema;
SQLiteAdapter.Query = SQLiteQuery;

export default SQLiteAdapter;
