"use client";

import { useState } from 'react';

interface DownloadPdfButtonProps {
  scanId: string;
}

export default function DownloadPdfButton({ scanId }: DownloadPdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/scan/${scanId}/pdf`);
      
      if (!response.ok) {
        throw new Error("No se pudo generar el reporte.");
      }

      // Convertimos la respuesta a Blob (archivo binario)
      const blob = await response.blob();
      
      // Creamos una URL local en el navegador para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sentineliq-report-${scanId}.pdf`;
      document.body.appendChild(link);
      
      // Simulamos el clic para iniciar la descarga
      link.click();
      
      // Limpiamos los nodos creados
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al descargar el PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all font-semibold flex items-center gap-3"
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando Reporte...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Descargar PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded-md border border-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
