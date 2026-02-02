import React, { useState, useEffect } from 'react';
import { StudentSubmission, GradingStatus } from '../types';
import { updateSubmissionResult } from '../services/db';

interface DetailModalProps {
    submission: StudentSubmission | null;
    onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ submission, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedScore, setEditedScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (submission?.result) {
            setEditedName(submission.result.studentName);
            setEditedScore(submission.result.score);
        }
    }, [submission]);

    if (!submission) return null;

    const handleSave = async () => {
        if (!submission.result) return;
        setIsSaving(true);
        try {
            const updatedResult = {
                ...submission.result,
                studentName: editedName,
                score: Number(editedScore)
            };
            // Maintain status as COMPLETED unless logic dictates otherwise
            await updateSubmissionResult(submission.id, updatedResult, GradingStatus.COMPLETED);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating submission:", error);
            alert("Error guardando cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left: Image Viewer */}
                <div className="w-1/2 bg-gray-900 flex items-center justify-center p-4 overflow-auto">
                    <img
                        src={`data:${submission.mimeType};base64,${submission.fileData}`}
                        alt="Trabajo del Estudiante"
                        className="max-w-full max-h-full object-contain shadow-lg"
                    />
                </div>

                {/* Right: Analysis */}
                <div className="w-1/2 flex flex-col h-full bg-white">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 mr-4">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nombre del Estudiante</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="w-full font-bold text-gray-900 border-b border-gray-300 focus:border-indigo-600 outline-none pb-1"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {submission.result?.studentName || "Estudiante Desconocido"}
                                    </h2>
                                )}
                                <p className="text-sm text-gray-500 mt-1">{submission.fileName}</p>
                            </div>

                            {submission.result && (
                                <div className="text-right">
                                    <div className="flex items-end justify-end gap-1">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editedScore}
                                                onChange={(e) => setEditedScore(Number(e.target.value))}
                                                className="w-16 text-3xl font-bold text-indigo-600 text-right border-b border-gray-300 focus:border-indigo-600 outline-none"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-indigo-600">{submission.result.score}</span>
                                        )}
                                        <span className="text-base text-gray-400 font-medium mb-1">/{submission.result.maxScore}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Puntaje</div>
                                </div>
                            )}
                        </div>

                        {submission.result && (
                            <div className="flex justify-end">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar Nota
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {submission.error ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                                Error: {submission.error}
                            </div>
                        ) : !submission.result ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p>Analizando envío...</p>
                            </div>
                        ) : (
                            <>
                                {/* Transcription Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        Escritura Reconocida
                                    </h3>
                                    <div className="text-gray-800 font-medium text-lg font-serif leading-relaxed whitespace-pre-wrap">
                                        "{submission.result.transcription}"
                                    </div>
                                </div>

                                {/* Feedback Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-2">Retroalimentación del Docente</h3>
                                    <p className="text-blue-800 leading-relaxed">{submission.result.feedback}</p>
                                </div>

                                {/* Improvements Section */}
                                {submission.result.areasForImprovement.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Áreas de Mejora</h3>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            {submission.result.areasForImprovement.map((area, idx) => (
                                                <li key={idx}>{area}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;