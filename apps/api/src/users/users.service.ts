import { Injectable } from '@nestjs/common';
import { db, usersTable } from '@repo/db';
import { eq } from 'drizzle-orm';

type User = {
  id: string;
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!result[0]) return null;

    return this.map(result[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.map(result[0]);
  }

  async create(user: User): Promise<User> {
    await db.insert(usersTable).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    });

    return user;
  }

  private map(row: typeof usersTable.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
    };
  }
}
