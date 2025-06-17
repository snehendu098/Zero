import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { cookiePreferencesRouter } from './routes/cookies';
import { connectionsRouter } from './routes/connections';
import { shortcutRouter } from './routes/shortcut';
import { settingsRouter } from './routes/settings';
import { getContext } from 'hono/context-storage';
import { themesRouter } from './routes/themes';
import { draftsRouter } from './routes/drafts';
import { labelsRouter } from './routes/label';
import { voiceRouter } from './routes/voice';
import { notesRouter } from './routes/notes';
import { notesRouter } from './routes/notes';
import { brainRouter } from './routes/brain';
import { userRouter } from './routes/user';
import { mailRouter } from './routes/mail';
import type { HonoContext } from '../ctx';
import { aiRouter } from './routes/ai';
import { router } from './trpc';

export const appRouter = router({
  ai: aiRouter,
  brain: brainRouter,
  connections: connectionsRouter,
  cookiePreferences: cookiePreferencesRouter,
  drafts: draftsRouter,
  labels: labelsRouter,
  mail: mailRouter,
  notes: notesRouter,
  shortcut: shortcutRouter,
  settings: settingsRouter,
  user: userRouter,
  voice: voiceRouter,
  themes: themesRouter,
});

export type AppRouter = typeof appRouter;

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;

export const serverTrpc = () => {
  const c = getContext<HonoContext>();
  return appRouter.createCaller({
    c,
    sessionUser: c.var.sessionUser,
    db: c.var.db,
    auth: c.var.auth,
    autumn: c.var.autumn,
  });
};
