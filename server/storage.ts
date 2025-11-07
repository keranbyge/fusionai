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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  
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

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.messages = new Map();
    this.diagrams = new Map();
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
    return updated;
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
    return diagram;
  }
}

export const storage = new MemStorage();
