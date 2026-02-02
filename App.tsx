import React, { useState, useCallback, useEffect } from 'react';
import RubricPanel from './components/RubricPanel';
import StudentUpload from './components/StudentUpload';
import SubmissionItem from './components/SubmissionItem';
import DetailModal from './components/DetailModal';
import Dashboard from './components/Dashboard';
import CourseSelector from './components/CourseSelector';
import SubjectSelector from './components/SubjectSelector';
import ExamSelector from './components/ExamSelector'; // New import
import StudentManager from './components/StudentManager';
import { RubricConfig, StudentSubmission, GradingStatus, Course, Student, Subject, Exam } from './types';
import { gradeSubmission } from './services/geminiService';
import { downloadCSV, findBestStudentMatch } from './utils';
import { BarChart2, Edit3, ArrowLeft, Users } from 'lucide-react';
import { subscribeToSubmissions, createSubmission, deleteSubmission, updateSubmissionResult, subscribeToStudents } from './services/db';

export default function App() {
  const [rubric, setRubric] = useState<RubricConfig>({
    description: "",
    maxScore: 10,
    strictness: 'moderate',
    language: 'spanish' // Default to Spanish
  });

  // Course & Subject & Exam State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null); // New state

  const [showStudentManager, setShowStudentManager] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [currentView, setCurrentView] = useState<'grading' | 'dashboard'>('grading');

  // Load Rubric from Exam when selected
  useEffect(() => {
    if (selectedExam) {
      setRubric(selectedExam.rubricConfig);
    }
  }, [selectedExam]);

  // Sync Students for selected COURSE (Students belong to the course/grade, not just the subject)
  useEffect(() => {
    if (selectedCourse) {
      const unsubscribe = subscribeToStudents(selectedCourse.id, (data) => {
        setStudents(data);
      });
      return () => unsubscribe();
    }
  }, [selectedCourse]);

  // Real-time sync with Firestore (filtered by EXAM now)
  useEffect(() => {
    if (selectedExam) {
      const unsubscribe = subscribeToSubmissions((data) => {
        // Filter locally by examId since the service filters by subjectId generally or update service to filter by examId
        // But for now, let's assume service is updated or we filter here.
        // Actually, previous step updated subscribeToSubmissions but didn't change the query to filter by examId?
        // Let's re-read the service update. Ah, I did not update the query in subscribeToSubmissions to filter by examId, only to RETURN extra field.
        // So I should filter here for safety or update the service.
        // Given complexity, let's filter client side or update service.
        // Let's rely on filtering here for now:
        setSubmissions(data.filter(s => s.examId === selectedExam.id));
      }, selectedSubject?.id || null); //Still subscribe to subject, but we might want to change this later
      return () => unsubscribe();
    } else {
      setSubmissions([]); // Clear submissions if no exam selected
    }
  }, [selectedExam, selectedSubject]);

  // Add new files to the list -> Upload to Firebase
  const handleUpload = useCallback(async (files: { name: string; data: string; mimeType: string }[]) => {
    if (!selectedCourse || !selectedSubject || !selectedExam) return;

    // Process uploads sequentially
    for (const f of files) {
      try {
        await createSubmission({
          fileName: f.name,
          mimeType: f.mimeType,
          courseId: selectedCourse.id,
          subjectId: selectedSubject.id,
          examId: selectedExam.id // <--- Pass examId
        }, f.data);
      } catch (error) {
        console.error("Upload failed", error);
        alert(`Error subiendo ${f.name}`);
      }
    }
  }, [selectedCourse, selectedSubject, selectedExam]);

  // Remove a submission -> Delete from Firebase
  const handleRemove = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    if (confirm("¿Estás seguro de eliminar este examen?")) {
      await deleteSubmission(id); // Only ID needed now
      if (selectedSubmissionId === id) setSelectedSubmissionId(null);
    }
  };

  // Trigger Grading Process
  const startGrading = async () => {
    // Validación
    // Rubric is now loaded from Exam, so it should be there.
    const hasRubricContent = rubric.description.trim().length > 0 || (rubric.rubricFileData && rubric.rubricFileData.length > 0);

    if (!hasRubricContent) {
      alert("Por favor ingresa una descripción de la rúbrica o sube un archivo de solución primero.");
      return;
    }

    setIsGrading(true);

    const pendingSubmissions = submissions.filter(s => s.status === GradingStatus.PENDING || s.status === GradingStatus.ERROR);

    for (const sub of pendingSubmissions) {
      try {
        // 1. Update status to processing
        await updateSubmissionResult(sub.id, null, GradingStatus.PROCESSING);

        // 2. Grade directly using fileData (from Firestore doc)
        // Use the current rubric state (which matches the exam)
        const result = await gradeSubmission(sub.fileData, sub.mimeType, rubric);

        // 3. Find Best Match for Student
        const matchedId = findBestStudentMatch(result.studentName, students);

        // 4. Update result object with matched info if found (optional, but good for UI)
        if (matchedId) {
          const matchedStudent = students.find(s => s.id === matchedId);
          if (matchedStudent) {
            result.studentName = matchedStudent.name; // Auto-correct name
          }
        } else {
          // Si no hay coincidencia, marcar como no identificado en el nombre si se desea, 
          // o simplemente dejar el nombre OCR.
        }

        // 5. Save result
        await updateSubmissionResult(sub.id, result, GradingStatus.COMPLETED, matchedId);

      } catch (error) {
        console.error(`Error grading ${sub.fileName}:`, error);
        await updateSubmissionResult(sub.id, { error: (error as Error).message }, GradingStatus.ERROR);
      }
    }

    setIsGrading(false);
  };

  // Handle manual student assignment
  const handleManualAssign = async (submissionId: string, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Update local state instantly
    setSubmissions(prev => prev.map(sub =>
      sub.id === submissionId
        ? { ...sub, matchedStudentId: studentId, result: sub.result ? { ...sub.result, studentName: student.name } : undefined }
        : sub
    ));

    // Save to DB
    // Assuming updateSubmissionResult handles matchedStudentId as 4th arg
    await updateSubmissionResult(submissionId, { studentName: student.name }, GradingStatus.COMPLETED, studentId);
  };

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

  // Handle Browser History (Back Button)
  useEffect(() => {
    // Initial State Check
    // If we reload, we might want to check hash, but for now let's just assume we start fresh or user navigates

    const handlePopState = () => {
      const hash = window.location.hash;
      console.log("PopState:", hash);

      // Simple routing based on hash depth or content
      // Logic:
      // #course/subject/exam -> We are in grading
      // #course/subject -> We are in exam selector
      // #course -> We are in subject selector
      // # -> We are in course selector

      if (hash.includes('/exam/')) {
        // Stay in exam? Or if we were in something else?
        // Actually, if we popstate TO this, we should ensure state matches.
        // But complex to sync perfectly if we reload. 
        // Let's implement the logic requested: "Si está en GradingView, vuelve a ExamSelector" etc.
        // Effectively, the "Previous" state is what we want.

        // If hash is #course/subject, we should BE in exam selector (no exam selected)
        // If hash Is #course, we should BE in subject selector (no subject selected)
        // If hash empty, no course selected.
      }

      // Better approach: Read state from hash to set App state
      const parts = hash.replace('#', '').split('/');
      // Expected formats: 
      // course/[id]
      // course/[id]/subject/[id]
      // course/[id]/subject/[id]/exam/[id]

      if (parts.length >= 6 && parts[4] === 'exam') {
        // We should be in grading view. 
        // If we are, fine. If not, we might not have the object data easily to restore.
        // Limitation: We store OBJECTS in state (selectedCourse: Course). URL only has ID.
        // Restoring full object from ID requires fetching.
        // For a simple "Back button works" within a session:
        // We can rely on the fact that if we POP to a state, we likely set that state previously.
        // The prompted solution suggests: "Si el usuario presiona atrás..."

        // Let's implement the specific logic:
        // If URL becomes #course/subject (implied), unset Exam.
        // If URL becomes #course, unset Subject.
        // If URL becomes empty, unset Course.
      }

      // Let's try to match the Hash to the State Levels
      const isExamLevel = hash.includes('/exam/'); // #course/cId/subject/sId/exam/eId
      const isSubjectLevel = hash.includes('/subject/') && !isExamLevel; // #course/cId/subject/sId
      const isCourseLevel = hash.includes('/course/') && !isSubjectLevel;

      if (isSubjectLevel) {
        setSelectedExam(null);
      } else if (isCourseLevel) {
        setSelectedExam(null);
        setSelectedSubject(null);
      } else if (!hash || hash === '') {
        setSelectedExam(null);
        setSelectedSubject(null);
        setSelectedCourse(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    window.history.pushState({}, '', `#course/${course.id}`);
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    window.history.pushState({}, '', `#course/${selectedCourse?.id}/subject/${subject.id}`);
  };

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    window.history.pushState({}, '', `#course/${selectedCourse?.id}/subject/${selectedSubject?.id}/exam/${exam.id}`);
  };

  const handleBackToSubject = () => {
    // Go back from Exam to Subject
    window.history.back(); // This triggers popstate, which handles the state update
    // Alternatively manual:
    // setSelectedExam(null);
    // window.history.pushState({}, '', `#course/${selectedCourse?.id}/subject/${selectedSubject?.id}`);
    // The prompt implies we want "Back" button to work. 
    // Clicking our "Back" button (UI) should probably just go back in history if we want to be consistent.
  };

  // 1. If no course selected, show course selector
  if (!selectedCourse) {
    return <CourseSelector onSelectCourse={handleSelectCourse} />;
  }

  // 2. If course selected but NO subject selected, show subject selector
  if (!selectedSubject) {
    return (
      <>
        {showStudentManager ? (
          <StudentManager
            isOpen={true}
            courseId={selectedCourse.id}
            onClose={() => setShowStudentManager(false)}
          />
        ) : (
          <SubjectSelector
            course={selectedCourse}
            onSelectSubject={handleSelectSubject}
            onBack={() => {
              // UI Back Button: Go back in history
              window.history.back();
            }}
          />
        )}
        {!showStudentManager && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowStudentManager(true)}
              className="flex items-center gap-2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Users size={20} />
              <span className="font-bold">Estudiantes del Curso</span>
            </button>
          </div>
        )}
        <div className="fixed bottom-6 left-6 z-40 sm:hidden">
          {/* Mobile Fab for easy thumb access if needed, or stick to right */}
        </div>
      </>
    );
  }

  // 3. If subject selected but NO exam selected, show exam selector
  if (!selectedExam) {
    return (
      <ExamSelector
        subjectId={selectedSubject.id}
        studentCount={students.length}
        onSelectExam={handleSelectExam}
        onBack={() => window.history.back()}
      />
    );
  }

  // 4. Main Grading Interface (Subject & Exam Selected)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title="Volver a Exámenes"
            >
              <ArrowLeft size={20} />
            </button>

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

          <div className="flex items-center gap-3">
            {/* View Toggle */}
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
                          students={students}
                          onRemove={handleRemove}
                          onClick={setSelectedSubmissionId}
                          onManualAssign={handleManualAssign}
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
            <Dashboard submissions={submissions} />
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