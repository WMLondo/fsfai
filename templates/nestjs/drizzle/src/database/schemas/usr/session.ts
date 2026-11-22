import { index, text, timestamp } from 'drizzle-orm/pg-core';
import { usr } from './schema.js';
import { usrUser } from './user.js';

// Better Auth: modelo `session`.
export const usrSession = usr.table(
  'usr_session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => usrUser.id, { onDelete: 'cascade' }),
  },
  (table) => [index('usr_session_user_id_idx').on(table.userId)],
);
