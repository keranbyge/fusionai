import { 
  type User, 
  type SafeUser,
  type InsertUser, 
  type Workspace,
  type InsertWorkspace,
  type Message,
  type InsertMessage,
  type Diagram,
  type InsertDiagram,
  type Reminder,
  type InsertReminder,
  users,
  workspaces,
  messages,
  diagrams,
  reminders,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Pick<User, 'name'>>): Promise<SafeUser | undefined>;
  
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;
  
  getMessagesByWorkspaceAndPanel(workspaceId: string, panelType: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<boolean>;
  
  getDiagramsByWorkspace(workspaceId: string): Promise<Diagram[]>;
  getDiagram(id: string): Promise<Diagram | undefined>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  deleteDiagram(id: string): Promise<boolean>;
  
  getRemindersByUserId(userId: string): Promise<Reminder[]>;
  getUpcomingReminders(userId: string): Promise<Reminder[]>;
  getReminder(id: string): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        username: insertUser.username.toLowerCase(), // Normalize username to lowercase
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<Pick<User, 'name'>>): Promise<SafeUser | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) return undefined;
    
    // Return safe user without password hash
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(desc(workspaces.updatedAt));
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db
      .insert(workspaces)
      .values(insertWorkspace)
      .returning();
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const [workspace] = await db
      .update(workspaces)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMessagesByWorkspaceAndPanel(workspaceId: string, panelType: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(eq(messages.workspaceId, workspaceId), eq(messages.panelType, panelType)))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDiagramsByWorkspace(workspaceId: string): Promise<Diagram[]> {
    return await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.workspaceId, workspaceId))
      .orderBy(desc(diagrams.createdAt));
  }

  async getDiagram(id: string): Promise<Diagram | undefined> {
    const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id));
    return diagram;
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const [diagram] = await db
      .insert(diagrams)
      .values(insertDiagram)
      .returning();
    return diagram;
  }

  async deleteDiagram(id: string): Promise<boolean> {
    const result = await db.delete(diagrams).where(eq(diagrams.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRemindersByUserId(userId: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(asc(reminders.reminderDate));
  }

  async getUpcomingReminders(userId: string): Promise<Reminder[]> {
    const now = new Date();
    return await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.completed, false)
        )
      )
      .orderBy(asc(reminders.reminderDate));
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set(updates)
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
