const TIERS={
 warmup:{label:'放鬆／暖身',offsets:[-5,-3]},
 practice:{label:'中等／練習',offsets:[-3,-1]},
 challenge:{label:'高難／挑戰',offsets:[-1,1]},
};

export function indexScores(records,keys){
 const index=new Map();
 for(const record of records||[]){
  const songId=Number(record.title),score=Number(record.score),pattern=String(record.pattern||'').toUpperCase();
  if(!Number.isFinite(songId)||!Number.isFinite(score)||!['NM','HD','MX','SC'].includes(pattern))continue;
  index.set(`${songId}:${keys}:${pattern}`,{score,level:Number(record.level),updatedAt:record.updatedAt||''});
 }
 return index;
}

export function levelReference(records,family){
 const grouped=new Map();
 for(const record of records||[]){
  const pattern=String(record.pattern||'').toUpperCase();
  if((family==='sc')!==(pattern==='SC'))continue;
  const level=Number(record.level),score=Number(record.score);
  if(!Number.isInteger(level)||level<1||level>15||!Number.isFinite(score))continue;
  if(!grouped.has(level))grouped.set(level,[]);
  grouped.get(level).push(score);
 }
 const rows=[...grouped].map(([level,scores])=>{
  scores.sort((a,b)=>a-b);
  const mid=Math.floor(scores.length/2);
  const median=scores.length%2?scores[mid]:(scores[mid-1]+scores[mid])/2;
  return {level,count:scores.length,median};
 }).sort((a,b)=>a.level-b.level);
 const qualified=rows.filter(row=>row.count>=3&&row.median>=98.5);
 const fallback=qualified.length===0;
 const usable=qualified.length?qualified:rows.filter(row=>row.count>=3);
 const source=usable.at(-1);
 return source?{level:source.level,count:source.count,median:source.median,fallback}:null;
}

export function rangeForTier(records,family,tier){
 const config=TIERS[tier],reference=levelReference(records,family);
 if(!config||!reference)return null;
 const [lowOffset,highOffset]=config.offsets;
 const min=Math.max(1,reference.level+lowOffset);
 const max=Math.min(15,Math.max(min,reference.level+highOffset));
 return {...reference,min,max,family,tier};
}

export function tierLabel(tier){return TIERS[tier]?.label||'自訂範圍';}
