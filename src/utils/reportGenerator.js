/**
 * Utility for generating various report formats
 */

const generateCSV = (data, headers) => {
  if (!data || !data.length) return '';
  
  const headerRow = headers.join(',') + '\n';
  const rows = data.map(item => {
    return headers.map(h => {
      const value = item[h] || '';
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',');
  }).join('\n');
  
  return headerRow + rows;
};

module.exports = { generateCSV };
