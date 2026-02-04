import React, { useState, useCallback, useEffect } from 'react';
import RubricPanel from './components/RubricPanel';
import StudentUpload from './components/StudentUpload';
import SubmissionItem from './components/SubmissionItem';
import DetailModal from './components/DetailModal';
import Dashboard from './components/Dashboard';
import CourseSelector from './components/CourseSelector';
import SubjectSelector from './components/SubjectSelector';
import ExamSelector from './components/ExamSelector';
import StudentManager from './components/StudentManager';
import { RubricConfig, StudentSubmission, GradingStatus, Course, Student, Subject, Exam } from './types';
import { gradeSubmission } from './services/geminiService';
import { downloadCSV, findBestStudentMatch } from './utils';
import { BarChart2, Edit3, ArrowLeft, Users, Zap, Layout, LogOut } from 'lucide-react';
import { subscribeToSubmissions, createSubmission, deleteSubmission, updateSubmissionResult, subscribeToStudents, getCourse, getSubject, getExam, updateExam } from './services/db';

export default function App() {
  const [rubric, setRubric] = useState<RubricConfig>({
    description: "",
    maxScore: 10,
    strictness: 'moderate',
    language: 'spanish'
  });

  // Course & Subject & Exam State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);

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

  // Sync Students for selected COURSE
  useEffect(() => {
    if (selectedCourse) {
      const unsubscribe = subscribeToStudents(selectedCourse.id, (data) => {
        setStudents(data);
      });
      return () => unsubscribe();
    }
  }, [selectedCourse]);

  // Real-time sync with Firestore
  useEffect(() => {
    if (selectedExam) {
      const unsubscribe = subscribeToSubmissions((data) => {
        setSubmissions(data.filter(s => s.examId === selectedExam.id));
      }, selectedSubject?.id || null);
      return () => unsubscribe();
    } else {
      setSubmissions([]);
    }
  }, [selectedExam, selectedSubject]);

  // Handle Browser History & Initial Hydration
  useEffect(() => {
    const restoreStateFromHash = async () => {
      const hash = window.location.hash;
      console.log("Restoring state from:", hash);

      if (!hash) {
        setIsLoadingState(false);
        return;
      }

      const parts = hash.replace('#', '').split('/');
      // Format: course/ID/subject/ID/exam/ID

      try {
        // 1. Course
        if (parts.length >= 2 && parts[0] === 'course') {
          const cId = parts[1];
          const course = await getCourse(cId);
          if (course) setSelectedCourse(course);

          // 2. Subject
          if (parts.length >= 4 && parts[2] === 'subject') {
            const sId = parts[3];
            const subject = await getSubject(sId);
            if (subject) setSelectedSubject(subject);

            // 3. Exam
            if (parts.length >= 6 && parts[4] === 'exam') {
              const eId = parts[5];
              const exam = await getExam(eId);
              if (exam) setSelectedExam(exam);
            }
          }
        }
      } catch (e) {
        console.error("Error restoring state", e);
      } finally {
        setIsLoadingState(false);
      }
    };

    restoreStateFromHash();

    const handlePopState = () => {
      const hash = window.location.hash;
      const isExamLevel = hash.includes('/exam/');
      const isSubjectLevel = hash.includes('/subject/') && !isExamLevel;
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

  const handleUpload = useCallback(async (files: { name: string; data: string; mimeType: string }[]) => {
    if (!selectedCourse || !selectedSubject || !selectedExam) return;

    for (const f of files) {
      try {
        await createSubmission({
          fileName: f.name,
          mimeType: f.mimeType,
          courseId: selectedCourse.id,
          subjectId: selectedSubject.id,
          examId: selectedExam.id
        }, f.data);
      } catch (error) {
        console.error("Upload failed", error);
        alert(`Error subiendo ${f.name}`);
      }
    }
  }, [selectedCourse, selectedSubject, selectedExam]);

  const handleRemove = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este examen?")) {
      await deleteSubmission(id);
      if (selectedSubmissionId === id) setSelectedSubmissionId(null);
    }
  };

  const startGrading = async () => {
    const hasRubricContent = rubric.description.trim().length > 0 || (rubric.rubricFileData && rubric.rubricFileData.length > 0);

    if (!hasRubricContent) {
      alert("Por favor ingresa una descripción de la rúbrica o sube un archivo de solución primero.");
      return;
    }

    setIsGrading(true);

    const pendingSubmissions = submissions.filter(s => s.status === GradingStatus.PENDING || s.status === GradingStatus.ERROR);

    for (const sub of pendingSubmissions) {
      try {
        await updateSubmissionResult(sub.id, null, GradingStatus.PROCESSING);
        const result = await gradeSubmission(sub.fileData, sub.mimeType, rubric);
        const matchedId = findBestStudentMatch(result.studentName, students);

        if (matchedId) {
          const matchedStudent = students.find(s => s.id === matchedId);
          if (matchedStudent) {
            result.studentName = matchedStudent.name;
          }
        }

        await updateSubmissionResult(sub.id, result, GradingStatus.COMPLETED, matchedId);

      } catch (error) {
        console.error(`Error grading ${sub.fileName}:`, error);
        await updateSubmissionResult(sub.id, { error: (error as Error).message }, GradingStatus.ERROR);
      }
    }

    setIsGrading(false);
  };

  const handleManualAssign = async (submissionId: string, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const targetSubmission = submissions.find(s => s.id === submissionId);
    if (!targetSubmission) return;

    const updatedResult = targetSubmission.result
      ? { ...targetSubmission.result, studentName: student.name }
      : undefined;

    setSubmissions(prev => prev.map(sub =>
      sub.id === submissionId
        ? { ...sub, matchedStudentId: studentId, result: updatedResult }
        : sub
    ));

    // If there is an existing result, we update it properly merging the new name. 
    // If not, we don't creating a partial result just with a name creates issues.
    if (updatedResult) {
      await updateSubmissionResult(submissionId, updatedResult, GradingStatus.COMPLETED, studentId);
    } else {
      // Just update the matched link if no result exists yet
      await updateSubmissionResult(submissionId, null, targetSubmission.status, studentId);
    }
  };

  const handleSaveRubric = async () => {
    if (selectedExam) {
      try {
        await updateExam(selectedExam.id, { rubricConfig: rubric });
        alert("Rúbrica actualizada correctamente.");
      } catch (e) {
        console.error(e);
        alert("Error al actualizar rúbrica.");
      }
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Nombre de Archivo", "Estudiante", "Puntaje", "Puntaje Max", "Retroalimentación", "Transcripción"];
    const rows = submissions.map(s => [
      s.id,
      s.fileName,
      s.result?.studentName || "N/A",
      s.result?.score || 0,
      s.result?.maxScore || rubric.maxScore,
      `"${s.result?.feedback?.replace(/"/g, '""') || ''}"`,
      `"${s.result?.transcription?.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csvContent, `haca-resultados-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const completedCount = submissions.filter(s => s.status === GradingStatus.COMPLETED).length;


  // Robust Back Handlers
  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedSubject(null);
    setSelectedExam(null);
    window.history.pushState(null, '', ' ');
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedExam(null);
    if (selectedCourse) {
      window.history.pushState(null, '', `#course/${selectedCourse.id}`);
    }
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    if (selectedCourse && selectedSubject) {
      window.history.pushState(null, '', `#course/${selectedCourse.id}/subject/${selectedSubject.id}`);
    }
  };


  // Views Routing
  if (!selectedCourse) {
    return <CourseSelector onSelectCourse={handleSelectCourse} />;
  }

  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-light">
        <div className="bg-gradient-to-r from-primary to-primary/80 h-48 absolute top-0 w-full z-0"></div>
        <div className="relative z-10 pt-8">
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
              onBack={handleBackToCourses}
            />
          )}

          {!showStudentManager && (
            <div className="fixed bottom-8 right-8 z-40">
              <button
                onClick={() => setShowStudentManager(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 font-medium group"
              >
                <Users size={20} className="group-hover:text-primary transition-colors" />
                <span>Gestionar Estudiantes</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!selectedExam) {
    return (
      <div className="min-h-screen bg-light">
        <div className="bg-gradient-to-r from-primary to-primary/80 h-48 absolute top-0 w-full z-0"></div>
        <div className="relative z-10 pt-8">
          <ExamSelector
            subjectId={selectedSubject.id}
            studentCount={students.length}
            onSelectExam={handleSelectExam}
            onBack={handleBackToSubjects}
          />
        </div>
      </div>
    );
  }

  // 4. Main Grading Interface (Subject & Exam Selected)
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm"></div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between relative z-10 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToExams}
              className="p-2.5 hover:bg-gray-100/80 rounded-full transition-all text-gray-500 hover:text-primary active:scale-95"
              title="Volver"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-lg">
                {selectedCourse.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-bold text-gray-900 leading-tight">{selectedExam.name}</h1>
                <p className="text-xs text-gray-500 font-medium">{selectedSubject.name} • {selectedCourse.name}</p>
              </div>
            </div>

            {/* Navigation Tabs - Modern Pill Style */}
            <nav className="flex items-center bg-gray-100/50 p-1.5 rounded-full ml-6 border border-gray-200/50">
              <button
                onClick={() => setCurrentView('grading')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentView === 'grading'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
              >
                <Edit3 size={15} />
                <span className="hidden sm:inline">Calificación</span>
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentView === 'dashboard'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
              >
                <BarChart2 size={15} />
                <span className="hidden sm:inline">Resultados</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            {currentView === 'grading' && completedCount > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                <Layout size={16} />
                <span className="hidden lg:inline">Exportar CSV</span>
              </button>
            )}

            {currentView === 'grading' && (
              <button
                onClick={startGrading}
                disabled={isGrading || submissions.length === 0}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-95
                    ${isGrading || submissions.length === 0
                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-primary hover:shadow-xl'}`}
              >
                {isGrading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    Iniciar Calificación
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
        {currentView === 'grading' ? (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Config & Upload */}
            <div className="lg:col-span-4 space-y-6">
              <RubricPanel config={rubric} onChange={setRubric} onSave={handleSaveRubric} />
              <div className="sticky top-24">
                <StudentUpload onUpload={handleUpload} />
              </div>
            </div>

            {/* Right Col: Submissions List */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Entregas de Estudiantes</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Gestiona y califica los documentos subidos</p>
                  </div>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                    {submissions.length} Documentos
                  </span>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
                  {submissions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Layout className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-600">No hay entregas disponibles</h3>
                      <p className="text-sm mt-2 max-w-xs text-center text-gray-400">Sube los exámenes escaneados o fotografías utilizando el panel de la izquierda.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
          <div className="max-w-7xl mx-auto px-4 py-8">
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