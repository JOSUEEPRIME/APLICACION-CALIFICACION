# 🎓 H.A.C.A. - Herramienta Automatizada de Calificación Académica

![Project Banner](https://img.shields.io/badge/Estado-Producción-success?style=for-the-badge&logo=activity)
![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **"Transformando la evaluación educativa mediante Inteligencia Artificial Generativa."**

**H.A.C.A.** es una plataforma empresarial diseñada para modernizar el flujo de trabajo de calificación en instituciones educativas. Mediante la integración de modelos de lenguaje masivos (**LLMs**) y visión computacional, el sistema automatiza la transcripción, corrección y análisis de evaluaciones físicas manuscritas, garantizando consistencia, objetividad y eficiencia operativa.

---

## 🏛️ Arquitectura del Sistema

La solución está construida sobre una arquitectura modular **Serverless**, priorizando la escalabilidad y la persistencia de datos en tiempo real.

### Jerarquía de Datos
El sistema organiza la información siguiendo un modelo relacional jerárquico estricto para mantener la integridad referencial:
1.  **Cursos (Courses):** Unidad organizativa superior (ej. "Matemáticas 101").
2.  **Asignaturas/Materias (Subjects):** Divisiones temáticas dentro de un curso (ej. "Álgebra").
3.  **Exámenes (Exams):** Evaluaciones específicas que contienen la configuración de la Rúbrica.
4.  **Entregas (Submissions):** Instancias individuales de estudiantes vinculadas a un Examen.

### Flujo de Datos (Data Pipeline)
1.  **Ingesta:** Captura de imágenes de exámenes físicos y conversión optimizada a Base64 en el cliente.
2.  **Procesamiento:**
    *   **OCR & Análisis:** El motor **Google Gemini 2.5 Flash** procesa la imagen para extraer texto manuscrito y evaluarlo contra parámetros estrictos definidos en la rúbrica.
    *   **Identificación (Student Matching):** Algoritmo de distancia de Levenshtein para vincular automáticamente el nombre manuscrito con la base de datos de estudiantes registrados.
3.  **Persistencia:** Almacenamiento transaccional en **Firestore** con listeners `onSnapshot` para sincronización bidireccional inmediata.
4.  **Hidratación de Estado:** Sistema de enrutamiento basado en **Hash Navigation** (`#course/:id/subject/:id/exam/:id`) que permite deep-linking y recuperación de contexto ante recargas de página.

---

## ✨ Características Técnicas Avanzadas

*   **Motor de Calificación IA:** Utiliza prompts estructurados para simular el razonamiento de un evaluador humano, capaz de interpretar intenciones, corregir sintaxis y asignar puntajes parciales.
*   **Gestión de Estado Persistente:** Implementación robusta de `History API` para manejar la navegación del navegador (Atrás/Adelante) sin perder el contexto de la sesión de trabajo.
*   **Interfaz Mobile-First:** Diseño UI/UX adaptativo desarrollado con **Tailwind CSS**, optimizado para tablets y dispositivos móviles, permitiendo a los docentes calificar desde cualquier lugar.
*   **Dashboard Analítico en Tiempo Real:** Visualización de estadísticas de rendimiento (promedios, distribución de notas) calculadas al vuelo mediante agregaciones en Firestore.
*   **Exportación Corporativa:** Generación de reportes detallados en formato CSV para integración con sistemas LMS o ERP externos.

---

## 🚀 Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Motor de renderizado de alto rendimiento. |
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

## 📄 Licencia y Derechos

Este software es propiedad de **H.A.C.A. Systems**. Su uso, modificación y distribución están sujetos a los términos de la licencia propietaria interna.

<div align="center">
  <br>
  <sub>Copyright © 2024-2026 H.A.C.A. Todos los derechos reservados.</sub>
</div>
