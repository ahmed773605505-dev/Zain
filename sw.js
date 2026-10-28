/* Zain offline worker: the app opens without internet after the first visit */
const V="zain-v6";
const CORE=["./","./index.html","./config.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  // live data and AI always go to the network (Firestore keeps its own offline copy)
  if(/firestore\.googleapis|identitytoolkit|securetoken|generativelanguage/.test(u.host))return;
  if(u.origin===location.origin){
    // app files: network first so updates arrive, cached copy when offline
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))));
    return;
  }
  // libraries and fonts: cached after first use
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r&&(r.ok||r.type==="opaque")){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})));
});
