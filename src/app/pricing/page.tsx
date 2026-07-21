"use client";

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Zap, Shield, Star } from "lucide-react";

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0',
    description: 'Perfecto para probar SentinelIQ.',
    features: ['1 Monitoreo semanal', 'Reportes básicos PDF', 'Soporte comunitario'],
    icon: <Shield className="h-6 w-6 text-gray-500" />,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$19',
    period: '/mes',
    description: 'Para profesionales y pequeños equipos.',
    features: ['Monitoreo diario', 'Reportes detallados PDF', 'Soporte por email', 'Alertas tempranas'],
    icon: <Zap className="h-6 w-6 text-indigo-500" />,
    popular: true,
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: '$49',
    period: '/mes',
    description: 'Para empresas con múltiples sitios.',
    features: ['Monitoreo en tiempo real', 'Reportes marca blanca', 'Soporte prioritario 24/7', 'API pública de integración'],
    icon: <Star className="h-6 w-6 text-purple-500" />,
  }
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (planId === 'FREE') {
      router.push("/monitors");
      return;
    }
    
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error al iniciar el pago: ' + (data.error || 'Desconocido'));
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al contactar al servidor.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Precios</h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Elige el plan ideal para tu web
          </p>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Escala tu monitoreo a medida que creces. Sin contratos a largo plazo.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map(plan => (
            <div 
              key={plan.name} 
              className={`relative bg-white rounded-3xl shadow-xl flex flex-col p-8 transition-transform hover:-translate-y-1 ${
                plan.popular ? 'border-2 border-indigo-600 ring-2 ring-indigo-600 ring-opacity-50 scale-105 lg:scale-110 z-10' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Más popular
                  </span>
                </div>
              )}
              
              <div className="mb-6 flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="mt-2 mb-8">
                <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-xl font-medium text-gray-500">{plan.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-5 h-5 text-indigo-600 mt-0.5" />
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-colors flex justify-center items-center ${
                  plan.popular 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {loading === plan.id ? 'Procesando...' : (status === "unauthenticated" ? 'Iniciar sesión para continuar' : (plan.id === 'FREE' ? 'Ir al Dashboard' : 'Suscribirse ahora'))}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
