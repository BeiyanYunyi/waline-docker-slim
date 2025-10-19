import Abstract from 'think-model-abstract';
import SQLiteParser from './parser';
import MysqlSchema from './schema';
import SQLiteQuery from './query';

// export { SQLiteParser as Parser, MysqlSchema as Schema, SQLiteQuery as Query };
class SQLiteAdapter extends Abstract {}

SQLiteAdapter.Parser = SQLiteParser;
SQLiteAdapter.Schema = MysqlSchema;
SQLiteAdapter.Query = SQLiteQuery;

export default SQLiteAdapter;
