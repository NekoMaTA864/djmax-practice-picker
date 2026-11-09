import {filterCharts,sampleUnique} from './filter.js';
import {indexScores,rangeForTier,tierLabel} from './recommendation.js';
const $=id=>document.getElementById(id);
const defaults={keys:4,ranges:{normal:{enabled:true,min:10,max:13},sc:{enabled:true,min:4,max:6}},tier:'manual',tags:['트릴'],match:'any',strength:1,pack:'',q:'',unknown:false};
let f=structuredClone(defaults),data,filtered=[],shown=30,drawnIds=new Set(),scoreRecordsByKeys=new Map(),scoreIndexByKeys=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const packNames={R:'RESPECT',RV:'RESPECT / V',P1:'PORTABLE 1',P2:'PORTABLE 2',CE:'CLAZZIQUAI',BS:'BLACK SQUARE',DM:'DEEMO',CY:'CYTUS',T1:'TECHNIKA 1',T2:'TECHNIKA 2',T3:'TECHNIKA 3',TR:'TRILOGY',ES:'EMOTIONAL S.',NXN:'NEXON',BA:'BLUE ARCHIVE',ARC:'ARCAEA',CP:'CLEAR PASS'};
function label(t){return data.tags.find(x=>x.id===t)?.label||({'능지':'讀譜','변속':'變速','레이저 / 가변':'側軌／變換','따닥이':'雙擊'}[t])||t;}
function activeScoreIndex(){return scoreIndexByKeys.get(f.keys)||new Map();}
function card(c){
 const ts=Object.entries(c.tags).filter(([,v])=>v>0).sort(([a],[b])=>Number(f.tags.includes(b))-Number(f.tags.includes(a)));
 const tags=c.hasTags?ts.map(([id,n])=>`<span class="tag ${f.tags.includes(id)?'match':''}">${esc(label(id))} · ${n}</span>`).join(''):'<span class="unknown">尚無特徵標記</span>';
 const own=activeScoreIndex().get(c.id),hasScores=scoreRecordsByKeys.has(f.keys);
 const personal=hasScores?`<span class="personal-score">${own?`V-ARCHIVE 最佳 ${own.score.toFixed(2)}%`:'V-ARCHIVE 無紀錄'}</span>`:'';
 const query=encodeURIComponent(`DJMAX ${c.name} ${c.keys}B ${c.diff} pattern`);
 return `<article class="chart" data-chart="${esc(c.id)}"><div class="chart-head"><div><h3>${esc(c.name)}</h3><div class="meta">${c.keys}B · ${esc(c.composer)} · ${esc(packNames[c.pack]||c.pack)}</div></div><span class="badge ${c.diff==='SC'?'sc':''}">${c.diff} ${c.level}</span></div>${personal?`<div class="personal-row">${personal}</div>`:''}<div class="chart-tags">${tags}</div><div class="chart-links"><a href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener">搜尋譜面影片 ↗</a></div></article>`;
}
function save(){try{localStorage.setItem('djmax-practice-filters-v1',JSON.stringify({...f,tier:'manual'}));}catch{}}
function rangeText(family){const r=f.ranges[family];return r.enabled?`${r.min}–${r.max}`:'關閉';}
function sync(){
 document.querySelectorAll('[data-keys]').forEach(b=>{const active=Number(b.dataset.keys)===f.keys;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelectorAll('[data-tier]').forEach(b=>{const active=b.dataset.tier===f.tier;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 for(const family of ['normal','sc']){
  $(`${family}Enabled`).checked=f.ranges[family].enabled;
  $(`${family}Min`).value=f.ranges[family].min;
  $(`${family}Max`).value=f.ranges[family].max;
  $(`${family}Range`).classList.toggle('disabled',!f.ranges[family].enabled);
 }
 for(const id of ['match','strength','pack','q'])$(id).value=f[id];$('unknown').checked=f.unknown;
 const available=data.tags.filter(t=>data.charts.some(c=>c.keys===f.keys&&c.tags[t.id]>0));
 f.tags=f.tags.filter(id=>available.some(t=>t.id===id));
 $('tags').innerHTML=available.map(t=>`<button class="chip" data-tag="${esc(t.id)}" aria-pressed="${f.tags.includes(t.id)}" title="${esc(t.description)}">${esc(t.label)}</button>`).join('');
 $('tagHelp').textContent=f.tags.length?f.tags.map(id=>data.tags.find(t=>t.id===id)?.description).filter(Boolean).join('；'):'未選特徵：瀏覽此範圍內有標記的譜面。';
}
function render(){
 sync();filtered=filterCharts(data.charts,f);shown=30;drawnIds.clear();save();$('drawn').hidden=true;
 $('count').textContent=filtered.length.toLocaleString();$('draw').disabled=!filtered.length;
 const ranges=[f.ranges.normal.enabled?`一般 ${rangeText('normal')}`:'',f.ranges.sc.enabled?`SC ${rangeText('sc')}`:''].filter(Boolean).join('＋')||'未開啟難度範圍';
 $('status').textContent=filtered.length?`${f.keys}B · ${ranges} · ${f.tags.length?(f.match==='all'?'同時符合':'符合任一')+'所選特徵':'全部特徵'}。候選依星級排列；抽出的歌曲會從下方清單暫時收起。`:'這個組合目前沒有符合的已標記譜面。試著放寬等級、降低標籤強度，或少選一項特徵。';
 list();
}
function list(){const visible=filtered.filter(c=>!drawnIds.has(c.id));$('list').innerHTML=visible.slice(0,shown).map(card).join('');$('more').hidden=shown>=visible.length;}
function markManual(){if(f.tier!=='manual')f.tier='manual';}
function updateRange(family,key,value){const r=f.ranges[family];r[key]=value;if(key==='min'&&r.min>r.max)r.max=r.min;if(key==='max'&&r.max<r.min)r.min=r.max;markManual();render();}
function showLoadedStatus(keys){
 const records=scoreRecordsByKeys.get(keys);if(!records)return;
 $('scoreStatus').textContent=`已載入 ${keys}B 的 ${records.length.toLocaleString()} 筆公開最佳成績，只暫存在此頁面記憶體。切換鍵數後需另載入該鍵數。`;
}
async function loadScores(){
 const nickname=$('nickname').value.trim();
 if(!nickname){$('scoreStatus').textContent='先輸入 V-ARCHIVE 公開暱稱，再載入成績。';$('nickname').focus();return false;}
 $('nickname').value=nickname;$('loadScores').disabled=true;$('scoreStatus').textContent=`正在向 V-ARCHIVE 讀取 ${f.keys}B 公開成績…`;
 try{
  const url=`https://v-archive.net/api/v2/archive/${encodeURIComponent(nickname)}/button/${f.keys}`;
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const payload=await response.json();
  if(payload.success===false||!Array.isArray(payload.records))throw new Error('回傳資料格式不符');
  scoreRecordsByKeys.set(f.keys,payload.records);scoreIndexByKeys.set(f.keys,indexScores(payload.records,f.keys));
  try{localStorage.setItem('djmax-practice-nickname',nickname);}catch{}
  showLoadedStatus(f.keys);render();return true;
 }catch(error){
  $('scoreStatus').textContent=`讀取失敗：V-ARCHIVE 暫時無法提供資料，或瀏覽器跨網域限制了查詢。${error?.name==='TimeoutError'?'請稍後重試。':'網站不會改用代理伺服器。'}`;
  return false;
 }finally{$('loadScores').disabled=false;}
}
function applyTier(tier){
 if(tier==='manual'){f.tier='manual';$('tierStatus').textContent='使用下方自訂的普通譜面與 SC 範圍。';render();return;}
 const records=scoreRecordsByKeys.get(f.keys);
 if(!records){$('tierStatus').textContent=`先輸入暱稱並按「載入 ${f.keys}B 成績」，才能依個人成績估算三檔星級。`;$('nickname').focus();return;}
 const next={...f.ranges},details=[];let updated=0;
 for(const family of ['normal','sc']){
  const result=rangeForTier(records,family,tier);
  if(!result){details.push(`${family==='normal'?'一般':'SC'}：沒有可用成績`);continue;}
  next[family]={...next[family],enabled:true,min:result.min,max:result.max};updated++;
  details.push(`${family==='normal'?'一般':'SC'} ${result.min}–${result.max} 星（參考 ${result.count} 張，${result.median.toFixed(2)}% 中位最佳${result.fallback?'；該類型沒有任何參考級達 98.5%，採備用範圍':''}）`);
 }
 if(!updated){$('tierStatus').textContent=`${f.keys}B 尚無足夠成績可估算，請改用自訂範圍。`;return;}
 f.ranges=next;f.tier=tier;$('tierStatus').textContent=`${tierLabel(tier)} · ${f.keys}B：${details.join('；')}。以每級至少 3 張、最佳準度中位數 98.5% 作為參考；這是星級估算，不代表單局穩定度。`;
 render();
}
function updateKeyMode(keys){f.keys=keys;f.tier='manual';$('tierStatus').textContent=scoreRecordsByKeys.has(keys)?`已載入 ${keys}B 成績；可選一個自動分檔。`:`請載入 ${keys}B 成績後使用自動分檔；一般與 SC 會分開估算。`;render();}
async function init(){
 try{$('nickname').value=localStorage.getItem('djmax-practice-nickname')||'';}catch{}
 $('saveNickname').addEventListener('click',()=>{const name=$('nickname').value.trim();$('nickname').value=name;try{if(name){localStorage.setItem('djmax-practice-nickname',name);$('nicknameStatus').textContent=`已在此瀏覽器儲存「${name}」。`; }else{localStorage.removeItem('djmax-practice-nickname');$('nicknameStatus').textContent='已清除暱稱。篩選功能仍可使用。';}}catch{$('nicknameStatus').textContent='此瀏覽器無法儲存暱稱；篩選功能仍可使用。';}});
 $('loadScores').addEventListener('click',loadScores);
 try{
  const response=await fetch('data.json');if(!response.ok)throw Error();data=await response.json();
  const options=Array.from({length:15},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');for(const family of ['normal','sc']){$(`${family}Min`).innerHTML=options;$(`${family}Max`).innerHTML=options;}
  const packs=[...new Set(data.charts.map(c=>c.pack))].sort();$('pack').innerHTML='<option value="">所有曲包</option>'+packs.map(p=>`<option value="${esc(p)}">${esc(packNames[p]||p)}</option>`).join('');
  try{
   const stored=JSON.parse(localStorage.getItem('djmax-practice-filters-v1')||'null');
   if(stored&&[4,6].includes(stored.keys)&&stored.ranges&&['normal','sc'].every(key=>stored.ranges[key]&&Number(stored.ranges[key].min)>=1&&Number(stored.ranges[key].max)<=15&&stored.ranges[key].min<=stored.ranges[key].max))f={...defaults,...stored,ranges:structuredClone(stored.ranges),tier:'manual'};
   else if(stored&&[4,6].includes(stored.keys)&&['normal','sc'].includes(stored.family)&&stored.min>=1&&stored.max<=15&&stored.min<=stored.max)f={...defaults,...stored,tier:'manual',ranges:{normal:{enabled:stored.family==='normal',min:stored.min,max:stored.max},sc:{enabled:stored.family==='sc',min:stored.min,max:stored.max}}};
   if(f.pack&&!packs.includes(f.pack))f.pack='';
  }catch{}
  $('coverage').textContent=`曲庫共 ${data.charts.length.toLocaleString()} 張譜面，${data.charts.filter(c=>c.hasTags).length.toLocaleString()} 張有特徵標記；其餘未標記譜面不會列入特徵搜尋。`;$('dataDate').textContent=data.date;
  document.querySelectorAll('[data-keys]').forEach(b=>b.addEventListener('click',()=>updateKeyMode(Number(b.dataset.keys))));
  document.querySelectorAll('[data-tier]').forEach(b=>b.addEventListener('click',()=>applyTier(b.dataset.tier)));
  $('tags').addEventListener('click',e=>{const button=e.target.closest('[data-tag]');if(!button)return;const t=button.dataset.tag;f.tags=f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t];render();});
  for(const family of ['normal','sc']){
   $(`${family}Enabled`).addEventListener('change',()=>{f.ranges[family].enabled=$(`${family}Enabled`).checked;markManual();render();});
   for(const edge of ['Min','Max'])$(`${family}${edge}`).addEventListener('change',()=>updateRange(family,edge==='Min'?'min':'max',Number($(`${family}${edge}`).value)));
  }
  for(const id of ['match','strength','pack'])$(id).addEventListener('change',()=>{f[id]=['strength'].includes(id)?Number($(id).value):$(id).value;render();});
  $('q').addEventListener('input',()=>{f.q=$('q').value;render();});$('unknown').addEventListener('change',()=>{f.unknown=$('unknown').checked;render();});
  $('clearTags').addEventListener('click',()=>{f.tags=[];render();});$('reset').addEventListener('click',()=>{f=structuredClone(defaults);$('tierStatus').textContent='載入成績後，可依 4B／6B 與一般／SC 分別估算星級。';render();});
  $('more').addEventListener('click',()=>{shown+=30;list();});$('closeDraw').addEventListener('click',()=>{$('drawn').hidden=true;drawnIds.clear();list();});
  $('draw').addEventListener('click',()=>{const n=Number($('drawCount').value),picks=sampleUnique(filtered,n);drawnIds=new Set(picks.map(c=>c.id));$('picks').innerHTML=picks.map(card).join('');$('drawNotice').textContent=picks.length<n?`符合條件的歌曲共 ${picks.length} 首，已全部列出；同首歌只抽一張譜面。`:`已隨機挑出 ${picks.length} 首，同首歌不重複。抽出的歌曲會從下方清單收起。覺得吃力就換歌，不必全部打完。`;$('drawn').hidden=false;list();$('drawn').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
  render();
 }catch{$('status').innerHTML='曲庫暫時無法載入，請重新整理後再試。';$('count').textContent='0';}
}
init();
