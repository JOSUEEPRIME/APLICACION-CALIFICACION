import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { subscribeToStudents, addStudentsToCourse } from '../services/db';
import { Users, Upload, X } from 'lucide-react';

interface StudentManagerProps {
    courseId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function StudentManager({ courseId, isOpen, onClose }: StudentManagerProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [inputList, setInputList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (courseId) {
            const unsubscribe = subscribeToStudents(courseId, (data) => {
                setStudents(data);
            });
            return () => unsubscribe();
        }
    }, [courseId]);

    const handleAddStudents = async () => {
        if (!inputList.trim()) return;

        setIsSubmitting(true);
        // Split by new line, remove empty and duplicates
        const names = Array.from(new Set(
            inputList
                .split(/\n/)
                .map(s => s.trim())
                .filter(s => s.length > 0)
        )) as string[];

        if (names.length === 0) {
            setIsSubmitting(false);
            return;
        }

        try {
            await addStudentsToCourse(courseId, names);
            setInputList('');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-800">Gestión de Estudiantes</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-6">

                    {/* Left: List */}
                    <div className="flex-1 flex flex-col min-h-[300px]">
                        <h3 className="font-semibold text-gray-700 mb-3 flex justify-between items-center">
                            Lista Actual
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{students.length}</span>
                        </h3>
                        <div className="flex-1 border border-gray-200 rounded-lg overflow-y-auto bg-gray-50 p-2 space-y-1">
                            {students.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center italic mt-10">Aún no hay estudiantes en este curso.</p>
                            ) : (
                                students.map(s => (
                                    <div key={s.id} className="bg-white px-3 py-2 rounded shadow-sm text-sm text-gray-700 border border-gray-100">
                                        {s.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Add Form */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-3">Añadir Estudiantes</h3>
                        <div className="bg-blue-50 p-4 rounded-lg flex-1 flex flex-col">
                            <p className="text-xs text-blue-700 mb-2">
                                Pega la lista de nombres (uno por línea) o sube un archivo de texto plano.
                            </p>

                            <textarea
                                value={inputList}
                                onChange={(e) => setInputList(e.target.value)}
                                className="flex-1 w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-3 resize-none"
                                placeholder={`Juan Pérez\nMaría García\nCarlos López...`}
                            />

                            <div className="flex gap-2">
                                <label className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1 text-sm text-gray-700">
                                    <Upload size={16} className="mr-2" />
                                    Importar TXT/CSV
                                    <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>

                            <button
                                onClick={handleAddStudents}
                                disabled={isSubmitting || !inputList.trim()}
                                className={`mt-3 w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${isSubmitting || !inputList.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isSubmitting ? 'Guardando...' : 'Añadir a la Lista'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
