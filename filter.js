export function matches(c,f){
 if(c.keys!==Number(f.keys))return false;
 if(f.ranges){
  const range=c.diff==='SC'?f.ranges.sc:f.ranges.normal;
  if(!range?.enabled||c.level<Number(range.min)||c.level>Number(range.max))return false;
 }else{
  if(f.family==='normal'&&c.diff==='SC'||f.family==='sc'&&c.diff!=='SC')return false;
  if(c.level<Number(f.min)||c.level>Number(f.max))return false;
 }
 if(f.pack&&c.pack!==f.pack)return false;
 if(f.q&&!`${c.name} ${c.composer}`.toLowerCase().includes(f.q.toLowerCase().trim()))return false;
 if(f.tags.length){const checks=f.tags.map(t=>(c.tags[t]||0)>=Number(f.strength));if(f.match==='all'?!checks.every(Boolean):!checks.some(Boolean))return false;}
 if(!f.tags.length&&!f.unknown&&!c.hasTags)return false;
 return true;
}
export function filterCharts(charts,f){return charts.filter(c=>matches(c,f)).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)||a.diff.localeCompare(b.diff));}
export function sampleUnique(charts,n,rng=Math.random){const a=[...charts];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}const seen=new Set();return a.filter(c=>{if(seen.has(c.songId))return false;seen.add(c.songId);return true;}).slice(0,n);}
