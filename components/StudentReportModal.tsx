import React, { useEffect, useState, useMemo } from 'react';
import { X, Trophy, AlertCircle, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { Student, StudentSubmission, Subject, Exam } from '../types';
import { getStudentHistory, subscribeToSubjects, subscribeToExams } from '../services/db';

interface StudentReportModalProps {
    student: Student;
    courseId: string;
    onClose: () => void;
}

interface SubjectData {
    subject: Subject;
    submissions: StudentSubmission[];
    average: number;
    exams: Record<string, Exam>; // Map examId to Exam
}

const StudentReportModal: React.FC<StudentReportModalProps> = ({ student, courseId, onClose }) => {
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [examsMap, setExamsMap] = useState<Record<string, Exam>>({});
    const [loading, setLoading] = useState(true);

    // 1. Fetch Submissions & Subjects
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Submissions
                const history: any[] = await getStudentHistory(student.id);
                // Filter by current course if needed (though student is usually in one course, history might be broad)
                const courseSubmissions = history.filter(s => s.courseId === courseId);
                setSubmissions(courseSubmissions as StudentSubmission[]);

                // Fetch Subjects (Subscribe/Unsubscribe pattern or just once)
                // Since we are in a modal, a one-time fetch via listener is okay, or just use the hook logic
                // We reused subscribeToSubjects but we want a promise ideally. 
                // For now, let's wrap it or just wait a bit. 
                // Actually simpler: let's use the subscription in a separate effect or just assume we get them fast.
                // Let's use a temporary subscription to get data once.
            } catch (error) {
                console.error("Error fetching report data", error);
            }
        };

        fetchData();
    }, [student.id, courseId]);

    // Fetch Subjects separate effect
    useEffect(() => {
        const unsubscribe = subscribeToSubjects(courseId, (data) => {
            setSubjects(data);
        });
        return () => unsubscribe();
    }, [courseId]);

    // Fetch Exams for the Subjects we have
    useEffect(() => {
        if (subjects.length === 0) return;

        const unsubscribers: (() => void)[] = [];

        subjects.forEach(subject => {
            const unsub = subscribeToExams(subject.id, (examsList) => {
                setExamsMap(prev => {
                    const newMap = { ...prev };
                    examsList.forEach(e => {
                        newMap[e.id] = e as Exam;
                    });
                    return newMap;
                });
            });
            unsubscribers.push(unsub);
        });

        // Check loading state
        setLoading(false);

        return () => {
            unsubscribers.forEach(u => u());
        };
    }, [subjects]);


    // 2. Group Data
    const reportData = useMemo(() => {
        const grouped: SubjectData[] = [];

        // Group by Subject ID
        subjects.forEach(subject => {
            const subjectSubmissions = submissions.filter(s => s.subjectId === subject.id);

            const totalScore = subjectSubmissions.reduce((sum, sub) => sum + (sub.result?.score || 0), 0);
            const average = subjectSubmissions.length > 0 ? totalScore / subjectSubmissions.length : 0;

            grouped.push({
                subject,
                submissions: subjectSubmissions.sort((a, b) => {
                    // Sort by date descending
                    return (b.result as any)?.createdAt - (a.result as any)?.createdAt || 0;
                }),
                average,
                exams: examsMap
            });
        });

        // Calculate Global Average
        const validSubjects = grouped.filter(g => g.submissions.length > 0);
        const globalSum = validSubjects.reduce((sum, g) => sum + g.average, 0);
        const globalAverage = validSubjects.length > 0 ? globalSum / validSubjects.length : 0;

        return { grouped, globalAverage };
    }, [submissions, subjects, examsMap]);

    if (!student) return null;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const getScoreColor = (score: number) => score >= 7 ? 'text-success' : 'text-danger';
    const getBgScoreColor = (score: number) => score >= 7 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger';
    const getBorderColor = (score: number) => score >= 7 ? 'border-success/30' : 'border-danger/30';

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
                            {getInitials(student.name)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                            <p className="text-gray-500 text-sm flex items-center gap-1">
                                <GraduationCap size={16} /> Expediente Académico
                            </p>
                        </div>
                    </div>

                    <div className={`px-6 py-3 rounded-xl flex flex-col items-center ${getBgScoreColor(reportData.globalAverage)}`}>
                        <span className="text-xs uppercase font-bold tracking-wider opacity-70">Promedio Global</span>
                        <span className="text-3xl font-black">{reportData.globalAverage.toFixed(2)}</span>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-light rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-light">

                    {loading && <div className="text-center py-10 text-gray-400">Cargando expediente...</div>}

                    {!loading && subjects.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500">No hay materias registradas en este curso.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {reportData.grouped.map((group) => (
                            <div
                                key={group.subject.id}
                                className={`bg-white rounded-xl border-l-4 shadow-sm overflow-hidden transition-all hover:shadow-md ${group.submissions.length > 0 ? getBorderColor(group.average).replace('border-', 'border-l-') : 'border-l-gray-300'}`}
                            >
                                {/* Subject Header */}
                                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={20} className="text-gray-400" />
                                        <h3 className="text-lg font-bold text-gray-800">{group.subject.name}</h3>
                                    </div>
                                    {group.submissions.length > 0 ? (
                                        <span className={`text-xl font-bold ${getScoreColor(group.average)}`}>
                                            {group.average.toFixed(2)} <span className="text-xs text-gray-400 font-normal">/ 10</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Sin registros</span>
                                    )}
                                </div>

                                {/* Submissions List */}
                                {group.submissions.length > 0 && (
                                    <div className="bg-white">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-light text-gray-500">
                                                <tr>
                                                    <th className="px-6 py-2 font-medium">Evaluación</th>
                                                    <th className="px-6 py-2 font-medium">Nota</th>
                                                    <th className="px-6 py-2 font-medium text-right">Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.submissions.map(sub => {
                                                    const examName = sub.examId && examsMap[sub.examId] ? examsMap[sub.examId].name : 'Evaluación';
                                                    // Parse date if possible
                                                    const date = (sub as any).createdAt?.toDate ? (sub as any).createdAt.toDate().toLocaleDateString() : '—';

                                                    return (
                                                        <tr key={sub.id} className="hover:bg-light transition-colors">
                                                            <td className="px-6 py-3 text-gray-700 font-medium">
                                                                {examName}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`font-bold ${getScoreColor(sub.result?.score || 0)}`}>
                                                                    {sub.result?.score || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-gray-400 text-right text-xs">
                                                                {date}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>

                <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-light transition-colors shadow-sm">
                        Cerrar Expediente
                    </button>
                </div>

            </div>
        </div>
    );
};

export default StudentReportModal;
