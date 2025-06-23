import type { CreateTheme, Theme, ThemePallette, UpdateTheme } from './schemas';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { theme } from '../db/schema';
import type { DB } from '../db';

export class ThemeManager {
  constructor(private db: DB) {}

  async getUserThemes(userId: string, connectionId?: string): Promise<Theme[]> {
    const whereCondition = connectionId
      ? and(eq(theme.userId, userId), eq(theme.connectionId, connectionId))
      : eq(theme.userId, userId);

    const rows = await this.db
      .select()
      .from(theme)
      .where(whereCondition)
      .orderBy(desc(theme.createdAt));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      connectionId: row.connectionId,
      name: row.name,
      description: row.description,
      themeData: row.themeData as ThemePallette,
      isPublic: row.isPublic ?? false,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }

  async getConnectionThemes(connectionId: string): Promise<Theme[]> {
    const rows = await this.db
      .select()
      .from(theme)
      .where(eq(theme.connectionId, connectionId))
      .orderBy(desc(theme.createdAt));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      connectionId: row.connectionId,
      name: row.name,
      description: row.description,
      themeData: row.themeData as ThemePallette,
      isPublic: row.isPublic ?? false,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }

  async getThemeById(themeId: string, userId?: string): Promise<Theme | null> {
    const whereCondition = userId
      ? and(eq(theme.id, themeId), eq(theme.userId, userId))
      : eq(theme.id, themeId);

    const [foundTheme] = await this.db.select().from(theme).where(whereCondition).limit(1);

    if (!foundTheme) return null;

    return {
      id: foundTheme.id,
      userId: foundTheme.userId,
      connectionId: foundTheme.connectionId,
      name: foundTheme.name,
      description: foundTheme.description,
      themeData: foundTheme.themeData as ThemePallette,
      isPublic: foundTheme.isPublic ?? false,
      createdAt: foundTheme.createdAt ?? new Date(),
      updatedAt: foundTheme.updatedAt ?? new Date(),
    };
  }

  async getPublicThemes(limit = 50, offset = 0, searchQuery = ''): Promise<Theme[]> {
    let rows;

    if (searchQuery) {
      rows = await this.db
        .select()
        .from(theme)
        .where(
          and(
            or(
              eq(theme.name, searchQuery),
              eq(theme.description, searchQuery),
              like(theme.name, `%${searchQuery}%`),
              like(theme.description, `%${searchQuery}%`),
            ),
            eq(theme.isPublic, true),
          ),
        )
        .orderBy(desc(theme.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await this.db
        .select()
        .from(theme)
        .where(eq(theme.isPublic, true))
        .orderBy(desc(theme.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      connectionId: row.connectionId,
      name: row.name,
      description: row.description,
      themeData: row.themeData as ThemePallette,
      isPublic: row.isPublic ?? false,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));
  }

  async createTheme(
    userId: string,
    connectionId: string | null,
    data: CreateTheme,
  ): Promise<Theme> {
    const [newTheme] = await this.db
      .insert(theme)
      .values({
        userId,
        connectionId,
        name: data.name,
        description: data.description,
        themeData: data.themeData,
        isPublic: data.isPublic,
      })
      .returning();

    if (!newTheme) {
      throw new Error('Failed to create theme');
    }

    return {
      id: newTheme.id,
      userId: newTheme.userId,
      connectionId: newTheme.connectionId,
      name: newTheme.name,
      description: newTheme.description,
      themeData: newTheme.themeData as ThemePallette,
      isPublic: newTheme.isPublic ?? false,
      createdAt: newTheme.createdAt ?? new Date(),
      updatedAt: newTheme.updatedAt ?? new Date(),
    };
  }

  async updateTheme(userId: string, themeId: string, data: Partial<UpdateTheme>): Promise<Theme> {
    const { id, ...updateData } = data;

    const [updatedTheme] = await this.db
      .update(theme)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(theme.id, themeId), eq(theme.userId, userId)))
      .returning();

    if (!updatedTheme) {
      throw new Error('Theme not found or unauthorized');
    }

    return {
      id: updatedTheme.id,
      userId: updatedTheme.userId,
      connectionId: updatedTheme.connectionId,
      name: updatedTheme.name,
      description: updatedTheme.description,
      themeData: updatedTheme.themeData as ThemePallette,
      isPublic: updatedTheme.isPublic ?? false,
      createdAt: updatedTheme.createdAt ?? new Date(),
      updatedAt: updatedTheme.updatedAt ?? new Date(),
    };
  }

  async deleteTheme(userId: string, themeId: string): Promise<boolean> {
    const [deletedTheme] = await this.db
      .delete(theme)
      .where(and(eq(theme.id, themeId), eq(theme.userId, userId)))
      .returning();

    return !!deletedTheme;
  }

  async copyPublicTheme(
    userId: string,
    connectionId: string,
    publicThemeId: string,
  ): Promise<Theme> {
    const [publicTheme] = await this.db
      .select()
      .from(theme)
      .where(and(eq(theme.id, publicThemeId), eq(theme.isPublic, true)))
      .limit(1);

    if (!publicTheme) {
      throw new Error('Public theme not found');
    }

    return this.createTheme(userId, connectionId, {
      name: `${publicTheme.name} (Copy)`,
      description: publicTheme.description || undefined,
      themeData: publicTheme.themeData as ThemePallette,
      isPublic: false,
    });
  }

  async togglePublicStatus(userId: string, themeId: string): Promise<Theme> {
    const existingTheme = await this.getThemeById(themeId, userId);
    if (!existingTheme) {
      throw new Error('Theme not found or unauthorized');
    }

    return this.updateTheme(userId, themeId, {
      isPublic: !existingTheme.isPublic,
    });
  }
}
