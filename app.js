import {filterCharts,sampleUnique} from './filter.js';
const $=id=>document.getElementById(id);
const defaults={keys:4,family:'normal',min:10,max:13,tags:['트릴'],match:'any',strength:1,pack:'',q:'',unknown:false};
let f={...defaults,tags:[...defaults.tags]},data,filtered=[],shown=30;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const packNames={R:'RESPECT',RV:'RESPECT / V',P1:'PORTABLE 1',P2:'PORTABLE 2',CE:'CLAZZIQUAI',BS:'BLACK SQUARE',DM:'DEEMO',CY:'CYTUS',T1:'TECHNIKA 1',T2:'TECHNIKA 2',T3:'TECHNIKA 3',TR:'TRILOGY',ES:'EMOTIONAL S.',NXN:'NEXON',BA:'BLUE ARCHIVE',ARC:'ARCAEA',CP:'CLEAR PASS'};
function label(t){return data.tags.find(x=>x.id===t)?.label||({'능지':'讀譜','변속':'變速','레이저 / 가변':'側軌／變換','따닥이':'雙擊'}[t])||t;}
function card(c){
 const ts=Object.entries(c.tags).filter(([,v])=>v>0).sort(([a],[b])=>Number(f.tags.includes(b))-Number(f.tags.includes(a)));
 const tags=c.hasTags?ts.map(([id,n])=>`<span class="tag ${f.tags.includes(id)?'match':''}">${esc(label(id))} · ${n}</span>`).join(''):'<span class="unknown">尚無特徵標記</span>';
 const query=encodeURIComponent(`DJMAX ${c.name} ${c.keys}B ${c.diff} pattern`);
 return `<article class="chart" data-chart="${esc(c.id)}"><div class="chart-head"><div><h3>${esc(c.name)}</h3><div class="meta">${c.keys}B · ${esc(c.composer)} · ${esc(packNames[c.pack]||c.pack)}</div></div><span class="badge ${c.diff==='SC'?'sc':''}">${c.diff} ${c.level}</span></div><div class="chart-tags">${tags}</div><div class="chart-links"><a href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener">搜尋譜面影片 ↗</a></div></article>`;
}
function save(){try{localStorage.setItem('djmax-practice-filters-v1',JSON.stringify(f));}catch{}}
function sync(){
 document.querySelectorAll('[data-keys]').forEach(b=>{const active=Number(b.dataset.keys)===f.keys;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 for(const id of ['family','min','max','match','strength','pack','q'])$(id).value=f[id];$('unknown').checked=f.unknown;
 const available=data.tags.filter(t=>data.charts.some(c=>c.keys===f.keys&&c.tags[t.id]>0));
 f.tags=f.tags.filter(id=>available.some(t=>t.id===id));
 $('tags').innerHTML=available.map(t=>`<button class="chip" data-tag="${esc(t.id)}" aria-pressed="${f.tags.includes(t.id)}" title="${esc(t.description)}">${esc(t.label)}</button>`).join('');
 $('tagHelp').textContent=f.tags.length?f.tags.map(id=>data.tags.find(t=>t.id===id)?.description).filter(Boolean).join('；'):'未選特徵：瀏覽此範圍內有標記的譜面。';
}
function render(){
 sync();filtered=filterCharts(data.charts,f);shown=30;save();$('count').textContent=filtered.length.toLocaleString();$('draw').disabled=!filtered.length;$('drawn').hidden=true;
 const family=f.family==='sc'?'SC':'一般';
 $('status').textContent=filtered.length?`${f.keys}B · ${family} ${f.min}–${f.max} · ${f.tags.length?(f.match==='all'?'同時符合':'符合任一')+'所選特徵':'全部特徵'}。由低等級開始排列。`:'這個組合目前沒有符合的已標記譜面。試著放寬等級、降低標籤強度，或少選一項特徵。';
 list();
}
function list(){$('list').innerHTML=filtered.slice(0,shown).map(card).join('');$('more').hidden=shown>=filtered.length;}
function update(id,value){f[id]=value;if(id==='min'&&Number(f.min)>Number(f.max))f.max=Number(f.min);if(id==='max'&&Number(f.max)<Number(f.min))f.min=Number(f.max);render();}
async function init(){
 try{$('nickname').value=localStorage.getItem('djmax-practice-nickname')||'';}catch{}
 $('saveNickname').addEventListener('click',()=>{const name=$('nickname').value.trim();$('nickname').value=name;try{if(name)localStorage.setItem('djmax-practice-nickname',name);else localStorage.removeItem('djmax-practice-nickname');$('nicknameStatus').textContent=name?`已儲存「${name}」。個人成績推薦尚未啟用，目前結果仍依篩選條件列出。`:'已清除暱稱。你仍可使用所有篩選功能。';}catch{$('nicknameStatus').textContent='此瀏覽器無法儲存暱稱；篩選功能仍可使用。';}});
 try{
  const response=await fetch('data.json');if(!response.ok)throw Error();data=await response.json();
  const options=Array.from({length:15},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');$('min').innerHTML=options;$('max').innerHTML=options;
  const packs=[...new Set(data.charts.map(c=>c.pack))].sort();$('pack').innerHTML='<option value="">所有曲包</option>'+packs.map(p=>`<option value="${esc(p)}">${esc(packNames[p]||p)}</option>`).join('');
  try{const stored=JSON.parse(localStorage.getItem('djmax-practice-filters-v1')||'null');if(stored&&[4,6].includes(stored.keys)&&['normal','sc'].includes(stored.family)&&stored.min>=1&&stored.max<=15&&stored.min<=stored.max&&Array.isArray(stored.tags)){f={...defaults,...stored};if(!packs.includes(f.pack))f.pack='';}}catch{}
  $('coverage').textContent=`曲庫共 ${data.charts.length.toLocaleString()} 張譜面，${data.charts.filter(c=>c.hasTags).length.toLocaleString()} 張有特徵標記；其餘未標記譜面不會列入特徵搜尋。`;$('dataDate').textContent=data.date;
  document.querySelectorAll('[data-keys]').forEach(b=>b.addEventListener('click',()=>update('keys',Number(b.dataset.keys))));
  $('tags').addEventListener('click',e=>{const button=e.target.closest('[data-tag]');if(!button)return;const t=button.dataset.tag;f.tags=f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t];render();});
  for(const id of ['family','min','max','match','strength','pack'])$(id).addEventListener('change',()=>update(id,['min','max','strength'].includes(id)?Number($(id).value):$(id).value));
  $('q').addEventListener('input',()=>update('q',$('q').value));$('unknown').addEventListener('change',()=>update('unknown',$('unknown').checked));
  $('clearTags').addEventListener('click',()=>{f.tags=[];render();});$('reset').addEventListener('click',()=>{f={...defaults,tags:[...defaults.tags]};render();});
  $('more').addEventListener('click',()=>{shown+=30;list();});$('closeDraw').addEventListener('click',()=>{$('drawn').hidden=true;});
  $('draw').addEventListener('click',()=>{const n=Number($('drawCount').value);const picks=sampleUnique(filtered,n);$('picks').innerHTML=picks.map(card).join('');$('drawNotice').textContent=picks.length<n?`符合條件的歌曲共 ${picks.length} 首，已全部列出；同首歌只抽一張譜面。`:`已隨機挑出 ${picks.length} 首，同首歌不重複。覺得吃力就換歌，不必全部打完。`;$('drawn').hidden=false;$('drawn').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
  render();
 }catch{$('status').innerHTML='曲庫暫時無法載入，請重新整理後再試。';$('count').textContent='0';}
}
init();
