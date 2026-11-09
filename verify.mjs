import assert from 'node:assert/strict';import fs from 'node:fs';import {filterCharts,sampleUnique} from './filter.js';
const data=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url)));
const f={keys:4,family:'normal',min:10,max:13,tags:['트릴'],strength:1,match:'any',pack:'',q:'',unknown:false};
for(const keys of [4,6])for(const family of ['normal','sc'])for(const tag of data.tags){const q={...f,keys,family,tags:[tag.id]};for(const c of filterCharts(data.charts,q)){assert.equal(c.keys,keys);assert.equal(c.diff==='SC',family==='sc');assert.ok(c.level>=10&&c.level<=13);assert.ok(c.tags[tag.id]>=1);}}
const cross=[{id:'91:4:SC',songId:91,keys:4,diff:'SC',level:10,tags:{'연타':2},hasTags:true,name:'SQUEEZE'},{id:'91:8:SC',songId:91,keys:8,diff:'SC',level:5,tags:{},hasTags:false,name:'SQUEEZE'}];
assert.equal(filterCharts(cross,{...f,family:'sc',min:1,max:5,tags:['연타']}).length,0,'Do not combine features across keys/difficulties');
assert.equal(filterCharts([{...cross[0],level:3,tags:{},hasTags:false}],{...f,family:'sc',min:1,max:5}).length,0,'Missing data is not a feature match');
const multi=filterCharts(data.charts,{...f,tags:['트릴','연타'],match:'all',strength:1});assert.ok(multi.every(c=>c.tags['트릴']&&c.tags['연타']));
const samples=sampleUnique(data.charts,50,()=>0.3);assert.equal(new Set(samples.map(c=>c.songId)).size,samples.length);
assert.equal(new Set(data.charts.map(c=>c.id)).size,data.charts.length);
console.log(JSON.stringify({charts:data.charts.length,tagged:data.charts.filter(c=>c.hasTags).length,defaultMatches:filterCharts(data.charts,f).length,tests:'passed'}));
