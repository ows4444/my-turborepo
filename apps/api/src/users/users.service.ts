import { Injectable } from '@nestjs/common';
import { db, users } from '@repo/db';
import { getApiEnv } from '@repo/env';
import { eq } from 'drizzle-orm';

type User = {
  id: string;
  email: string;
  passwordHash: string;
};

const database = db(getApiEnv().DATABASE_URL);
@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<User | null> {
    const [result] = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!result) return null;

    return this.map(result);
  }

  async findById(id: string): Promise<User | null> {
    const [result] = await database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result) return null;

    return this.map(result);
  }

  async create(user: User): Promise<User> {
    await database.insert(users).values({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    });

    return user;
  }

  private map(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
    };
  }
}
