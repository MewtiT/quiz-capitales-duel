// Import Firebase (module CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getDatabase, ref, onValue, set, update, get, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

// ⚙️ Config Firebase (garde la tienne)
const firebaseConfig = {
  apiKey: "AIzaSyCe-bTChoBYZzzX_F9Cwf6tZXGIxzS4Qf8",
  authDomain: "quizz-capitales.firebaseapp.com",
  databaseURL: "https://quizz-capitales-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quizz-capitales",
  storageBucket: "quizz-capitales.appspot.com",
  messagingSenderId: "657917175552",
  appId: "1:657917175552:web:7f35b3595d97919f2835e5"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ===== Utils =====
const $ = sel => document.querySelector(sel);
const norm = s => (s||'').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-zA-Z\-\s']/g,'').trim().toLowerCase();
const rand = (seed => () => (seed = (seed*9301+49297)%233280, seed/233280));
const seededShuffle = (arr, seed) => { const r = rand(seed); const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(r()* (i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const code = () => ($('#roomId').value||'').replace(/\W/g,'').toUpperCase();
const uid  = () => localStorage.getItem('uid') || (localStorage.setItem('uid', crypto.randomUUID()), localStorage.getItem('uid'));
const BASE_REVEAL_MS = 700; // sans correction

function flash(elem, cls, ms=1000){
  if(!elem) return;
  elem.classList.add(cls);
  setTimeout(()=>elem.classList.remove(cls), ms);
}

// ===== Data =====
const CAPITALS = [
  ["Afghanistan","Kaboul"],["Albanie","Tirana"],["Algérie","Alger"],["Andorre","Andorre-la-Vieille"],["Angola","Luanda"],
  ["Antigua-et-Barbuda","Saint John's"],["Arabie saoudite","Riyad"],["Argentine","Buenos Aires"],["Arménie","Erevan"],["Australie","Canberra"],
  ["Autriche","Vienne"],["Azerbaïdjan","Bakou"],["Bahamas","Nassau"],["Bahreïn","Manama"],["Bangladesh","Dacca"],
  ["Barbade","Bridgetown"],["Belgique","Bruxelles"],["Belize","Belmopan"],["Bénin","Porto-Novo"],["Bhoutan","Thimphou"],
  ["Biélorussie","Minsk"],["Birmanie (Myanmar)","Naypyidaw"],["Bolivie","Sucre"],["Bosnie-Herzégovine","Sarajevo"],["Botswana","Gaborone"],
  ["Brésil","Brasília"],["Brunei","Bandar Seri Begawan"],["Bulgarie","Sofia"],["Burkina Faso","Ouagadougou"],["Burundi","Gitega"],
  ["Cambodge","Phnom Penh"],["Cameroun","Yaoundé"],["Canada","Ottawa"],["Cap-Vert","Praia"],["Centrafrique","Bangui"],
  ["Chili","Santiago"],["Chine","Pékin"],["Chypre","Nicosie"],["Colombie","Bogotá"],["Comores","Moroni"],
  ["Congo (RDC)","Kinshasa"],["Congo (République)","Brazzaville"],["Corée du Nord","Pyongyang"],["Corée du Sud","Séoul"],["Costa Rica","San José"],
  ["Côte d’Ivoire","Yamoussoukro"],["Croatie","Zagreb"],["Cuba","La Havane"],["Danemark","Copenhague"],["Djibouti","Djibouti"],
  ["Dominique","Roseau"],["Égypte","Le Caire"],["Émirats arabes unis","Abou Dabi"],["Équateur","Quito"],["Érythrée","Asmara"],
  ["Espagne","Madrid"],["Estonie","Tallinn"],["Eswatini","Mbabane"],["États-Unis","Washington"],["Éthiopie","Addis-Abeba"],
  ["Fidji","Suva"],["Finlande","Helsinki"],["France","Paris"],["Gabon","Libreville"],["Gambie","Banjul"],
  ["Géorgie","Tbilissi"],["Ghana","Accra"],["Grèce","Athènes"],["Grenade","Saint George's"],["Guatemala","Guatemala"],
  ["Guinée","Conakry"],["Guinée-Bissau","Bissau"],["Guinée équatoriale","Malabo"],["Guyana","Georgetown"],["Haïti","Port-au-Prince"],
  ["Honduras","Tegucigalpa"],["Hongrie","Budapest"],["Îles Marshall","Delap-Uliga-Darrit"],["Inde","New Delhi"],["Indonésie","Jakarta"],
  ["Irak","Bagdad"],["Iran","Téhéran"],["Irlande","Dublin"],["Islande","Reykjavik"],["Israël","Jérusalem"],
  ["Italie","Rome"],["Jamaïque","Kingston"],["Japon","Tokyo"],["Jordanie","Amman"],["Kazakhstan","Astana"],
  ["Kenya","Nairobi"],["Kirghizistan","Bichkek"],["Kiribati","Tarawa-Sud"],["Kosovo","Pristina"],["Koweït","Koweït"],
  ["Laos","Vientiane"],["Lesotho","Maseru"],["Lettonie","Riga"],["Liban","Beyrouth"],["Libéria","Monrovia"],
  ["Libye","Tripoli"],["Liechtenstein","Vaduz"],["Lituanie","Vilnius"],["Luxembourg","Luxembourg"],["Macédoine du Nord","Skopje"],
  ["Madagascar","Antananarivo"],["Malaisie","Kuala Lumpur"],["Malawi","Lilongwe"],["Maldives","Malé"],["Mali","Bamako"],
  ["Malte","La Valette"],["Maroc","Rabat"],["Maurice","Port-Louis"],["Mauritanie","Nouakchott"],["Mexique","Mexico"],
  ["Micronésie","Palikir"],["Moldavie","Chisinau"],["Monaco","Monaco"],["Mongolie","Oulan-Bator"],["Monténégro","Podgorica"],
  ["Mozambique","Maputo"],["Namibie","Windhoek"],["Nauroo","Yaren"],["Népal","Katmandou"],["Nicaragua","Managua"],
  ["Niger","Niamey"],["Nigeria","Abuja"],["Norvège","Oslo"],["Nouvelle-Zélande","Wellington"],["Oman","Mascate"],
  ["Ouganda","Kampala"],["Ouzbékistan","Tachkent"],["Pakistan","Islamabad"],["Palaos","Ngerulmud"],["Panama","Panama"],
  ["Papouasie-Nouvelle-Guinée","Port Moresby"],["Paraguay","Asuncion"],["Pays-Bas","Amsterdam"],["Pérou","Lima"],["Philippines","Manille"],
  ["Pologne","Varsovie"],["Portugal","Lisbonne"],["Qatar","Doha"],["République tchèque","Prague"],["Roumanie","Bucarest"],
  ["Royaume-Uni","Londres"],["Russie","Moscou"],["Rwanda","Kigali"],["Saint-Christophe-et-Niévès","Basseterre"],["Sainte-Lucie","Castries"],
  ["Saint-Vincent-et-les-Grenadines","Kingstown"],["Salomon (Îles)","Honiara"],["Salvador","San Salvador"],["Samoa","Apia"],["Sao Tomé-et-Principe","São Tomé"],
  ["Sénégal","Dakar"],["Serbie","Belgrade"],["Seychelles","Victoria"],["Sierra Leone","Freetown"],["Singapour","Singapour"],
  ["Slovaquie","Bratislava"],["Slovénie","Ljubljana"],["Somalie","Mogadiscio"],["Soudan","Khartoum"],["Soudan du Sud","Djouba"],
  ["Sri Lanka","Sri Jayawardenepura Kotte"],["Suède","Stockholm"],["Suisse","Berne"],["Suriname","Paramaribo"],["Syrie","Damas"],
  ["Tadjikistan","Douchanbé"],["Tanzanie","Dodoma"],["Tchad","N'Djamena"],["Thaïlande","Bangkok"],["Timor oriental","Dili"],
  ["Togo","Lomé"],["Tonga","Nuku'alofa"],["Trinité-et-Tobago","Port d'Espagne"],["Tunisie","Tunis"],["Turkménistan","Achgabat"],
  ["Turquie","Ankara"],["Tuvalu","Funafuti"],["Ukraine","Kiev"],["Uruguay","Montevideo"],["Vanuatu","Port-Vila"],
  ["Vatican","Vatican"],["Venezuela","Caracas"],["Viêt Nam","Hanoï"],["Yémen","Sanaa"],["Zambie","Lusaka"],["Zimbabwe","Harare"]
];

const ALIASES = new Map([
  ["saint johns","saint john's"],["st johns","saint john's"],["washington dc","washington"],["la havane","la havane"],
  ["sao tome","são tomé"],["sao tomé","são tomé"],["sao tome et principe","são tomé"],["bichkek","bichkek"],
  ["oulan bator","oulan-bator"],["douchambe","douchanbé"],["dacca","dacca"],["rangoun","naypyidaw"],["al quds","jérusalem"],
  ["pekin","pékin"],["kiev","kiev"],["kyiv","kiev"],["sanaa","sanaa"],["nuku alofa","nuku'alofa"],["porto novo","porto-novo"],
  ["st george","saint george's"],["st georges","saint george's"],["port of spain","port d'espagne"],["delhi","new delhi"],
  ["riyadh","riyad"],["ulaanbaatar","oulan-bator"],["kotte","sri jayawardenepura kotte"],
  ["prague","prague"],["warsaw","varsovie"],["vienna","vienne"],["athens","athènes"],["rome","rome"],["london","londres"]
]);

// --- PAYS → RÉGION (Afrique, Amérique, Asie, Europe, Océanie) ---
const REGION_OF = new Map([
  // Afrique
  ["Algérie","Afrique"],["Angola","Afrique"],["Bénin","Afrique"],["Botswana","Afrique"],["Burkina Faso","Afrique"],
  ["Burundi","Afrique"],["Cameroun","Afrique"],["Cap-Vert","Afrique"],["Centrafrique","Afrique"],["Comores","Afrique"],
  ["Congo (RDC)","Afrique"],["Congo (République)","Afrique"],["Côte d’Ivoire","Afrique"],["Djibouti","Afrique"],["Égypte","Afrique"],
  ["Érythrée","Afrique"],["Eswatini","Afrique"],["Éthiopie","Afrique"],["Gabon","Afrique"],["Gambie","Afrique"],
  ["Ghana","Afrique"],["Guinée","Afrique"],["Guinée-Bissau","Afrique"],["Guinée équatoriale","Afrique"],["Kenya","Afrique"],
  ["Lesotho","Afrique"],["Libéria","Afrique"],["Libye","Afrique"],["Madagascar","Afrique"],["Malawi","Afrique"],
  ["Mali","Afrique"],["Maroc","Afrique"],["Maurice","Afrique"],["Mauritanie","Afrique"],["Mozambique","Afrique"],
  ["Namibie","Afrique"],["Niger","Afrique"],["Nigeria","Afrique"],["Ouganda","Afrique"],["Rwanda","Afrique"],
  ["Sao Tomé-et-Principe","Afrique"],["Sénégal","Afrique"],["Seychelles","Afrique"],["Sierra Leone","Afrique"],["Somalie","Afrique"],
  ["Soudan","Afrique"],["Soudan du Sud","Afrique"],["Tanzanie","Afrique"],["Tchad","Afrique"],["Togo","Afrique"],
  ["Tunisie","Afrique"],["Zambie","Afrique"],["Zimbabwe","Afrique"],

  // Amérique
  ["Antigua-et-Barbuda","Amérique"],["Argentine","Amérique"],["Bahamas","Amérique"],["Barbade","Amérique"],["Belize","Amérique"],
  ["Bolivie","Amérique"],["Brésil","Amérique"],["Canada","Amérique"],["Chili","Amérique"],["Colombie","Amérique"],
  ["Costa Rica","Amérique"],["Cuba","Amérique"],["Dominique","Amérique"],["États-Unis","Amérique"],["Grenade","Amérique"],
  ["Guatemala","Amérique"],["Guyana","Amérique"],["Haïti","Amérique"],["Honduras","Amérique"],["Jamaïque","Amérique"],
  ["Mexique","Amérique"],["Nicaragua","Amérique"],["Panama","Amérique"],["Paraguay","Amérique"],["Pérou","Amérique"],
  ["Saint-Christophe-et-Niévès","Amérique"],["Sainte-Lucie","Amérique"],["Saint-Vincent-et-les-Grenadines","Amérique"],["Salvador","Amérique"],
  ["Suriname","Amérique"],["Trinité-et-Tobago","Amérique"],["Uruguay","Amérique"],["Venezuela","Amérique"],

  // Asie
  ["Afghanistan","Asie"],["Arabie saoudite","Asie"],["Arménie","Asie"],["Azerbaïdjan","Asie"],["Bahreïn","Asie"],
  ["Bangladesh","Asie"],["Bhoutan","Asie"],["Birmanie (Myanmar)","Asie"],["Brunei","Asie"],["Cambodge","Asie"],
  ["Chine","Asie"],["Corée du Nord","Asie"],["Corée du Sud","Asie"],["Émirats arabes unis","Asie"],["Géorgie","Asie"],
  ["Inde","Asie"],["Indonésie","Asie"],["Irak","Asie"],["Iran","Asie"],["Israël","Asie"],
  ["Japon","Asie"],["Jordanie","Asie"],["Kazakhstan","Asie"],["Kirghizistan","Asie"],["Koweït","Asie"],
  ["Laos","Asie"],["Liban","Asie"],["Malaisie","Asie"],["Maldives","Asie"],["Mongolie","Asie"],
  ["Népal","Asie"],["Oman","Asie"],["Pakistan","Asie"],["Philippines","Asie"],["Qatar","Asie"],
  ["Singapour","Asie"],["Sri Lanka","Asie"],["Syrie","Asie"],["Tadjikistan","Asie"],["Thaïlande","Asie"],
  ["Timor oriental","Asie"],["Turkménistan","Asie"],["Turquie","Asie"],["Ouzbékistan","Asie"],["Viêt Nam","Asie"],
  ["Yémen","Asie"],

  // Europe
  ["Albanie","Europe"],["Andorre","Europe"],["Autriche","Europe"],["Belgique","Europe"],["Biélorussie","Europe"],
  ["Bosnie-Herzégovine","Europe"],["Bulgarie","Europe"],["Croatie","Europe"],["Chypre","Europe"],["Danemark","Europe"],
  ["Espagne","Europe"],["Estonie","Europe"],["Finlande","Europe"],["France","Europe"],["Grèce","Europe"],
  ["Hongrie","Europe"],["Irlande","Europe"],["Islande","Europe"],["Italie","Europe"],["Kosovo","Europe"],
  ["Lettonie","Europe"],["Liechtenstein","Europe"],["Lituanie","Europe"],["Luxembourg","Europe"],["Macédoine du Nord","Europe"],
  ["Malte","Europe"],["Moldavie","Europe"],["Monaco","Europe"],["Monténégro","Europe"],["Norvège","Europe"],
  ["Pays-Bas","Europe"],["Pologne","Europe"],["Portugal","Europe"],["République tchèque","Europe"],["Roumanie","Europe"],
  ["Royaume-Uni","Europe"],["Russie","Europe"],["Serbie","Europe"],["Slovaquie","Europe"],["Slovénie","Europe"],
  ["Suède","Europe"],["Suisse","Europe"],["Ukraine","Europe"],["Vatican","Europe"],

  // Océanie
  ["Australie","Océanie"],["Fidji","Océanie"],["Kiribati","Océanie"],["Îles Marshall","Océanie"],["Micronésie","Océanie"],
  ["Nauroo","Océanie"],["Nouvelle-Zélande","Océanie"],["Palaos","Océanie"],["Papouasie-Nouvelle-Guinée","Océanie"],["Samoa","Océanie"],
  ["Salomon (Îles)","Océanie"],["Tonga","Océanie"],["Tuvalu","Océanie"],["Vanuatu","Océanie"]
]);


(function checkRegionCoverage(){
  const missing = CAPITALS.filter(([c])=>!REGION_OF.has(c)).map(([c])=>c);
  if(missing.length) console.warn("Région manquante pour:", missing);
})();

// ---- MC options (seeded, mêmes pour tous) ----
function mcOptions(orderIndex, seedBase){
  const pair = CAPITALS[orderIndex];
  const correct = pair[1];
  const allCaps = CAPITALS.map(p=>p[1]);
  const others = allCaps.filter(c => c !== correct);
  const distract = seededShuffle(others, seedBase*1000 + orderIndex).slice(0,3);
  const opts = [correct, ...distract];
  return seededShuffle(opts, seedBase*5000 + orderIndex);
}

// ---- Régions: helpers UI/logic ----
function filterByRegions(regions){
  if (regions.length === 0) return CAPITALS;
  return CAPITALS.filter(([country]) => regions.includes(REGION_OF.get(country)));
}
function rebuildQuestionCountOptions(poolLen){
  const sel = $('#questionCount');
  sel.innerHTML = '';
  const maxCap = Math.min(100, poolLen);
  for(let n=10; n<=maxCap; n+=10){
    sel.insertAdjacentHTML('beforeend', `<option value="${n}">${n} questions</option>`);
  }
  sel.insertAdjacentHTML('beforeend', `<option value="all">Toutes (${poolLen})</option>`);
}

// --- Regions picker helpers ---
function selectedRegions(){
  return Array.from(document.querySelectorAll('.regionChk:checked')).map(el=>el.value);
}
function updateRegionSummary(){
  const regs = selectedRegions();
  const el = document.getElementById('regionSummary');
  el.textContent = regs.length === 5 ? 'Toutes' : (regs.length ? regs.join(', ') : 'Aucune');
}
function refreshCountForRegions(){
  const pool = filterByRegions(selectedRegions());
  rebuildQuestionCountOptions(pool.length);
  updateRegionSummary();
}

(() => {
  const picker = document.getElementById('regionPicker');
  const menu   = picker?.querySelector('.picker-menu');
  menu?.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', e => {
    if (!picker.contains(e.target)) picker.removeAttribute('open');
  });
  // react to checkbox changes
  document.querySelectorAll('.regionChk').forEach(chk=>{
    chk.addEventListener('change', () => { 
      updateRegionSummary(); 
      refreshCountForRegions(); 
    });
  });

  updateRegionSummary();       // ← déjà présent
  refreshCountForRegions();    // ← ajoute-le juste ici
})();


// ===== Local state =====
let ROOM = null;
let ME = { id: uid(), name: '' };
let TIMER = null;
let CLICK_LOCK = false;
let ROOM_MODE = 'text'; // 'text' | 'mc'
let ROOM_CORR = false;
let CUR_QIDX = -1; // évite reset inutile

// ===== UI events =====
$('#createBtn').onclick = async () => {
  ME.name = ($('#playerName').value||'').trim() || 'Joueur-'+uid().slice(0,4);
  const id = code(); if(!id){ alert('Choisis un code salon (ex: RIO974).'); return; }

  const mode = $('#modeSelect').value; ROOM_MODE = mode;
  const regions = selectedRegions();
  const pool = filterByRegions(regions);
  if (pool.length === 0) { alert('Sélectionne au moins une région.'); return; }

  const countSelVal = $('#questionCount').value;
  const count = countSelVal==='all' ? pool.length : parseInt(countSelVal,10);

  const seed = (Date.now() ^ crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
  const orderInPool = seededShuffle([...Array(pool.length).keys()], seed).slice(0, count);
  const poolToGlobal = pool.map(([country]) => CAPITALS.findIndex(([c])=>c===country));
  const order = orderInPool.map(i => poolToGlobal[i]);

  const correction = $('#corrSelect').value === 'on';

  ROOM = id;
  await set(ref(db, 'rooms/'+ROOM), {
    createdAt: Date.now(),
    seed, count, order, mode,
    regions, correction,
    started: false, index: 0,
    players: { [ME.id]: { name: ME.name, score: 0, answered: false, last:"", history: [] } },
  });

  enterLobby(count, mode, correction, regions);
};

$('#joinBtn').onclick = async () => {
  ME.name = ($('#playerName').value||'').trim() || 'Joueur-'+uid().slice(0,4);
  const id = code(); if(!id){ alert('Entre le code salon.'); return; }

  ROOM = id;
  const roomRef = ref(db, 'rooms/'+ROOM);
  const snap = await get(roomRef);
  if(!snap.exists()) { alert('Salon introuvable. Demande au pote de le créer.'); return; }
  const data = snap.val();

  ROOM_MODE = data.mode || 'text';
  ROOM_CORR = !!data.correction;

  await update(roomRef, { ['players/'+ME.id]: { name: ME.name, score: 0, answered: false, last:"", history: [] } });

  enterLobby(data.count, ROOM_MODE, ROOM_CORR, data.regions || []);
};

function enterLobby(count, mode, correction){
  $('#setup').classList.remove('grid');
  $('#lobby').classList.remove('hidden');
  $('#lobbyRoom').textContent = ROOM;
  $('#shareCode').textContent = ROOM;
  $('#lobbyCount').textContent = count;
  $('#lobbyMode').textContent = (mode==='mc' ? 'QCM' : 'Saisie') + (correction ? ' • Correction ON' : ' • Correction OFF');

  $('#startBtn').style.display = 'inline-block';

  onValue(ref(db, 'rooms/'+ROOM+'/players'), (s)=>{
    const v=s.val()||{}; $('#players').innerHTML = Object.values(v).map(p=>`<li>${p.name} — <span class="muted small">${p.score} pts</span></li>`).join('');
  });
  onValue(ref(db, 'rooms/'+ROOM+'/started'), (s)=>{ if(s.val()) startGame(); });

  $('#startBtn').onclick = async ()=>{ await update(ref(db, 'rooms/'+ROOM), { started:true, index:0 }); };
}

function startGame(){
  $('#setup').classList.add('hidden');
  $('#game').classList.remove('hidden');
  $('#gameRoom').textContent = ROOM; $('#roundStatus').textContent='';

  onValue(ref(db, 'rooms/'+ROOM+'/mode'), (s)=> {
    ROOM_MODE = s.val() || 'text';
    if(ROOM_MODE==='mc'){ $('#textZone').classList.add('hidden'); $('#mcZone').classList.remove('hidden'); }
    else { $('#mcZone').classList.add('hidden'); $('#textZone').classList.remove('hidden'); }
  });
  onValue(ref(db, 'rooms/'+ROOM+'/correction'), (s)=>{ ROOM_CORR = !!(s.val()); });

  onValue(ref(db, 'rooms/'+ROOM), s=>{
    const r = s.val(); if(!r) return;
    window.__lastRoomSnapshot = r;

    const idx = r.index;
    $('#qTotal').textContent = r.count;
    $('#qIndex').textContent = Math.min(idx+1, r.count);

    const newQIdx = r.order[idx];
    const pair = CAPITALS[newQIdx] || [];
    $('#country').textContent = pair[0] || '';

    if (ROOM_MODE==='mc' && newQIdx !== CUR_QIDX && newQIdx !== undefined){
      const opts = mcOptions(newQIdx, r.seed);
      document.querySelectorAll('.mc-btn').forEach((b,i)=>{
        b.textContent = opts[i] || '';
        b.classList.remove('selected','correct','wrong');
        b.setAttribute('aria-pressed','false');
      });
    }
    CUR_QIDX = newQIdx;

    if(idx>=r.count){ showResults(r); }
  });

  startTimer(30);
  onValue(ref(db, 'rooms/' + ROOM + '/index'), () => {
    resetForNext();
    startTimer(30);
  });

  // Avance différée
  let ADV_TIMER = null;
  onValue(ref(db, 'rooms/' + ROOM + '/advanceAt'), (s) => {
    const ts = s.val();
    if (!ts) { if (ADV_TIMER) clearTimeout(ADV_TIMER); return; }
    const wait = Math.max(0, ts - Date.now());
    if (ADV_TIMER) clearTimeout(ADV_TIMER);

    ADV_TIMER = setTimeout(async () => {
      await runTransaction(ref(db, 'rooms/' + ROOM), (room) => {
        if (!room || !room.advanceAt) return room;
        if (Date.now() < room.advanceAt) return room;

        const idx = room.index || 0;
        if (room.players) {
          for (const pid of Object.keys(room.players)) {
            room.players[pid].answered = false;
          }
        }
        room.index = idx + 1;
        delete room.advanceAt;
        return room;
      });
    }, wait);
  });

  // Handlers
  $('#submitBtn').onclick = ()=>submitAnswer();
  $('#answer').addEventListener('keydown',e=>{ if(e.key==='Enter') submitAnswer(); });

  // ✅ Handler QCM propre (une seule fois, pas d'imbrication)
  document.querySelectorAll('.mc-btn').forEach(btn=>{
    btn.onclick = ()=>{
      if (CLICK_LOCK) return;

      const buttons = Array.from(document.querySelectorAll('.mc-btn'));
      // reset visuel
      buttons.forEach(b=>{
        b.classList.remove('selected','correct','wrong');
        b.setAttribute('aria-pressed','false');
      });

      const label = btn.textContent.trim().toLowerCase();
      btn.setAttribute('aria-pressed','true');

      if (!ROOM_CORR) {
        // Sans correction → juste la sélection bleue
        btn.classList.add('selected');
      } else if (window.__lastRoomSnapshot) {
        // Avec correction → rouge/vert + marquer la bonne
        const r = window.__lastRoomSnapshot;
        const correctTxt = CAPITALS[r.order[r.index]][1].trim().toLowerCase();
        if (label === correctTxt) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          const goodBtn = buttons.find(b => b.textContent.trim().toLowerCase() === correctTxt);
          if (goodBtn) goodBtn.classList.add('correct');
        }
      }

      CLICK_LOCK = true;
      submitAnswer(btn.textContent);
    };
  });
}

function startTimer(s){
  clearInterval(TIMER);
  let t=s;
  $('#timer').textContent=t;
  TIMER=setInterval(()=>{
    t--;
    $('#timer').textContent=t;
    if(t<=0){
      clearInterval(TIMER);
      autoLock();
    }
  },1000);
}

function resetForNext(){
  $('#answer').value='';
  $('#roundStatus').textContent='';
  $('#correctionLine')?.classList.add('hidden');
  clearInterval(TIMER);
  CLICK_LOCK = false;

  document.querySelectorAll('.mc-btn').forEach(b=>{
    b.classList.remove('selected','correct','wrong');
    b.setAttribute('aria-pressed','false');
  });
}

function isCorrectLocal(answer){
  const r = window.__lastRoomSnapshot;
  if(!r) return null;
  const idx = r.index;
  const qIdx = r.order[idx];
  const correct = CAPITALS[qIdx][1];
  const expected = norm(correct);
  const gotNorm = norm(ALIASES.get(norm(answer)) || answer);
  return !!(gotNorm && expected===norm(ALIASES.get(gotNorm)||gotNorm));
}

async function submitAnswer(valueFromMC){
  const ans = (valueFromMC!==undefined) ? valueFromMC : $('#answer').value.trim();
  if(!ans && ROOM_MODE==='text') return autoLock();

  // Feedback immédiat en mode saisie si correction ON
  if (ROOM_MODE === 'text' && ROOM_CORR){
    const ok = isCorrectLocal(ans||'');
    const input = $('#answer');
    const line  = $('#correctionLine');
    if (ok){
      flash(input, 'input-flash-ok', 1000);
      if (line){ line.classList.add('hidden'); line.textContent=''; }
    } else {
      flash(input, 'input-flash-bad', 1000);
      if (line && window.__lastRoomSnapshot){
        const r = window.__lastRoomSnapshot;
        const correct = CAPITALS[r.order[r.index]][1];
        line.innerHTML = `<span class="good">${correct}</span>`;
        line.classList.remove('hidden');
        setTimeout(()=>{ line.classList.add('hidden'); }, 1000);
      }
    }
  }

  await lockAndEvaluate(ans||'');
}

async function autoLock(){ await lockAndEvaluate(''); }

async function lockAndEvaluate(raw){
  const base = ref(db, 'rooms/'+ROOM);
  await runTransaction(base, (room)=>{
    if(!room || room.index>=room.count) return room;
    const idx = room.index;
    const qIdx = room.order[idx];
    const [country, cap] = CAPITALS[qIdx];
    const me = room.players?.[ME.id] || { name: (localStorage.getItem('lastName')||'Moi'), score:0, answered:false, last:"", history: [] };
    if(me.answered) return room;

    const expected = norm(cap);
    const gotNorm = norm(ALIASES.get(norm(raw)) || raw);
    const ok = gotNorm && expected===norm(ALIASES.get(gotNorm)||gotNorm);

    me.answered = true; me.last = raw;
    if(ok) me.score = (me.score||0) + 1;

    me.history = me.history || [];
    me.history.push({ idx:qIdx, country, correct:cap, answer: raw, ok });

    room.players[ME.id] = me;

    const allAnswered = Object.values(room.players).every(p=>p.answered);
    if (allAnswered) {
      if (!room.advanceAt) {
        const extra = room.correction ? 1000 : BASE_REVEAL_MS; // 1s si correction ON
        room.advanceAt = Date.now() + extra;
      }
    }
    return room;
  });
}

function showResults(room){
  $('#game').classList.add('hidden');
  $('#results').classList.remove('hidden');

  const me = room.players?.[ME.id];
  const others = Object.entries(room.players||{}).filter(([id])=>id!==ME.id).map(([,p])=>p);
  const op = others[0]||{name:'Adversaire',score:0,history:[]};

  $('#colMe').textContent = me?.name || 'Moi';
  $('#colOp').textContent = op?.name || 'Adversaire';

  $('#resSubtitle').textContent = `Mode: ${room.mode==='mc'?'QCM':'Saisie'} • ${room.correction?'Correction ON':'Correction OFF'} • Total: ${room.count} questions`;
  $('#meFinal').innerHTML = `<div class="big">${me?.name||'Moi'}</div><div class="ok" style="font-size:36px;font-weight:800">${me?.score||0} pts</div>`;
  $('#opFinal').innerHTML = `<div class="big">${op.name}</div><div class="ok" style="font-size:36px;font-weight:800">${op.score} pts</div>`;

  const myH = me?.history||[];
  const opH = op?.history||[];
  const byIdx = new Map();
  for(const h of myH) byIdx.set(h.idx, {country:h.country, correct:h.correct, me:h});
  for(const h of opH){
    const cur = byIdx.get(h.idx) || {country:h.country, correct:h.correct, me:null};
    cur.op = h; byIdx.set(h.idx, cur);
  }

  const tbody = document.querySelector('#detailTable tbody'); tbody.innerHTML='';
  room.order.forEach((qIdx, i)=>{
    const rec = byIdx.get(qIdx) || {country: CAPITALS[qIdx][0], correct: CAPITALS[qIdx][1], me:null, op:null};
    const meTxt = rec.me ? `${rec.me.answer||'∅'} ${rec.me.ok?'<span class="good">✅</span>':'<span class="badx">❌</span>'}` : '—';
    const opTxt = rec.op ? `${rec.op.answer||'∅'} ${rec.op.ok?'<span class="good">✅</span>':'<span class="badx">❌</span>'}` : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${rec.country}</td><td>${rec.correct}</td><td>${meTxt}</td><td>${opTxt}</td>`;
    tbody.appendChild(tr);
  });
}

// UX
$('#playerName').value = localStorage.getItem('lastName')||'';
$('#playerName').addEventListener('change',()=>localStorage.setItem('lastName',$('#playerName').value));
