"use client";

import { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchKeys = () => {
    fetch('/api/keys')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setKeys(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setName('');
        fetchKeys();
      } else {
        alert('Error al generar clave');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar esta API Key? Esta acción no se puede deshacer y romperá integraciones activas.')) return;
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
          API y Configuración
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-2xl">
          Administra tus claves de acceso para conectarte con la API pública de SentinelIQ.
        </p>
      </div>

      <div className="bg-white shadow-xl shadow-indigo-100/20 rounded-2xl p-6 md:p-8 mb-12 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Plus className="h-6 w-6 text-indigo-500" />
          Generar Nueva API Key
        </h2>
        <p className="text-gray-500 mb-6 text-sm">Crea una nueva llave con permisos limitados a tu cuenta para automatizar procesos.</p>
        
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre descriptivo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Servidor de Producción"
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none text-gray-900 font-medium"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Generando...' : 'Crear API Key'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-500" />
            Claves Activas
          </h3>
          <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold">
            {keys.length} {keys.length === 1 ? 'Clave' : 'Claves'}
          </span>
        </div>
        
        <ul className="divide-y divide-gray-100">
          {keys.length === 0 ? (
            <li className="p-12 text-center flex flex-col items-center">
              <Key className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No tienes claves generadas</p>
              <p className="text-gray-500 mt-1">Crea tu primera API Key en el panel superior.</p>
            </li>
          ) : (
            keys.map(k => (
              <li key={k.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-indigo-50/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-lg font-bold text-gray-900">{k.name}</p>
                    <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Activa</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <code className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700 tracking-wide font-mono border border-gray-200 shadow-inner">
                      {k.key.substring(0, 12)}••••••••••••{k.key.substring(k.key.length - 4)}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(k.key)} 
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar completa
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 font-medium">
                    Creada el: {new Date(k.createdAt).toLocaleDateString()} a las {new Date(k.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  <button 
                    onClick={() => handleRevoke(k.id)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm font-bold border border-red-200 bg-red-50 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Revocar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
