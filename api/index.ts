import { app } from '../server/src/app.ts';
import { initDatabase } from '../server/src/db/index.ts';

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('Database initialization error in serverless handler:', err);
    }
  }
  return app(req, res);
}
