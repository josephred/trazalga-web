export default async function handler(req, res) {
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;

    // Reconstruir los parámetros de consulta (query params) excluyendo 'path'
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
        if (key !== 'path') {
            if (Array.isArray(value)) {
                value.forEach(val => queryParams.append(key, val));
            } else {
                queryParams.append(key, value);
            }
        }
    }
    const queryString = queryParams.toString();
    const targetUrl = `https://apps.procesac.com/api/${apiPath}${queryString ? '?' + queryString : ''}`;

    // En Vercel, req.body ya viene parseado si es JSON. 
    // Debemos volver a convertirlo a string si vamos a usar fetch para reenviarlo.
    const body = req.method !== 'GET' && req.method !== 'HEAD'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined;

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                // Forzamos el Origin al del backend para evitar validaciones de CORS del lado del servidor
                'Origin': 'https://apps.procesac.com',
                'Referer': 'https://apps.procesac.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
            },
            body,
        });

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Set CORS headers for our frontend
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        res.status(response.status).send(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Proxy error', message: error.message });
    }
}
