
import React, { useState, useMemo } from 'react';
import { Upload, Users, Award, TrendingUp, AlertCircle, FileText, Search, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

const Dashboard = () => {
  // Datos iniciales basados en el snippet proporcionado por el usuario
  const sampleData = [
    { id: '3a4w1b19g', filename: 'WhatsApp Image...41.jpeg', student: 'Desconocido', score: 3.33, maxScore: 10, feedback: '¡Hola! Has demostrado un buen esfuerzo en esta prueba de ciencias. Es genial que hayas identificado algunos elementos clave como el sol, el CO2 y el oxígeno. Sin embargo, hay algunas áreas importantes que necesitamos repasar...', transcription: '1) la fotosintes es una rama de las matematicas, 2) Los peiros 3) el sol 4) bajo el agua 5) es un compuesto quimico...' },
    { id: 'c32hnpubo', filename: 'WhatsApp Image...41.jpeg', student: 'Desconocido', score: 5.00, maxScore: 10, feedback: '¡Hola! Has demostrado un buen esfuerzo en tu examen de fotosíntesis. Es genial que sepas que el sol es importante y que las plantas absorben CO2 y liberan oxígeno...', transcription: '1) la fotosintesis es una rama de las matematicas, 2) Los peiros 3) el sol 4) bajo el agua...' },
    { id: 'crppe7b85', filename: 'WhatsApp Image...41.jpeg', student: 'Desconocido', score: 6.00, maxScore: 10, feedback: '¡Hola! Gracias por tu esfuerzo en esta prueba de fotosíntesis. Has demostrado que conoces algunos aspectos importantes del proceso...', transcription: '1) la fotosintes es una rama de las matemáticas, 2) Los peiros 3) el sol 4) bajo el agua 5) es un compuesto quimico...' },
    { id: '1yn5mx5ki', filename: 'WhatsApp Image...25.jpeg', student: 'Miyako', score: 0.00, maxScore: 10, feedback: 'Hola Miyako, gracias por tu mensaje. Sin embargo, esta tarea es sobre...', transcription: 'Contenido no relacionado o vacío...' },
  ];

  const [data, setData] = useState(sampleData);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Parsear CSV simple (maneja comillas)
  const parseCSV = (text: string) => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    // const headers = rows[0].split(',').map(h => h.trim()); // Unused logic for now
    
    // Función auxiliar para dividir por comas ignorando las que están entre comillas
    const splitCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.replace(/^"|"$/g, '').trim()); // Limpiar comillas externas
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.replace(/^"|"$/g, '').trim());
      return result;
    };

    const parsedData = rows.slice(1).map(row => {
      const values = splitCSVLine(row);
      // Mapeo seguro basado en índices estándar del archivo
      return {
        id: values[0],
        filename: values[1],
        student: values[2],
        score: parseFloat(values[3]) || 0,
        maxScore: parseFloat(values[4]) || 10,
        feedback: values[5],
        transcription: values[6]
      };
    });
    
    return parsedData;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseCSV(text);
          setData(parsed);
        } catch (error) {
          alert("Error al leer el archivo CSV. Asegúrate de que el formato sea correcto.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Cálculos de estadísticas
  const stats = useMemo(() => {
    const totalStudents = data.length;
    const avgScore = data.reduce((acc, curr) => acc + curr.score, 0) / (totalStudents || 1);
    const passing = data.filter(d => d.score >= 7).length;
    const maxScore = Math.max(...data.map(d => d.score));
    
    // Distribución para gráfica simple
    const distribution = {
      low: data.filter(d => d.score < 5).length,
      mid: data.filter(d => d.score >= 5 && d.score < 8).length,
      high: data.filter(d => d.score >= 8).length
    };

    return { totalStudents, avgScore, passing, maxScore, distribution };
  }, [data]);

  const filteredData = data.filter(item => 
    item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      
      {/* Header inside Dashboard */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard de Resultados</h2>
          <p className="text-slate-500 mt-1">Análisis detallado de evaluaciones</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
            <Upload size={18} />
            <span>Cargar CSV Completo</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Estudiantes" 
          value={stats.totalStudents} 
          icon={<Users className="text-blue-500" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Promedio General" 
          value={stats.avgScore.toFixed(2)} 
          suffix="/ 10"
          icon={<TrendingUp className="text-emerald-500" />} 
          color="bg-emerald-50"
        />
        <StatCard 
          title="Tasa Aprobación" 
          value={`${((stats.passing / stats.totalStudents) * 100).toFixed(0)}%`} 
          subtext={`(Nota >= 7)`}
          icon={<Award className="text-purple-500" />} 
          color="bg-purple-50"
        />
        <StatCard 
          title="Nota Más Alta" 
          value={stats.maxScore} 
          icon={<BarChart2 className="text-orange-500" />} 
          color="bg-orange-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Distribución de Notas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Distribución de Rendimiento</h3>
          <div className="flex items-end h-40 gap-4 mt-4 px-4">
            <Bar 
              label="Bajo (0-4)" 
              count={stats.distribution.low} 
              total={stats.totalStudents} 
              color="bg-red-400" 
            />
            <Bar 
              label="Medio (5-7)" 
              count={stats.distribution.mid} 
              total={stats.totalStudents} 
              color="bg-yellow-400" 
            />
            <Bar 
              label="Alto (8-10)" 
              count={stats.distribution.high} 
              total={stats.totalStudents} 
              color="bg-emerald-400" 
            />
          </div>
        </div>

        {/* Resumen Rápido */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Estado del Curso</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Aprobados</span>
              <span className="font-bold text-emerald-600">{stats.passing}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Reprobados</span>
              <span className="font-bold text-red-600">{stats.totalStudents - stats.passing}</span>
            </div>
             <div className="mt-4 pt-4 border-t border-slate-100">
               <p className="text-sm text-slate-500">
                 La mayoría de los estudiantes se encuentra en el rango 
                 <span className="font-bold text-slate-700"> {
                   stats.distribution.high >= stats.distribution.mid && stats.distribution.high >= stats.distribution.low ? "Alto" :
                   stats.distribution.mid >= stats.distribution.low ? "Medio" : "Bajo"
                 }</span>.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Detalle por Estudiante</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar estudiante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID / Archivo</th>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4">Puntaje</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{row.id}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{row.filename}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {row.student ? row.student.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className={row.student === 'Desconocido' ? 'text-slate-400 italic' : 'text-slate-700'}>
                            {row.student}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-lg ${getScoreColor(row.score)}`}>
                          {row.score}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">/ {row.maxScore}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge score={row.score} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleRow(row.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 justify-end ml-auto"
                        >
                          {expandedRow === row.id ? 'Ocultar' : 'Ver Detalles'}
                          {expandedRow === row.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {expandedRow === row.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-2">
                                <AlertCircle size={16} /> Retroalimentación AI
                              </h4>
                              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {row.feedback.replace(/^"|"$/g, '')}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                <FileText size={16} /> Transcripción Respuesta
                              </h4>
                              <p className="text-slate-500 text-sm font-mono leading-relaxed bg-slate-50 p-2 rounded whitespace-pre-wrap">
                                {row.transcription.replace(/^"|"$/g, '')}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron resultados para su búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-slate-400 text-xs">
        <p>Generado para Ab. Jose Morales • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

// Componentes Auxiliares

const StatCard = ({ title, value, suffix, subtext, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        {suffix && <span className="text-slate-400 text-sm">{suffix}</span>}
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
  </div>
);

const StatusBadge = ({ score }: { score: number }) => {
  if (score >= 8) return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Excelente</span>;
  if (score >= 7) return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Aprobado</span>;
  if (score >= 4) return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">Regular</span>;
  return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Reprobado</span>;
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 7) return 'text-blue-600';
  if (score >= 5) return 'text-yellow-600';
  return 'text-red-600';
};

const Bar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const heightPercentage = total > 0 ? (count / total) * 100 : 0;
  // Asegurar una altura mínima para visualización si hay datos
  const visualHeight = count > 0 ? Math.max(heightPercentage, 10) : 0; 
  
  return (
    <div className="flex-1 flex flex-col justify-end items-center group">
      <div className="mb-2 opacity-0 group-hover:opacity-100 transition text-xs font-bold text-slate-600">
        {count} alum. ({heightPercentage.toFixed(0)}%)
      </div>
      <div 
        className={`w-full max-w-[60px] rounded-t-md transition-all duration-500 ${color} relative`}
        style={{ height: `${visualHeight}%` }}
      >
      </div>
      <div className="mt-2 text-xs text-slate-500 font-medium text-center">{label}</div>
    </div>
  );
};

export default Dashboard;
