import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// פרטי פרויקט Supabase שסופקו עבור SPARK
const SUPABASE_URL = "https://xahqpmsenunulkpljald.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_j7Sym2Ku9TJOOCRE_baw4w_1ZNbLJTT";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const decks = [
  {id:"connection",name:"קרבה וחיבור",icon:"♡",desc:"שיחות קטנות, חיבור גדול",cards:[
    ["מהו רגע קטן מהשבוע האחרון שבו הרגשת קרוב/ה אליי?","שתפו בלי למהר. רק להקשיב."],
    ["ספרו על זיכרון משותף שתמיד מעלה לכם חיוך.","אפשר להוסיף פרט שהשני אולי שכח."],
    ["מה דבר אחד שהיית רוצה שנעשה יותר ביחד?","בחרו משהו קטן שאפשר להתחיל השבוע."],
    ["השלימו: אני מרגיש/ה הכי אהוב/ה כשאת/ה…","אפשר לבקש, לא חייבים לנחש."],
    ["תנו זה לזו מחמאה אחת שלא אומרים מספיק.","היו ספציפיים ואמיתיים."]
  ]},
  {id:"spark",name:"ניצוץ ותשוקה",icon:"✧",desc:"רומנטיקה, פלרטוט ורכות",cards:[
    ["תכננו דייט קצר בבית כאילו זו הפגישה הראשונה שלכם.","תנו לדמיון להוביל."],
    ["מה מחווה רומנטית קטנה תמיד מצליחה לשמח אותך?","ספרו גם למה."],
    ["שלחו זה לזו הודעת פלרטוט כאילו רק עכשיו הכרתם.","אפשר גם בלחש, פנים אל פנים."],
    ["בחרו שיר שמזכיר לכם את תחילת הקשר ורקדו יחד.","גם סלון קטן הוא רחבת ריקודים."],
    ["תארו ערב זוגי מושלם, בלי מגבלות של זמן או תקציב.","חלמו ביחד."]
  ]},
  {id:"bold",name:"אזור נועז",icon:"🔥",desc:"סקרנות, גבולות והעזה",cards:[
    ["שתפו משהו חדש שהייתם סקרנים לנסות יחד, רק אם מתאים לשניכם.","סקרנות היא הזמנה, לא התחייבות."],
    ["איזו אווירה גורמת לכם להרגיש הכי נינוחים ואינטימיים?","דברו על מה נעים ומה פחות."],
    ["הציעו דרך חדשה להכניס רומנטיקה לשגרה.","מותר לענות כן, לא או אולי."],
    ["שתפו גבול או העדפה שחשוב לכם שהשני יכיר.","מקשיבים בלי לשפוט."]
  ]},
  {id:"surprise",name:"הפתעה ובונוס",icon:"🎁",desc:"משימות קלילות ולא צפויות",cards:[
    ["הכינו לשני משקה קטן והגישו אותו עם ברכה.","הפתעה פשוטה מהלב."],
    ["צלמו סלפי זוגי מצחיק ותנו לו שם של סרט.","לא צריך להיות פוטוגניים."],
    ["כל אחד בוחר שיר אחד — והשני צריך לנחש למה נבחר.","ספרו את הסיפור מאחורי הבחירה."],
    ["תנו חיבוק של 20 שניות, אם נעים לשניכם.","אפשר גם להחזיק ידיים."]
  ]}
];

const $ = id => document.getElementById(id);
let state = {pairCode:null,activeDeck:null,currentCard:null,history:[]};
let pairId = null, busy = false;
const localKey = "spark-state-v1";

