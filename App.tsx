import React, { useState, useCallback, useEffect } from 'react';
import RubricPanel from './components/RubricPanel';
import StudentUpload from './components/StudentUpload';
import SubmissionItem from './components/SubmissionItem';
import DetailModal from './components/DetailModal';
import Dashboard from './components/Dashboard';
import { RubricConfig, StudentSubmission, GradingStatus } from './types';
import { gradeSubmission } from './services/geminiService';
import { downloadCSV } from './utils';
import { BarChart2, Edit3 } from 'lucide-react';
import { subscribeToSubmissions, createSubmission, deleteSubmission, updateSubmissionResult } from './services/db';

export default function App() {
  const [rubric, setRubric] = useState<RubricConfig>({
    description: "",
    maxScore: 10,
    strictness: 'moderate',
    language: 'spanish' // Default to Spanish
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [currentView, setCurrentView] = useState<'grading' | 'dashboard'>('grading');

  // Real-time sync with Firestore
  useEffect(() => {
    // Import dynamically to avoid circular dependencies if any, though here it's fine direct
    const unsubscribe = subscribeToSubmissions((data) => {
      setSubmissions(data);
    });
    return () => unsubscribe();
  }, []);

  // Add new files to the list -> Upload to Firebase
  const handleUpload = useCallback(async (files: { name: string; data: string; mimeType: string }[]) => {
    // Process uploads sequentially
    for (const f of files) {
      try {
        await createSubmission({ fileName: f.name, mimeType: f.mimeType }, f.data);
      } catch (error) {
        console.error("Upload failed", error);
        alert(`Error subiendo ${f.name}`);
      }
    }
  }, []);

  // Remove a submission -> Delete from Firebase
  const handleRemove = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    if (confirm("¿Estás seguro de eliminar este examen?")) {
      await deleteSubmission(id); // Only ID needed now, fileData is embedded
      if (selectedSubmissionId === id) setSelectedSubmissionId(null);
    }
  };

  // Trigger Grading Process
  const startGrading = async () => {
    // Validación: Debe existir texto O un archivo de rúbrica
    const hasRubricContent = rubric.description.trim().length > 0 || (rubric.rubricFileData && rubric.rubricFileData.length > 0);

    if (!hasRubricContent) {
      alert("Por favor ingresa una descripción de la rúbrica o sube un archivo de solución primero.");
      return;
    }

    setIsGrading(true);

    // We process sequentially 
    const pendingSubmissions = submissions.filter(s => s.status === GradingStatus.PENDING || s.status === GradingStatus.ERROR);

    for (const sub of pendingSubmissions) {
      try {
        // 1. Update status to processing
        await updateSubmissionResult(sub.id, null, GradingStatus.PROCESSING);

        // 2. Grade directly using fileData (from Firestore doc)
        const result = await gradeSubmission(sub.fileData, sub.mimeType, rubric);

        // 3. Save result
        await updateSubmissionResult(sub.id, result, GradingStatus.COMPLETED);
      } catch (error) {
        console.error(`Error grading ${sub.fileName}:`, error);
        await updateSubmissionResult(sub.id, { error: (error as Error).message }, GradingStatus.ERROR);
      }
    }

    setIsGrading(false);
  };

  // Export Logic
  const handleExport = () => {
    const headers = ["ID", "Nombre de Archivo", "Estudiante", "Puntaje", "Puntaje Max", "Retroalimentación", "Transcripción"];
    const rows = submissions.map(s => [
      s.id,
      s.fileName,
      s.result?.studentName || "N/A",
      s.result?.score || 0,
      s.result?.maxScore || rubric.maxScore,
      `"${s.result?.feedback?.replace(/"/g, '""') || ''}"`, // CSV escape
      `"${s.result?.transcription?.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    downloadCSV(csvContent, `haca-resultados-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const completedCount = submissions.filter(s => s.status === GradingStatus.COMPLETED).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-1.5 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">H.A.C.A.</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide">Herramienta Automatizada de Calificación</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-gray-100 p-1 rounded-lg ml-4">
              <button
                onClick={() => setCurrentView('grading')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'grading'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Edit3 size={16} />
                <span className="hidden sm:inline">Calificación</span>
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <BarChart2 size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </nav>
          </div>

          <div className="flex gap-3">
            {currentView === 'grading' && completedCount > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Exportar CSV
              </button>
            )}
            {currentView === 'grading' && (
              <button
                onClick={startGrading}
                disabled={isGrading || submissions.length === 0}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all
                    ${isGrading || submissions.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
              >
                {isGrading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calificando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Iniciar Calificación
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto">
        {currentView === 'grading' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Config & Upload */}
            <div className="lg:col-span-4 space-y-6">
              <RubricPanel config={rubric} onChange={setRubric} />
              <div>
                <StudentUpload onUpload={handleUpload} />
              </div>
            </div>

            {/* Right Col: Submissions List */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Entregas de la Clase</h2>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {submissions.length} Estudiantes
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
                  {submissions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p>No hay estudiantes aún.</p>
                      <p className="text-sm mt-2">Sube exámenes manuscritos para comenzar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map(sub => (
                        <SubmissionItem
                          key={sub.id}
                          submission={sub}
                          onRemove={handleRemove}
                          onClick={setSelectedSubmissionId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <Dashboard />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedSubmissionId && (
        <DetailModal
          submission={submissions.find(s => s.id === selectedSubmissionId) || null}
          onClose={() => setSelectedSubmissionId(null)}
        />
      )}
    </div>
  );
}