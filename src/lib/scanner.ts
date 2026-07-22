// =============================================================
// SentinelIQ - Motor de Escaneo HTTP Real
// =============================================================
// Este módulo realiza un fetch() real al sitio web objetivo y
// analiza la respuesta HTTP para detectar vulnerabilidades,
// problemas de rendimiento, SEO y accesibilidad.
// =============================================================

export interface Finding {
  type: 'success' | 'warning' | 'error' | 'info';
  category: 'security' | 'performance' | 'seo' | 'accessibility';
  text: string;
  detail?: string;
}

export interface ScanResult {
  url: string;
  scores: {
    global: number;
    performance: number;
    security: number;
    accessibility: number;
    seo: number;
  };
  findings: Finding[];
  serverInfo: {
    ip?: string;
    server?: string;
    poweredBy?: string;
    responseTimeMs: number;
    contentEncoding?: string;
    redirectChain: string[];
    statusCode: number;
    isHttps: boolean;
    htmlSizeKb: number;
  };
}

// =============================================================
// Función principal de escaneo
// =============================================================
export async function scanUrl(targetUrl: string): Promise<ScanResult> {
  const findings: Finding[] = [];
  let normalizedUrl = targetUrl.trim();

  // Asegurar que tenga esquema
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const isHttps = normalizedUrl.startsWith('https://');
  const redirectChain: string[] = [];
  let finalUrl = normalizedUrl;
  let responseTimeMs = 0;
  let statusCode = 0;
  let headers: Headers = new Headers();
  let htmlBody = '';
  let htmlSizeKb = 0;

  // ----- 1. Realizar el fetch real -----
  const startTime = Date.now();
  try {
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SentinelIQ-Scanner/1.0 (Security Audit Bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000), // Timeout de 15 segundos
    });

    responseTimeMs = Date.now() - startTime;
    statusCode = response.status;
    headers = response.headers;
    finalUrl = response.url;

    // Leer el body HTML (limitado a 500KB para no saturar memoria)
    const bodyBuffer = await response.arrayBuffer();
    const bodyBytes = bodyBuffer.byteLength;
    htmlSizeKb = Math.round(bodyBytes / 1024);

    // Solo decodificar los primeros 500KB
    const decoder = new TextDecoder('utf-8', { fatal: false });
    htmlBody = decoder.decode(bodyBuffer.slice(0, 512 * 1024));

  } catch (fetchError: any) {
    responseTimeMs = Date.now() - startTime;

    if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
      findings.push({ type: 'error', category: 'performance', text: 'El servidor no respondió en 15 segundos (timeout).', detail: 'El sitio es extremadamente lento o está caído.' });
    } else {
      findings.push({ type: 'error', category: 'performance', text: `No se pudo conectar al sitio: ${fetchError.message}`, detail: 'Verifica que la URL sea correcta y que el sitio esté en línea.' });
    }

    // Retornar resultado con scores muy bajos
    return {
      url: normalizedUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      scores: { global: 10, performance: 0, security: 0, accessibility: 0, seo: 0 },
      findings,
      serverInfo: {
        responseTimeMs,
        redirectChain: [],
        statusCode: 0,
        isHttps,
        htmlSizeKb: 0,
      },
    };
  }

  // ----- 2. Analizar Seguridad -----
  const securityFindings = analyzeSecurityHeaders(headers, isHttps, finalUrl, normalizedUrl);
  findings.push(...securityFindings);

  // ----- 3. Analizar Rendimiento -----
  const perfFindings = analyzePerformance(responseTimeMs, headers, htmlSizeKb, statusCode);
  findings.push(...perfFindings);

  // ----- 4. Analizar SEO -----
  const seoFindings = analyzeSeo(htmlBody, isHttps);
  findings.push(...seoFindings);

  // ----- 5. Analizar Accesibilidad -----
  const a11yFindings = analyzeAccessibility(htmlBody);
  findings.push(...a11yFindings);

  // ----- 6. Detectar fugas de información -----
  const leakFindings = analyzeInfoLeaks(headers);
  findings.push(...leakFindings);

  // ----- 7. Calcular scores -----
  const scores = calculateScores(findings);

  const displayUrl = normalizedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return {
    url: displayUrl,
    scores,
    findings,
    serverInfo: {
      server: headers.get('server') || undefined,
      poweredBy: headers.get('x-powered-by') || undefined,
      responseTimeMs,
      contentEncoding: headers.get('content-encoding') || undefined,
      redirectChain,
      statusCode,
      isHttps,
      htmlSizeKb,
    },
  };
}

