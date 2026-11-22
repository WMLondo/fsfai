import { index, text, timestamp } from 'drizzle-orm/pg-core';
import { usr } from './schema.js';

// Better Auth: modelo `verification` (tokens de verificación de email, reseteo de contraseña...).
export const usrVerification = usr.table(
  'usr_verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('usr_verification_identifier_idx').on(table.identifier)],
);
