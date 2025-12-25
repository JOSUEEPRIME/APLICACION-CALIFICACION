import React, { useRef, useState } from 'react';
import { fileToBase64 } from '../utils';

interface StudentUploadProps {
  onUpload: (files: { name: string; data: string; mimeType: string }[]) => void;
}

const StudentUpload: React.FC<StudentUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(file);
            newFiles.push({
              name: file.name,
              data: base64,
              mimeType: file.type,
            });
          } catch (err) {
            console.error("Error al leer archivo", file.name, err);
          }
        }
      }
      onUpload(newFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div 
      className={`
        relative group rounded-xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer 
        flex flex-col items-center justify-center p-8 text-center overflow-hidden
        min-h-[220px] w-full
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 shadow-inner scale-[1.01]' 
          : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50 hover:shadow-md'
        }
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      
      {/* Fondo decorativo animado */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-indigo-100/50 to-transparent opacity-0 transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'group-hover:opacity-100'}`} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className={`
          p-4 rounded-full transition-all duration-300 transform group-hover:scale-110
          ${isDragging ? 'bg-indigo-200 text-indigo-700 shadow-sm' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'}
        `}>
          {isDragging ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
             </svg>
          )}
        </div>
        
        <div>
          <h3 className={`text-lg font-bold transition-colors ${isDragging ? 'text-indigo-800' : 'text-gray-900'}`}>
            {isDragging ? '¡Suelta los archivos aquí!' : 'Subir Tareas'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
             Arrastra imágenes o <span className="text-indigo-600 font-medium underline decoration-indigo-300 underline-offset-2">haz clic para explorar</span>
          </p>
        </div>
        
        <div className="flex gap-2 items-center justify-center mt-2">
            <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-mono text-gray-500 border border-gray-200">JPG</span>
            <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-mono text-gray-500 border border-gray-200">PNG</span>
        </div>
      </div>
    </div>
  );
};

export default StudentUpload;