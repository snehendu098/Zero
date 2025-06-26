import type { CreateTheme, Theme, ThemePallette, UpdateTheme } from './schemas';
import { getZeroDB } from './server-utils';

export class ThemeManager {
  constructor() {}

  async getUserThemes(userId: string, connectionId?: string): Promise<Theme[]> {
    const db = await getZeroDB(userId);
    const rows: Theme[] = await db.findManyThemesByUserId(connectionId);
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

  async getConnectionThemes(userId: string, connectionId: string): Promise<Theme[]> {
    return this.getUserThemes(userId, connectionId);
  }

  async getThemeById(userId: string, themeId: string): Promise<Theme | null> {
    const db = await getZeroDB(userId);
    const foundTheme = (await db.findThemeById(themeId)) as Theme | undefined;
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
    const db = await getZeroDB('public');
    const rows: Theme[] = await db.findPublicThemes(limit, offset, searchQuery);
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
    const db = await getZeroDB(userId);
    const [newTheme] = (await db.createTheme({
      connectionId,
      name: data.name,
      description: data.description,
      themeData: data.themeData,
      isPublic: data.isPublic,
    })) as Theme[];
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
    const db = await getZeroDB(userId);
    const { id, ...updateData } = data;
    const updatedTheme = (await db.updateTheme(themeId, updateData)) as Theme | undefined;
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
    const db = await getZeroDB(userId);
    return (await db.deleteTheme(themeId)) as boolean;
  }

  async copyPublicTheme(
    userId: string,
    connectionId: string,
    publicThemeId: string,
  ): Promise<Theme> {
    const db = await getZeroDB(userId);
    const publicTheme = (await db.findThemeById(publicThemeId)) as Theme | undefined;
    if (!publicTheme || !publicTheme.isPublic) {
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
    const db = await getZeroDB(userId);
    const existingTheme = (await db.findThemeById(themeId)) as Theme | undefined;
    if (!existingTheme) {
      throw new Error('Theme not found or unauthorized');
    }
    return this.updateTheme(userId, themeId, {
      isPublic: !existingTheme.isPublic,
    });
  }
}
