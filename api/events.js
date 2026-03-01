export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Construir la URL hacia Ticketmaster con la clave desde variables de entorno
  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  url.searchParams.set('apikey', process.env.TM_API_KEY);

  // Pasar todos los parámetros que envíe el frontend (latlong, radius, etc.)
  for (const [key, value] of Object.entries(req.query)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Ticketmaster' });
  }
}