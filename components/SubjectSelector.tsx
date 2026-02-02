import React, { useState, useEffect } from 'react';
import { Course, Subject } from '../types';
import { subscribeToSubjects, createSubject } from '../services/db';
import { Plus, Book, ArrowLeft } from 'lucide-react';

interface SubjectSelectorProps {
    course: Course;
    onSelectSubject: (subject: Subject) => void;
    onBack: () => void;
}

export default function SubjectSelector({ course, onSelectSubject, onBack }: SubjectSelectorProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');

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

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <button
                    onClick={onBack}
                    className="mb-6 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="mr-2" size={20} />
                    Volver a Cursos
                </button>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.name}</h1>
                    <p className="text-gray-500">Selecciona la materia que deseas calificar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Subject Card */}
                    <div
                        onClick={() => setIsCreating(true)}
                        className="group bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all min-h-[160px]"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                            <Plus className="text-green-600" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Añadir Materia</h3>
                    </div>

                    {/* Existing Subjects */}
                    {subjects.map(subject => (
                        <div
                            key={subject.id}
                            onClick={() => onSelectSubject(subject)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center justify-center min-h-[160px] text-center"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                <Book className="text-indigo-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                            <p className="text-xs text-gray-400 mt-2">Click para ingresar</p>
                        </div>
                    ))}
                </div>

                {/* Create Modal */}
                {isCreating && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Materia</h2>
                            <form onSubmit={handleCreateSubject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Asignatura</label>
                                    <input
                                        type="text"
                                        required
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                        placeholder="Ej. Matemáticas, Historia..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
