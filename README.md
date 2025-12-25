
# 🎓 H.A.C.A. - Herramienta Automatizada de Calificación

![Project Banner](https://img.shields.io/badge/Estado-Activo-success?style=for-the-badge&logo=activity)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **Transforma la manera de calificar exámenes manuscritos con el poder de la Inteligencia Artificial.**

H.A.C.A. es una aplicación web moderna diseñada para automatizar el tedioso proceso de calificación de exámenes físicos. Utilizando la última tecnología de visión y lenguaje de **Google Gemini**, el sistema transcribe, analiza y califica respuestas manuscritas basándose en rúbricas personalizables, reduciendo horas de trabajo a minutos.

---

## ✨ Características Principales

*   **🤖 Calificación con IA:** Análisis inteligente de escritura a mano capaz de entender contextos, transcripciones imperfectas y diferentes idiomas.
*   **☁️ Sincronización en la Nube:** Arquitectura *Serverless* potenciada por **Firebase Firestore**. Tus datos y calificaciones se sincronizan en tiempo real entre todos tus dispositivos.
*   **📊 Dashboard Analítico:** Visualiza el rendimiento de tu clase con gráficos de distribución, promedios y métricas clave al instante.
*   **📝 Rúbricas Dinámicas:** Configura criterios de evaluación flexibles (estricto, moderado, benevolente) y puntajes máximos personalizados.
*   **📁 Gestión de Evidencias:** Cada examen se guarda digitalmente junto con su transcripción y feedback detallado.
*   **💾 Exportación de Datos:** Descarga los resultados en formato CSV compatible con Excel/Sheets para tu registro de notas.

---

## 🚀 Tecnologías

Este proyecto está construido con un stack tecnológico de vanguardia para asegurar rendimiento, escalabilidad y una experiencia de usuario premium:

*   **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) para una experiencia de desarrollo y carga ultrarrápida.
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) para un código robusto y tipado.
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para un diseño moderno, responsivo y elegante.
*   **Backend & DB:** [Firebase Firestore](https://firebase.google.com/docs/firestore) como base de datos NoSQL en tiempo real (Persistencia de imágenes en Base64).
*   **Inteligencia Artificial:** [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) a través del SDK oficial `@google/genai`.
*   **Iconos:** [Lucide React](https://lucide.dev/).

---

## 🛠️ Instalación y Configuración

Sigue estos pasos para correr el proyecto en tu máquina local:

### Prerrequisitos
*   Node.js (v18 o superior)
*   NPM
*   Una cuenta de Google Cloud (para Gemini API Key)
*   Un proyecto de Firebase configurado

### 1. Clonar el repositorio
```bash
git clone https://github.com/JOSUEEPRIME/APLICACION-CALIFICACION.git
cd APLICACION-CALIFICACION/APP
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del directorio `APP` y añade tus claves:

```env
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
VITE_FIREBASE_API_KEY=tu_api_key_de_firebase
```

> **Nota:** Para despliegues en CI/CD (GitHub Actions), asegúrate de agregar `GEMINI_API_KEY` como un **Secret** en tu repositorio.

### 4. Ejecutar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📸 Capturas de Pantalla

| Vista de Calificación | Dashboard de Estadísticas |
|:---:|:---:|
| *Espacio para subir y calificar exámenes* | *Métricas de rendimiento de la clase* |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

---

<div align="center">
  <sub>Desarrollado con ❤️ por el equipo de H.A.C.A.</sub>
</div>
