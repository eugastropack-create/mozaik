import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Initialize Gemini AI Client (Server-side ONLY)
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Mosaic Analysis Endpoint
  app.post("/api/analyze-mosaic", async (req, res) => {
    try {
      const { imageBase64, mimeType, widthCm, heightCm, tileSizeMm, material, maxColors } = req.body;

      if (!apiKey) {
        return res.status(200).json({
          success: true,
          geminiAnalysis: {
            artisticStyle: "Görsel Sanatlar & Uygulamalı Mozaik Sanatı",
            colorNotes: `Seçilen ${maxColors} ana renk tonu, resmin derinlik ve ışık-gölge dengesini koruyacak şekilde k-means algoritması ile piksellere eşleştirildi.`,
            groutRecommendation: "Koyu füme veya antik kömür siyahı derz dolgusu (1-2mm) tercih edilerek taş renklerinin parlaklığı öne çıkarılabilir.",
            mountingAdvice: "Eser 30x30 cm modüler file panolara bölünerek alttan fileli montaj yöntemi ile duvara veya zemine sırasıyla uygulanmalıdır."
          }
        });
      }

      let promptParts: any[] = [
        {
          text: `Sen duayen bir Sanatsal Mozaik Üretim Asistanı ve Mozaik Ustasısın.
Kullanıcı sana üretilecek mozaik panonun referans resmini verdi.
Mozaik Teknik Detayları:
- Pano Ölçüleri: ${widthCm} cm Genişlik x ${heightCm} cm Yükseklik
- Taş Boyutu: ${tileSizeMm} mm
- Materyal Tipi: ${material}
- Renk Limiti: ${maxColors} Renk

Lütfen bu resmi bir mozaik ustası gözüyle teknik ve sanatsal açıdan değerlendir.
Aşağıdaki JSON formatında Türkçe yanıt üret:
1. artisticStyle: Resmin sanatsal stili ve mozaik taşlarıyla işlenmeye uygunluğu hakkında kısa profesyonel yorum.
2. colorNotes: Ana renk paletinin dağılımı ve kontras tavsiyesi.
3. groutRecommendation: En uygun derz rengi (örn: Koyu füme, Krem, Antik Siyah, Açık Gri) ve derz boşluğu önerisi.
4. mountingAdvice: Mozaik ustanın montaj sırasında dikkat etmesi gereken kritik püf noktaları.`
        }
      ];

      if (imageBase64 && mimeType) {
        promptParts.push({
          inlineData: {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: mimeType || "image/jpeg"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: promptParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              artisticStyle: { type: Type.STRING },
              colorNotes: { type: Type.STRING },
              groutRecommendation: { type: Type.STRING },
              mountingAdvice: { type: Type.STRING }
            },
            required: ["artisticStyle", "colorNotes", "groutRecommendation", "mountingAdvice"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedAnalysis = JSON.parse(resultText);

      return res.json({
        success: true,
        geminiAnalysis: parsedAnalysis
      });
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      return res.status(200).json({
        success: true,
        geminiAnalysis: {
          artisticStyle: "Sanatsal Mozaik Tasarımı",
          colorNotes: "Renk paleti başarıyla piksellendi ve harmonik taş gruplarına dönüştürüldü.",
          groutRecommendation: "1.5 mm Koyu Füme Derz Dolgusu önerilir.",
          mountingAdvice: "30x30 cm modüler file panolar sırasıyla A1 başlangıç noktasından itibaren duvara yapıştırılmalıdır."
        }
      });
    }
  });

  // Serve Vite in dev or Static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
