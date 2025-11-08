import { 
  type User, 
  type InsertUser, 
  type Workspace,
  type InsertWorkspace,
  type Message,
  type InsertMessage,
  type Diagram,
  type InsertDiagram
} from "@shared/schema";
import { randomUUID } from "crypto";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;
  
  getMessagesByWorkspaceAndPanel(workspaceId: string, panelType: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getDiagramsByWorkspace(workspaceId: string): Promise<Diagram[]>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private messages: Map<string, Message>;
  private diagrams: Map<string, Diagram>;
  private dataFile = join(process.cwd(), '.data.json');

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.messages = new Map();
    this.diagrams = new Map();
    this.loadData();
  }

  private loadData() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf-8'));
        this.workspaces = new Map((data.workspaces || []).map(([k, v]: [string, any]) => [
          k,
          { ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) }
        ]));
        this.messages = new Map((data.messages || []).map(([k, v]: [string, any]) => [
          k,
          { ...v, createdAt: new Date(v.createdAt) }
        ]));
        this.diagrams = new Map((data.diagrams || []).map(([k, v]: [string, any]) => [
          k,
          { ...v, createdAt: new Date(v.createdAt) }
        ]));
        console.log(`Loaded ${this.workspaces.size} workspaces, ${this.messages.size} messages, ${this.diagrams.size} diagrams`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        workspaces: Array.from(this.workspaces.entries()),
        messages: Array.from(this.messages.entries()),
        diagrams: Array.from(this.diagrams.entries()),
      };
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values())
      .filter((ws) => ws.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = randomUUID();
    const now = new Date();
    const workspace: Workspace = {
      ...insertWorkspace,
      id,
      panelStates: insertWorkspace.panelStates ?? { coder: true, artist: true, tutor: true },
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.set(id, workspace);
    this.saveData();
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const workspace = this.workspaces.get(id);
    if (!workspace) return undefined;

    const updated: Workspace = {
      ...workspace,
      ...updates,
      updatedAt: new Date(),
    };
    this.workspaces.set(id, updated);
    this.saveData();
    return updated;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = this.workspaces.delete(id);
    if (result) this.saveData();
    return result;
  }

  async getMessagesByWorkspaceAndPanel(workspaceId: string, panelType: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.workspaceId === workspaceId && msg.panelType === panelType)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    this.saveData();
    return message;
  }

  async getDiagramsByWorkspace(workspaceId: string): Promise<Diagram[]> {
    return Array.from(this.diagrams.values())
      .filter((diagram) => diagram.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const id = randomUUID();
    const diagram: Diagram = {
      ...insertDiagram,
      id,
      createdAt: new Date(),
    };
    this.diagrams.set(id, diagram);
    this.saveData();
    return diagram;
  }
}

export const storage = new MemStorage();
