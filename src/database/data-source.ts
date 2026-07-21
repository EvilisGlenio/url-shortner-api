import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const createDatabaseOptions = (
  databaseUrl = process.env.DATABASE_URL,
  nodeEnv = process.env.NODE_ENV,
): DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,

  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],

  synchronize: false,

  ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

export default new DataSource(createDatabaseOptions());