function saveLocal(){ localStorage.setItem(localKey, JSON.stringify(state)); }
function loadLocal(){ try { state = {...state,...JSON.parse(localStorage.getItem(localKey)||"{}")}; } catch {} }
function toast(msg){ const el=$("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); }
function setStatus(text){ $("connectionStatus").textContent=text; }
function renderDecks(){
  $("deckGrid").innerHTML = decks.map(d=>`<button class="deck ${state.activeDeck===d.id?"active":""}" data-deck="${d.id}"><span class="deck-icon">${d.icon}</span><strong>${d.name}</strong><small>${d.desc}</small></button>`).join("");
  document.querySelectorAll("[data-deck]").forEach(b=>b.addEventListener("click",()=>selectDeck(b.dataset.deck)));
}
function selectDeck(id){ state.activeDeck=id; state.currentCard=null; renderDecks(); showCard(null); saveLocal(); }
function showCard(card){
  if(!card){ $("activeDeckLabel").textContent="הקלף הבא שלכם"; $("cardCategory").textContent=state.activeDeck?decks.find(d=>d.id===state.activeDeck).name:"בחרו חפיסה"; $("cardText").textContent=state.activeDeck?"מוכנים לניצוץ הבא?":"כל ניצוץ מתחיל ברגע קטן."; $("cardNote").textContent=state.activeDeck?"לחצו על שליפת קלף כדי לגלות את המשימה שלכם.":"בחרו אחת מהחפיסות למעלה והגרילו קלף."; $("doneBtn").disabled=true; $("skipBtn").disabled=true; $("cardCount").textContent=""; return; }
  $("activeDeckLabel").textContent="הקלף שלכם"; $("cardCategory").textContent=card.deckName; $("cardText").textContent=card.text; $("cardNote").textContent=card.note; $("doneBtn").disabled=false; $("skipBtn").disabled=false;
}
function draw(){
  if(!state.activeDeck){toast("קודם בחרו חפיסה");return;}
  const deck=decks.find(d=>d.id===state.activeDeck), item=deck.cards[Math.floor(Math.random()*deck.cards.length)];
  state.currentCard={deckId:deck.id,deckName:deck.name,text:item[0],note:item[1]};
  showCard(state.currentCard); $("cardCount").textContent=`${deck.cards.length} קלפים בחפיסה`; saveLocal();
}
async function syncState(){
  if(!pairId)return;
  const {error}=await supabase.rpc("spark_save_state",{p_pair_id:pairId,p_state:{history:state.history}});
  if(error) console.warn("Sync failed",error.message);
}
async function finish(status){
  if(!state.currentCard)return;
  state.history.unshift({...state.currentCard,status,at:new Date().toISOString()});
  state.currentCard=null; showCard(null); renderHistory(); saveLocal();
  if(pairId) await syncState();
  toast(status==="done"?"הרגע הזה נשמר ❤️":"נשמר לפעם אחרת");
}
function renderHistory(){
  $("historyList").innerHTML=state.history.length?state.history.slice(0,12).map(h=>`<div class="history-item"><div><strong>${escapeHtml(h.text)}</strong><small>${escapeHtml(h.deckName)} · ${new Date(h.at).toLocaleDateString("he-IL")}</small></div><span class="history-status">${h.status==="done"?"הושלם ✓":"דילגנו"}</span></div>`).join(""):'<p class="empty">עוד אין רגעים שמורים. זה הזמן ליצור את הראשון ✨</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setPairUI(code){state.pairCode=code;$("pairTitle").textContent=code?"המרחב הזוגי מחובר":"מתחילים ביחד";$("pairDescription").textContent=code?`הקוד הזוגי שלכם: ${code}`:"צרו קוד זוגי או הצטרפו עם קוד שקיבלתם.";$("pairCodeInput").value=code||"";saveLocal();}
async function createPair(){
  $("pairMessage").textContent="יוצרים קוד…";
  const {data,error}=await supabase.rpc("spark_create_pair");
  if(error){$("pairMessage").textContent="לא הצלחנו ליצור קוד. בדקו שהרצתם את קובץ SQL.";toast(error.message);return;}
  pairId=data.pair_id;setPairUI(data.pair_code);$("pairMessage").textContent="הקוד נוצר! שתפו אותו עם בן/בת הזוג.";setStatus("מחובר לענן");await syncState();
}
async function joinPair(){
  const code=$("pairCodeInput").value.trim().toUpperCase();
  if(!code){$("pairMessage").textContent="צריך להזין קוד זוגי.";return;}
  const {data,error}=await supabase.rpc("spark_get_state",{p_pair_code:code});
  if(error||!data){$("pairMessage").textContent="לא מצאנו את הקוד. בדקו ונסו שוב.";return;}
  pairId=data.pair_id;setPairUI(code);state.history=data.state?.history||[];renderHistory();saveLocal();$("pairMessage").textContent="הצטרפתם בהצלחה!";setStatus("מחובר לענן");toast("ברוכים הבאים למרחב הזוגי");
}
async function init(){
  loadLocal();renderDecks();renderHistory();setPairUI(state.pairCode);showCard(null);
  $("drawBtn").addEventListener("click",draw);$("doneBtn").addEventListener("click",()=>finish("done"));$("skipBtn").addEventListener("click",()=>finish("skip"));$("createPairBtn").addEventListener("click",createPair);$("joinPairBtn").addEventListener("click",joinPair);
  try{const {error}=await supabase.from("spark_pairs").select("id").limit(1);if(!error)setStatus("מוכן לסנכרון");else setStatus("ממתין להגדרת ענן");}catch{setStatus("מצב מקומי");}
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
init();
