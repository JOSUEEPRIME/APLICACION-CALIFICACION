# 🎓 H.A.C.A. - Herramienta Automatizada de Calificación Académica

![Project Banner](https://img.shields.io/badge/Estado-Producción-success?style=for-the-badge&logo=activity)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **"Transformando la evaluación educativa mediante Inteligencia Artificial Generativa."**

<div align="justify">
  <strong>H.A.C.A.</strong> es un <strong>Proyecto de Investigación Tecnológica</strong> desarrollado para explorar la automatización del flujo de trabajo de calificación en instituciones educativas. Mediante la integración de modelos de lenguaje masivos (<strong>LLMs</strong>) y visión computacional, el sistema automatiza la transcripción, corrección y análisis de evaluaciones físicas manuscritas, garantizando consistencia, objetividad y eficiencia operativa.
</div>

---

## 🎯 Propósito Estratégico

<div align="justify">
  El objetivo central de <strong>H.A.C.A.</strong> es liberar al cuerpo docente de la carga operativa de la calificación manual repetitiva. La aplicación trasciende la simple asignación de una nota numérica; proporciona una <strong>retroalimentación pedagógica detallada y constructiva</strong>, analizando el razonamiento del estudiante. Es una herramienta ideal para:
</div>

*   **Evaluaciones de respuesta abierta y ensayos.**
*   **Problemas matemáticos con desarrollo.**
*   **Cuestionarios mixtos.**

## 📖 Flujo de Trabajo (User Journey)

<div align="justify">
  La interfaz ha sido diseñada bajo principios heurísticos de usabilidad para minimizar la curva de aprendizaje:
</div>

1.  **Contextualización:**
    <div align="justify">
      El docente selecciona la jerarquía de trabajo: <strong>Curso</strong> (Grado/Paralelo, ej. "Decimo 'B'") → <strong>Asignatura</strong> (ej. "Ciencias") → <strong>Examen</strong>. Esta estructura fragmentada evita errores administrativos.
    </div>

2.  **Calibración de la IA (Rúbrica):**
    <div align="justify">
      Antes de calificar, el usuario define los criterios de éxito. El sistema permite:
    </div>
    *   Subir un **Solucionario Maestro** (imagen/PDF) como referencia de verdad.
    *   Ajustar el **Nivel de Exigencia** (Estricto, Moderado, Benevolente).
    *   Definir el puntaje máximo y el idioma de salida.

3.  **Ingesta de Evidencias:**
    <div align="justify">
      Mediante una interfaz de <strong>Arrastrar y Soltar</strong>, se cargan las fotografías de los exámenes. El sistema convierte y optimiza las imágenes automáticamente en el navegador.
    </div>

4.  **Análisis y Revisión:**
    *   **Ejecución:** Al iniciar la calificación, el motor de IA procesa la cola de entregas.
    *   **Supervisión Humana:** <div align="justify" style="display:inline">El docente visualiza el resultado propuesto (transcripción + feedback + nota) y puede modificar cualquier parámetro manualmente si discrepa de la sugerencia de la IA.</div>

---

## 🏛️ Arquitectura del Sistema

<div align="justify">
  La solución está construida sobre una arquitectura modular <strong>Serverless</strong>, priorizando la escalabilidad y la persistencia de datos en tiempo real.
</div>

### Jerarquía de Datos
<div align="justify">
  El sistema organiza la información siguiendo un modelo relacional jerárquico estricto para mantener la integridad referencial:
</div>
1.  **Cursos (Courses):** Unidad organizativa que representa el grado y paralelo (ej. "8vo Año - Paralelo 'C'", "1er Bachillerato 'A'").
2.  **Asignaturas/Materias (Subjects):** Divisiones académicas impartidas dentro de ese curso específico (ej. "Matemáticas", "Lengua y Literatura").
3.  **Exámenes (Exams):** Evaluaciones específicas que contienen la configuración de la Rúbrica.
4.  **Entregas (Submissions):** Instancias individuales de estudiantes vinculadas a un Examen.

### Flujo de Datos (Data Pipeline)
1.  **Ingesta:** Captura de imágenes de exámenes físicos y conversión optimizada a Base64 en el cliente.
2.  **Procesamiento:**
    *   **OCR & Análisis:** <div align="justify" style="display:inline">El motor <strong>Google Gemini 2.5 Flash</strong> procesa la imagen para extraer texto manuscrito y evaluarlo contra parámetros estrictos definidos en la rúbrica.</div>
    *   **Identificación (Student Matching):** <div align="justify" style="display:inline">Algoritmo de distancia de Levenshtein para vincular automáticamente el nombre manuscrito con la base de datos de estudiantes registrados.</div>
3.  **Persistencia:** Almacenamiento transaccional en **Firestore** con listeners `onSnapshot` para sincronización bidireccional inmediata.
4.  **Hidratación de Estado:** <div align="justify" style="display:inline">Sistema de enrutamiento basado en <strong>Hash Navigation</strong> (<code>#course/:id/subject/:id/exam/:id</code>) que permite deep-linking y recuperación de contexto ante recargas de página.</div>

---

## ✨ Características Técnicas Avanzadas

*   **Motor de Calificación IA:** Utiliza prompts estructurados para simular el razonamiento de un evaluador humano, capaz de interpretar intenciones, corregir sintaxis y asignar puntajes parciales.
*   **Gestión de Estado Persistente:** Implementación robusta de `History API` para manejar la navegación del navegador (Atrás/Adelante) sin perder el contexto de la sesión de trabajo.
*   **Interfaz Mobile-First:** Diseño UI/UX adaptativo desarrollado con **Tailwind CSS**, optimizado para tablets y dispositivos móviles, permitiendo a los docentes calificar desde cualquier lugar.
*   **Dashboard Analítico en Tiempo Real:** Visualización de estadísticas de rendimiento (promedios, distribución de notas) calculadas al vuelo mediante agregaciones en Firestore.
*   **Exportación de Datos:** Generación de reportes detallados en formato CSV para análisis posterior.

---

## 🚀 Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Motor de renderizado de alto rendimiento. |
| **Lenguaje** | TypeScript | Tipado estático para asegurar la robustez del código. |
| **Estilos** | Tailwind CSS | Framework de utilidades para diseño consistente. |
| **BaaS** | Firebase (Firestore) | Base de datos NoSQL, Auth y Hosting. |
| **IA Core** | Google Gemini API | Motor de inferencia multimodal. |
| **Iconografía** | Lucide React | Sistema de iconos vectoriales ligero. |

---

## 🛠️ Despliegue e Instalación

### Requisitos del Entorno
*   Node.js v18.0.0 o superior.
*   Cuenta de Google Cloud Platform con API Vertex AI/Gemini habilitada.
*   Proyecto de Firebase activo.

### Instalación Local

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/JOSUEEPRIME/APLICACION-CALIFICACION.git
    cd APLICACION-CALIFICACION/APP
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm ci
    ```

3.  **Configuración de Entorno:**
    Crea un archivo `.env` en la raíz con las siguientes credenciales:
    ```env
    VITE_GEMINI_API_KEY="AIzaSy..."
    VITE_FIREBASE_API_KEY="AIzaSy..."
    VITE_FIREBASE_AUTH_DOMAIN="proyecto.firebaseapp.com"
    VITE_FIREBASE_PROJECT_ID="proyecto"
    ```

4.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```

---

## 🔒 Seguridad y Privacidad

*   **Manejo de Datos:** Las imágenes de los exámenes se procesan de forma efímera o se almacenan con control de acceso estricto en la base de datos.
*   **API Keys:** Las llaves de acceso deben rotarse periódicamente y restringirse por dominio (CORS) en la consola de Google Cloud.

---

## 📄 Propiedad Intelectual

<div align="justify">
  Este software forma parte del <strong>Proyecto Final de Investigación (MEDINA)</strong>. Su distribución y uso están restringidos al ámbito académico y de evaluación del proyecto.
</div>

<div align="center">
  <br>
  <sub>Copyright © 2024-2026. Todos los derechos reservados.</sub>
</div>