// =============================================================
// Análisis de Cabeceras de Seguridad
// =============================================================
function analyzeSecurityHeaders(headers: Headers, isHttps: boolean, finalUrl: string, originalUrl: string): Finding[] {
  const findings: Finding[] = [];

  // HTTPS
  if (!isHttps) {
    findings.push({ type: 'error', category: 'security', text: 'El sitio NO usa HTTPS.', detail: 'Toda la comunicación viaja sin cifrar. Cualquier persona en la red puede interceptar datos sensibles.' });
  } else {
    findings.push({ type: 'success', category: 'security', text: 'Conexión cifrada (HTTPS) activa.' });
  }

  // Strict-Transport-Security (HSTS)
  const hsts = headers.get('strict-transport-security');
  if (hsts) {
    findings.push({ type: 'success', category: 'security', text: 'HSTS (HTTP Strict Transport Security) configurado.', detail: `Valor: ${hsts}` });
    if (!hsts.includes('includeSubDomains')) {
      findings.push({ type: 'warning', category: 'security', text: 'HSTS no incluye subdominios.', detail: 'Se recomienda añadir "includeSubDomains" para proteger todos los subdominios.' });
    }
  } else if (isHttps) {
    findings.push({ type: 'error', category: 'security', text: 'Falta la cabecera Strict-Transport-Security (HSTS).', detail: 'Sin HSTS, un atacante podría forzar una conexión HTTP insegura mediante un ataque de downgrade.' });
  }

  // Content-Security-Policy (CSP)
  const csp = headers.get('content-security-policy');
  if (csp) {
    findings.push({ type: 'success', category: 'security', text: 'Content-Security-Policy (CSP) configurada.', detail: `Longitud de la política: ${csp.length} caracteres.` });
    if (csp.includes("'unsafe-inline'")) {
      findings.push({ type: 'warning', category: 'security', text: 'CSP permite scripts inline (unsafe-inline).', detail: 'Esto reduce significativamente la protección contra ataques XSS.' });
    }
    if (csp.includes("'unsafe-eval'")) {
      findings.push({ type: 'warning', category: 'security', text: 'CSP permite eval() (unsafe-eval).', detail: 'Esto abre la puerta a inyección de código malicioso.' });
    }
  } else {
    findings.push({ type: 'error', category: 'security', text: 'Falta la cabecera Content-Security-Policy (CSP).', detail: 'Sin CSP, el sitio es vulnerable a ataques XSS (Cross-Site Scripting). Esta es una de las cabeceras de seguridad más importantes.' });
  }

  // X-Content-Type-Options
  const xcto = headers.get('x-content-type-options');
  if (xcto && xcto.toLowerCase() === 'nosniff') {
    findings.push({ type: 'success', category: 'security', text: 'X-Content-Type-Options: nosniff configurado.' });
  } else {
    findings.push({ type: 'warning', category: 'security', text: 'Falta la cabecera X-Content-Type-Options.', detail: 'El navegador podría interpretar archivos con un tipo MIME incorrecto (MIME sniffing).' });
  }

  // X-Frame-Options
  const xfo = headers.get('x-frame-options');
  if (xfo) {
    findings.push({ type: 'success', category: 'security', text: `X-Frame-Options configurado: ${xfo.toUpperCase()}.`, detail: 'El sitio está protegido contra ataques de clickjacking.' });
  } else {
    // Verificar si CSP ya cubre frame-ancestors
    if (csp && csp.includes('frame-ancestors')) {
      findings.push({ type: 'info', category: 'security', text: 'X-Frame-Options ausente, pero CSP frame-ancestors lo cubre.' });
    } else {
      findings.push({ type: 'warning', category: 'security', text: 'Falta la cabecera X-Frame-Options.', detail: 'El sitio puede ser embebido en un iframe malicioso (clickjacking).' });
    }
  }

  // Referrer-Policy
  const referrer = headers.get('referrer-policy');
  if (referrer) {
    findings.push({ type: 'success', category: 'security', text: `Referrer-Policy configurada: ${referrer}.` });
  } else {
    findings.push({ type: 'warning', category: 'security', text: 'Falta la cabecera Referrer-Policy.', detail: 'URLs completas podrían filtrarse a sitios de terceros al hacer clic en enlaces externos.' });
  }

  // Permissions-Policy
  const permissions = headers.get('permissions-policy');
  if (permissions) {
    findings.push({ type: 'success', category: 'security', text: 'Permissions-Policy configurada.', detail: 'Se controlan los permisos de APIs del navegador (cámara, micrófono, geolocalización).' });
  } else {
    findings.push({ type: 'info', category: 'security', text: 'Falta la cabecera Permissions-Policy.', detail: 'Se recomienda restringir el acceso a APIs sensibles del navegador como cámara y micrófono.' });
  }

  // Cookies inseguras
  const setCookies = headers.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      const cookieName = cookie.split('=')[0]?.trim() || 'desconocida';
      const hasSecure = cookie.toLowerCase().includes('secure');
      const hasHttpOnly = cookie.toLowerCase().includes('httponly');
      const hasSameSite = cookie.toLowerCase().includes('samesite');

      if (!hasSecure && isHttps) {
        findings.push({ type: 'error', category: 'security', text: `Cookie "${cookieName}" sin flag Secure.`, detail: 'La cookie puede ser interceptada en conexiones HTTP no cifradas.' });
      }
      if (!hasHttpOnly) {
        findings.push({ type: 'warning', category: 'security', text: `Cookie "${cookieName}" sin flag HttpOnly.`, detail: 'La cookie es accesible desde JavaScript, lo que facilita robo de sesión mediante XSS.' });
      }
      if (!hasSameSite) {
        findings.push({ type: 'warning', category: 'security', text: `Cookie "${cookieName}" sin flag SameSite.`, detail: 'La cookie puede ser enviada en solicitudes cross-site (CSRF).' });
      }
    }
  }

  return findings;
}

