import { relations } from 'drizzle-orm'
import { boolean, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createTable } from '../table-creator'
import { users } from './auth'

export const workspaces = createTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(), // Workspace thường bắt buộc có icon
  data: text('data'),
  logo: text('logo'),
  bannerUrl: text('banner_url'),
  workspaceOwnerId: uuid('workspace_owner_id').notNull(),
  inTrash: boolean('in_trash').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
})

export const folders = createTable('folders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id'),
  data: text('data'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id')
    .notNull() // Folder bắt buộc phải thuộc về workspace
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  inTrash: boolean('in_trash').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
})

export const files = createTable('files', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id'), // Đã bỏ .notNull() - Đây là nguyên nhân gây lỗi 500
  data: text('data'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
  inTrash: boolean('in_trash').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
})

// --- QUAN TRỌNG: ĐỊNH NGHĨA RELATIONSHIPS ---
// Việc này giúp bạn query: db.query.folders.findMany({ with: { files: true } }) cực nhanh
export const foldersRelations = relations(folders, ({ many, one }) => ({
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id]
  }),
  files: many(files)
}))

export const filesRelations = relations(files, ({ one }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id]
  })
}))

export const collaborators = createTable('collaborators', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string'
  })
    .defaultNow()
    .notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
})
