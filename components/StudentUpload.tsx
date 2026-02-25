import React, { useRef, useState } from 'react';
import { fileToBase64 } from '../utils';

interface StudentUploadProps {
  onUpload: (fileGroups: { name: string; data: string; mimeType: string }[][]) => void;
}

// Interfaz local para los archivos en espera
interface PendingFile {
  name: string;
  data: string;
  mimeType: string;
}

const StudentUpload: React.FC<StudentUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiPage, setIsMultiPage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]); // ESTADO PARA PRESELECCIÓN

  const processFiles = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles: PendingFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(file);
            newFiles.push({ name: file.name, data: base64, mimeType: file.type });
          } catch (err) {
            console.error("Error al leer archivo", file.name, err);
          }
        }
      }

      if (isMultiPage) {
        // MODO MÚLTIPLE: Acumulamos en la preselección
        setPendingFiles(prev => [...prev, ...newFiles]);
      } else {
        // MODO INDIVIDUAL: Subimos directamente (1 foto = 1 examen)
        onUpload(newFiles.map(f => [f]));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };

  // Función para remover una foto de la preselección si el usuario se equivocó
  const handleRemovePending = (indexToRemove: number) => {
    setPendingFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Función para confirmar la agrupación y enviar a la lista de la derecha
  const handleConfirmUpload = () => {
    if (pendingFiles.length > 0) {
      onUpload([pendingFiles]); // Enviamos todas las fotos como 1 solo grupo
      setPendingFiles([]); // Limpiamos la bandeja
    }
  };

  // Manejar el cambio de modo (limpiamos la bandeja si el usuario desactiva el modo múltiple)
  const handleToggleMode = () => {
    if (isMultiPage && pendingFiles.length > 0) {
      if (!confirm("Tienes imágenes en espera. Si cambias de modo se descartarán. ¿Continuar?")) return;
      setPendingFiles([]);
    }
    setIsMultiPage(!isMultiPage);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* SWITCH DE ESTADO */}
      <div className="flex items-center gap-3 px-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <span className="text-sm font-semibold text-gray-700">Modo de subida:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={isMultiPage} onChange={handleToggleMode} />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
        <span className="text-sm font-medium text-gray-600">
          {isMultiPage ? 'Varias fotos = 1 Examen' : '1 foto = 1 Examen'}
        </span>
      </div>

      {/* ÁREA DE DRAG & DROP */}
      <div
        className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-center p-8 text-center overflow-hidden ${isMultiPage && pendingFiles.length > 0 ? 'min-h-[120px]' : 'min-h-[220px]'} w-full ${isDragging ? 'border-primary bg-primary/5 shadow-inner scale-[1.01]' : 'border-gray-300 bg-white hover:border-primary/50 hover:bg-light hover:shadow-md'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        <input type="file" multiple accept="image/*" className="hidden" ref={inputRef} onChange={handleFileChange} />
        <div className={`absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'group-hover:opacity-100'}`} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-all duration-300 transform group-hover:scale-110 ${isDragging ? 'bg-primary/20 text-primary shadow-sm' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <div>
            <h3 className={`text-lg font-bold transition-colors ${isDragging ? 'text-primary' : 'text-gray-900'}`}>{isDragging ? '¡Suelta los archivos aquí!' : 'Subir Tareas'}</h3>
            <p className="text-sm text-gray-500 mt-1">Arrastra imágenes o <span className="text-primary font-medium underline">haz clic para explorar</span></p>
          </div>
        </div>
      </div>

      {/* BANDEJA DE PRESELECCIÓN (Solo visible en modo múltiple si hay archivos) */}
      {isMultiPage && pendingFiles.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-800">Agrupando Examen</h4>
              <p className="text-xs text-gray-500">{pendingFiles.length} página(s) seleccionadas</p>
            </div>
            <button
              onClick={handleConfirmUpload}
              className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ¡Listo, subir!
            </button>
          </div>

          {/* Miniaturas */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="relative w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 group bg-gray-50">
                <img src={`data:${file.mimeType};base64,${file.data}`} alt={`Pág ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Número de página */}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {idx + 1}
                </div>

                {/* Botón Eliminar */}
                <button
                  onClick={() => handleRemovePending(idx)}
                  className="absolute top-1 right-1 bg-danger/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                  title="Eliminar página"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentUpload;