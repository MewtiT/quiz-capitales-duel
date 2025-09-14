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

// ===== Local state =====
let ROOM = null;
let ME = { id: uid(), name: '' };
let TIMER = null;
let ROOM_MODE = 'text'; // 'text' | 'mc'

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

// ===== UI events =====
$('#createBtn').onclick = async () => {
  ME.name = ($('#playerName').value||'').trim() || 'Joueur-'+uid().slice(0,4);
  const id = code(); if(!id){ alert('Choisis un code salon (ex: RIO974).'); return; }
  const mode = $('#modeSelect').value; ROOM_MODE = mode;
  const countSel = $('#questionCount').value;
  const count = countSel==='all' ? CAPITALS.length : parseInt(countSel,10);
  const seed = (Date.now() ^ crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
  const order = seededShuffle([...Array(CAPITALS.length).keys()], seed).slice(0,count);

  ROOM = id;
  await set(ref(db, 'rooms/'+ROOM), {
    createdAt: Date.now(),
    seed, count, order, mode,
    started: false, index: 0,
    players: { [ME.id]: { name: ME.name, score: 0, answered: false, last:"", history: [] } },
  });
  enterLobby(count, mode);
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
  await update(roomRef, { ['players/'+ME.id]: { name: ME.name, score: 0, answered: false, last:"", history: [] } });
  enterLobby(data.count, ROOM_MODE);
};

function enterLobby(count, mode){
  $('#setup').classList.remove('grid');
  $('#lobby').classList.remove('hidden');
  $('#lobbyRoom').textContent = ROOM;
  $('#shareCode').textContent = ROOM;
  $('#lobbyCount').textContent = count;
  $('#lobbyMode').textContent = mode==='mc' ? 'QCM' : 'Saisie';
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

  onValue(ref(db, 'rooms/'+ROOM), s=>{
    const r = s.val(); if(!r) return;
    const idx = r.index;
    $('#qTotal').textContent = r.count;
    $('#qIndex').textContent = Math.min(idx+1, r.count);
    const pair = CAPITALS[r.order[idx]] || [];
    $('#country').textContent = pair[0] || '';

    // Remplir QCM + reset visuel
    if(ROOM_MODE==='mc' && r.order[idx]!==undefined){
      const opts = mcOptions(r.order[idx], r.seed);
      document.querySelectorAll('.mc-btn').forEach((b,i)=>{ 
        b.textContent = opts[i] || ''; 
        b.disabled = false; 
        b.classList.remove('selected'); // reset sélection
      });
    }

    if(idx>=r.count){ showResults(r); }
  });

  startTimer(30);
  onValue(ref(db, 'rooms/'+ROOM+'/index'), ()=>{ resetForNext(); startTimer(30); });

  // Handlers
  $('#submitBtn').onclick = submitAnswer;
  $('#answer').addEventListener('keydown',e=>{ if(e.key==='Enter') submitAnswer(); });

  // QCM : surbrillance et lock
  document.querySelectorAll('.mc-btn').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.mc-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      submitAnswer(btn.textContent);
      btn.disabled = true;
    };
  });
}

function startTimer(s){ clearInterval(TIMER); let t=s; $('#timer').textContent=t; TIMER=setInterval(()=>{ t--; $('#timer').textContent=t; if(t<=0){ clearInterval(TIMER); autoLock(); } },1000); }
function resetForNext(){ $('#answer').value=''; $('#roundStatus').textContent=''; clearInterval(TIMER); document.querySelectorAll('.mc-btn').forEach(b=>{ b.classList.remove('selected'); b.disabled=false; }); }

async function submitAnswer(valueFromMC){
  const ans = (valueFromMC!==undefined) ? valueFromMC : $('#answer').value.trim();
  if(!ans && ROOM_MODE==='text') return autoLock();
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
    if(allAnswered){
      for(const pid of Object.keys(room.players)) room.players[pid].answered=false;
      room.index = idx+1;
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

  // Entêtes personnalisées
  $('#colMe').textContent = me?.name || 'Moi';
  $('#colOp').textContent = op?.name || 'Adversaire';

  $('#resSubtitle').textContent = `Mode: ${room.mode==='mc'?'QCM':'Saisie'} • Total: ${room.count} questions`;
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
