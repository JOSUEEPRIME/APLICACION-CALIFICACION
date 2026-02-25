import React, { useState, useRef } from 'react';
import { RubricConfig } from '../types';
import { fileToBase64 } from '../utils';

import { Save } from 'lucide-react';

interface RubricPanelProps {
  config: RubricConfig;
  onChange: (config: RubricConfig) => void;
  onSave?: () => void;
}

const RubricPanel: React.FC<RubricPanelProps> = ({ config, onChange, onSave }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof RubricConfig, value: string | number | undefined) => {
    onChange({ ...config, [field]: value });
  };

  const handleRubricFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        onChange({
          ...config,
          rubricFileData: base64,
          rubricFileMimeType: file.type,
          rubricFileName: file.name
        });
      } catch (err) {
        console.error("Error loading rubric file", err);
      }
    }
  };

  const clearRubricFile = () => {
    onChange({
      ...config,
      rubricFileData: undefined,
      rubricFileMimeType: undefined,
      rubricFileName: undefined
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Rúbrica y Solución
        </h2>
      </div>

      <div className="space-y-4">

        {/* Tabs */}
        <div className="flex bg-light p-1 rounded-lg">
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'text' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('text')}
          >
            Texto Manual
          </button>
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'file' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('file')}
          >
            Subir PDF/Img
          </button>
        </div>

        {activeTab === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Respuesta Correcta / Criterios
            </label>
            <textarea
              className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              placeholder="Ej: La respuesta debe mencionar fotosíntesis, luz solar y clorofila. Otorgar 2 puntos por la definición y 3 puntos por explicar el proceso."
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Sé específico sobre cómo se otorgan los puntos.</p>
          </div>
        ) : (
          <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 bg-light">
            {config.rubricFileData ? (
              <div className="w-full flex items-center justify-between bg-white p-3 rounded border border-primary/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-primary/10 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate">{config.rubricFileName}</span>
                </div>
                <button onClick={clearRubricFile} className="text-danger hover:text-danger/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleRubricFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium">Subir PDF o Imagen</span>
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">Rúbrica oficial o guía de soluciones</p>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puntaje Máximo
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              value={config.maxScore}
              onChange={(e) => handleChange('maxScore', parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Idioma del Examen
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              value={config.language}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              <option value="auto">Auto-detectar</option>
              <option value="spanish">Español</option>
              <option value="english">Inglés</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        {onSave && (
          <div className="pt-2">
            <button
              onClick={onSave}
              className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-black transition flex items-center justify-center gap-2 font-medium shadow-md active:scale-95"
            >
              <Save size={18} />
              Guardar Configuración
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RubricPanel;