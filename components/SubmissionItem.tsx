import React from 'react';
import { GradingStatus, StudentSubmission, Student } from '../types';

interface SubmissionItemProps {
  submission: StudentSubmission;
  students: Student[];
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
  onManualAssign: (submissionId: string, studentId: string) => void;
}

const SubmissionItem: React.FC<SubmissionItemProps> = ({
  submission,
  students,
  onRemove,
  onClick,
  onManualAssign
}) => {

  const getStatusColor = (status: GradingStatus) => {
    switch (status) {
      case GradingStatus.COMPLETED: return 'bg-success/20 text-success border-success/30';
      case GradingStatus.PROCESSING: return 'bg-info/20 text-info border-info/30';
      case GradingStatus.ERROR: return 'bg-danger/20 text-danger border-danger/30';
      default: return 'bg-light text-gray-800 border-gray-200';
    }
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent modal open
    onManualAssign(submission.id, e.target.value);
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 flex flex-col sm:flex-row items-center justify-between hover:shadow-md transition-shadow cursor-pointer ${submission.matchedStudentId ? 'border-success/30 ring-1 ring-success/20' : 'border-gray-200'}`}
      onClick={() => onClick(submission.id)}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="h-16 w-16 bg-light rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
          <img
            src={`data:${submission.mimeType};base64,${submission.fileData}`}
            alt="Examen"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* SMART STUDENT SELECTOR */}
            {submission.status === GradingStatus.COMPLETED || submission.status === GradingStatus.PROCESSING ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <select
                  className={`block w-full max-w-[250px] pl-2 pr-8 py-1 text-sm font-semibold rounded-md border-0 ring-1 ring-inset focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 ${submission.matchedStudentId ? 'text-success ring-success/30 bg-success/5' : 'text-gray-900 ring-gray-300'
                    }`}
                  value={submission.matchedStudentId || ""}
                  onChange={handleStudentChange}
                >
                  <option value="" disabled>-- Identificar Estudiante --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {/* OCR Feedback */}
                {!submission.matchedStudentId && submission.result?.studentName && (
                  <p className="text-xs text-warning mt-1 flex items-center gap-1">
                    <span>⚠️ OCR leyó: "{submission.result.studentName}"</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="font-medium text-gray-400 italic">Esperando calificación...</p>
            )}
          </div>

          <div className="flex gap-2">
            <span className="text-xs text-gray-400">{submission.fileName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
        {submission.result && (
          <div className="text-right">
            <span className={`block text-2xl font-bold ${submission.result.score >= 7 ? 'text-success' : 'text-warning'}`}>
              {submission.result.score}
              <span className="text-sm text-gray-400 font-normal">/{submission.result.maxScore}</span>
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Nota Final</span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onRemove(submission.id); }}
          className="text-gray-300 hover:text-danger hover:bg-danger/10 p-2 rounded-full transition-all"
          title="Eliminar examen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SubmissionItem;