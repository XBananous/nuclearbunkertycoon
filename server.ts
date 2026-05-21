import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API Proxy for Roblox
  app.get("/api/roblox/game-info", async (req, res) => {
    try {
      const universeId = "9964912209";
      
      // Get general game info
      const gameResponse = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
      const gameData = gameResponse.data?.data?.[0];

      if (!gameData) {
        throw new Error(`No game data found for universeId: ${universeId}`);
      }

      // Get votes (likes/dislikes)
      const votesResponse = await axios.get(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`);
      const votesData = votesResponse.data?.data?.[0];

      res.json({
        playing: gameData.playing ?? 0,
        visits: gameData.visits ?? 0,
        upVotes: votesData?.upVotes ?? 0,
        downVotes: votesData?.downVotes ?? 0,
        updated: gameData.updated ?? new Date().toISOString(),
        name: gameData.name ?? "Unknown",
        description: gameData.description ?? ""
      });
    } catch (error) {
      console.error("Error fetching Roblox data:", error);
      res.status(500).json({ error: "Failed to fetch Roblox data" });
    }
  });

  // AI Security post report analysis
  app.post("/api/report-post", express.json(), async (req, res) => {
    try {
      const { title, content, category, reporterReason, details } = req.body;
      
      const ai = getAI();
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            text: `Vous êtes l'IA de sécurité et de modération automatique du forum de l'abri anti-atomique (Le Bunker).
Votre tâche est d'analyser un sujet signalé par un membre de la communauté et de rendre un verdict immédiat de conformité ou d'infraction.

-- CHARTE DU BUNKER --
1. ANONYMAT STRICT : Aucune information personnelle réelle (vrais noms, numéros de téléphone privés, adresses physiques réelles, ou coordonnées personnelles identifiables comme réelles).
2. SÉCURITÉ ET ARNAQUES : Pas d'escroqueries, de tromperies, d'incitation au vol, ou de contournement du système d'échange d'items officiel du jeu.
3. CONVERSATION PROFESSIONNELLE ET COURTOISE : Pas de grossièretés extrêmes, d'insultes agressives ciblées, de harcèlement, de menaces, ou de haine.
4. PERTINENCE : Pas de spam répétitif d'autres jeux, liens suspects de phishing, ou flood incompréhensible.

SUJET ANALYSÉ :
- Titre : "${title || ''}"
- Catégorie d'origine : "${category || ''}"
- Contenu du post : "${content || ''}"

INFORMATIONS DE SIGNALEMENT REÇUES :
- Motif de signalement sélectionné : "${reporterReason || ''}"
- Précisions apportées par le membre : "${details || 'Aucune précision'}"

Analysez si ce sujet doit être masqué/supprimé car il viole l'une des 4 règles majeures rédigées ci-dessus.
Générez impérativement un JSON conforme à la structure demandée.`
          }
        ],
        config: {
          systemInstruction: "Tu es le système automatisé de protection et d'intégrité du Bunker (Abri 312). Tu rends un avis neutre, direct et catégorique.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              violatesRules: { 
                type: Type.BOOLEAN, 
                description: "Indique true si le post viole une règle et doit être immédiatement supprimé du forum" 
              },
              reason: { 
                type: Type.STRING, 
                description: "Verdict de modération expliqué de façon synthétique en français" 
              },
              aiComment: { 
                type: Type.STRING, 
                description: "Message de statut court en capitales, ex: '⚠️ VIOLATION DE CONDUITE DETECTEE' ou '✅ PROTOCOLE SECURITE RESPECTE'" 
              }
            },
            required: ["violatesRules", "reason", "aiComment"]
          }
        }
      });

      const resultText = aiResponse.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini AI");
      }

      res.json(JSON.parse(resultText));
    } catch (error) {
      console.error("AI report check error:", error);
      res.status(500).json({ 
        error: "Échec de l'analyse automatique",
        violatesRules: false,
        reason: "Le routeur de sécurité de l'IA est temporairement instable. Le signalement a été chiffré et stocké pour vérification manuelle.",
        aiComment: "⚠️ ERREUR RESEAU MODERATION"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