// =============================================================
// Análisis de Rendimiento
// =============================================================
function analyzePerformance(responseTimeMs: number, headers: Headers, htmlSizeKb: number, statusCode: number): Finding[] {
  const findings: Finding[] = [];

  // Tiempo de respuesta (TTFB)
  if (responseTimeMs < 300) {
    findings.push({ type: 'success', category: 'performance', text: `Tiempo de respuesta excelente: ${responseTimeMs}ms.`, detail: 'TTFB por debajo de 300ms es considerado óptimo.' });
  } else if (responseTimeMs < 800) {
    findings.push({ type: 'warning', category: 'performance', text: `Tiempo de respuesta aceptable: ${responseTimeMs}ms.`, detail: 'Se recomienda un TTFB inferior a 300ms para una experiencia óptima.' });
  } else {
    findings.push({ type: 'error', category: 'performance', text: `Tiempo de respuesta lento: ${responseTimeMs}ms.`, detail: 'Un TTFB superior a 800ms afecta negativamente la experiencia del usuario y el ranking SEO.' });
  }

  // Compresión
  const encoding = headers.get('content-encoding');
  if (encoding) {
    findings.push({ type: 'success', category: 'performance', text: `Compresión activa: ${encoding}.`, detail: 'Los recursos se transmiten comprimidos, reduciendo el tiempo de carga.' });
  } else {
    findings.push({ type: 'warning', category: 'performance', text: 'No se detectó compresión (gzip/brotli).', detail: 'Activar compresión puede reducir el tamaño de transferencia entre un 60-80%.' });
  }

  // Tamaño del HTML
  if (htmlSizeKb > 500) {
    findings.push({ type: 'error', category: 'performance', text: `Página HTML muy pesada: ${htmlSizeKb} KB.`, detail: 'Un HTML de más de 500KB puede causar tiempos de carga excesivos, especialmente en dispositivos móviles.' });
  } else if (htmlSizeKb > 200) {
    findings.push({ type: 'warning', category: 'performance', text: `Página HTML moderadamente pesada: ${htmlSizeKb} KB.`, detail: 'Considera reducir el contenido HTML inline y mover scripts/estilos a archivos externos.' });
  } else {
    findings.push({ type: 'success', category: 'performance', text: `Tamaño del HTML optimizado: ${htmlSizeKb} KB.` });
  }

  // Status code
  if (statusCode >= 200 && statusCode < 300) {
    findings.push({ type: 'success', category: 'performance', text: `Código de estado HTTP: ${statusCode} OK.` });
  } else if (statusCode >= 300 && statusCode < 400) {
    findings.push({ type: 'info', category: 'performance', text: `Redirección detectada (HTTP ${statusCode}).`, detail: 'Las cadenas de redirecciones agregan latencia. Minimiza el número de redirecciones.' });
  } else if (statusCode >= 400) {
    findings.push({ type: 'error', category: 'performance', text: `Error HTTP: ${statusCode}.`, detail: 'El servidor retornó un código de error. Verifica que la URL sea correcta.' });
  }

  // Cache
  const cacheControl = headers.get('cache-control');
  if (cacheControl && (cacheControl.includes('max-age') || cacheControl.includes('s-maxage'))) {
    findings.push({ type: 'success', category: 'performance', text: 'Cabeceras de caché configuradas.', detail: `Cache-Control: ${cacheControl}` });
  } else {
    findings.push({ type: 'warning', category: 'performance', text: 'No se detectaron cabeceras de caché efectivas.', detail: 'Configurar Cache-Control reduce la carga del servidor y mejora tiempos de carga para visitantes recurrentes.' });
  }

  return findings;
}

