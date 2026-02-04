import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { subscribeToCourses, createCourse } from '../services/db';
import { Plus, BookOpen, ArrowRight, GraduationCap, LayoutGrid, Search } from 'lucide-react';

interface CourseSelectorProps {
    onSelectCourse: (course: Course) => void;
}

export default function CourseSelector({ onSelectCourse }: CourseSelectorProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Hero Section with Gradient */}
            <div className="bg-gradient-to-r from-primary to-blue-600 pt-20 pb-32 px-4 shadow-lg relative overflow-hidden">
                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="text-white">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                                Mis Cursos
                            </h1>
                            <p className="text-blue-100 text-lg md:text-xl font-light">
                                Gestiona tus clases y evalúa el progreso de tus estudiantes.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* FIX: High Contrast Stats Card */}
                            <div className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-xl border border-blue-100">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <GraduationCap className="text-primary" size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cursos</p>
                                    <p className="text-2xl font-extrabold text-primary leading-none">{courses.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-10 relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar curso por nombre o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white rounded-xl shadow-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white transition-all text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content - Overlapping Cards */}
            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20 pb-20 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Create New Course Card */}
                    <div
                        onClick={() => setIsCreating(true)}
                        className="group bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all duration-300 min-h-[280px]"
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 text-primary">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">Crear Un Nuevo Curso</h3>
                        <p className="text-gray-500 text-center mt-2 text-sm">Configura una nueva clase para comenzar</p>
                    </div>

                    {/* Existing Courses */}
                    {filteredCourses.map(course => (
                        <div
                            key={course.id}
                            onClick={() => onSelectCourse(course)}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 cursor-pointer h-full min-h-[280px]"
                        >
                            <div className="h-2 bg-gradient-to-r from-primary to-blue-400 group-hover:h-3 transition-all duration-300"></div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                                        Activo
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                    {course.name}
                                </h3>

                                <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                    {course.description || "Sin descripción disponible para este curso."}
                                </p>

                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-primary font-semibold mt-auto">
                                    <span className="text-sm">Acceder al Aula</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCourses.length === 0 && !searchTerm && courses.length > 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No se encontraron cursos con ese nombre.</p>
                    </div>
                )}
            </div>

            {/* Create Modal - Enhanced */}
            {isCreating && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="bg-primary/5 p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Nuevo Curso</h2>
                            <p className="text-sm text-gray-500 mt-1">Ingresa los detalles para crear tu curso</p>
                        </div>

                        <form onSubmit={handleCreateCourse} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Nombre del Curso</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={newCourseName}
                                        onChange={(e) => setNewCourseName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Ej. Matemáticas 10mo A"
                                    />
                                    <LayoutGrid className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Descripción / Año Lectivo</label>
                                <textarea
                                    value={newCourseDesc}
                                    onChange={(e) => setNewCourseDesc(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32"
                                    placeholder="Descripción breve del curso, año lectivo, paralelo, etc..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 px-6 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:translate-y-0.5"
                                >
                                    Crear Curso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
