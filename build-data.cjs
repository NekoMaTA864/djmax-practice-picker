const fs=require('fs'),path=require('path');
const base=__dirname;
const songs=JSON.parse(fs.readFileSync(path.join(base,'songs-source.json'),'utf8'));
const radar=JSON.parse(fs.readFileSync(path.join(base,'radar-source.json'),'utf8'));
const tags=[['연타','連打','同一鍵連續按擊'],['트릴','交互','兩個位置交替按擊'],['폭타','密集亂打','密集而分散的音符'],['동치','多押','多個音符同時按下'],['롱잡','長條混合','按住長條時處理其他音符'],['계단','階梯','音符沿鍵位逐步移動'],['드르륵','掃鍵','快速連續掃過不同位置'],['겹계/데님','疊階／Denim','同時押的階梯組合'],['따닥','雙擊','短間隔的兩次按擊'],['능지/사이드','讀譜／側鍵','特殊讀譜或側軌配置']];
const charts=[];
for(const song of songs)for(const keys of [4,6])for(const [diff,p]of Object.entries(song.patterns[`${keys}B`]||{})){
 const raw=radar.charts[`${song.title}:${keys}:${diff}`]?.values||{};
 charts.push({id:`${song.title}:${keys}:${diff}`,songId:song.title,name:song.name,composer:song.composer||'',pack:song.dlcCode,keys,diff,level:p.level,tags:raw,hasTags:Object.keys(raw).length>0});
}
fs.writeFileSync(path.join(__dirname,'data.json'),JSON.stringify({source:radar.source,date:radar.fetchedAt,appVersion:'0.2.21',tags:tags.map(([id,label,description])=>({id,label,description})),charts}));
console.log(JSON.stringify({charts:charts.length,tagged:charts.filter(x=>x.hasTags).length}));