// =============================================================
// Análisis de SEO
// =============================================================
function analyzeSeo(html: string, isHttps: boolean): Finding[] {
  const findings: Finding[] = [];

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    if (title.length < 10) {
      findings.push({ type: 'warning', category: 'seo', text: `Título demasiado corto: "${title}" (${title.length} caracteres).`, detail: 'Se recomienda un título de entre 30 y 60 caracteres para SEO óptimo.' });
    } else if (title.length > 70) {
      findings.push({ type: 'warning', category: 'seo', text: `Título demasiado largo (${title.length} caracteres).`, detail: 'Google trunca títulos de más de ~60 caracteres en los resultados de búsqueda.' });
    } else {
      findings.push({ type: 'success', category: 'seo', text: `Título detectado: "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}" (${title.length} chars).` });
    }
  } else {
    findings.push({ type: 'error', category: 'seo', text: 'Falta la etiqueta <title>.', detail: 'El título es uno de los factores SEO más importantes. Sin él, los motores de búsqueda generarán uno automáticamente (normalmente malo).' });
  }

  // Meta description
  const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*\/?>/i)
    || html.match(/<meta\s+[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*\/?>/i);
  if (descMatch && descMatch[1]) {
    const desc = descMatch[1].trim();
    if (desc.length < 50) {
      findings.push({ type: 'warning', category: 'seo', text: `Meta descripción demasiado corta (${desc.length} caracteres).`, detail: 'Se recomienda entre 120 y 160 caracteres para maximizar el CTR en búsquedas.' });
    } else if (desc.length > 160) {
      findings.push({ type: 'warning', category: 'seo', text: `Meta descripción demasiado larga (${desc.length} caracteres).`, detail: 'Google trunca descripciones de más de ~160 caracteres.' });
    } else {
      findings.push({ type: 'success', category: 'seo', text: `Meta descripción configurada (${desc.length} caracteres).` });
    }
  } else {
    findings.push({ type: 'error', category: 'seo', text: 'Falta la meta descripción.', detail: 'Sin meta descripción, Google mostrará un fragmento aleatorio de tu página en los resultados de búsqueda.' });
  }

  // Viewport
  const viewportMatch = html.match(/<meta\s+[^>]*name=["']viewport["'][^>]*\/?>/i);
  if (viewportMatch) {
    findings.push({ type: 'success', category: 'seo', text: 'Meta viewport configurada (sitio responsive).' });
  } else {
    findings.push({ type: 'error', category: 'seo', text: 'Falta la meta viewport.', detail: 'Sin viewport, el sitio no será responsive en móviles. Google penaliza sitios no mobile-friendly.' });
  }

  // OpenGraph
  const ogTitle = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*\/?>/i);
  const ogDesc = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*\/?>/i);
  const ogImage = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*\/?>/i);
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  if (ogCount === 3) {
    findings.push({ type: 'success', category: 'seo', text: 'Etiquetas OpenGraph completas (título, descripción, imagen).', detail: 'El sitio se verá bien al compartirlo en redes sociales.' });
  } else if (ogCount > 0) {
    findings.push({ type: 'warning', category: 'seo', text: `OpenGraph incompleto (${ogCount}/3 tags).`, detail: 'Faltan tags OG. Sin og:image, las previsualizaciones en redes sociales no mostrarán imagen.' });
  } else {
    findings.push({ type: 'warning', category: 'seo', text: 'No se detectaron etiquetas OpenGraph.', detail: 'Al compartir el sitio en Facebook/Twitter/LinkedIn no se mostrará una previsualización atractiva.' });
  }

  // Canonical
  const canonical = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/i);
  if (canonical) {
    findings.push({ type: 'success', category: 'seo', text: 'URL canónica configurada.' });
  } else {
    findings.push({ type: 'info', category: 'seo', text: 'No se detectó URL canónica.', detail: 'Se recomienda definir una URL canónica para evitar problemas de contenido duplicado.' });
  }

  // H1
  const h1Match = html.match(/<h1[^>]*>/gi);
  if (h1Match) {
    if (h1Match.length === 1) {
      findings.push({ type: 'success', category: 'seo', text: 'Un solo <h1> detectado (estructura correcta).' });
    } else {
      findings.push({ type: 'warning', category: 'seo', text: `Múltiples <h1> detectados (${h1Match.length}).`, detail: 'Se recomienda un solo <h1> por página para una jerarquía de encabezados óptima.' });
    }
  } else {
    findings.push({ type: 'error', category: 'seo', text: 'No se detectó ningún <h1>.', detail: 'El encabezado H1 es crucial para que los motores de búsqueda entiendan el tema principal de la página.' });
  }

  return findings;
}

