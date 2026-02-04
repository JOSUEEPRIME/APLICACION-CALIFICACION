import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { subscribeToStudents, addStudentsToCourse, deleteStudent, updateStudent } from '../services/db';
import { Users, Upload, X, Trash2, Edit2, FileText, Search, UserPlus, Save } from 'lucide-react';
import StudentReportModal from './StudentReportModal';

interface StudentManagerProps {
    courseId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function StudentManager({ courseId, isOpen, onClose }: StudentManagerProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [inputList, setInputList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'bulk'>('list');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (courseId) {
            const unsubscribe = subscribeToStudents(courseId, (data) => {
                setStudents(data);
            });
            return () => unsubscribe();
        }
    }, [courseId]);

    // Sorted Students
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const surnameA = a.name.trim().split(/\s+/).pop()?.toLowerCase() || '';
            const surnameB = b.name.trim().split(/\s+/).pop()?.toLowerCase() || '';
            const comparison = surnameA.localeCompare(surnameB);
            if (comparison !== 0) return comparison;
            return a.name.localeCompare(b.name);
        }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [students, searchTerm]);

    const handleAddStudents = async () => {
        if (!inputList.trim()) return;

        setIsSubmitting(true);
        const names = Array.from(new Set(
            inputList.split(/\n/).map(s => s.trim()).filter(s => s.length > 0)
        )) as string[];

        if (names.length === 0) {
            setIsSubmitting(false);
            return;
        }

        try {
            await addStudentsToCourse(courseId, names);
            setInputList('');
            setViewMode('list');
            alert(`${names.length} estudiantes añadidos correctamente.`);
        } catch (error) {
            console.error("Error adding students", error);
            alert("Error al añadir estudiantes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setInputList(prev => prev + (prev ? '\n' : '') + text);
        };
        reader.readAsText(file);
    };

    const handleDeleteStudent = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este estudiante? Sus notas asociadas podrían perder la referencia.')) {
            await deleteStudent(id);
        }
    };

    const startEditing = (student: Student) => {
        setEditingId(student.id);
        setEditName(student.name);
    };

    const saveEdit = async () => {
        if (editingId && editName.trim()) {
            await updateStudent(editingId, editName);
            setEditingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border border-white/20">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl shadow-sm z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="text-primary" size={28} />
                            Gestión de Estudiantes
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 ml-10">
                            Administra la lista de clase y el rendimiento de tus {students.length} alumnos.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'bulk' : 'list')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${viewMode === 'bulk'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5'
                                }`}
                        >
                            {viewMode === 'list' ? <><UserPlus size={18} /> Añadir Estudiantes</> : 'Volver a la Lista'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-gray-50/50 relative">

                    {/* LIST VIEW (Table) */}
                    {viewMode === 'list' && (
                        <div className="h-full flex flex-col">
                            {/* Search and Filters */}
                            <div className="px-8 py-4 flex items-center gap-4 bg-white/50 border-b border-gray-100">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar estudiante por nombre..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-16 text-center">#</th>
                                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Estudiante</th>
                                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Entregas</th>
                                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Promedio</th>
                                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {sortedStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center text-gray-400">
                                                        No se encontraron estudiantes.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedStudents.map((student, idx) => (
                                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="py-4 px-6 text-sm font-medium text-gray-400 text-center">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {editingId === student.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editName}
                                                                        onChange={(e) => setEditName(e.target.value)}
                                                                        className="px-2 py-1 border border-primary rounded-md text-sm font-bold text-gray-800 focus:outline-none w-full"
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={saveEdit} className="p-1 text-success hover:bg-success/10 rounded">
                                                                        <Save size={16} />
                                                                    </button>
                                                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary shrink-0 shadow-sm border border-primary/20">
                                                                        {student.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-700">{student.name}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(student.submissionCount || 0) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {student.submissionCount || 0}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            {student.averageScore !== undefined && student.averageScore > 0 ? (
                                                                <span className={`font-bold text-sm ${student.averageScore >= 7 ? 'text-success' : 'text-warning'}`}>
                                                                    {student.averageScore.toFixed(2)}/10
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300 text-sm">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setSelectedStudent(student)}
                                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                    title="Ver Reporte"
                                                                >
                                                                    <FileText size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => startEditing(student)}
                                                                    className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                                                    title="Editar Nombre"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStudent(student.id)}
                                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BULK ADD VIEW */}
                    {viewMode === 'bulk' && (
                        <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right duration-300">
                            <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Upload className="text-primary" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">Importar Estudiantes</h3>
                                    <p className="text-gray-500 mt-2">
                                        Copia y pega la lista de nombres o sube un archivo plano.
                                    </p>
                                </div>

                                <textarea
                                    value={inputList}
                                    onChange={(e) => setInputList(e.target.value)}
                                    className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm mb-6 resize-none font-mono bg-gray-50"
                                    placeholder={`Juan Pérez\nMaría García\nCarlos López...`}
                                />

                                <div className="flex gap-4">
                                    <label className="flex items-center justify-center px-6 py-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-bold text-gray-700 flex-1 shadow-sm">
                                        <Upload size={18} className="mr-2" />
                                        Subir CSV/TXT
                                        <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                    <button
                                        onClick={handleAddStudents}
                                        disabled={isSubmitting || !inputList.trim()}
                                        className={`px-6 py-3 rounded-xl text-white text-sm font-bold transition-all flex-[2] shadow-lg ${isSubmitting || !inputList.trim()
                                            ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                            : 'bg-primary hover:bg-primary/90 shadow-primary/30 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {isSubmitting ? 'Procesando...' : 'Guardar Lista'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedStudent && (
                <StudentReportModal
                    student={selectedStudent}
                    courseId={courseId}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
}
