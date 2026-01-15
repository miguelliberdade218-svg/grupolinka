import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';

console.log('Running migrations...');
migrate(db, { migrationsFolder: './migrations' })
  .then(() => {
    console.log('Migrations completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
