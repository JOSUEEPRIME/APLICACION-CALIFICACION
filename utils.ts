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
const levenshteinDistance = (a: string, b: string): number => {
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

  let bestMatchId: string | undefined = undefined;
  let minDistance = Infinity;
  // Threshold can be adjusted. A ratio of 0.3 implies 70% similarity.
  const thresholdRatio = 0.3;

  const normalizedOcrName = ocrName.toLowerCase().trim();

  for (const student of studentList) {
    const normalizedStudentName = student.name.toLowerCase().trim();
    const distance = levenshteinDistance(normalizedOcrName, normalizedStudentName);
    const maxLen = Math.max(normalizedOcrName.length, normalizedStudentName.length);

    // Check if distance is within acceptable threshold
    if (distance <= maxLen * thresholdRatio) {
      if (distance < minDistance) {
        minDistance = distance;
        bestMatchId = student.id;
      }
    }
  }

  return bestMatchId;
};

export const findBestStudentMatch = findBestMatch;