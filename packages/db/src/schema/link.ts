import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull(),
});
