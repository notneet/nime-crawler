import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'nime_crawler',

  // Entity and Migration discovery
  entities: ['**/*.entity.ts'],
  migrations: ['**/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',

  // Environment-based configuration
  synchronize: false, //process.env.NODE_ENV === 'development', // Always false for migration generation
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'info', 'log', 'migration', 'query', 'schema', 'warn']
      : ['error'],

  // MySQL specific settings
  timezone: 'Z',
  charset: 'utf8mb4',

  // Connection pool configuration
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    connectTimeout: 60000,
    // acquireTimeout: 60000,
    // timeout: 60000,
    waitForConnections: true,
    queueLimit: 0,
    // MySQL 8.0+ authentication
    authPlugins: {
      mysql_clear_password: () => () => Buffer.alloc(0),
    },
  },

  // Performance settings
  maxQueryExecutionTime: 10000,

  // Redis cache configuration (only if Redis is available)
  // ...(process.env.REDIS_HOST && {
  //   cache: {
  //     type: 'redis',
  //     options: {
  //       host: process.env.REDIS_HOST,
  //       port: parseInt(process.env.REDIS_PORT || '6379', 10),
  //       password: process.env.REDIS_PASSWORD || undefined,
  //       db: parseInt(process.env.REDIS_TYPEORM_DB || '2', 10),
  //       // Redis connection options
  //       retryDelayOnFailover: 100,
  //       enableReadyCheck: false,
  //       maxRetriesPerRequest: null,
  //       lazyConnect: true,
  //     },
  //     duration: 30000,
  //     ignoreErrors: true, // Don't fail if Redis is unavailable
  //   },
  // }),
});

// Conditional initialization - only when not running CLI commands
const isCliCommand = process.argv.some(
  arg =>
    arg.includes('migration:') ||
    arg.includes('schema:') ||
    arg.includes('typeorm'),
);

if (!isCliCommand) {
  AppDataSource.initialize()
    .then(() => {
      console.log('✅ Data Source has been initialized successfully!');
    })
    .catch(err => {
      console.error('❌ Error during Data Source initialization:', err);
      // Don't exit process in development
      if (process.env.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });
}

export default AppDataSource;
