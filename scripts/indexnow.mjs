// Avisa a Bing/IndexNow de URLs nuevas o modificadas.
// Uso: node scripts/indexnow.mjs https://www.purosmates.com.ar/blog/mi-nota [...otras]
// Avisar solo lo que cambió: mandar todo el sitio cada vez hace que lo ignoren.
const HOST = 'www.purosmates.com.ar';
const KEY = 'a90f907613e63d418af5ba410fb39324';

const urlList = process.argv.slice(2);
if (urlList.length === 0) {
  console.error('Pasá al menos una URL.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log('IndexNow status:', res.status);
process.exit(res.ok || res.status === 202 ? 0 : 1);
