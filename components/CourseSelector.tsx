import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { subscribeToCourses, createCourse } from '../services/db';
import { Plus, BookOpen, ArrowRight } from 'lucide-react';

interface CourseSelectorProps {
    onSelectCourse: (course: Course) => void;
}

export default function CourseSelector({ onSelectCourse }: CourseSelectorProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToCourses((data) => {
            setCourses(data);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;

        try {
            await createCourse(newCourseName, newCourseDesc);
            setNewCourseName('');
            setNewCourseDesc('');
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating course", error);
            alert("Error creando el curso");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Cursos</h1>
                    <p className="text-gray-500">Selecciona un curso para comenzar a calificar o crea uno nuevo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Course Card */}
                    <div
                        onClick={() => setIsCreating(true)}
                        className="group bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                            <Plus className="text-indigo-600" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Curso</h3>
                    </div>

                    {/* Existing Courses */}
                    {courses.map(course => (
                        <div
                            key={course.id}
                            onClick={() => onSelectCourse(course)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all flex flex-col min-h-[200px]"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="text-blue-600" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{course.name}</h3>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                                {course.description || "Sin descripción"}
                            </p>
                            <div className="flex items-center text-indigo-600 font-medium text-sm mt-auto group">
                                Abrir Curso <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Modal */}
                {isCreating && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nuevo Curso</h2>
                            <form onSubmit={handleCreateCourse} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCourseName}
                                        onChange={(e) => setNewCourseName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Ej. 10mo EGB - Paralelo A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Año Lectivo</label>
                                    <textarea
                                        value={newCourseDesc}
                                        onChange={(e) => setNewCourseDesc(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                                        placeholder="Año Lectivo 2025-2026..."
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
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                    >
                                        Crear Curso
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
