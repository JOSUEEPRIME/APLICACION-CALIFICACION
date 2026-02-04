import React, { useState, useEffect } from 'react';
import { Plus, Notebook, ArrowRight, Users, FileText, ArrowLeft, Search, Settings } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredExams = exams.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 pb-20">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

                <div>
                    <button
                        onClick={onBack}
                        className="mb-4 flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
                        Volver a Materias
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Exámenes</h1>
                    <p className="text-gray-500">Gestiona las evaluaciones y calificaciones de esta materia.</p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 z-10">
                    <div className="bg-white border border-blue-100 p-4 rounded-2xl flex items-center gap-4 shadow-lg min-w-[160px]">
                        <div className="bg-blue-50 p-2 rounded-xl text-primary">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estudiantes</p>
                            <p className="text-xl font-extrabold text-gray-900">{studentCount}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-blue-100 p-4 rounded-2xl flex items-center gap-4 shadow-lg min-w-[140px]">
                        <div className="bg-green-50 p-2 rounded-xl text-success">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Creados</p>
                            <p className="text-xl font-extrabold text-gray-900">{exams.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar examen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                    />
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base"
                >
                    <Plus size={20} className="stroke-2" />
                    Crear Nuevo Examen
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <div
                    onClick={() => setIsCreating(true)}
                    className="group bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all min-h-[220px]"
                >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Plus className="text-primary" size={32} />
                    </div>
                    <span className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">Nuevo Examen</span>
                    <p className="text-xs text-gray-400 mt-2 text-center">Configura una nueva evaluación</p>
                </div>

                {/* Existing Exams */}
                {filteredExams.map((exam) => (
                    <div
                        key={exam.id}
                        onClick={() => onSelectExam(exam)}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary/30 cursor-pointer transition-all relative overflow-hidden min-h-[220px]"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                                    <Notebook size={24} />
                                </div>
                                <div className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                    {exam.createdAt?.toDate ? new Date(exam.createdAt.toDate()).toLocaleDateString() : 'Reciente'}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {exam.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {exam.rubricConfig.description ? "Rúbrica configurada" : "Sin descripción de rúbrica"}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-between text-primary font-bold group">
                            <span className="text-sm">Calificar Entregas</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredExams.length === 0 && !isCreating && (
                <div className="text-center py-12 text-gray-400">
                    <p>No hay exámenes creados en esta materia.</p>
                </div>
            )}

            {/* Creation Modal - Large for Rubric Panel */}
            {isCreating && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="bg-primary/5 p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white/50 backdrop-blur transition-all">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Examen</h2>
                                <p className="text-sm text-gray-500 mt-1">Configura los detalles y la rúbrica de evaluación</p>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus className="rotate-45" size={28} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} /> Nombre del Examen / Actividad
                                </label>
                                <input
                                    type="text"
                                    value={newExamName}
                                    onChange={(e) => setNewExamName(e.target.value)}
                                    placeholder="Ej: Parcial 1 - Primer Quimestre"
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <Settings size={18} className="text-primary" /> Configuración de la Rúbrica IA
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                                    Define claramente cómo la Inteligencia Artificial debe calificar este examen. Puedes escribir las reglas manualmente o subir un archivo con la solución correcta.
                                </p>
                                <RubricPanel config={newRubric} onChange={setNewRubric} />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl sticky bottom-0 z-10">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                            >
                                Crear Examen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamSelector;
