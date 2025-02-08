import React, { useState } from 'react';
import { initDatabase } from '../utils/database';

export default function DownloadButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const success = await initDatabase();
    if (success) {
      alert('Database initialized and data downloaded successfully!');
    } else {
      alert('Error initializing database. Check console for details.');
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleDownload} 
      disabled={loading} 
      style={{
        padding: '10px 20px',
        backgroundColor: loading ? 'gray' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? 'Downloading...' : 'Download Data'}
    </button>
  );
}
    