// =============================================================
// Análisis de Accesibilidad
// =============================================================
function analyzeAccessibility(html: string): Finding[] {
  const findings: Finding[] = [];

  // Lang attribute
  const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["'][^>]*>/i);
  if (langMatch) {
    findings.push({ type: 'success', category: 'accessibility', text: `Atributo lang detectado: "${langMatch[1]}".`, detail: 'Los lectores de pantalla usarán el idioma correcto para la pronunciación.' });
  } else {
    findings.push({ type: 'error', category: 'accessibility', text: 'Falta el atributo lang en <html>.', detail: 'Sin lang, los lectores de pantalla no saben en qué idioma pronunciar el contenido.' });
  }

  // Imágenes sin alt
  const imgTags = html.match(/<img\s[^>]*>/gi) || [];
  const imgsWithoutAlt = imgTags.filter(tag => !tag.match(/\salt=["'][^"']*["']/i));
  const totalImgs = imgTags.length;

  if (totalImgs === 0) {
    findings.push({ type: 'info', category: 'accessibility', text: 'No se detectaron imágenes en el HTML.' });
  } else if (imgsWithoutAlt.length === 0) {
    findings.push({ type: 'success', category: 'accessibility', text: `Todas las imágenes (${totalImgs}) tienen atributo alt.` });
  } else {
    findings.push({
      type: 'error', category: 'accessibility',
      text: `${imgsWithoutAlt.length} de ${totalImgs} imágenes no tienen atributo alt.`,
      detail: 'Las imágenes sin alt son invisibles para usuarios con lectores de pantalla y afectan el SEO.'
    });
  }

  // Links con texto descriptivo
  const linkTags = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/gi) || [];
  const genericLinks = linkTags.filter(tag => {
    const text = tag.replace(/<[^>]+>/g, '').trim().toLowerCase();
    return ['click aquí', 'click here', 'aquí', 'here', 'leer más', 'read more', 'more'].includes(text);
  });
  if (genericLinks.length > 0) {
    findings.push({ type: 'warning', category: 'accessibility', text: `${genericLinks.length} enlace(s) con texto genérico ("click aquí", "leer más").`, detail: 'Los lectores de pantalla leen los enlaces fuera de contexto. Usa textos descriptivos como "Ver precios" en lugar de "Click aquí".' });
  }

  // Formularios sin labels
  const inputTags = html.match(/<input\s[^>]*>/gi) || [];
  const labelTags = html.match(/<label[^>]*>/gi) || [];
  if (inputTags.length > 0 && labelTags.length === 0) {
    findings.push({ type: 'warning', category: 'accessibility', text: 'Se detectaron campos de formulario sin etiquetas <label>.', detail: 'Los usuarios de lectores de pantalla no podrán identificar el propósito de los campos.' });
  }

  // Contraste / skip navigation (detección básica)
  const skipLink = html.match(/<a[^>]*href=["']#(main|content|skip)[^"']*["'][^>]*>/i);
  if (skipLink) {
    findings.push({ type: 'success', category: 'accessibility', text: 'Enlace de "saltar al contenido" detectado.' });
  }

  // ARIA landmarks
  const ariaRoles = html.match(/role=["'](main|navigation|banner|contentinfo|search)["']/gi) || [];
  const semanticTags = html.match(/<(main|nav|header|footer|aside|article|section)\b/gi) || [];
  const totalLandmarks = ariaRoles.length + semanticTags.length;
  if (totalLandmarks >= 3) {
    findings.push({ type: 'success', category: 'accessibility', text: `${totalLandmarks} landmarks semánticos/ARIA detectados.`, detail: 'La estructura permite a los usuarios de lectores de pantalla navegar eficientemente.' });
  } else if (totalLandmarks > 0) {
    findings.push({ type: 'warning', category: 'accessibility', text: `Solo ${totalLandmarks} landmark(s) semántico(s) detectado(s).`, detail: 'Se recomienda usar <main>, <nav>, <header>, <footer> para mejorar la navegación asistida.' });
  } else {
    findings.push({ type: 'warning', category: 'accessibility', text: 'No se detectaron landmarks semánticos ni roles ARIA.', detail: 'El sitio carece de estructura semántica. Los usuarios de tecnologías de asistencia tendrán dificultades para navegar.' });
  }

  return findings;
}

// =============================================================
// Detección de Fugas de Información
// =============================================================
function analyzeInfoLeaks(headers: Headers): Finding[] {
  const findings: Finding[] = [];

  // Server header (fuga de software)
  const server = headers.get('server');
  if (server) {
    // Detectar si expone versión
    const hasVersion = /\/[\d.]+/.test(server);
    if (hasVersion) {
      findings.push({ type: 'error', category: 'security', text: `Fuga de información: Server header expone versión "${server}".`, detail: 'Un atacante puede buscar vulnerabilidades conocidas para esa versión exacta del servidor.' });
    } else {
      findings.push({ type: 'info', category: 'security', text: `Servidor detectado: ${server}.`, detail: 'Se recomienda ocultar o generalizar el header Server para reducir la superficie de ataque.' });
    }
  }

  // X-Powered-By (fuga de tecnología)
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    findings.push({ type: 'error', category: 'security', text: `Fuga de información: X-Powered-By expone "${poweredBy}".`, detail: 'Este header revela la tecnología del backend (ej: Express, PHP, ASP.NET). Debe eliminarse en producción.' });
  }

  // X-AspNet-Version
  const aspNet = headers.get('x-aspnet-version');
  if (aspNet) {
    findings.push({ type: 'error', category: 'security', text: `Fuga de información: X-AspNet-Version expone "${aspNet}".` });
  }

  // X-Generator
  const generator = headers.get('x-generator');
  if (generator) {
    findings.push({ type: 'warning', category: 'security', text: `X-Generator detectado: "${generator}".`, detail: 'Expone el CMS o framework usado (ej: WordPress, Drupal).' });
  }

  return findings;
}

// =============================================================
// Cálculo de Scores
// =============================================================
function calculateScores(findings: Finding[]): ScanResult['scores'] {
  const categories: Record<string, { score: number; total: number }> = {
    security: { score: 100, total: 0 },
    performance: { score: 100, total: 0 },
    seo: { score: 100, total: 0 },
    accessibility: { score: 100, total: 0 },
  };

  // Penalizaciones por tipo de finding
  const penalties: Record<string, number> = {
    error: -15,
    warning: -7,
    info: -2,
    success: 0,
  };

  for (const finding of findings) {
    const cat = categories[finding.category];
    if (!cat) continue;
    cat.total++;
    cat.score += penalties[finding.type] || 0;
  }

  // Clamp a 0-100
  for (const key of Object.keys(categories)) {
    categories[key].score = Math.max(0, Math.min(100, categories[key].score));
  }

  const security = categories.security.score;
  const performance = categories.performance.score;
  const seo = categories.seo.score;
  const accessibility = categories.accessibility.score;

  // Global con ponderación: seguridad pesa más
  const global = Math.round(
    security * 0.35 +
    performance * 0.25 +
    seo * 0.20 +
    accessibility * 0.20
  );

  return { global, performance, security, accessibility, seo };
}
