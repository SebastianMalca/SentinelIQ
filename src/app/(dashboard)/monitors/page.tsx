"use client";

import { useState, useEffect } from 'react';
import { Activity, Plus, Globe, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import DownloadPdfButton from '@/components/DownloadPdfButton';

export default function MonitorsPage() {
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState('DAILY');
  const [loading, setLoading] = useState(false);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/monitors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMonitors(data);
      })
      .catch(console.error);
  }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, frequency })
      });
      
      if (res.ok) {
        const newMonitor = await res.json();
        setMonitors([newMonitor, ...monitors]);
        setUrl('');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al agregar el monitor. Puede que necesites actualizar tu plan.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-indigo-600" />
            Mis Monitores
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl">
            SentinelIQ vigila automáticamente la salud y el rendimiento de tus sitios web.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-xl shadow-indigo-100/20 rounded-2xl p-6 md:p-8 mb-12 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Plus className="h-5 w-5 text-indigo-500" />
          Agregar Nuevo Monitor
        </h2>
        <form onSubmit={handleAddMonitor} className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">URL del Sitio Web</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="url" 
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://mi-empresa.com"
                className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none text-gray-900 font-medium"
              />
            </div>
          </div>
          <div className="w-full md:w-64 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Frecuencia</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="block w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none text-gray-900 font-medium appearance-none"
              >
                <option value="DAILY">Diaria</option>
                <option value="WEEKLY">Semanal</option>
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monitores Activos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay monitores</h3>
              <p className="mt-2 text-gray-500">Agrega tu primer sitio web arriba para comenzar.</p>
            </div>
          ) : (
            monitors.map(m => (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 flex flex-col h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   <Activity className="h-16 w-16 text-indigo-50 -mr-6 -mt-6 transform rotate-12" />
                </div>
                
                <div className="flex-1 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Auditando</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 truncate" title={m.url}>
                    {m.url.replace(/^https?:\/\//, '')}
                  </h3>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{m.frequency === 'DAILY' ? 'Diario' : 'Semanal'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50 z-10 flex flex-col gap-4">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Agregado el {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                  <DownloadPdfButton scanId={m.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
