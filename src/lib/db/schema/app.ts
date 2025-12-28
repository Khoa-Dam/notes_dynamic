import { relations } from 'drizzle-orm'
import { boolean, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { createTable } from '../table-creator'
import { users } from './auth'

export const workspaces = createTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  logo: text('logo'),
  bannerUrl: text('banner_url'),
  workspaceOwnerId: uuid('workspace_owner_id').notNull(),
  inTrash: boolean('in_trash').notNull().default(false),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string'
  })
    .defaultNow()
    .notNull()
})

export const folders = createTable('folders', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, {
    onDelete: 'cascade'
  }),
  inTrash: boolean('in_trash').notNull().default(false),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string'
  })
    .defaultNow()
    .notNull()
})

export const files = createTable('files', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  iconId: text('icon_id').notNull(),
  data: text('data'),
  bannerUrl: text('banner_url'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, {
    onDelete: 'cascade'
  }),
  folderId: uuid('folder_id').references(() => folders.id, {
    onDelete: 'cascade'
  }),
  inTrash: boolean('in_trash').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string'
  })
    .defaultNow()
    .notNull()
})

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
