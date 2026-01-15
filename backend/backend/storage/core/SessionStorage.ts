import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { sessions } from '../../shared/schema';

export interface SessionData {
  [key: string]: any;
}

export interface Session {
  sid: string;
  sess: SessionData;
  expire: Date;
}

export interface ISessionStorage {
  // Basic session operations
  getSession(sid: string): Promise<SessionData | null>;
  setSession(sid: string, sess: SessionData, expire: Date): Promise<void>;
  updateSession(sid: string, sess: SessionData, expire: Date): Promise<void>;
  destroySession(sid: string): Promise<void>;
  
  // Session management
  touchSession(sid: string, expire: Date): Promise<void>;
  getAllSessions(): Promise<Session[]>;
  getSessionsByUserId(userId: string): Promise<Session[]>;
  clearExpiredSessions(): Promise<number>;
  
  // User session management
  destroyUserSessions(userId: string): Promise<void>;
  getActiveSessionCount(userId: string): Promise<number>;
  limitUserSessions(userId: string, maxSessions: number): Promise<void>;
}

export class DatabaseSessionStorage implements ISessionStorage {
  
  // ===== BASIC SESSION OPERATIONS =====
  
  async getSession(sid: string): Promise<SessionData | null> {
    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.sid, sid),
          sql`${sessions.expire} > NOW()`
        ));
      
      return session?.sess || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async setSession(sid: string, sess: SessionData, expire: Date): Promise<void> {
    try {
      await db
        .insert(sessions)
        .values({
          sid,
          sess,
          expire,
        })
        .onConflictDoUpdate({
          target: sessions.sid,
          set: {
            sess,
            expire,
          },
        });
    } catch (error) {
      console.error('Error setting session:', error);
      throw new Error('Failed to set session');
    }
  }

  async updateSession(sid: string, sess: SessionData, expire: Date): Promise<void> {
    try {
      await db
        .update(sessions)
        .set({
          sess,
          expire,
        })
        .where(eq(sessions.sid, sid));
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  }

  async destroySession(sid: string): Promise<void> {
    try {
      await db.delete(sessions).where(eq(sessions.sid, sid));
    } catch (error) {
      console.error('Error destroying session:', error);
      throw new Error('Failed to destroy session');
    }
  }

  // ===== SESSION MANAGEMENT =====
  
  async touchSession(sid: string, expire: Date): Promise<void> {
    try {
      await db
        .update(sessions)
        .set({ expire })
        .where(eq(sessions.sid, sid));
    } catch (error) {
      console.error('Error touching session:', error);
      throw new Error('Failed to touch session');
    }
  }

  async getAllSessions(): Promise<Session[]> {
    try {
      const sessionList = await db
        .select()
        .from(sessions)
        .where(sql`${sessions.expire} > NOW()`)
        .orderBy(sessions.expire);
      
      return sessionList as Session[];
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    try {
      const sessionList = await db
        .select()
        .from(sessions)
        .where(and(
          sql`${sessions.sess}->>'userId' = ${userId}`,
          sql`${sessions.expire} > NOW()`
        ))
        .orderBy(sessions.expire);
      
      return sessionList as Session[];
    } catch (error) {
      console.error('Error getting sessions by user ID:', error);
      return [];
    }
  }

  async clearExpiredSessions(): Promise<number> {
    try {
      const result = await db
        .delete(sessions)
        .where(lt(sessions.expire, new Date()));
      
      // Return count of deleted sessions (implementation may vary by DB)
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error clearing expired sessions:', error);
      return 0;
    }
  }

  // ===== USER SESSION MANAGEMENT =====
  
  async destroyUserSessions(userId: string): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(sql`${sessions.sess}->>'userId' = ${userId}`);
    } catch (error) {
      console.error('Error destroying user sessions:', error);
      throw new Error('Failed to destroy user sessions');
    }
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql`count(*)` })
        .from(sessions)
        .where(and(
          sql`${sessions.sess}->>'userId' = ${userId}`,
          sql`${sessions.expire} > NOW()`
        ));
      
      return Number(result.count);
    } catch (error) {
      console.error('Error getting active session count:', error);
      return 0;
    }
  }

  async limitUserSessions(userId: string, maxSessions: number): Promise<void> {
    try {
      const userSessions = await this.getSessionsByUserId(userId);
      
      if (userSessions.length > maxSessions) {
        // Sort by expiration date and remove oldest sessions
        const sortedSessions = userSessions.sort((a, b) => 
          new Date(a.expire).getTime() - new Date(b.expire).getTime()
        );
        
        const sessionsToRemove = sortedSessions.slice(0, userSessions.length - maxSessions);
        
        for (const session of sessionsToRemove) {
          await this.destroySession(session.sid);
        }
      }
    } catch (error) {
      console.error('Error limiting user sessions:', error);
      throw new Error('Failed to limit user sessions');
    }
  }

  // ===== UTILITY METHODS =====
  
  async getSessionStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  }> {
    try {
      const [total] = await db
        .select({ count: sql`count(*)` })
        .from(sessions);
      
      const [active] = await db
        .select({ count: sql`count(*)` })
        .from(sessions)
        .where(sql`${sessions.expire} > NOW()`);
      
      const totalCount = Number(total.count);
      const activeCount = Number(active.count);
      
      return {
        totalSessions: totalCount,
        activeSessions: activeCount,
        expiredSessions: totalCount - activeCount,
      };
    } catch (error) {
      console.error('Error getting session statistics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
      };
    }
  }

  // ===== SESSION VALIDATION =====
  
  async isSessionValid(sid: string): Promise<boolean> {
    try {
      const session = await this.getSession(sid);
      return session !== null;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  async refreshSession(sid: string, extendBy: number = 3600000): Promise<boolean> {
    try {
      const session = await this.getSession(sid);
      if (!session) return false;
      
      const newExpiry = new Date(Date.now() + extendBy);
      await this.touchSession(sid, newExpiry);
      
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }
}

// Memory-based session storage for development/testing
export class MemorySessionStorage implements ISessionStorage {
  private sessions: Map<string, { sess: SessionData; expire: Date }> = new Map();

  async getSession(sid: string): Promise<SessionData | null> {
    const session = this.sessions.get(sid);
    if (!session) return null;
    
    if (session.expire < new Date()) {
      this.sessions.delete(sid);
      return null;
    }
    
    return session.sess;
  }

  async setSession(sid: string, sess: SessionData, expire: Date): Promise<void> {
    this.sessions.set(sid, { sess, expire });
  }

  async updateSession(sid: string, sess: SessionData, expire: Date): Promise<void> {
    if (this.sessions.has(sid)) {
      this.sessions.set(sid, { sess, expire });
    }
  }

  async destroySession(sid: string): Promise<void> {
    this.sessions.delete(sid);
  }

  async touchSession(sid: string, expire: Date): Promise<void> {
    const session = this.sessions.get(sid);
    if (session) {
      session.expire = expire;
    }
  }

  async getAllSessions(): Promise<Session[]> {
    const result: Session[] = [];
    for (const [sid, { sess, expire }] of this.sessions) {
      if (expire > new Date()) {
        result.push({ sid, sess, expire });
      }
    }
    return result;
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    const result: Session[] = [];
    for (const [sid, { sess, expire }] of this.sessions) {
      if (expire > new Date() && sess.userId === userId) {
        result.push({ sid, sess, expire });
      }
    }
    return result;
  }

  async clearExpiredSessions(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [sid, { expire }] of this.sessions) {
      if (expire < now) {
        this.sessions.delete(sid);
        count++;
      }
    }
    return count;
  }

  async destroyUserSessions(userId: string): Promise<void> {
    for (const [sid, { sess }] of this.sessions) {
      if (sess.userId === userId) {
        this.sessions.delete(sid);
      }
    }
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [, { sess, expire }] of this.sessions) {
      if (expire > now && sess.userId === userId) {
        count++;
      }
    }
    return count;
  }

  async limitUserSessions(userId: string, maxSessions: number): Promise<void> {
    const userSessions = await this.getSessionsByUserId(userId);
    if (userSessions.length > maxSessions) {
      const sortedSessions = userSessions.sort((a, b) => 
        new Date(a.expire).getTime() - new Date(b.expire).getTime()
      );
      
      const sessionsToRemove = sortedSessions.slice(0, userSessions.length - maxSessions);
      for (const session of sessionsToRemove) {
        this.sessions.delete(session.sid);
      }
    }
  }
}

// Export storage instance based on environment
export const sessionStorage = process.env.NODE_ENV === 'test' 
  ? new MemorySessionStorage() 
  : new DatabaseSessionStorage();