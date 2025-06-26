import {
  activeConnectionProcedure,
  createRateLimiterMiddleware,
  privateProcedure,
  publicProcedure,
  router,
} from '../trpc';
import { createThemeSchema, updateThemeSchema } from '../../lib/schemas';
import { ThemeManager } from '../../lib/theme-manager';
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';

const themeProcedure = privateProcedure.use(async ({ ctx, next }) => {
  const themeManager = new ThemeManager();
  return next({ ctx: { ...ctx, themeManager } });
});

export const themesRouter = router({
  // Get user's themes (optionally filtered by connection)
  list: themeProcedure
    .input(
      z
        .object({
          connectionId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const themes = await ctx.themeManager.getUserThemes(ctx.sessionUser.id, input?.connectionId);
      return { themes };
    }),

  // Get themes for current connection
  getConnectionThemes: activeConnectionProcedure
    .use(async ({ ctx, next }) => {
      const themeManager = new ThemeManager();
      return next({ ctx: { ...ctx, themeManager } });
    })
    .query(async ({ ctx }) => {
      const themes = await ctx.themeManager.getConnectionThemes(ctx.sessionUser.id, ctx.activeConnection.id);
      return { themes };
    }),

  // Get single theme by ID
  get: themeProcedure.input(z.object({ themeId: z.string() })).query(async ({ ctx, input }) => {
    const theme = await ctx.themeManager.getThemeById(ctx.sessionUser.id, input.themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    return { theme };
  }),

  // Create new theme
  create: activeConnectionProcedure
    .use(async ({ ctx, next }) => {
      const themeManager = new ThemeManager();
      return next({ ctx: { ...ctx, themeManager } });
    })
    .use(
      createRateLimiterMiddleware({
        generatePrefix: ({ sessionUser }) => `ratelimit:themes-create-${sessionUser?.id}`,
        limiter: Ratelimit.slidingWindow(10, '1h'), // 10 themes per hour
      }),
    )
    .input(createThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const theme = await ctx.themeManager.createTheme(
        ctx.sessionUser.id,
        ctx.activeConnection.id,
        input,
      );
      return { theme };
    }),

  // Update theme
  update: themeProcedure
    .use(
      createRateLimiterMiddleware({
        generatePrefix: ({ sessionUser }) => `ratelimit:themes-update-${sessionUser?.id}`,
        limiter: Ratelimit.slidingWindow(30, '1h'), // 30 updates per hour
      }),
    )
    .input(updateThemeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const theme = await ctx.themeManager.updateTheme(ctx.sessionUser.id, id, updateData);
      return { theme };
    }),

  // Delete theme
  delete: themeProcedure
    .use(
      createRateLimiterMiddleware({
        generatePrefix: ({ sessionUser }) => `ratelimit:themes-delete-${sessionUser?.id}`,
        limiter: Ratelimit.slidingWindow(20, '1h'), // 20 deletes per hour
      }),
    )
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = await ctx.themeManager.deleteTheme(ctx.sessionUser.id, input.themeId);
      return { success };
    }),

  // Toggle public status
  togglePublic: themeProcedure
    .use(
      createRateLimiterMiddleware({
        generatePrefix: ({ sessionUser }) => `ratelimit:themes-toggle-${sessionUser?.id}`,
        limiter: Ratelimit.slidingWindow(20, '1h'),
      }),
    )
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const theme = await ctx.themeManager.togglePublicStatus(ctx.sessionUser.id, input.themeId);
      return { theme };
    }),

  // Get public themes (marketplace)
  marketplace: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional().default(''),
        q: z.string().optional().default(''),
      }),
    )
    .use(async ({ ctx, next }) => {
      const themeManager = new ThemeManager();
      return next({ ctx: { ...ctx, themeManager } });
    })
    .query(async ({ ctx, input }) => {
      const offset = input.cursor ? parseInt(input.cursor) : 0;
      const themes = await ctx.themeManager.getPublicThemes(
        input.limit,
        offset,
        input.q, // Add search support
      );

      return {
        themes,
        nextPageToken: themes.length === input.limit ? (offset + input.limit).toString() : null,
      };
    }),

  // Get public theme details (for preview before copying)
  getPublic: publicProcedure
    .input(z.object({ themeId: z.string() }))
    .use(async ({ ctx, next }) => {
      const themeManager = new ThemeManager();
      return next({ ctx: { ...ctx, themeManager } });
    })
    .query(async ({ ctx, input }) => {
      // For public themes, we don't have a userId, so pass 'public' as userId
      const theme = await ctx.themeManager.getThemeById('public', input.themeId);
      if (!theme || !theme.isPublic) {
        throw new Error('Public theme not found');
      }
      return { theme };
    }),

  // Copy public theme
  copyPublic: activeConnectionProcedure
    .use(async ({ ctx, next }) => {
      const themeManager = new ThemeManager();
      return next({ ctx: { ...ctx, themeManager } });
    })
    .use(
      createRateLimiterMiddleware({
        generatePrefix: ({ sessionUser }) => `ratelimit:themes-copy-${sessionUser?.id}`,
        limiter: Ratelimit.slidingWindow(10, '1h'), // 10 copies per hour
      }),
    )
    .input(z.object({ publicThemeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const theme = await ctx.themeManager.copyPublicTheme(
        ctx.sessionUser.id,
        ctx.activeConnection.id,
        input.publicThemeId,
      );
      return { theme };
    }),
});
