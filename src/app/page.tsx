import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, BarChart, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
            SentinelIQ v1.0 Ya disponible
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
            Audita tu web en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">menos de 1 minuto</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            Seguridad, rendimiento, accesibilidad y SEO evaluados al instante. Protege tu negocio y mejora la experiencia de tus usuarios con reportes profesionales accionables.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              Comenzar gratis
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center"
            >
              Ver precios
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitas para tu web</h2>
            <p className="mt-4 text-lg text-gray-600">Analizamos más de 50 métricas clave para darte un CyberScore preciso.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-emerald-600" />}
              title="Seguridad"
              description="Detección de vulnerabilidades, encabezados faltantes y configuraciones SSL/TLS."
              color="bg-emerald-50 border-emerald-100"
            />
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-amber-600" />}
              title="Rendimiento"
              description="Tiempos de carga, TTI, y optimización de recursos estáticos."
              color="bg-amber-50 border-amber-100"
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6 text-blue-600" />}
              title="SEO"
              description="Análisis de metaetiquetas, estructura y optimización para buscadores."
              color="bg-blue-50 border-blue-100"
            />
            <FeatureCard 
              icon={<BarChart className="h-6 w-6 text-purple-600" />}
              title="Reportes PDF"
              description="Exporta auditorías completas en PDF listas para entregar a tus clientes."
              color="bg-purple-50 border-purple-100"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
