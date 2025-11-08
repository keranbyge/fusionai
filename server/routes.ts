import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkspaceSchema, insertMessageSchema, insertDiagramSchema, insertUserSchema } from "@shared/schema";
import { requireAuth } from "./auth";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import { z } from "zod";

// Using OpenRouter API with the user's API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // User provided OpenRouter key stored as OPENAI_API_KEY
  baseURL: "https://openrouter.ai/api/v1",
});

const SALT_ROUNDS = 12;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Create user
      const user = await storage.createUser({
        username: username.toLowerCase(),
        password: hashedPassword,
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return safe user (without password)
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error in signup:", error);
      res.status(400).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return safe user (without password)
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error in login:", error);
      res.status(400).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return safe user (without password)
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Name is required" });
      }
      
      const user = await storage.updateUser(req.session.userId!, { name });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Workspace routes (protected)
  app.get("/api/workspaces", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const workspaces = await storage.getWorkspacesByUserId(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", requireAuth, async (req, res) => {
    try {
      const validated = insertWorkspaceSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      const workspace = await storage.createWorkspace(validated);
      res.json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(400).json({ error: "Failed to create workspace" });
    }
  });

  app.patch("/api/workspaces/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership
      const existing = await storage.getWorkspace(id);
      if (!existing) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const workspace = await storage.updateWorkspace(id, req.body);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(400).json({ error: "Failed to update workspace" });
    }
  });

  app.delete("/api/workspaces/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership
      const existing = await storage.getWorkspace(id);
      if (!existing) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deleted = await storage.deleteWorkspace(id);
      if (!deleted) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(400).json({ error: "Failed to delete workspace" });
    }
  });

  // Message routes (protected)
  app.get("/api/workspaces/:workspaceId/messages/:panelType", requireAuth, async (req, res) => {
    try {
      const { workspaceId, panelType } = req.params;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessagesByWorkspaceAndPanel(workspaceId, panelType);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Coder AI endpoint (protected)
  app.post("/api/ai/coder", requireAuth, async (req, res) => {
    try {
      const { workspaceId, message } = req.body;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Save user message
      const userMessage = await storage.createMessage({
        workspaceId,
        panelType: "coder",
        role: "user",
        content: message,
      });

      // Get conversation history
      const history = await storage.getMessagesByWorkspaceAndPanel(workspaceId, "coder");
      
      // Call OpenRouter
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert coding assistant. Help users write code, debug issues, and learn programming concepts. Provide clear explanations and code examples. Be concise but thorough.",
          },
          ...history.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ],
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      // Save AI response
      const assistantMessage = await storage.createMessage({
        workspaceId,
        panelType: "coder",
        role: "assistant",
        content: aiResponse,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Error in coder AI:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Artist AI endpoint (protected)
  app.post("/api/ai/artist", requireAuth, async (req, res) => {
    try {
      const { workspaceId, prompt, coderContext } = req.body;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Build enhanced prompt with Coder context if available
      let enhancedPrompt = prompt;
      if (coderContext) {
        enhancedPrompt = `Based on this coding discussion:\n\n${coderContext}\n\nCreate a diagram for: ${prompt}`;
      }

      // Call OpenRouter to generate Mermaid diagram
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating diagrams using Mermaid.js syntax. When given a description, generate valid Mermaid.js code for flowcharts, sequence diagrams, class diagrams, or other diagram types. Only respond with the Mermaid code, no explanations or markdown code blocks.",
          },
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: 0.5,
      });

      const mermaidCode = completion.choices[0]?.message?.content || "graph TD\nA[Error] --> B[Could not generate diagram]";

      // Save diagram
      const diagram = await storage.createDiagram({
        workspaceId,
        prompt,
        mermaidCode,
      });

      res.json(diagram);
    } catch (error) {
      console.error("Error in artist AI:", error);
      res.status(500).json({ error: "Failed to generate diagram" });
    }
  });

  // Sync Coder to Artist endpoint (protected)
  app.post("/api/ai/sync-to-artist", requireAuth, async (req, res) => {
    try {
      const { workspaceId } = req.body;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get recent Coder conversation (last 3 messages for context)
      const coderHistory = await storage.getMessagesByWorkspaceAndPanel(workspaceId, "coder");
      if (coderHistory.length === 0) {
        return res.status(400).json({ error: "No coder messages to sync" });
      }

      const recentMessages = coderHistory.slice(-3);
      const latestAIResponse = recentMessages.filter(m => m.role === "assistant").pop();
      
      if (!latestAIResponse) {
        return res.status(400).json({ error: "No AI responses found in coder panel" });
      }

      // Create a context summary from recent messages
      const context = recentMessages.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.substring(0, 500)}`).join("\n\n");

      // Ask AI to analyze the conversation and create a diagram prompt
      const analysisCompletion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing coding conversations and creating diagram prompts. Based on the conversation, suggest the most appropriate diagram type (flowchart, sequence diagram, class diagram, state diagram, etc.) and create a detailed prompt for it. Keep your response under 200 words and be specific about what should be visualized.",
          },
          {
            role: "user",
            content: `Analyze this coding conversation and create a diagram prompt that visualizes the key concept:\n\n${context}`,
          },
        ],
        temperature: 0.7,
      });

      const diagramPrompt = analysisCompletion.choices[0]?.message?.content || "Create a flowchart showing the code logic discussed";

      // Generate the Mermaid diagram
      const diagramCompletion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating diagrams using Mermaid.js syntax. When given a description, generate valid Mermaid.js code for flowcharts, sequence diagrams, class diagrams, or other diagram types. Only respond with the Mermaid code, no explanations or markdown code blocks.",
          },
          {
            role: "user",
            content: `${diagramPrompt}\n\nContext from coding discussion:\n${latestAIResponse.content.substring(0, 800)}`,
          },
        ],
        temperature: 0.5,
      });

      const mermaidCode = diagramCompletion.choices[0]?.message?.content || "graph TD\nA[Error] --> B[Could not generate diagram]";

      // Save diagram with the generated prompt
      const diagram = await storage.createDiagram({
        workspaceId,
        prompt: `Auto-synced: ${diagramPrompt.substring(0, 200)}`,
        mermaidCode,
      });

      res.json(diagram);
    } catch (error) {
      console.error("Error in sync-to-artist:", error);
      res.status(500).json({ error: "Failed to sync to artist" });
    }
  });

  // Tutor AI endpoint (protected)
  app.post("/api/ai/tutor", requireAuth, async (req, res) => {
    try {
      const { workspaceId, message } = req.body;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        workspaceId,
        panelType: "tutor",
        role: "user",
        content: message,
      });

      // Get tutor conversation history
      const tutorHistory = await storage.getMessagesByWorkspaceAndPanel(workspaceId, "tutor");
      
      // Get context from coder panel (last 5 messages)
      const coderHistory = await storage.getMessagesByWorkspaceAndPanel(workspaceId, "coder");
      const recentCoderContext = coderHistory.slice(-5);

      // Get context from artist panel (last 3 diagrams)
      const diagrams = await storage.getDiagramsByWorkspace(workspaceId);
      const recentDiagrams = diagrams.slice(-3);

      // Build system message with context from both panels
      let systemMessage = "You are a personalized learning assistant with access to the user's workspace. Provide clear explanations, tutorials, and guidance. Be patient and adapt your teaching to the learner's level.";
      
      if (recentCoderContext.length > 0) {
        const contextSummary = recentCoderContext.map(m => `${m.role}: ${m.content.substring(0, 200)}`).join("\n");
        systemMessage += `\n\nContext from the user's recent coding work:\n${contextSummary}`;
      }

      if (recentDiagrams.length > 0) {
        const diagramSummary = recentDiagrams.map(d => `Diagram: ${d.prompt}`).join("\n");
        systemMessage += `\n\nThe user has been working with these visual diagrams:\n${diagramSummary}`;
      }

      // Call OpenRouter
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          ...tutorHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ],
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      // Save AI response
      const assistantMessage = await storage.createMessage({
        workspaceId,
        panelType: "tutor",
        role: "assistant",
        content: aiResponse,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Error in tutor AI:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Diagrams list endpoint (protected)
  app.get("/api/workspaces/:workspaceId/diagrams", requireAuth, async (req, res) => {
    try {
      const { workspaceId } = req.params;
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const diagrams = await storage.getDiagramsByWorkspace(workspaceId);
      res.json(diagrams);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      res.status(500).json({ error: "Failed to fetch diagrams" });
    }
  });

  // Text-to-image generation endpoint (protected)
  app.post("/api/ai/generate-image", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      console.log("Generating image for prompt:", prompt);

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse.data?.[0]?.url;

      if (!imageUrl) {
        console.error("No image URL in response");
        return res.status(500).json({ error: "No image generated" });
      }

      console.log("Image generated successfully:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate image", message: errorMessage });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
