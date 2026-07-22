"use client";

import { useState, useEffect } from 'react';
import { Search, Shield, Zap, Globe, Accessibility, AlertCircle, CheckCircle2, Server, ArrowRight } from 'lucide-react';

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const steps = [
    "Resolviendo DNS...",
    "Analizando cabeceras HTTP...",
    "Verificando certificados SSL/TLS...",
    "Midiendo tiempo de respuesta (TTFB)...",
    "Analizando accesibilidad y SEO...",
    "Calculando Cyberscore global..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'scanning') {
      interval = setInterval(() => {
        setScanStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 800); // Avanza de paso cada 800ms
    }
    return () => clearInterval(interval);
  }, [status, steps.length]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setStatus('scanning');
    setScanStep(0);
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/scan/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Nos aseguramos de que la animación termine antes de mostrar resultados
        setTimeout(() => {
          setResult(data);
          setStatus('complete');
        }, 3000); 
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Error al analizar la URL');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Error de conexión con el servidor');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-200';
    if (score >= 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[80vh] flex flex-col">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Auditoría en Tiempo Real
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Analiza cualquier dominio al instante. Descubre vulnerabilidades, problemas de rendimiento y mejoras SEO.
        </p>
      </div>

      <div className="bg-white shadow-2xl shadow-indigo-100/40 rounded-3xl p-6 md:p-8 mb-8 border border-gray-100">
        <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Globe className="h-6 w-6 text-gray-400" />
            </div>
            <input 
              type="url" 
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tu-sitio-web.com"
              disabled={status === 'scanning'}
              className="block w-full pl-12 pr-4 py-4 md:text-lg bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner outline-none text-gray-900 font-medium"
            />
          </div>
          <button 
            type="submit" 
            disabled={status === 'scanning' || !url}
            className="md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl hover:bg-indigo-700 disabled:bg-indigo-400 font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
          >
            {status === 'scanning' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analizando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Auditar Ahora
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </button>
        </form>
      </div>

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium text-lg">{errorMsg}</p>
            {errorMsg.toLowerCase().includes('límite') && (
              <a href="/pricing" className="mt-3 inline-block text-sm bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm">
                Mejorar Plan
              </a>
            )}
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <div className="bg-gray-900 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div className="z-10 w-full max-w-md">
            <div className="flex justify-between text-indigo-400 mb-2 font-mono text-sm">
              <span>{steps[scanStep]}</span>
              <span>{Math.round(((scanStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                style={{ width: `${((scanStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            
            <div className="space-y-3 font-mono text-xs md:text-sm h-32 overflow-hidden flex flex-col justify-end">
              {steps.slice(0, scanStep + 1).map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${idx === scanStep ? 'text-white font-bold' : 'text-gray-500'}`}>
                  <span className={idx === scanStep ? 'text-indigo-400 animate-pulse' : 'text-green-500'}>
                    {idx === scanStep ? '>' : '✓'}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'complete' && result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Cabecera del Reporte */}
            <div className="bg-gray-900 text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
              
              <div className="z-10 text-center md:text-left">
                <p className="text-indigo-300 font-semibold uppercase tracking-wider text-sm mb-2">Reporte de Auditoría</p>
                <h2 className="text-3xl md:text-4xl font-bold truncate max-w-xl" title={result.url}>
                  {result.url}
                </h2>
              </div>
              
              <div className="z-10 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm font-medium mb-1">CyberScore</p>
                  <div className={`text-6xl font-black ${getScoreColor(result.scores.global)} drop-shadow-lg`}>
                    {result.scores.global}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas de Métricas */}
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <MetricCard 
                icon={<Zap />} 
                title="Rendimiento" 
                score={result.scores.performance} 
                colorClass={getScoreColor(result.scores.performance)}
                bgClass={getScoreBg(result.scores.performance)}
              />
              <MetricCard 
                icon={<Shield />} 
                title="Seguridad" 
                score={result.scores.security} 
                colorClass={getScoreColor(result.scores.security)}
                bgClass={getScoreBg(result.scores.security)}
              />
              <MetricCard 
                icon={<Accessibility />} 
                title="Accesibilidad" 
                score={result.scores.accessibility} 
                colorClass={getScoreColor(result.scores.accessibility)}
                bgClass={getScoreBg(result.scores.accessibility)}
              />
              <MetricCard 
                icon={<Search />} 
                title="SEO" 
                score={result.scores.seo} 
                colorClass={getScoreColor(result.scores.seo)}
                bgClass={getScoreBg(result.scores.seo)}
              />
            </div>

            {/* Hallazgos */}
            <div className="p-8 pt-0">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Server className="h-5 w-5 text-indigo-500" />
                Hallazgos Destacados
              </h3>
              
              <div className="space-y-4">
                {result.findings.map((finding: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-start gap-4 ${
                    finding.type === 'success' ? 'bg-green-50/50 border-green-100' : 
                    finding.type === 'warning' ? 'bg-yellow-50/50 border-yellow-100' : 
                    'bg-red-50/50 border-red-100'
                  }`}>
                    {finding.type === 'success' && <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />}
                    {finding.type === 'warning' && <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />}
                    {finding.type === 'error' && <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />}
                    <p className="text-gray-800 font-medium pt-0.5">{finding.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, title, score, colorClass, bgClass }: { icon: any, title: string, score: number, colorClass: string, bgClass: string }) {
  return (
    <div className={`p-6 rounded-2xl border ${bgClass} flex flex-col items-center justify-center text-center transition-transform hover:scale-105`}>
      <div className={`mb-3 ${colorClass} opacity-80`}>
        {icon}
      </div>
      <h4 className="text-gray-600 font-semibold text-sm mb-2">{title}</h4>
      <span className={`text-4xl font-black ${colorClass}`}>{score}</span>
    </div>
  );
}
