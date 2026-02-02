import React, { useState, useEffect } from 'react';
import { Plus, Notebook, ArrowRight } from 'lucide-react';
import { subscribeToExams, createExam } from '../services/db';
import { Exam, RubricConfig } from '../types';
import RubricPanel from './RubricPanel';

interface ExamSelectorProps {
    subjectId: string;
    onSelectExam: (exam: Exam) => void;
    onBack: () => void;
}

const ExamSelector: React.FC<ExamSelectorProps> = ({ subjectId, onSelectExam, onBack }) => {
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
            <div className="max-w-4xl mx-auto p-6">
                <button
                    onClick={() => setIsCreating(false)}
                    className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                    &larr; Volver a lista de exámenes
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Examen</h2>

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

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all"
                        >
                            Crear Examen y Empezar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                    &larr; Volver a materias
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Selecciona un Examen</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <button
                    onClick={() => setIsCreating(true)}
                    className="h-48 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50 hover:border-indigo-500 transition-all group"
                >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold text-lg">Nuevo Examen</span>
                </button>

                {/* Existing Exams */}
                {exams.map((exam) => (
                    <div
                        key={exam.id}
                        onClick={() => onSelectExam(exam)}
                        className="h-48 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <Notebook className="text-indigo-600" />
                                <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{exam.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                Creado el: {exam.createdAt?.toDate ? new Date(exam.createdAt.toDate()).toLocaleDateString() : 'Reciente'}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center text-indigo-600 font-medium group-hover:translate-x-2 transition-transform">
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
