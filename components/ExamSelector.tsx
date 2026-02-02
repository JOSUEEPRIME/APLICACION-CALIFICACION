import React, { useState, useEffect } from 'react';
import { Plus, Notebook, ArrowRight, Users, FileText } from 'lucide-react';
import { subscribeToExams, createExam } from '../services/db';
import { Exam, RubricConfig } from '../types';
import RubricPanel from './RubricPanel';

interface ExamSelectorProps {
    subjectId: string;
    studentCount: number;
    onSelectExam: (exam: Exam) => void;
    onBack: () => void;
}

const ExamSelector: React.FC<ExamSelectorProps> = ({ subjectId, studentCount, onSelectExam, onBack }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // New Exam Form State
    const [newExamName, setNewExamName] = useState('');
    const [newRubric, setNewRubric] = useState<RubricConfig>({
        description: "",
        maxScore: 10,
        strictness: 'moderate',
        language: 'spanish'
    });

    useEffect(() => {
        if (subjectId) {
            const unsubscribe = subscribeToExams(subjectId, (data) => {
                setExams(data as Exam[]);
            });
            return () => unsubscribe();
        }
    }, [subjectId]);

    const handleCreate = async () => {
        if (!newExamName.trim()) {
            alert("Debes ponerle nombre al examen");
            return;
        }
        if (!newRubric.description.trim() && !newRubric.rubricFileData) {
            alert("Debes configurar la rúbrica para crear el examen.");
            return;
        }

        await createExam({
            name: newExamName,
            subjectId: subjectId,
            rubricConfig: newRubric
        });

        setIsCreating(false);
        setNewExamName("");
        // Reset rubric if needed or keep default
    };

    if (isCreating) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <button
                    onClick={() => setIsCreating(false)}
                    className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                    &larr; Volver a lista de exámenes
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-4 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Examen</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Examen / Actividad</label>
                        <input
                            type="text"
                            value={newExamName}
                            onChange={(e) => setNewExamName(e.target.value)}
                            placeholder="Ej: Parcial 1 - Primer Quimestre"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Configuración de la Rúbrica</h3>
                        <p className="text-sm text-gray-500 mb-4">Define cómo la IA debe calificar este examen. Esta configuración se aplicará a todos los estudiantes.</p>
                        <RubricPanel config={newRubric} onChange={setNewRubric} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200 sm:border-transparent text-center"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all text-center"
                        >
                            Crear Examen y Empezar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <button
                        onClick={onBack}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2 md:mb-0"
                    >
                        &larr; Volver a materias
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Selecciona un Examen</h1>
                </div>

                {/* Dashboard Stats */}
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Estudiantes</p>
                            <p className="text-lg font-bold text-gray-800 leading-none">{studentCount}</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Exámenes</p>
                            <p className="text-lg font-bold text-gray-800 leading-none">{exams.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <button
                    onClick={() => setIsCreating(true)}
                    className="h-40 md:h-48 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 hover:border-indigo-500 transition-all group w-full"
                >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} className="md:hidden" />
                        <Plus size={32} className="hidden md:block" />
                    </div>
                    <span className="font-bold text-lg">Nuevo Examen</span>
                </button>

                {/* Existing Exams */}
                {exams.map((exam) => (
                    <div
                        key={exam.id}
                        onClick={() => onSelectExam(exam)}
                        className="h-40 md:h-48 bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <Notebook className="text-indigo-600" />
                                <h3 className="text-lg md:text-xl font-bold text-gray-800 line-clamp-2">{exam.name}</h3>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500">
                                Creado el: {exam.createdAt?.toDate ? new Date(exam.createdAt.toDate()).toLocaleDateString() : 'Reciente'}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center text-indigo-600 font-medium group-hover:translate-x-2 transition-transform text-sm md:text-base">
                            Calificar <ArrowRight size={16} className="ml-2" />
                        </div>
                    </div>
                ))}

                {exams.length === 0 && !isCreating && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <p>No hay exámenes creados en esta materia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamSelector;
