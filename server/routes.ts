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

// Helper function to extract and fix Mermaid code from AI output
function fixMermaidSyntax(mermaidCode: string): string {
  let extracted = mermaidCode.trim();
  
  // Step 1: Extract content from markdown code fences if present
  const fenceMatch = extracted.match(/```(?:mermaid)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenceMatch) {
    extracted = fenceMatch[1].trim();
  }
  
  // Step 2: Find diagram type and extract from there
  const diagramTypes = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'journey',
    'gantt', 'pie', 'quadrantChart', 'requirementDiagram',
    'gitGraph', 'mindmap', 'timeline', 'zenuml', 'sankey'
  ];
  
  const lines = extracted.split('\n');
  let diagramStart = -1;
  
  // Find first line with diagram type
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (diagramTypes.some(type => trimmed.toLowerCase().startsWith(type.toLowerCase()))) {
      diagramStart = i;
      break;
    }
  }
  
  if (diagramStart === -1) {
    // No diagram type found, return as-is with label fixes
    return fixLabels(extracted);
  }
  
  // Step 3: Extract diagram lines using Mermaid syntax rules
  const diagramLines = [lines[diagramStart]];
  let indentLevel = 0;
  
  for (let i = diagramStart + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Stop at completely empty lines followed by prose or another diagram type
    if (trimmed === '') {
      // Check next non-empty line
      let nextNonEmpty = '';
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next !== '') {
          nextNonEmpty = next;
          break;
        }
      }
      
      // If next line looks like prose (starts with lowercase, no Mermaid syntax)
      if (nextNonEmpty && /^[a-z]/.test(nextNonEmpty) && !isMermaidSyntax(nextNonEmpty)) {
        break;
      }
      
      // Include blank line (might be intentional formatting)
      diagramLines.push(line);
      continue;
    }
    
    // Check if this line is valid Mermaid syntax
    if (isMermaidSyntax(trimmed)) {
      diagramLines.push(line);
      
      // Track subgraph/end blocks
      if (/^\s*subgraph/.test(trimmed)) indentLevel++;
      if (/^\s*end\s*$/.test(trimmed)) indentLevel--;
    } else {
      // Not Mermaid syntax - stop here
      break;
    }
  }
  
  const fixed = diagramLines.join('\n').trim();
  return fixLabels(fixed);
}

// Check if a line contains valid Mermaid syntax
function isMermaidSyntax(line: string): boolean {
  if (!line) return false;
  
  // Diagram type declarations
  if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|zenuml|sankey)/i.test(line)) {
    return true;
  }
  
  // Directives and keywords
  if (/^\s*(subgraph|end|style|classDef|class|click|linkStyle|direction|title|section|accTitle|accDescr|%%)/i.test(line)) {
    return true;
  }
  
  // Sequence diagram keywords
  if (/^(participant|actor|activate|deactivate|note|loop|alt|opt|par|and|rect|critical|break|autonumber)/i.test(line)) {
    return true;
  }
  
  // State diagram keywords and special syntax
  if (/^(state|hide empty description|\[\*\])/i.test(line)) {
    return true;
  }
  
  // Comments
  if (/^\s*%%/.test(line)) {
    return true;
  }
  
  // Node definitions: A[label], B(label), C{label}, D((label)), E[[label]], etc.
  if (/^[A-Za-z0-9_]+\s*[\[\(\{]/.test(line)) {
    return true;
  }
  
  // Links and arrows (comprehensive list for flowchart, sequence, class diagrams)
  // Matches: -->, --->, -.->,-.->, ==>, ==>>, ->>, ->>,-x, --x, --, etc.
  // Also matches links with text: -- text -->, -. text .->
  if (/[A-Za-z0-9_]+\s*(--|==|\.\.|-\.)/.test(line)) {
    return true;
  }
  
  // Sequence diagram message format: A->>B, A-->>B, A-)B, etc.
  if (/[A-Za-z0-9_]+\s*(->>|-->>|-\)|--\)|-x|--x|\+|-)/.test(line)) {
    return true;
  }
  
  // Labeled edges: |text|, ||text||
  if (/[A-Za-z0-9_]+\s*[\|\|]/.test(line)) {
    return true;
  }
  
  // Sequence diagram actor definitions with colon
  if (/^[A-Za-z0-9_]+\s*:/.test(line)) {
    return true;
  }
  
  // Class diagram relationships: <|--,  *--, o--, etc.
  if (/<\|--|>\|--|\*--|o--|<\.\.|\*\.\./.test(line)) {
    return true;
  }
  
  // If none of the above explicit patterns matched, treat as prose
  // Only return true if we found an explicit Mermaid token
  return false;
}

// Fix unquoted labels with spaces
function fixLabels(code: string): string {
  return code.replace(/([A-Za-z0-9_]+)([\[\(\{])([^"\]\)\}]*\s[^"\]\)\}]*)([\]\)\}])/g, (match, nodeId, openBracket, text, closeBracket) => {
    if (!text.trim().startsWith('"')) {
      const escapedText = text.replace(/"/g, '\\"');
      return `${nodeId}${openBracket}"${escapedText}"${closeBracket}`;
    }
    return match;
  });
}

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
            content: `You are an expert at creating diagrams using Mermaid.js syntax. 

CRITICAL RULES:
1. ALWAYS wrap node text in quotes if it contains spaces
2. Use double quotes for node labels: A["Text with spaces"]
3. Single words can be unquoted: A[Start] is OK
4. Multi-word text MUST be quoted: A["User Login"] not A[User Login]

CORRECT Examples:
graph TD
    A["Start process"] --> B["Check input"]
    B --> C{Valid?}
    C -->|Yes| D["Process data"]
    C -->|No| E["Show error"]

flowchart LR
    A["num1"] --> B{"Is num1 > num2?"}
    B -->|Yes| C["num1 is largest"]
    B -->|No| D["num2 is largest"]

Only respond with valid Mermaid code, no explanations.`,
          },
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: 0.5,
      });

      const rawMermaidCode = completion.choices[0]?.message?.content || "graph TD\nA[\"Error\"] --> B[\"Could not generate diagram\"]";
      const mermaidCode = fixMermaidSyntax(rawMermaidCode);

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
            content: "You are an expert at analyzing coding discussions and creating technical diagram prompts. Focus on the CODE, ALGORITHM, or TECHNICAL CONCEPT being discussed - NOT the conversation itself. Create prompts for flowcharts showing logic flow, class diagrams showing structure, or state diagrams showing behavior. NEVER create sequence diagrams of user-AI conversations. Keep your response under 200 words.",
          },
          {
            role: "user",
            content: `Analyze this coding discussion and create a diagram prompt that visualizes the algorithm, code logic, or technical concept being explained:\n\n${context}`,
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
            content: `You are an expert at creating technical diagrams using Mermaid.js syntax.

CRITICAL RULES:
1. ALWAYS wrap node text in quotes if it contains spaces
2. Use double quotes for node labels: A["Text with spaces"]
3. Single words can be unquoted: A[Start] is OK
4. Multi-word text MUST be quoted: A["User Login"] not A[User Login]

CORRECT Examples:
flowchart TD
    A["Start"] --> B["Get two numbers"]
    B --> C{"Compare values"}
    C -->|num1 > num2| D["num1 is largest"]
    C -->|num2 >= num1| E["num2 is largest"]

Focus on CODE LOGIC flowcharts, not conversation diagrams.
Only respond with valid Mermaid code, no explanations.`,
          },
          {
            role: "user",
            content: `${diagramPrompt}\n\nCode/technical content:\n${latestAIResponse.content.substring(0, 800)}`,
          },
        ],
        temperature: 0.5,
      });

      const rawMermaidCode = diagramCompletion.choices[0]?.message?.content || "graph TD\nA[\"Error\"] --> B[\"Could not generate diagram\"]";
      const mermaidCode = fixMermaidSyntax(rawMermaidCode);

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

  // Delete diagram endpoint (protected)
  app.delete("/api/diagrams/:diagramId", requireAuth, async (req, res) => {
    try {
      const { diagramId } = req.params;
      
      // First, get the diagram to verify ownership via workspace
      const diagram = await storage.getDiagram(diagramId);
      
      if (!diagram) {
        return res.status(404).json({ error: "Diagram not found" });
      }
      
      // Verify workspace ownership
      const workspace = await storage.getWorkspace(diagram.workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      if (workspace.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deleted = await storage.deleteDiagram(diagramId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Diagram not found" });
      }
    } catch (error) {
      console.error("Error deleting diagram:", error);
      res.status(500).json({ error: "Failed to delete diagram" });
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
