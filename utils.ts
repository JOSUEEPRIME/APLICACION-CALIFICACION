export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadCSV = (data: string, filename: string) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Levenshtein distance algorithm
export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

export const findBestMatch = (ocrName: string, studentList: { id: string; name: string }[]): string | undefined => {
  if (!ocrName || studentList.length === 0) return undefined;

  const normalizedOcr = ocrName.toLowerCase().trim();
  // Dividimos lo que leyó la IA en palabras (tokens)
  const ocrTokens = normalizedOcr.split(/\s+/).filter(t => t.length > 2); // Ignoramos palabras de 1-2 letras

  let bestMatchId: string | undefined = undefined;
  let maxScore = 0;

  for (const student of studentList) {
    const studentNameNorm = student.name.toLowerCase();
    const studentTokens = studentNameNorm.split(/\s+/);

    let matches = 0;

    // Verificamos cuántas palabras del OCR coinciden con el nombre del estudiante
    ocrTokens.forEach(ocrToken => {
      // Buscamos coincidencia exacta o muy cercana (para typos pequeños)
      const tokenMatch = studentTokens.some(studentToken => {
        if (studentToken.includes(ocrToken)) return true; // Ejemplo: "Torres" está en "Torres"
        if (getLevenshteinDistance(ocrToken, studentToken) <= 1) return true; // Ejemplo: "Tores" vs "Torres"
        return false;
      });

      if (tokenMatch) matches++;
    });

    // Calculamos un puntaje basado en cuántas palabras coincidieron
    // Si OCR dice "Diana Torres" (2 palabras) y encontramos las 2 en el nombre completo, el score es alto.
    const score = ocrTokens.length > 0 ? matches / ocrTokens.length : 0;

    // El umbral es 0.5: Al menos la mitad de las palabras deben coincidir.
    if (score > 0.5 && score > maxScore) {
      maxScore = score;
      bestMatchId = student.id;
    }
  }

  return bestMatchId;
};

export const findBestStudentMatch = findBestMatch;