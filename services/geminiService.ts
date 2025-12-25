import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RubricConfig, GradingResult } from "../types";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key is missing. Please check VITE_GEMINI_API_KEY or GEMINI_API_KEY in .env");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

// Cache en memoria para almacenar resultados previos
// La clave será un hash de la imagen + la configuración de la rúbrica
const resultCache: Map<string, GradingResult> = new Map();

// Función simple para generar un hash de un string largo (como el base64)
const getHashCode = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const gradingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    studentName: {
      type: Type.STRING,
      description: "El nombre del estudiante encontrado en el papel. Si no se encuentra, usar 'Desconocido'.",
    },
    transcription: {
      type: Type.STRING,
      description: "La transcripción literal de la respuesta manuscrita. Capturar cada palabra incluso si tiene errores ortográficos.",
    },
    score: {
      type: Type.NUMBER,
      description: "El puntaje numérico asignado basado en la rúbrica.",
    },
    maxScore: {
      type: Type.NUMBER,
      description: "El puntaje máximo posible para esta tarea.",
    },
    feedback: {
      type: Type.STRING,
      description: "Retroalimentación constructiva para el estudiante sobre su respuesta.",
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Una lista de puntos breves sobre qué podría mejorarse.",
    },
  },
  required: ["studentName", "transcription", "score", "feedback", "areasForImprovement"],
};

export const gradeSubmission = async (
  base64Image: string,
  mimeType: string,
  rubric: RubricConfig
): Promise<GradingResult> => {
  try {
    // 1. Generar Cache Key única
    // Combinamos el hash de la imagen con la configuración de la rúbrica.
    // JSON.stringify(rubric) ahora incluye rubricFileData si existe, asegurando congruencia.
    const imageHash = getHashCode(base64Image);
    const rubricKey = JSON.stringify(rubric);
    const cacheKey = `${imageHash}::${rubricKey}`;

    if (resultCache.has(cacheKey)) {
      console.log("Recuperando resultado desde caché (congruencia garantizada)");
      // Devolvemos una copia para evitar mutaciones accidentales
      return JSON.parse(JSON.stringify(resultCache.get(cacheKey)));
    }

    // Usamos gemini-2.5-flash por su excelente capacidad de visión y razonamiento
    const modelId = "gemini-2.5-flash";

    // Construir los contenidos de la solicitud
    const contentParts: any[] = [];

    // Parte 1: El examen del estudiante (Siempre presente)
    contentParts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    });

    // Parte 2: Archivo de Rúbrica (Opcional)
    // Si existe, lo agregamos como contexto adicional.
    if (rubric.rubricFileData && rubric.rubricFileMimeType) {
      contentParts.push({
        inlineData: {
          mimeType: rubric.rubricFileMimeType,
          data: rubric.rubricFileData
        }
      });
    }

    const promptText = `
      Eres un experto maestro de escuela primaria. Tu objetivo es calificar un examen o tarea manuscrita de un estudiante.
      
      ARCHIVOS ADJUNTOS:
      1. El PRIMER archivo/imagen proporcionado es el TRABAJO DEL ESTUDIANTE.
      ${rubric.rubricFileData ? "2. El SEGUNDO archivo proporcionado es la RÚBRICA OFICIAL o SOLUCIONARIO." : ""}

      CONTEXTO:
      - La imagen del estudiante contiene texto manuscrito.
      - La letra puede ser desordenada, contener errores ortográficos o ser difícil de leer.
      
      RÚBRICA Y SOLUCIÓN (Instrucciones):
      ${rubric.rubricFileData ? "Por favor, utiliza estrictamente el archivo de rúbrica/solucionario adjunto para evaluar la respuesta." : "Utiliza la siguiente descripción:"}
      ${rubric.description}
      
      PARÁMETROS DE CALIFICACIÓN:
      - Puntaje Máximo: ${rubric.maxScore}
      - Exigencia: ${rubric.strictness}
      - Idioma Objetivo: ${rubric.language === 'auto' ? 'Detectar idioma del contenido' : rubric.language}
      
      INSTRUCCIONES:
      1. **OCR / Transcripción**: Lee el texto manuscrito del estudiante. Transcribe exactamente lo que está escrito.
      2. **Identificar Estudiante**: Busca un nombre en la hoja del estudiante.
      3. **Calificación**: Compara la respuesta transcrita contra la Rúbrica proporcionada (ya sea texto o archivo adjunto).
         - Si la Exigencia es 'lenient' (Benevolente), perdona errores menores.
         - Si la Exigencia es 'strict' (Estricta), deduce puntos por inexactitudes.
      4. **Retroalimentación**: Genera feedback constructivo.
      5. **Idioma**: Output en ${rubric.language}.
    `;

    contentParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: contentParts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: gradingSchema,
        temperature: 0.0, // ESTABLECIDO EN 0 PARA MÁXIMA DETERMINACIÓN Y CONGRUENCIA
      },
    });

    let jsonText = response.text || "{}";

    // Limpieza: Eliminar bloques de código markdown si están presentes
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
    }

    const result = JSON.parse(jsonText) as GradingResult;

    // Asegurar que el maxScore coincida con la configuración
    result.maxScore = rubric.maxScore;

    // Guardar en caché para futuras consultas idénticas
    resultCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Falló la calificación:", error);
    throw error;
  }
};