import React, { useState, useEffect } from 'react';
import { Course, Subject } from '../types';
import { subscribeToSubjects, createSubject } from '../services/db';
import { Plus, Book, ArrowLeft, Search, GraduationCap } from 'lucide-react';

interface SubjectSelectorProps {
    course: Course;
    onSelectSubject: (subject: Subject) => void;
    onBack: () => void;
}

export default function SubjectSelector({ course, onSelectSubject, onBack }: SubjectSelectorProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToSubjects(course.id, (data) => {
            setSubjects(data);
        });
        return () => unsubscribe();
    }, [course.id]);

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;

        try {
            await createSubject(newSubjectName, course.id);
            setNewSubjectName('');
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating subject", error);
            alert("Error creando la materia");
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                        Volver a Cursos
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{course.name}</h1>
                    <p className="text-gray-500">Selecciona la materia que deseas calificar.</p>
                </div>

                <div className="flex items-center gap-4 z-10">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                        <GraduationCap className="text-primary" size={32} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar materia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                    />
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-success to-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-success/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={20} />
                    Nueva Materia
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Subject Card (Small) */}
                <div
                    onClick={() => setIsCreating(true)}
                    className="group bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-success hover:bg-success/5 transition-all min-h-[200px]"
                >
                    <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-success group-hover:text-white transition-all duration-300">
                        <Plus className="text-success group-hover:text-white" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 text-center">Crear Materia</h3>
                    <p className="text-xs text-center text-gray-400 mt-1">Añade una nueva asignatura</p>
                </div>

                {/* Existing Subjects */}
                {filteredSubjects.map(subject => (
                    <div
                        key={subject.id}
                        onClick={() => onSelectSubject(subject)}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all flex flex-col items-center justify-center min-h-[200px] text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-primary transition-colors duration-300"></div>

                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                            <Book className="text-primary" size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{subject.name}</h3>
                        <p className="text-xs text-gray-400">Click para ingresar</p>

                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Seleccionar</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSubjects.length === 0 && !isCreating && (
                <div className="text-center py-12 text-gray-400">
                    <p>No tienes materias creadas en este curso.</p>
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-success/5 p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Nueva Materia</h2>
                            <p className="text-sm text-gray-500 mt-1">Añade una asignatura al curso {course.name}</p>
                        </div>

                        <form onSubmit={handleCreateSubject} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Asignatura</label>
                                <input
                                    type="text"
                                    required
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all placeholder-gray-400"
                                    placeholder="Ej. Matemáticas, Historia..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-success rounded-xl hover:bg-success/90 hover:shadow-lg hover:shadow-success/20 transition-all"
                                >
                                    Crear Materia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
