import { z } from 'zod';

export const serializedFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  lastModified: z.number(),
  base64: z.string(),
});

export const deserializeFiles = async (serializedFiles: z.infer<typeof serializedFileSchema>[]) => {
  return await Promise.all(
    serializedFiles.map((data) => {
      const file = Buffer.from(data.base64, 'base64');
      const blob = new Blob([file], { type: data.type });
      const newFile = new File([blob], data.name, {
        type: data.type,
        lastModified: data.lastModified,
      });
      return newFile;
    }),
  );
};

export const createDraftData = z.object({
  to: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string(),
  message: z.string(),
  attachments: z.array(serializedFileSchema).transform(deserializeFiles).optional(),
  id: z.string().nullable(),
});

export type CreateDraftData = z.infer<typeof createDraftData>;

export const defaultUserSettings = {
  language: 'en',
  timezone: 'UTC',
  dynamicContent: false,
  externalImages: true,
  customPrompt: '',
  trustedSenders: [],
  isOnboarded: false,
  colorTheme: 'system',
} satisfies UserSettings;

export const userSettingsSchema = z.object({
  language: z.string(),
  timezone: z.string(),
  dynamicContent: z.boolean().optional(),
  externalImages: z.boolean(),
  customPrompt: z.string(),
  isOnboarded: z.boolean().optional(),
  trustedSenders: z.string().array().optional(),
  colorTheme: z.enum(['light', 'dark', 'system']).default('system'),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Theme schemas
export const themeColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  muted: z.string(),
  background: z.string(),
  foreground: z.string(),
  card: z.string(),
  cardForeground: z.string(),
  border: z.string(),
  ring: z.string(),
  sidebar: z.string(),
  sidebarForeground: z.string(),
  sidebarAccent: z.string(),
  sidebarAccentForeground: z.string(),
  radius: z.string(),
});

export const themeDataSchema = z.object({
  lightColors: themeColorsSchema,
  darkColors: themeColorsSchema,
});

export const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  themeData: themeDataSchema,
  isPublic: z.boolean().default(false),
});

export const updateThemeSchema = createThemeSchema.partial().extend({
  id: z.string(),
});

export type Theme = {
  id: string;
  userId: string;
  connectionId: string | null;
  name: string;
  description: string | null;
  themeData: ThemeData;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ThemeData = z.infer<typeof themeDataSchema>;
export type CreateTheme = z.infer<typeof createThemeSchema>;
export type UpdateTheme = z.infer<typeof updateThemeSchema>;
