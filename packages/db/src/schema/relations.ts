import { relations } from "drizzle-orm";
import { usersTable } from "./user";
import { sessions } from "./session";

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessions.userId],
    references: [usersTable.id],
  }),
}));
