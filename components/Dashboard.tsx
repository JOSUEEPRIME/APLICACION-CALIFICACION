
import React, { useState, useMemo } from 'react';
import { Upload, Users, Award, TrendingUp, AlertCircle, FileText, Search, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { StudentSubmission } from '../types';

interface DashboardProps {
  submissions: StudentSubmission[];
}

const Dashboard: React.FC<DashboardProps> = ({ submissions = [] }) => {
  // Transformar los datos de las entregas al formato plano que usa el dashboard
  const data = useMemo(() => {
    return submissions.map(s => ({
      id: s.id,
      filename: s.fileName,
      student: s.result?.studentName || 'Desconocido',
      score: s.result?.score || 0,
      maxScore: s.result?.maxScore || 10,
      feedback: s.result?.feedback || '',
      transcription: s.result?.transcription || ''
    })).filter(item => item.transcription !== ''); // Solo mostrar procesados o al menos con algo
  }, [submissions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Parsear CSV simple (maneja comillas) - MANTENIDO POR COMPATIBILIDAD PERO YA NO SE USA DESDE UI PRINCIPAL
  const parseCSV = (text: string) => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const splitCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.replace(/^"|"$/g, '').trim());
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
          parseCSV(text);
          alert("La carga de CSV solo está disponible en la vista de Calificación para añadir nuevas entregas.");
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

  // Análisis de Palabras Frecuentes
  const wordStats = useMemo(() => {
    const allText = data.map(d => d.transcription).join(' ').toLowerCase();
    // Lista básica de stop words en español
    const stopWords = new Set([
      'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'son', 'dos', 'fue', 'era', 'vez', 'bien', 'ser', 'tengo', 'fin', 'ha', 'sido'
    ]);

    const words = allText
      .replace(/[.,/#!$%^&*;:{}=\-_`~()"\n]/g, "")
      .replace(/\s{2,}/g, " ")
      .split(" ");

    const counts: Record<string, number> = {};
    words.forEach(word => {
      const w = word.trim();
      if (w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w)) { // Filtrar palabras cortas y stopwords
        counts[w] = (counts[w] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([text, value]) => ({ text, value }));
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
    <div className="bg-light font-sans text-secondary p-4 md:p-8">

      {/* Header inside Dashboard */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard de Resultados</h2>
          <p className="text-gray-500 mt-1">Análisis detallado de evaluaciones</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
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
          icon={<Users className="text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          title="Promedio General"
          value={stats.avgScore.toFixed(2)}
          suffix="/ 10"
          icon={<TrendingUp className="text-success" />}
          color="bg-success/10"
        />
        <StatCard
          title="Tasa Aprobación"
          value={`${stats.totalStudents > 0 ? ((stats.passing / stats.totalStudents) * 100).toFixed(0) : 0}%`}
          subtext={`(Nota >= 7)`}
          icon={<Award className="text-warning" />}
          color="bg-warning/10"
        />
        <StatCard
          title="Nota Más Alta"
          value={stats.maxScore}
          icon={<BarChart2 className="text-info" />}
          color="bg-info/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Columna Izquierda: Gráficas de Rendimiento y Palabras */}
        <div className="lg:col-span-2 space-y-6">

          {/* Distribución de Notas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Distribución de Rendimiento</h3>
            <div className="flex items-end h-40 gap-4 mt-4 px-4">
              <Bar
                label="Bajo (0-4)"
                count={stats.distribution.low}
                total={stats.totalStudents}
                color="bg-danger"
              />
              <Bar
                label="Medio (5-7)"
                count={stats.distribution.mid}
                total={stats.totalStudents}
                color="bg-warning"
              />
              <Bar
                label="Alto (8-10)"
                count={stats.distribution.high}
                total={stats.totalStudents}
                color="bg-success"
              />
            </div>
          </div>

          {/* Nueva Sección: Palabras Más Frecuentes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Palabras Frecuentes en Respuestas</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Top 8</span>
            </div>

            <div className="space-y-4">
              {wordStats.length > 0 ? (
                wordStats.map((item, index) => (
                  <div key={item.text} className="relative group">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="font-medium text-gray-700 capitalize flex items-center gap-2">
                        <span className="text-gray-300 w-4 text-xs font-mono">#{index + 1}</span>
                        {item.text}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">{item.value} usos</span>
                    </div>
                    <div className="w-full bg-light rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r shadow-sm ${index === 0 ? 'from-primary to-indigo-500' :
                          index === 1 ? 'from-info to-blue-500' :
                            index === 2 ? 'from-success to-emerald-500' :
                              'from-secondary to-gray-500 opacity-60'
                          }`}
                        style={{ width: `${(item.value / wordStats[0].value) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 bg-light rounded-lg border border-dashed border-gray-200">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">No hay suficientes datos de texto para analizar.</p>
                  <p className="text-xs mt-1 text-gray-300">Califica más exámenes para ver tendencias.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Estado del Curso</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-light rounded-lg">
                <span className="text-gray-600">Aprobados</span>
                <span className="font-bold text-success">{stats.passing}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-light rounded-lg">
                <span className="text-gray-600">Reprobados</span>
                <span className="font-bold text-danger">{stats.totalStudents - stats.passing}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  La mayoría de los estudiantes se encuentra en el rango
                  <span className="font-bold text-gray-700"> {
                    stats.totalStudents === 0 ? "..." :
                      stats.distribution.high >= stats.distribution.mid && stats.distribution.high >= stats.distribution.low ? "Alto" :
                        stats.distribution.mid >= stats.distribution.low ? "Medio" : "Bajo"
                  }</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Detalle por Estudiante</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-light text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID / Archivo</th>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4">Puntaje</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-light transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{row.id}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{row.filename}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                            {row.student ? row.student.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className={row.student === 'Desconocido' ? 'text-gray-400 italic' : 'text-gray-700'}>
                            {row.student}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-lg ${getScoreColor(row.score)}`}>
                          {row.score}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">/ {row.maxScore}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge score={row.score} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleRow(row.id)}
                          className="text-primary hover:text-primary/80 text-xs font-medium flex items-center gap-1 justify-end ml-auto"
                        >
                          {expandedRow === row.id ? 'Ocultar' : 'Ver Detalles'}
                          {expandedRow === row.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Content */}
                    {expandedRow === row.id && (
                      <tr className="bg-light/80">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                                <AlertCircle size={16} /> Retroalimentación AI
                              </h4>
                              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {row.feedback.replace(/^"|"$/g, '')}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <FileText size={16} /> Transcripción Respuesta
                              </h4>
                              <p className="text-gray-500 text-sm font-mono leading-relaxed bg-light p-2 rounded whitespace-pre-wrap">
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron resultados para su búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-400 text-xs">
        <p>HACA • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

// Componentes Auxiliares

const StatCard = ({ title, value, suffix, subtext, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
        {suffix && <span className="text-gray-400 text-sm">{suffix}</span>}
      </div>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
  </div>
);

const StatusBadge = ({ score }: { score: number }) => {
  if (score >= 8) return <span className="bg-success/20 text-success px-2 py-1 rounded-full text-xs font-bold">Excelente</span>;
  if (score >= 7) return <span className="bg-info/20 text-info px-2 py-1 rounded-full text-xs font-bold">Aprobado</span>;
  if (score >= 4) return <span className="bg-warning/20 text-warning px-2 py-1 rounded-full text-xs font-bold">Regular</span>;
  return <span className="bg-danger/20 text-danger px-2 py-1 rounded-full text-xs font-bold">Reprobado</span>;
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-success';
  if (score >= 7) return 'text-info';
  if (score >= 5) return 'text-warning';
  return 'text-danger';
};

const Bar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const heightPercentage = total > 0 ? (count / total) * 100 : 0;
  // Asegurar una altura mínima para visualización si hay datos
  const visualHeight = count > 0 ? Math.max(heightPercentage, 5) : 0;

  return (
    <div className="flex-1 flex flex-col justify-end items-center group h-full">
      <div className="mb-2 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        {count} alum. ({heightPercentage.toFixed(0)}%)
      </div>
      <div className="w-full flex-1 flex items-end justify-center">
        <div
          className={`w-full max-w-[60px] rounded-t-lg transition-all duration-500 ${color} relative shadow-sm`}
          style={{ height: `${visualHeight}%`, minHeight: count > 0 ? '4px' : '0' }}
        >
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 font-medium text-center">{label}</div>
    </div>
  );
};

export default Dashboard;
