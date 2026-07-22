"use client";

import { useState, useEffect } from 'react';
import { Search, Shield, Zap, Globe, Accessibility, AlertCircle, CheckCircle2, Server, ArrowRight, Info, ChevronDown, ChevronUp, Clock, HardDrive, Lock } from 'lucide-react';

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    security: true,
    performance: true,
    seo: true,
    accessibility: true,
  });

  const steps = [
    "Resolviendo DNS y conectando al servidor...",
    "Analizando cabeceras HTTP de seguridad...",
    "Verificando HSTS, CSP y protección XSS...",
    "Midiendo tiempo de respuesta (TTFB)...",
    "Descargando HTML y analizando estructura SEO...",
    "Evaluando accesibilidad (ARIA, alt, lang)...",
    "Buscando fugas de información en headers...",
    "Calculando CyberScore global..."
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
      }, 700);
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
        // Esperar a que la animación termine
        const elapsed = scanStep * 700;
        const remaining = Math.max(0, (steps.length * 700) - elapsed);
        setTimeout(() => {
          setResult(data);
          setStatus('complete');
        }, remaining + 500);
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

  const getScoreRing = (score: number) => {
    if (score >= 90) return 'ring-green-500/30';
    if (score >= 70) return 'ring-yellow-500/30';
    return 'ring-red-500/30';
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'security': return <Shield className="h-5 w-5" />;
      case 'performance': return <Zap className="h-5 w-5" />;
      case 'seo': return <Search className="h-5 w-5" />;
      case 'accessibility': return <Accessibility className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'security': return 'Seguridad';
      case 'performance': return 'Rendimiento';
      case 'seo': return 'SEO';
      case 'accessibility': return 'Accesibilidad';
      default: return cat;
    }
  };

  const getFindingIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
      default: return null;
    }
  };

  const getFindingBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50/60 border-green-100';
      case 'warning': return 'bg-yellow-50/60 border-yellow-100';
      case 'error': return 'bg-red-50/60 border-red-100';
      case 'info': return 'bg-blue-50/60 border-blue-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[80vh] flex flex-col">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Auditoría en Tiempo Real
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Analiza cualquier sitio web al instante. Escaneo real de cabeceras HTTP, fugas de seguridad, SEO y accesibilidad.
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
        <div className="bg-gray-900 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[350px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99,102,241,0.05) 2px, rgba(99,102,241,0.05) 4px)' }}></div>
          </div>
          
          <div className="z-10 w-full max-w-lg">
            <div className="flex justify-between text-indigo-400 mb-2 font-mono text-sm">
              <span>{steps[scanStep]}</span>
              <span>{Math.round(((scanStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                style={{ width: `${((scanStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            
            <div className="space-y-2 font-mono text-xs md:text-sm max-h-40 overflow-hidden flex flex-col justify-end">
              {steps.slice(0, scanStep + 1).map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 transition-all duration-300 ${idx === scanStep ? 'text-white font-bold' : 'text-gray-600'}`}>
                  <span className={idx === scanStep ? 'text-indigo-400 animate-pulse' : 'text-green-500'}>
                    {idx === scanStep ? '▸' : '✓'}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'complete' && result && (
        <div className="space-y-6">
          {/* Cabecera del Reporte */}
          <div className="bg-gray-900 text-white rounded-3xl overflow-hidden shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-gray-900"></div>
            
            <div className="relative z-10 p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <p className="text-indigo-300 font-semibold uppercase tracking-wider text-sm mb-2">Reporte de Auditoría</p>
                  <h2 className="text-3xl md:text-4xl font-bold truncate max-w-xl" title={result.url}>
                    {result.url}
                  </h2>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className={`text-center p-6 rounded-2xl ring-4 ${getScoreRing(result.scores.global)} bg-gray-800/50 backdrop-blur`}>
                    <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">CyberScore</p>
                    <div className={`text-6xl font-black ${getScoreColor(result.scores.global)} drop-shadow-lg`}>
                      {result.scores.global}
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Info Bar */}
              {result.serverInfo && (
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-sm">
                  {result.serverInfo.server && (
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                      <HardDrive className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{result.serverInfo.server}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{result.serverInfo.responseTimeMs}ms</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className={result.serverInfo.isHttps ? 'text-green-400' : 'text-red-400'}>
                      {result.serverInfo.isHttps ? 'HTTPS' : 'HTTP'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Server className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">HTTP {result.serverInfo.statusCode}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{result.serverInfo.htmlSizeKb} KB</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <MetricCard icon={<Zap />} title="Rendimiento" score={result.scores.performance} colorClass={getScoreColor(result.scores.performance)} bgClass={getScoreBg(result.scores.performance)} />
            <MetricCard icon={<Shield />} title="Seguridad" score={result.scores.security} colorClass={getScoreColor(result.scores.security)} bgClass={getScoreBg(result.scores.security)} />
            <MetricCard icon={<Accessibility />} title="Accesibilidad" score={result.scores.accessibility} colorClass={getScoreColor(result.scores.accessibility)} bgClass={getScoreBg(result.scores.accessibility)} />
            <MetricCard icon={<Search />} title="SEO" score={result.scores.seo} colorClass={getScoreColor(result.scores.seo)} bgClass={getScoreBg(result.scores.seo)} />
          </div>

          {/* Hallazgos por Categoría */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-500" />
                Hallazgos Detallados
              </h3>
              <p className="text-gray-500 text-sm mt-1">{result.findings.length} hallazgos encontrados</p>
            </div>
            
            {['security', 'performance', 'seo', 'accessibility'].map((category) => {
              const catFindings = result.findings.filter((f: any) => f.category === category);
              if (catFindings.length === 0) return null;

              const errors = catFindings.filter((f: any) => f.type === 'error').length;
              const warnings = catFindings.filter((f: any) => f.type === 'warning').length;
              const successes = catFindings.filter((f: any) => f.type === 'success').length;

              return (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  <button 
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 md:px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        category === 'security' ? 'bg-red-100 text-red-600' :
                        category === 'performance' ? 'bg-blue-100 text-blue-600' :
                        category === 'seo' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getCategoryIcon(category)}
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{getCategoryLabel(category)}</span>
                      <div className="flex items-center gap-2 ml-2">
                        {errors > 0 && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{errors} error{errors > 1 ? 'es' : ''}</span>}
                        {warnings > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{warnings} aviso{warnings > 1 ? 's' : ''}</span>}
                        {successes > 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{successes} ok</span>}
                      </div>
                    </div>
                    {expandedCategories[category] ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </button>
                  
                  {expandedCategories[category] && (
                    <div className="px-6 md:px-8 pb-6 space-y-3">
                      {catFindings.map((finding: any, i: number) => (
                        <div key={i} className={`p-4 rounded-xl border ${getFindingBg(finding.type)}`}>
                          <div className="flex items-start gap-3">
                            {getFindingIcon(finding.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-semibold text-sm">{finding.text}</p>
                              {finding.detail && (
                                <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{finding.detail}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
