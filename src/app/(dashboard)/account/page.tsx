"use client";

import { useState, useEffect } from 'react';
import { User, Mail, CreditCard, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function AccountPage() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('FREE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setName(data.name || '');
          setEmail(data.email || '');
          setPlan(data.plan || 'FREE');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        setMessage({ text: 'Perfil actualizado correctamente.', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Error al actualizar el perfil.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error de conexión.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getPlanStyle = (currentPlan: string) => {
    switch(currentPlan) {
      case 'PRO': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'BUSINESS': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-indigo-600" />
          Mi Cuenta
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Administra tus datos personales y tu suscripción.
        </p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className={`h-5 w-5 mt-0.5 text-green-500`} />
          ) : (
            <AlertCircle className={`h-5 w-5 mt-0.5 text-red-500`} />
          )}
          <p className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="bg-white shadow-xl shadow-indigo-100/20 rounded-2xl overflow-hidden border border-gray-100">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Información Personal</h2>
          
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none text-gray-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="block w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">El correo electrónico está vinculado a tu cuenta y no se puede cambiar aquí.</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            Plan de Suscripción
          </h2>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Plan actual</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border uppercase tracking-wide ${getPlanStyle(plan)}`}>
                  Plan {plan}
                </span>
              </div>
            </div>
            
            <div>
              <a 
                href="/pricing"
                className="inline-flex justify-center items-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full md:w-auto"
              >
                Ver planes de mejora
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
