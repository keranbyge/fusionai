import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkspaceSchema, insertMessageSchema, insertDiagramSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Workspace routes
  app.get("/api/workspaces", async (req, res) => {
    try {
      // For now, using a demo user ID - will be replaced with auth later
      const userId = "demo-user";
      const workspaces = await storage.getWorkspacesByUserId(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const validated = insertWorkspaceSchema.parse({
        ...req.body,
        userId: "demo-user", // Will be replaced with auth
      });
      const workspace = await storage.createWorkspace(validated);
      res.json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(400).json({ error: "Failed to create workspace" });
    }
  });

  app.patch("/api/workspaces/:id", async (req, res) => {
    try {
      const { id } = req.params;
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

  app.delete("/api/workspaces/:id", async (req, res) => {
    try {
      const { id } = req.params;
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

  // Message routes
  app.get("/api/workspaces/:workspaceId/messages/:panelType", async (req, res) => {
    try {
      const { workspaceId, panelType } = req.params;
      const messages = await storage.getMessagesByWorkspaceAndPanel(workspaceId, panelType);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Coder AI endpoint
  app.post("/api/ai/coder", async (req, res) => {
    try {
      const { workspaceId, message } = req.body;
      
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

  // Artist AI endpoint
  app.post("/api/ai/artist", async (req, res) => {
    try {
      const { workspaceId, prompt } = req.body;

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
            content: prompt,
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

  // Tutor AI endpoint
  app.post("/api/ai/tutor", async (req, res) => {
    try {
      const { workspaceId, message } = req.body;

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

      // Build system message with context
      let systemMessage = "You are a personalized learning assistant. Provide clear explanations, tutorials, and guidance. Be patient and adapt your teaching to the learner's level.";
      
      if (recentCoderContext.length > 0) {
        const contextSummary = recentCoderContext.map(m => `${m.role}: ${m.content.substring(0, 200)}`).join("\n");
        systemMessage += `\n\nContext from the user's recent coding work:\n${contextSummary}`;
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

  // Diagrams list endpoint
  app.get("/api/workspaces/:workspaceId/diagrams", async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const diagrams = await storage.getDiagramsByWorkspace(workspaceId);
      res.json(diagrams);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      res.status(500).json({ error: "Failed to fetch diagrams" });
    }
  });

  // Text-to-image generation endpoint
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      console.log("Generating image for prompt:", prompt);

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse.data[0]?.url;

      if (!imageUrl) {
        console.error("No image URL in response");
        return res.status(500).json({ error: "No image generated" });
      }

      console.log("Image generated successfully:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image", message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
