import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <Link href="/settings" className="text-indigo-600 hover:text-indigo-800 font-medium mb-8 inline-block">
        &larr; Volver a Configuración
      </Link>
      
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Documentación de la API Pública</h1>
      <p className="text-lg text-gray-600 mb-12">
        Aprende cómo integrar SentinelIQ directamente en tus sistemas usando nuestra API REST.
      </p>

      <div className="prose prose-indigo max-w-none">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Autenticación</h2>
        <p className="text-gray-700 mb-6">
          Todas las peticiones a la API deben incluir tu API Key en el encabezado <code className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Authorization</code> utilizando el esquema Bearer.
          Puedes generar tus claves en la <Link href="/settings" className="text-indigo-600 hover:underline">configuración de tu cuenta</Link>.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">Realizar un Escaneo (API v1)</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded text-sm">POST</span> 
          <code className="text-gray-800 bg-gray-100 px-3 py-1 rounded border border-gray-200">/api/v1/scan</code>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mt-8 mb-3">Ejemplo usando cURL</h3>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-lg overflow-x-auto mb-6 shadow-md font-mono text-sm leading-relaxed">
{`curl -X POST https://api.sentineliq.com/api/v1/scan \\
  -H "Authorization: Bearer sk_test_tu_api_key_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://mi-empresa.com"}'`}
        </pre>

        <h3 className="text-lg font-bold text-gray-900 mt-8 mb-3">Ejemplo usando Fetch (JavaScript)</h3>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-lg overflow-x-auto mb-6 shadow-md font-mono text-sm leading-relaxed">
{`const response = await fetch('https://api.sentineliq.com/api/v1/scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_tu_api_key_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://mi-empresa.com' })
});

const data = await response.json();
console.log(data);`}
        </pre>

        <h3 className="text-lg font-bold text-gray-900 mt-8 mb-3">Respuesta Exitosa (200 OK)</h3>
        <pre className="bg-gray-900 text-green-400 p-5 rounded-lg overflow-x-auto shadow-md font-mono text-sm leading-relaxed">
{`{
  "success": true,
  "data": {
    "url": "https://mi-empresa.com",
    "status": "healthy",
    "cyberScore": 98,
    "metrics": {
      "performance": 100,
      "security": 98,
      "accessibility": 95,
      "seo": 99
    },
    "scannedAt": "2026-07-21T10:00:00.000Z"
  }
}`}
        </pre>
      </div>
    </div>
  );
}
