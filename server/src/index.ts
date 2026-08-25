import { createApp } from './app';
import { createDb } from './db';
import { seedIfEmpty } from './db/seed';

const db = createDb();
seedIfEmpty(db);

const port = Number(process.env.PORT ?? 3001);
createApp(db).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
