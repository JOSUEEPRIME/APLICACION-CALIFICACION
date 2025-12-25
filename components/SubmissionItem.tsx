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
            <p className="text-xs text-gray-500">{submission.fileName}</p>
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