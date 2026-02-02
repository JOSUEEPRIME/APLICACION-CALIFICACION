import React from 'react';
import { GradingStatus, StudentSubmission } from '../types';

interface SubmissionItemProps {
  submission: StudentSubmission;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
}

const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, onRemove, onClick }) => {
  const getStatusColor = (status: GradingStatus) => {
    switch (status) {
      case GradingStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case GradingStatus.PROCESSING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case GradingStatus.ERROR: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: GradingStatus) => {
    switch (status) {
      case GradingStatus.PENDING: return 'PENDIENTE';
      case GradingStatus.PROCESSING: return 'PROCESANDO';
      case GradingStatus.COMPLETED: return 'COMPLETADO';
      case GradingStatus.ERROR: return 'ERROR';
      default: return status;
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(submission.id)}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
          <img
            src={`data:${submission.mimeType};base64,${submission.fileData}`}
            alt="thumb"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate max-w-[150px]">{submission.result?.studentName || "Analizando..."}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(submission.status)}`}>
              {getStatusText(submission.status)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500">{submission.fileName}</p>
            {submission.result?.studentId && (
              <span className="text-green-600 text-[10px] flex items-center bg-green-50 px-1 rounded gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Vinculado
              </span>
            )}
            {submission.status === GradingStatus.COMPLETED && !submission.result?.studentId && (
              <span className="text-amber-600 text-[10px] flex items-center bg-amber-50 px-1 rounded gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                No ID
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {submission.result && (
          <div className="text-right">
            <span className="block text-lg font-bold text-gray-900">
              {submission.result.score}<span className="text-xs text-gray-400 font-normal">/{submission.result.maxScore}</span>
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(submission.id); }}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SubmissionItem;