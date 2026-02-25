import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RubricConfig, GradingResult } from "../types";

// 1. Carga de Claves de API con soporte para múltiples claves
const envKeys = import.meta.env.VITE_GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEYS || '';
const singleKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Combinamos las claves de la lista y la clave individual si existen
let apiKeys = envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
if (apiKeys.length === 0 && singleKey) {
  apiKeys = [singleKey];
}

if (apiKeys.length === 0) {
  console.error("API Key is missing. Please check VITE_GEMINI_API_KEYS or GEMINI_API_KEY in .env");
}

// 2. Gestión del Estado (Índice Actual)
let currentKeyIndex = 0;
try {
  const savedIndex = localStorage.getItem('gemini_key_index');
  if (savedIndex) {
    currentKeyIndex = parseInt(savedIndex, 10) % apiKeys.length;
  }
} catch (e) {
  console.warn("localStorage not available, starting with index 0");
}

// 3. Inicialización del Cliente Cliente de IA
let ai = new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex] });

// 4. Función de Rotación
const rotateKey = () => {
  if (apiKeys.length <= 1) return; // No tiene sentido rotar si solo hay una clave

  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`⚠️ Quota exceeded or Key Invalid. Rotating to API Key index: ${currentKeyIndex}`);

  try {
    localStorage.setItem('gemini_key_index', currentKeyIndex.toString());
  } catch (e) { }

  // Re-inicializamos el cliente con la nueva clave
  ai = new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex] });
};

// Cache persistente para almacenar resultados previos y NO gastar recursos
const resultCache: Map<string, GradingResult> = new Map();

const CACHE_STORAGE_KEY = 'gemini_grading_cache_v2';

// Cargar caché desde LocalStorage al iniciar
try {
  const storedCache = localStorage.getItem(CACHE_STORAGE_KEY);
  if (storedCache) {
    const parsed = JSON.parse(storedCache);
    Object.keys(parsed).forEach(key => {
      resultCache.set(key, parsed[key]);
    });
    console.log(`Caché recuperada con ${resultCache.size} elementos para calificar automáticamente.`);
  }
} catch (e) {
  console.warn("No se pudo cargar la caché de resultados de Gemini", e);
}

// Guardar caché en LocalStorage
const persistCache = () => {
  try {
    const cacheObj = Object.fromEntries(resultCache);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    console.warn("No se pudo guardar la caché de resultados (posible límite de espacio)", e);
  }
};

const getHashCode = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
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

// Función auxiliar para generar contenido con reintentos y rotación de claves
const generateContentWithRetry = async (
  modelId: string,
  contentParts: any[],
  config: any,
  attemptsLeft: number = apiKeys.length
): Promise<any> => {
  try {
    return await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: contentParts,
      },
      config: config,
    });
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    // Detectar errores de cuota (429, resource exhausted, quota)
    const isQuotaError =
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.toLowerCase().includes('quota');

    // Detectar errores de permiso/leaked key (403)
    const isPermissionError =
      errorMessage.includes('403') ||
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.toLowerCase().includes('leaked');

    if ((isQuotaError || isPermissionError) && attemptsLeft > 1) {
      console.warn(`API Error (${isQuotaError ? 'Quota' : 'Permission/Leaked'}). Rotating key...`);
      rotateKey();
      // Reintentar recursivamente
      return generateContentWithRetry(modelId, contentParts, config, attemptsLeft - 1);
    }

    // Si no es un error de recuperación o ya no quedan intentos
    throw error;
  }
};

export const gradeSubmission = async (
  pages: { fileData: string; mimeType: string }[],
  rubric: RubricConfig
): Promise<GradingResult> => {
  try {
    const combinedData = pages.map(p => p.fileData).join("");
    const imageHash = getHashCode(combinedData);
    const rubricKey = JSON.stringify(rubric);
    const cacheKey = `${imageHash}::${rubricKey}`;

    if (resultCache.has(cacheKey)) {
      console.log("Recuperando resultado desde caché (congruencia garantizada y recursos ahorrados)");
      const cachedResult = JSON.parse(JSON.stringify(resultCache.get(cacheKey)));
      // Devolvemos la calificación de la caché directamente sin consumir la API
      return cachedResult;
    }

    const modelId = "gemini-2.5-flash";

    const contentParts: any[] = [];

    for (const page of pages) {
      contentParts.push({
        inlineData: {
          mimeType: page.mimeType,
          data: page.fileData,
        },
      });
    }

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
      1. El/los archivo(s) inicial(es) proporcionado(s) son el TRABAJO DEL ESTUDIANTE (puede constar de varias páginas de un solo examen).
      ${rubric.rubricFileData ? "2. El ÚLTIMO archivo proporcionado es la RÚBRICA OFICIAL o SOLUCIONARIO." : ""}

      CONTEXTO:
      - Las imágenes del estudiante contienen texto manuscrito y forman parte de una sola entrega.
      - La letra puede ser desordenada, contener errores ortográficos o ser difícil de leer.
      
      RÚBRICA Y SOLUCIÓN (Instrucciones):
      ${rubric.rubricFileData ? "Por favor, utiliza estrictamente el archivo de rúbrica/solucionario adjunto para evaluar la respuesta." : "Utiliza la siguiente descripción:"}
      ${rubric.description}
      
      PARÁMETROS DE CALIFICACIÓN:
      - Puntaje Máximo: ${rubric.maxScore}
      - Idioma Objetivo: ${rubric.language === 'auto' ? 'Detectar idioma del contenido' : rubric.language}
      
      INSTRUCCIONES:
      1. **OCR / Transcripción**: Lee el texto manuscrito del estudiante. Transcribe exactamente lo que está escrito.
      2. **Identificar Estudiante**: Busca un nombre en la hoja del estudiante.
      3. **Calificación**: Compara la respuesta transcrita contra la Rúbrica proporcionada (ya sea texto o archivo adjunto).
      4. **Retroalimentación**: Genera feedback constructivo.
      5. **Idioma**: Output en ${rubric.language}.
    `;

    contentParts.push({ text: promptText });

    // USAMOS LA NUEVA FUNCIÓN CON RETRY
    const response = await generateContentWithRetry(modelId, contentParts, {
      responseMimeType: "application/json",
      responseSchema: gradingSchema,
      temperature: 0.0,
    });

    let jsonText = response.text || "{}";

    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
    }

    const result = JSON.parse(jsonText) as GradingResult;
    result.maxScore = rubric.maxScore;

    resultCache.set(cacheKey, result);
    persistCache(); // Persistimos en localStorage para evitar reevaluar las mismas fotos más adelante

    return result;

  } catch (error) {
    console.error("Falló la calificación:", error);
    throw error;
  }
};