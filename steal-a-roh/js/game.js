(function(){
'use strict';

/* =========================================================
   설정 (NPC 이름/색/아이템/성장템은 여기서 바꾸세요)
   ========================================================= */
var NPCS=window.__IMGS__.map(function(m){return {name:m.name,img:m.src,iw:m.w,ih:m.h};});
/* 등급: [이름, 그림자색, 중간색, 하이라이트색, 포인트색(받침/빔)] — 낮은 등급 → 높은 등급 */
var GRADES=[
  {name:'일반',     c:['#4a4f57','#9aa0a8','#eef0f3'],m:'#b0b6bd'},
  {name:'청동',     c:['#3b1f0e','#a8642a','#f0b27a'],m:'#cd7f32'},
  {name:'은',       c:['#3a4048','#a9b2bd','#ffffff'],m:'#d5dbe2'},
  {name:'황금',     c:['#5a3a00','#e0a400','#fff1a8'],m:'#ffc107'},
  {name:'에메랄드', c:['#032b14','#1faa59','#b9ffd6'],m:'#2ecc71'},
  {name:'아쿠아',   c:['#032c3a','#1fb6d6','#c4f6ff'],m:'#26c6da'},
  {name:'사파이어', c:['#06143f','#2a5fe0','#bcd2ff'],m:'#3d6bff'},
  {name:'자수정',   c:['#25083f','#8a3fd1','#e6c8ff'],m:'#a855f7'},
  {name:'로즈',     c:['#4a0f2a','#e0488e','#ffd0e6'],m:'#ff5fa2'},
  {name:'루비',     c:['#3d0206','#d4161f','#ffb3b3'],m:'#ff2b3a'},
  {name:'앰버',     c:['#4a1d00','#f07a10','#ffe0b0'],m:'#ff9100'},
  {name:'터콰이즈', c:['#02332f','#12c4b0','#c2fff6'],m:'#1de9b6'},
  {name:'흑요석',   c:['#05050a','#2b2d3f','#8d92c4'],m:'#6d72b8'},
  {name:'플래티넘', c:['#27323e','#9fc4e6','#ffffff'],m:'#bfe0ff'},
  {name:'다이아몬드',c:['#0b3d5c','#7ee8ff','#ffffff'],m:'#aef4ff'},
  {name:'오로라',   rainbow:1,c:['#000','#000','#fff'],m:'#ff80ff'},
  {name:'레전드',   c:['#3a0a52','#ff2fd0','#ffe9a0'],m:'#ff4fe0'},
  {name:'신화',     c:['#0a0014','#6a00ff','#ffd700'],m:'#ffd700'}
];
var ITEM_COLORS=NPCS.map(function(_,i){return GRADES[i%GRADES.length].m;});
/* 새 수호자(19번째부터)용 등급: 기존 18등급 위로 이어져요 */
(function(){
  var more=['초월','천상','성운','은하','퀘이사','초신성','블랙홀','차원','시공','무한','영겁','태초','혼돈','심연','태양','월광','혜성','극광','성좌','천계','절대','궁극','창세','오메가'];
  function hx(h,s,l){s/=100;l/=100;var k=function(n){return (n+h/30)%12;},a=s*Math.min(l,1-l),f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));};
    return '#'+[f(0),f(8),f(4)].map(function(v){return ('0'+Math.round(v*255).toString(16)).slice(-2);}).join('');}
  for(var k=0;GRADES.length<NPCS.length;k++){
    var h=(k*47+20)%360;
    GRADES.push({name:more[k%more.length]+(k>=more.length?' '+(Math.floor(k/more.length)+1):''),c:[hx(h,70,10),hx(h,85,45),hx(h,100,86)],m:hx(h,95,60),rainbow:(k%6===5)?1:0});
  }
})();
ITEM_COLORS=NPCS.map(function(_,i){return GRADES[i%GRADES.length].m;});
function gradeOf(i){return GRADES[i%GRADES.length];}
var TREADS=[
  {name:'일반',   gain:1,     price:100,         color:'#78909c'},
  {name:'희귀',   gain:3,     price:500,         color:'#43a047'},
  {name:'레어',   gain:8,     price:2500,        color:'#1e88e5'},
  {name:'에픽',   gain:20,    price:12000,       color:'#8e24aa'},
  {name:'전설',   gain:50,    price:60000,       color:'#fb8c00'},
  {name:'신화',   gain:130,   price:300000,      color:'#e53935'},
  {name:'코스믹', gain:340,   price:1500000,     color:'#5c6bc0'},
  {name:'시크릿', gain:900,   price:8000000,     color:'#37474f'},
  {name:'영원한', gain:2300,  price:40000000,    color:'#26c6da'},
  {name:'신성',   gain:6000,  price:200000000,   color:'#ffd54a'},
  {name:'타이탄', gain:15000, price:1000000000,  color:'#ff1744'}
];
var SPEED_MIN=8, SPEED_MAX=30000;
var STEP_SPEED=1; /* 한 걸음 걸을 때마다 오르는 속도 */
var PRICE_GROWTH=1.3;
var RESPAWN=15, STUN=2, CHARGE=0.9;
var SAVE_KEY='balondor-steal-v2';

/* =========================================================
   유틸
   ========================================================= */
var fxLevel=1,fxMul=1;
var isTouch=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
if(isTouch)document.body.classList.add('touch');
/* 📱 휴대폰은 항상 가로 화면: 세로로 들고 있으면 화면 전체를 90° 돌려서 보여줘요 */
var isPhone=isTouch&&Math.min(screen.width||9999,screen.height||9999)<=600,ROT=false;
function VW(){return ROT?innerHeight:innerWidth;}
function VH(){return ROT?innerWidth:innerHeight;}
function ptX(e){return ROT?e.clientY:e.clientX;}
function ptY(e){return ROT?innerWidth-e.clientX:e.clientY;}
function $(id){return document.getElementById(id);}
function rand(a,b){return a+Math.random()*(b-a);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function realSpeed(v){return 5+6.5*Math.log10(Math.max(1,v));}
function lerpAngle(a,b,t){var d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;}
function fmt(n){
  n=Math.floor(n);
  if(n<10000)return n.toLocaleString('en-US');
  var u=[['T',1e12],['B',1e9],['M',1e6],['K',1e3]];
  for(var i=0;i<u.length;i++){
    if(n>=u[i][1]){var x=n/u[i][1];return (x>=100?x.toFixed(0):x>=10?x.toFixed(1):x.toFixed(2))+u[i][0];}
  }
  return String(n);
}
var N=NPCS.length;
/* 원래 18명은 그대로, 새 수호자(19번째~)는 그 뒤로 점점 빨라지고 수입도 커져요 */
var BASE_NPCS=18;
NPCS.forEach(function(n,i){
  var bi=Math.min(i,BASE_NPCS-1),ex=Math.max(0,i-(BASE_NPCS-1));
  n.speed=Math.round(SPEED_MIN*Math.pow(SPEED_MAX/SPEED_MIN,bi/(BASE_NPCS-1))*Math.pow(1.3,ex));
  n.income=Math.round(2*Math.pow(10000,bi/(BASE_NPCS-1))*Math.pow(1.35,ex));
  n.z=90+i*60;
  n.side=(i%2)?1:-1;
  n.x=n.side*19;
  n.move=realSpeed(n.speed);
});

/* =========================================================
   저장 / 불러오기
   ========================================================= */
var OFFLINE=0;var G={owned:[0,0,0],skin:-1,streak:0,money:0,speed:10,qty:TREADS.map(function(){return 0;}),counts:NPCS.map(function(){return 0;})};
var noSave=false,modalOpen=false;
function save(){
  if(noSave)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({t:Date.now(),money:G.money,speed:G.speed,qty:G.qty,counts:G.counts,owned:G.owned,skin:G.skin,x:G.x}));}catch(e){}
}
function load(){
  try{
    var s=localStorage.getItem(SAVE_KEY);
    if(!s)return false;
    var d=JSON.parse(s);
    if(typeof d.money==='number'&&isFinite(d.money))G.money=d.money;
    if(typeof d.speed==='number'&&isFinite(d.speed))G.speed=Math.max(10,d.speed);
    if(Array.isArray(d.qty))G.qty=TREADS.map(function(_,i){return Math.max(0,d.qty[i]|0);});
    if(Array.isArray(d.owned))G.owned=[0,1,2].map(function(i){return d.owned[i]?1:0;});
    if(typeof d.skin==='number'&&d.skin>=-1&&d.skin<3&&(d.skin<0||G.owned[d.skin]))G.skin=d.skin;
    if(Array.isArray(d.counts))G.counts=NPCS.map(function(_,i){return Math.max(0,d.counts[i]|0);});
    if(typeof d.t==='number'){var offS=clamp((Date.now()-d.t)/1000,0,28800);OFFLINE=Math.floor(income()*offS*0.25);G.money+=OFFLINE;}
    return true;
  }catch(e){return false;}
}
var hadSave=load();
if(hadSave){$('saveInfo').textContent=(OFFLINE>0?'🌙 오프라인 수입 +'+fmt(OFFLINE)+' · ':'')+'💾 저장된 진행: 돈 '+fmt(G.money)+' · 속도 '+fmt(G.speed)+' · 수집 '+G.counts.filter(function(c){return c>0;}).length+'/'+N;}
$('resetBtn').addEventListener('click',function(){
  noSave=true;
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  location.reload();
});

/* ---------- 백업 슬롯 (최대 3개) ---------- */
var BK_N=3,bkArmed={};
function bkKey(i){return SAVE_KEY+'-bk'+(i+1);}
function bkRead(i){try{var s=localStorage.getItem(bkKey(i));return s?JSON.parse(s):null;}catch(e){return null;}}
function bkMsg(t,bad){var e=$('bkMsg');e.textContent=t;e.style.color=bad?'#ff8a80':'#b9f6ca';}
function bkSnap(){return {at:Date.now(),money:G.money,speed:G.speed,qty:G.qty.slice(),counts:G.counts.slice(),owned:G.owned.slice(),skin:G.skin};}
function bkInfo(d){
  var n=0;if(Array.isArray(d.counts))for(var i=0;i<d.counts.length;i++)if(d.counts[i]>0)n++;
  var dt=new Date(d.at||0),ts=dt.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return '돈 '+fmt(d.money||0)+' · 속도 '+fmt(d.speed||10)+' · 수집 '+n+'/'+N+' · '+ts;
}
function bkRender(){
  var h='';
  for(var i=0;i<BK_N;i++){
    var d=bkRead(i),a=function(k){return bkArmed[k]&&bkArmed[k]>Date.now();};
    h+='<div class="bkSlot"><div class="bkInfo"><b>슬롯 '+(i+1)+'</b><small'+(d?'':' class="empty"')+'>'+(d?bkInfo(d):'비어 있음')+'</small></div><div class="bkBtns">'
      +'<button data-a="save" data-i="'+i+'"'+(a('save'+i)?' class="arm"':'')+'>'+(a('save'+i)?'덮어쓸까요?':'💾 저장')+'</button>'
      +'<button data-a="load" data-i="'+i+'"'+(d?'':' disabled')+(a('load'+i)?' class="arm"':'')+'>'+(a('load'+i)?'정말?':'📂 불러오기')+'</button>'
      +'<button data-a="del" data-i="'+i+'"'+(d?'':' disabled')+(a('del'+i)?' class="arm"':'')+'>'+(a('del'+i)?'정말?':'🗑')+'</button>'
      +'</div></div>';
  }
  $('bkList').innerHTML=h;
}
function bkArm(k,msg){
  if(bkArmed[k]&&bkArmed[k]>Date.now()){bkArmed[k]=0;return true;}
  bkArmed[k]=Date.now()+3000;bkMsg(msg,true);bkRender();
  setTimeout(function(){if(modalOpen)bkRender();},3100);
  return false;
}
function bkOpen(){
  modalOpen=true;keys={};joy.x=joy.y=0;bkArmed={};
  $('bkModal').style.display='flex';bkMsg('');bkRender();
}
function bkClose(){modalOpen=false;$('bkModal').style.display='none';}
$('bkBtn').addEventListener('click',function(){this.blur();bkOpen();});
$('bkOpen2').addEventListener('click',bkOpen);
$('bkClose').addEventListener('click',bkClose);
$('bkModal').addEventListener('click',function(e){if(e.target===this)bkClose();});
$('bkList').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b||b.disabled)return;
  var a=b.getAttribute('data-a'),i=+b.getAttribute('data-i'),d=bkRead(i);
  if(a==='save'){
    if(d&&!bkArm('save'+i,'슬롯 '+(i+1)+'의 기존 백업을 덮어써요. 한 번 더 누르면 저장!'))return;
    try{localStorage.setItem(bkKey(i),JSON.stringify(bkSnap()));save();bkMsg('✅ 슬롯 '+(i+1)+'에 저장했어요!');}
    catch(err){bkMsg('저장에 실패했어요 (브라우저 저장 공간을 확인하세요)',true);}
    bkRender();
  }else if(a==='load'&&d){
    if(!bkArm('load'+i,'⚠️ 현재 진행이 이 백업으로 바뀌어요. 한 번 더 누르면 불러오기!'))return;
    try{
      noSave=true;
      localStorage.setItem(SAVE_KEY,JSON.stringify({t:Date.now(),money:d.money,speed:d.speed,qty:d.qty,counts:d.counts,owned:d.owned,skin:d.skin}));
      bkMsg('📂 불러오는 중...');location.reload();
    }catch(err){noSave=false;bkMsg('불러오기에 실패했어요',true);}
  }else if(a==='del'&&d){
    if(!bkArm('del'+i,'슬롯 '+(i+1)+' 백업을 삭제해요. 한 번 더 누르면 삭제!'))return;
    try{localStorage.removeItem(bkKey(i));bkMsg('🗑 슬롯 '+(i+1)+'을 삭제했어요');}catch(err){}
    bkRender();
  }
});
function income(){var s=0;for(var i=0;i<N;i++)s+=G.counts[i]*NPCS[i].income;return s;}

/* =========================================================
   👥 멀티플레이 (PeerJS · 방 코드)
   - 방장이 월드(받침대·NPC·던전·보스)를 계산해서 친구들에게 보내요
   - 친구들은 자기 캐릭터 위치를 방장에게 보내고, 화면을 그대로 그려요
   - 돈·속도·러닝머신·수집품은 각자 자기 브라우저에 저장돼요
   ========================================================= */
var NET={mode:'solo',via:'',ws:null,peer:null,conns:{},host:null,my:'me',code:'',name:'',tick:0,joinTO:0};
var REM={};
var PEER_PREFIX='steal-a-roh-v1-',MAX_PLAYERS=4,NET_HZ=15; /* 기지 칸 수(4)와 같게: 한 사람당 기지 하나 */
/* 친구가 다른 통신사/회사 와이파이라서 연결이 안 되면 TURN 서버를 여기에 추가하세요 (README 참고) */
var ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
function isClient(){return NET.mode==='client';}
function hostSide(){return NET.mode!=='client';}
function r1(v){return Math.round(v*10)/10;}
function r2(v){return Math.round(v*100)/100;}
function r3(v){return Math.round(v*1000)/1000;}
function sendHost(m){if(NET.host&&NET.host.open){try{NET.host.send(m);}catch(e){}}}
function bcast(m){if(NET.mode!=='host')return;if(NET.via==='ws'){if(NET.ws&&Object.keys(NET.conns).length)wsSend(NET.ws,{op:'bc',m:m});return;}for(var id in NET.conns){var c=NET.conns[id];if(c.open){try{c.send(m);}catch(e){}}}}
function sendTo(id,m){var c=NET.conns[id];if(c&&c.open){try{c.send(m);}catch(e){}}}
/* 아무 플레이어에게 보내기 (친구 → 방장이 대신 전달) */
function sendPeer(to,m){
  if(!to)return;
  if(NET.mode==='host'){m.from=NET.my;sendTo(to,m);}
  else if(NET.mode==='client'){m.to=to;sendHost(m);}
}
/* ---------- 채팅 ---------- */
function cleanChat(x){return String(x||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,60);}
function showChat(name,text,mine){
  var log=document.getElementById('chatLog');if(!log)return;
  var d=document.createElement('div');d.className='chatLine'+(mine?' me':'');
  var b=document.createElement('b');b.textContent=name+': ';d.appendChild(b);d.appendChild(document.createTextNode(text));
  log.appendChild(d);while(log.children.length>8)log.removeChild(log.firstChild);
  setTimeout(function(){d.classList.add('old');},12000);
  if(!mine&&typeof sfx!=='undefined'&&AC)tone(880,0.06,'sine',0.05);
}
var chatLast=0;
function sendChat(x){
  x=cleanChat(x);if(!x||NET.mode==='solo')return;
  var now=performance.now();if(now-chatLast<700){toast('채팅은 천천히!','warn');return;}chatLast=now;
  showChat(NET.name||'나',x,true);
  if(NET.mode==='host')bcast({t:'chat',id:NET.my,n:NET.name,x:x});else sendHost({t:'chat',x:x});
}
function chatOpen(){
  if(NET.mode==='solo'){toast('채팅은 멀티 방에서만 돼요','warn');return;}
  var box=document.getElementById('chatBox'),inp=document.getElementById('chatIn');
  box.classList.add('open');keys={};joy.x=joy.y=0;inp.value='';inp.focus();
}
function chatClose(){var box=document.getElementById('chatBox'),inp=document.getElementById('chatIn');box.classList.remove('open');inp.blur();}
/* NPC가 쫓는 '운반 중' 판정: 친구 기지에서 훔친 건 NPC와 상관없음 */
function npcCarry(){return P.raid?-1:P.carry;}
function peerCount(){var n=1;for(var id in REM)n++;return n;}
function tgtObj(id){if(!id)return null;if(id===NET.my)return P;var r=REM[id];return r&&r.init?r:null;}
function tgtCarry(id){if(id===NET.my)return npcCarry();var r=REM[id];return r?r.carry:-1;}
function genCode(){var a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',s='';for(var i=0;i<5;i++)s+=a[(Math.random()*a.length)|0];return s;}
function errText(e){
  var t=e&&e.type;
  if(t==='peer-unavailable')return '방을 찾지 못했어요. 코드를 다시 확인하세요';
  if(t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed')return '연결 서버에 접속하지 못했어요 (인터넷 확인)';
  if(t==='browser-incompatible')return '이 브라우저는 지원하지 않아요 (크롬/사파리 최신 버전 사용)';
  return '연결 오류 ('+(t||e)+')';
}
function newPeer(id){return id?new Peer(id,{debug:0,config:{iceServers:ICE}}):new Peer({debug:0,config:{iceServers:ICE}});}

/* ---------- 방 만들기 (방장) ---------- */
function netHost(cb,tries){
  if(!window.Peer){cb('멀티플레이 모듈(PeerJS)을 불러오지 못했어요. 인터넷 연결을 확인하세요');return;}
  tries=tries||0;
  var code=genCode(),peer=newPeer(PEER_PREFIX+code),opened=false;
  peer.on('open',function(id){opened=true;NET.mode='host';NET.via='peer';NET.peer=peer;NET.my=id;NET.code=code;cb(null,code);});
  peer.on('connection',hostAttach);
  var to=setTimeout(function(){if(!opened){opened=true;try{peer.destroy();}catch(_){}cb('연결 서버(PeerJS)에 접속하지 못했어요. 학교·회사 인터넷에서 막혔을 수 있어요');}},9000);
  peer.on('open',function(){clearTimeout(to);});
  peer.on('error',function(e){
    if(!opened){
      opened=true;clearTimeout(to);
      try{peer.destroy();}catch(_){}
      if(e.type==='unavailable-id'&&tries<4){netHost(cb,tries+1);return;}
      cb(errText(e));
    }
  });
  peer.on('disconnected',function(){if(NET.mode==='host'){try{peer.reconnect();}catch(_){}}});
}
/* 방장: 새로 온 친구에게 기지 칸 정해주기 (빈 칸 먼저 · 다 차면 사람이 제일 적은 칸) */
function pickSlot(){
  var cnt=SLOT_X.map(function(){return 0;});cnt[mySlot]++;
  for(var id in REM){var s=REM[id].slot;if(s>=0&&s<SLOT_N)cnt[s]++;}
  var best=-1;SLOT_ORDER.forEach(function(s){if(best<0||cnt[s]<cnt[best])best=s;});
  return best;
}
/* 방장: 친구 연결 하나를 등록 (PeerJS든 코드 연결이든 같은 방식) */
function hostAttach(c){
  c.on('open',function(){
    if(peerCount()>=MAX_PLAYERS){try{c.send({t:'full'});}catch(e){}setTimeout(function(){try{c.close();}catch(e){}},400);return;}
    NET.conns[c.peer]=c;var r=getRem(c.peer);r.slot=pickSlot();
    c.send({t:'hello',id:c.peer,host:NET.my,slot:r.slot});
    /* 새 친구에게 지금 있는 사람들의 기지(수집 현황)를 바로 보내줘요 */
    c.send({t:'bs',id:NET.my,c:G.counts.slice(),q:G.qty.slice()});
    for(var oid in REM)if(oid!==c.peer&&REM[oid].bc)c.send({t:'bs',id:oid,c:REM[oid].bc,q:REM[oid].bq||[]});
  });
  c.on('data',function(m){if(m&&typeof m==='object')onHostMsg(c.peer,m);});
  c.on('close',function(){dropPeer(c.peer);});
  c.on('error',function(){dropPeer(c.peer);});
}
/* ---------- 방 참가 (친구) ---------- */
function netJoin(code,cb){
  if(!window.Peer){cb('멀티플레이 모듈(PeerJS)을 불러오지 못했어요. 인터넷 연결을 확인하세요');return;}
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length!==5){cb('방 코드 5자리를 입력하세요');return;}
  var peer=newPeer(),done=false;
  function fail(msg){if(done)return;done=true;clearTimeout(NET.joinTO);try{peer.destroy();}catch(_){}cb(msg);}
  NET.joinTO=setTimeout(function(){fail('방에 연결하지 못했어요. 코드 확인 · 방장이 게임 중인지 확인하세요');},15000);
  peer.on('open',function(id){
    var c=peer.connect(PEER_PREFIX+code,{reliable:true,serialization:'json'});
    c.on('data',function(m){
      if(!m||typeof m!=='object')return;
      if(m.t==='hello'&&!done){
        done=true;clearTimeout(NET.joinTO);
        NET.mode='client';NET.via='peer';NET.peer=peer;NET.host=c;NET.my=id;NET.code=code;NET.hostId=m.host;NET.slot0=m.slot;
        cb(null,code);return;
      }
      if(m.t==='full'){fail('방이 꽉 찼어요 (최대 '+MAX_PLAYERS+'명)');return;}
      if(NET.mode==='client')onClientMsg(m);
    });
    c.on('close',function(){if(NET.mode==='client'&&NET.host===c)hostLost();});
    c.on('error',function(){if(NET.mode==='client'&&NET.host===c)hostLost();});
  });
  peer.on('error',function(e){if(!done)fail(errText(e));else if(NET.mode==='client'&&e.type!=='peer-unavailable'){}});
}
function leaveRoom(){
  var p=NET.peer;
  if(NET.mode==='client'){try{NET.host.close();}catch(_){}hostLost(true);}
  else if(NET.mode==='host'){
    for(var id in NET.conns){try{NET.conns[id].close();}catch(_){}}
    NET.conns={};for(var rid in REM)dropPeer(rid);
    if(NET.ws){var w=NET.ws;NET.ws=null;try{w.close();}catch(_){}}
    NET.mode='solo';NET.via='';NET.code='';netUI();toast('📴 방을 닫았어요 · 혼자 모드','warn');
  }
  if(p){try{p.destroy();}catch(_){}}NET.peer=null;
}
/* =========================================================
   🛰️ 중계 서버 연결 (server.js) — 학교처럼 직접 연결이 막힌 곳용
   모두가 서버 하나에 https(wss)로 접속하고, 서버가 방장 ↔ 친구 메시지를 전달해요.
   게임을 server.js로 열었다면 자동으로 이 방식을 써요.
   ========================================================= */
var SERVER_URL=''; /* 게임은 다른 곳(Netlify 등)에, 서버는 따로 올렸다면 여기에: 'wss://내서버.onrender.com/ws' */
function wsURL(){
  var q=/[?&]server=([^&]+)/.exec(location.search);if(q)return decodeURIComponent(q[1]);
  if(SERVER_URL)return SERVER_URL;
  if(location.protocol==='http:'||location.protocol==='https:')return (location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  return null;
}
function SConn(id){this.peer=id;this.open=false;this._h={};}
SConn.prototype.on=function(e,f){(this._h[e]=this._h[e]||[]).push(f);return this;};
SConn.prototype.emit=function(e,a){(this._h[e]||[]).forEach(function(f){try{f(a);}catch(err){console.error(err);}});};
function wsSend(ws,o){if(ws&&ws.readyState===1){try{ws.send(JSON.stringify(o));}catch(e){}}}
function wsOpen(url,cb){
  var ws;try{ws=new WebSocket(url);}catch(e){cb('bad');return;}
  var done=false,to=setTimeout(function(){if(done)return;done=true;try{ws.close();}catch(e){}cb('timeout');},30000);
  ws.onopen=function(){if(done)return;done=true;clearTimeout(to);cb(null,ws);};
  ws.onerror=function(){if(done)return;done=true;clearTimeout(to);cb('error');};
}
function wsParse(ev){try{return JSON.parse(ev.data);}catch(e){return null;}}
function wsHost(cb){
  var url=wsURL();if(!url){cb('noserver');return;}
  wsOpen(url,function(err,ws){
    if(err){cb(err);return;}
    var ok=false,conns={};
    ws.onmessage=function(ev){
      var m=wsParse(ev),c;if(!m)return;
      if(m.op==='hosted'&&!ok){ok=true;NET.mode='host';NET.via='ws';NET.ws=ws;NET.peer=null;NET.my=m.id;NET.code=m.code;cb(null,m.code);}
      else if(m.op==='err'&&!ok){ok=true;try{ws.close();}catch(e){}cb(m.msg);}
      else if(m.op==='peer'){
        c=new SConn(m.id);
        c.send=function(x){wsSend(ws,{op:'to',id:this.peer,m:x});};
        c.close=function(){wsSend(ws,{op:'kick',id:this.peer});};
        conns[m.id]=c;hostAttach(c);c.open=true;c.emit('open');
      }
      else if(m.op==='m'){c=conns[m.from];if(c&&m.m&&typeof m.m==='object')c.emit('data',m.m);}
      else if(m.op==='left'){c=conns[m.id];if(c){delete conns[m.id];c.open=false;c.emit('close');}}
    };
    ws.onclose=function(){
      if(!ok){ok=true;cb('closed');return;}
      if(NET.ws!==ws)return;
      NET.ws=null;
      for(var id in conns){conns[id].open=false;conns[id].emit('close');}
      if(NET.mode==='host'){NET.mode='solo';NET.via='';NET.code='';toast('📴 서버 연결이 끊겼어요 · 혼자 모드로 계속해요','warn');netUI();}
    };
    wsSend(ws,{op:'host'});
  });
}
function wsJoin(code,cb){
  var url=wsURL();if(!url){cb('noserver');return;}
  wsOpen(url,function(err,ws){
    if(err){cb(err);return;}
    var ok=false,conn=new SConn('host');
    conn.send=function(x){wsSend(ws,{op:'up',m:x});};
    conn.close=function(){try{ws.close();}catch(e){}};
    ws.onmessage=function(ev){
      var m=wsParse(ev);if(!m)return;
      if(m.op==='err'&&!ok){ok=true;try{ws.close();}catch(e){}cb(m.msg,true);return;}
      if(m.op!=='m'||!m.m||typeof m.m!=='object')return;
      var d=m.m;
      if(d.t==='hello'&&!ok){
        ok=true;conn.open=true;
        NET.mode='client';NET.via='ws';NET.ws=ws;NET.peer=null;NET.host=conn;NET.my=d.id;NET.code=code;NET.hostId=d.host;NET.slot0=d.slot;
        cb(null,code);return;
      }
      if(d.t==='full'&&!ok){ok=true;try{ws.close();}catch(e){}cb('방이 꽉 찼어요 (최대 '+MAX_PLAYERS+'명)',true);return;}
      if(NET.mode==='client'&&NET.host===conn)onClientMsg(d);
    };
    ws.onclose=function(){
      conn.open=false;
      if(!ok){ok=true;cb('closed');return;}
      if(NET.mode==='client'&&NET.host===conn)hostLost();
    };
    wsSend(ws,{op:'join',code:code});
  });
}
/* 서버 먼저 → 안 되면 PeerJS */
function netHostAny(cb,status){
  if(!wsURL()){netHost(cb);return;}
  status('📡 서버에 연결하는 중... (무료 서버는 깨어나는 데 30초쯤 걸릴 수 있어요)');
  wsHost(function(err,code){
    if(!err){cb(null,code);return;}
    status('📡 서버 연결 실패 → 다른 방법(PeerJS)으로 시도 중...');
    netHost(cb);
  });
}
function netJoinAny(code,cb,status){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length!==5){cb('방 코드 5자리를 입력하세요');return;}
  if(!wsURL()){netJoin(code,cb);return;}
  status('📡 서버에 연결하는 중... (무료 서버는 깨어나는 데 30초쯤 걸릴 수 있어요)');
  wsJoin(code,function(err,code2,definite){
    if(!err){cb(null,code2);return;}
    if(definite){cb(err);return;}
    var wsMsg=typeof err==='string'&&err.length>12?err:null;
    status('📡 다른 방법(PeerJS)으로도 찾아보는 중...');
    netJoin(code,function(err2,c3){
      if(!err2){cb(null,c3);return;}
      cb(wsMsg||err2);
    });
  });
}
/* 무료 서버는 잠들어 있을 수 있어서, 시작 화면이 뜨면 미리 깨워둬요 */
(function(){
  var u=wsURL();if(!u||!window.fetch)return;
  try{fetch(u.replace(/^ws/,'http').replace(/\/ws(\?.*)?$/,'/health'),{cache:'no-store'}).catch(function(){});}catch(e){}
})();
/* 방장 연결 끊김 → 혼자 모드로 이어서 */
function hostLost(byMe){
  if(NET.mode!=='client')return;
  NET.mode='solo';NET.via='';NET.host=null;NET.code='';
  if(NET.ws){var w=NET.ws;NET.ws=null;try{w.close();}catch(_){}}
  for(var id in REM)removeRem(id);
  npcs.forEach(function(n){
    n.nx=undefined;
    if(n.tg!==NET.my&&n.state!=='sleep'){n.state='return';n.tg=null;}
    if(n.tg===NET.my&&npcCarry()!==n.i){n.state='return';n.tg=null;}
    if(npcCarry()===n.i)n.carrier=NET.my;else n.carrier=null;
  });
  /* 친구 기지에서 훔치던 중이면 주인에게 돌아가요 */
  if(P.raid){P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});}
  if(DG.on)exitDungeon(false);
  dgWorldReset();DG.act=false;
  setMySlot(SLOT_ORDER[0]);refreshBases(true);
  toast(byMe?'📴 방에서 나왔어요 · 혼자 모드':'📴 방장과 연결이 끊겼어요 · 혼자 모드로 계속해요','warn');
  netUI();
}
/* 방장: 친구가 나감 */
function dropPeer(id){
  if(!REM[id]&&!NET.conns[id])return;
  var r=REM[id],nm=r?r.name:'친구';
  delete NET.conns[id];
  npcs.forEach(function(n){
    if(n.carrier===id){n.carrier=null;if(!n.ped.has){n.ped.has=true;n.ped.pop=0;}}
    if(n.tg===id){n.state='return';n.tg=null;hideAim(n);}
  });
  if(r&&r.announced)toast('👋 '+nm+' 님이 나갔어요','warn');
  removeRem(id);dgWorldCheckEnd();netUI();
}

/* ---------- 메시지 처리 ---------- */
function onHostMsg(id,m){
  var r=REM[id];if(!r)return;
  switch(m.t){
    case 'st':applyState(r,m,true);break;
    case 'steal':hostSteal(id,m.i|0,function(ok,msg){sendTo(id,{t:'stealR',i:m.i|0,ok:ok,msg:msg||''});});break;
    case 'drop':hostDrop(id,m.i|0);break;
    case 'dep':hostDep(id,m.i|0);break;
    case 'atk':if(r.dg&&DG.act)dgHitAt(+m.x||0,+m.z||0,clamp(+m.d||0,0,1e30),clamp(+m.r||9,1,40),clamp(+m.bm||1,1,20),clamp(+m.ex||0,0,0.5),clamp(+m.bx||0,0,0.5),r.id);break;
    case 'bs':r.bc=nArr(m.c,N);r.bq=nArr(m.q,TREADS.length);bcast({t:'bs',id:id,c:r.bc,q:r.bq});break;
    case 'snat':hostSnatch(id,m.i|0);break;
    case 'chat':
      var cx=cleanChat(m.x);if(!cx)break;
      showChat(r.name||'친구',cx,false);bcast({t:'chat',id:id,n:r.name||'친구',x:cx});break;
    case 'raid':case 'raidR':case 'raidBack':case 'raidDone':case 'snatch':case 'snatchR':case 'raidXfer':
      m.from=id;
      if(m.to===NET.my)onRaidMsg(m);else if(REM[m.to]&&NET.conns[m.to])sendTo(m.to,m);
      break;
  }
}
function onClientMsg(m){
  var n;
  switch(m.t){
    case 'snap':applySnap(m);break;
    case 'stealR':
      stealPend=0;
      if(m.ok)grantSteal(m.i);else{toast(m.msg||'훔치기 실패','warn');sfx.deny();}
      break;
    case 'cast':
      n=npcs[m.i];if(!n)break;
      n.ch.root.position.x=m.rx;n.ch.root.position.z=m.rz;n.tg=m.tg;
      runCast(n,m.a,{x:m.qx,z:m.qz},tgtObj(m.tg)||P);break;
    case 'pr':addDgProj(m.x,m.y,m.z,m.vx,m.vz,m.d,m.c,m.s,m.l,m.b);break;
    case 'rip':applyRip(m.l||[],m.w);break;
    case 'zn':addZone(+m.x||0,+m.z||0,clamp(+m.r||5,1,200),clamp(+m.dl||0,0,5),m.k==='w'?'w':'c',clamp(+m.sp||0,0,80));break;
    case 'tiles':applyTiles(m.s||[]);if(DG.on&&DG.spawnT>0&&tileAt().st!==0)dgSafeSpawn();break;
    case 'mobK':
      for(var i=0;i<DG.mobs.length;i++)if(DG.mobs[i].id===m.id){scene.remove(DG.mobs[i].g);DG.mobs.splice(i,1);break;}
      mobDeadFx(m.x,m.z,m.c);break;
    case 'bossK':
      var kv=DG.boss?DG.boss.v:(m.v|0);
      if(DG.boss){scene.remove(DG.boss.g);DG.boss=null;}
      bossDeadFx(m.x,m.z,m.mvp,m.lh,kv,m.n|0);break;
    case 'dgt':if(DG.on)toast(m.m,m.c);break;
    case 'dgst':dgStageReward(m.s|0,!!m.b);break;
    case 'bs':
      if(!m.id||m.id===NET.my)break;
      n=getRem(m.id);n.bc=nArr(m.c,N);n.bq=nArr(m.q,TREADS.length);break;
    case 'raid':case 'raidR':case 'raidBack':case 'raidDone':case 'snatch':case 'snatchR':case 'raidXfer':onRaidMsg(m);break;
    case 'chat':if(m.id!==NET.my){var cy=cleanChat(m.x);if(cy)showChat(String(m.n||'친구').slice(0,10),cy,false);}break;
  }
}
/* 플레이어 위치 정보 반영 (부드럽게 따라가기) */
function applyState(r,m,fromHostView){
  var now=performance.now();
  if(r.lt){var d=(now-r.lt)/1000;if(d>0.02){r.vx+=((m.x-r.lx)/d-r.vx)*0.5;r.vz+=((m.z-r.lz)/d-r.vz)*0.5;}}
  r.lx=m.x;r.lz=m.z;r.lt=now;
  r.dd=Math.max(0,+m.dd||0);if(m.ti!==undefined)r.ti=String(m.ti||'').slice(0,24);if(m.au!==undefined)r.au=String(m.au||'').slice(0,16);r.tx=+m.x||0;r.ty=+m.y||0;r.tz=+m.z||0;r.f=+m.f||0;r.vc=m.c|0;r.stun=m.s?1:0;r.skin=(m.k|0);r.mv=m.m?1:0;
  if(r.skin!==99&&(r.skin<-1||r.skin>2))r.skin=-1; /* 99 = 크리스마스 산타 */
  if(m.n!==undefined)r.name=String(m.n||'친구').slice(0,10);
  if(!r.init){r.x=r.tx;r.y=r.ty;r.z=r.tz;r.init=1;}
  if(!r.announced&&r.name){r.announced=1;toast('👋 '+r.name+' 님이 들어왔어요!','good');netUI();}
  var d2=m.d?1:0;
  if(fromHostView&&d2!==r.dg){
    r.dg=d2;
    if(d2){dgWorldJoin(m.df);sendTo(r.id,{t:'tiles',s:tileState()});}
    else dgWorldCheckEnd();
  }else r.dg=d2;
}
var ST_CODE={sleep:0,chase:1,charge:2,'return':3},ST_NAME=['sleep','chase','charge','return'];
function netSendState(){
  if(NET.mode!=='client')return;
  sendHost({t:'st',x:r2(P.x),y:r2(P.y),z:r2(P.z),f:r2(P.face),c:P.carry,s:P.stun>0?1:0,k:netSkin(),d:DG.on?1:0,df:DG.myDf,dd:DG.on?dgDmg():0,ti:curTitle()?curTitle().ti:'',au:G.x.au,m:P.mv?1:0,n:NET.name});
}
function buildSnap(){
  var pl=[[NET.my,NET.name,r2(P.x),r2(P.y),r2(P.z),r2(P.face),P.carry,P.stun>0?1:0,netSkin(),DG.on?1:0,P.mv?1:0,mySlot,curTitle()?curTitle().ti:'',G.x.au]];
  for(var id in REM){var r=REM[id];if(r.init)pl.push([id,r.name,r2(r.tx),r2(r.ty),r2(r.tz),r.f,r.vc,r.stun,r.skin,r.dg,r.mv,r.slot,r.ti||'',r.au||'']);}
  var np=npcs.map(function(n){var p=n.ch.root.position;return [r1(p.x),r1(p.z),ST_CODE[n.state],n.tg||0,n.ped.has?1:0];});
  var dg=0;
  if(DG.act){
    dg={df:DG.df,q:DG.q.length,w:DG.wave,m:DG.mobs.map(function(o){return [o.id,o.t,r1(o.g.position.x),r1(o.g.position.z),o.hp,o.max];}),b:0};
    var b=DG.boss;if(b)dg.b=[r1(b.g.position.x),r1(b.g.position.z),Math.round(b.hp),b.max,b.rage,b.dash>0?1:0,b.wind>0?1:0,b.flash>0?1:0,b.v];
  }
  return {t:'snap',pl:pl,np:np,dg:dg};
}
function applySnap(m){
  var seen={};
  (m.pl||[]).forEach(function(a){
    var id=a[0];
    if(id===NET.my){if(typeof a[11]==='number'&&a[11]!==mySlot)setMySlot(a[11]);return;}
    seen[id]=1;
    var r=getRem(id);r.slot=typeof a[11]==='number'?a[11]:-1;r.ti=String(a[12]||'').slice(0,24);r.au=String(a[13]||'').slice(0,16);
    applyState(r,{x:a[2],y:a[3],z:a[4],f:a[5],c:a[6],s:a[7],k:a[8],d:a[9],m:a[10],n:a[1]},false);
  });
  for(var rid in REM)if(!seen[rid]){if(REM[rid].announced)toast('👋 '+REM[rid].name+' 님이 나갔어요','warn');removeRem(rid);netUI();}
  (m.np||[]).forEach(function(a,i){
    var n=npcs[i];if(!n)return;
    n.nx=a[0];n.nz=a[1];n.state=ST_NAME[a[2]]||'sleep';n.tg=a[3]||null;
    var has=!!a[4];
    if(has&&!n.ped.has){n.ped.pop=0;burst(n.ped.x,3,n.ped.z,ITEM_COLORS[i],10,5);}
    n.ped.has=has;
  });
  var dg=m.dg;
  if(dg){
    DG.act=true;DG.wave=dg.w;DG.qn=dg.q|0;if(dgDfOk(dg.df))DG.df=dg.df;
    var ids={};
    dg.m.forEach(function(a){
      ids[a[0]]=1;var o=null;
      for(var i=0;i<DG.mobs.length;i++)if(DG.mobs[i].id===a[0]){o=DG.mobs[i];break;}
      if(!o){o=mkMob(a[1],a[2],a[3],a[0]);burst(a[2],2,a[3],'#b36bff',8,5);}
      o.nx=a[2];o.nz=a[3];o.hp=a[4];o.max=a[5];
    });
    for(var j=DG.mobs.length-1;j>=0;j--)if(!ids[DG.mobs[j].id]){scene.remove(DG.mobs[j].g);DG.mobs.splice(j,1);}
    if(dg.b){
      var b=DG.boss;
      if(!b){b=DG.boss=makeBossVis(dg.b[0],dg.b[1],dg.b[8]|0);fxBoom(dg.b[0],dg.b[1],16,'#b36bff',0.8);if(DG.on){shk=3;flashA=0.5;}}
      b.nx=dg.b[0];b.nz=dg.b[1];b.hp=dg.b[2];b.max=dg.b[3];b.rage=dg.b[4];b.dash=dg.b[5]?0.1:0;b.wind=dg.b[6]?0.1:0;if(dg.b[7])b.flash=0.1;
    }else if(DG.boss){scene.remove(DG.boss.g);DG.boss=null;}
  }else if(DG.act){dgWorldReset();DG.act=false;}
}
/* 내 기지(수집 현황·러닝머신) 정보를 친구들에게: 바뀌면 바로, 아니어도 4초마다 */
var bsT=0,bsKey='';
function netBaseTick(dt){
  bsT+=dt;
  var k=G.counts.join(',')+'|'+G.qty.join(',');
  if(k===bsKey&&bsT<4)return;
  bsKey=k;bsT=0;
  var m={t:'bs',c:G.counts.slice(),q:G.qty.slice()};
  if(NET.mode==='client')sendHost(m);
  else if(Object.keys(NET.conns).length){m.id=NET.my;bcast(m);}
}
function netTick(dt){
  if(NET.mode==='solo')return;
  netBaseTick(dt);
  NET.tick+=dt;
  if(NET.tick<1/NET_HZ)return;
  NET.tick=0;
  if(NET.mode==='client')netSendState();
  else if(Object.keys(NET.conns).length)bcast(buildSnap());
}

/* ---------- 친구 캐릭터 그리기 ---------- */
function getRem(id){
  var r=REM[id];if(r)return r;
  r=REM[id]={id:id,name:'',x:0,y:0,z:8,tx:0,ty:0,tz:8,f:0,vx:0,vz:0,carry:-1,vc:-1,stun:0,skin:-1,curSkin:-9,dg:0,mv:0,ph:0,lie:0,init:0,sets:{},ch:null,tr:null,trI:-1,tag:null,tagName:null,slot:-1,bc:null,bq:null};
  return r;
}
function remSet(r,skin){
  if(r.sets[skin])return r.sets[skin];
  var ch;
  if(skin===99&&window.__XMASIMG__)ch=makePlayerChar({skin:'#f0c9a6',hair:'#c62828',suit:'#c62828',stripe:'#e04848',shirt:'#ffffff',collar:'#ffffff',tie:'#1b5e20',knot:'#124a18',face:window.__XMASIMG__});
  else if(skin>=0&&skin<SKINS.length&&window.__SKINIMG__){var o=Object.assign({},SKINS[skin].o);o.face=window.__SKINIMG__[skin];ch=makePlayerChar(o);}
  else ch=makePlayerChar();
  ch.root.visible=false;scene.add(ch.root);
  return r.sets[skin]=ch;
}
function dropTrophy(tr){if(tr.parent)tr.parent.remove(tr);fxList=fxList.filter(function(f){return f.g!==tr;});}
function removeRem(id){
  /* 내 트로피를 들고 있던 도둑이 나가면 → 트로피가 돌아와요 */
  if(RAIDS_OUT[id]!==undefined){var ri=RAIDS_OUT[id];delete RAIDS_OUT[id];raidRefund(ri,'🛡️ 도둑이 나가서 ['+gradeOf(ri).name+'] 큰 손이 돌아왔어요');}
  var r=REM[id];if(!r)return;
  for(var k in r.sets)scene.remove(r.sets[k].root);
  if(r.tr)dropTrophy(r.tr);
  if(r.tag)scene.remove(r.tag.sprite);
  delete REM[id];
}
function remTagKey(r){return r.name+(RAIDS_OUT[r.id]!==undefined?'!':'')+'|'+(r.ti||'');}
function drawRemTag(r){
  var g=r.tag.g,nm=r.name||'친구',thief=RAIDS_OUT[r.id]!==undefined;
  g.clearRect(0,0,256,64);roundRect(g,4,4,248,56,16);g.fillStyle=thief?'rgba(190,20,30,.9)':'rgba(20,60,140,.78)';g.fill();
  g.lineWidth=3;g.strokeStyle=thief?'#ffd54a':'#7fd3ff';g.stroke();
  g.textAlign='center';g.textBaseline='middle';
  if(r.ti){g.font='bold 18px '+FONT;g.fillStyle='#ffd54a';g.fillText(r.ti,128,17,236);g.font='bold 24px '+FONT;g.fillStyle='#fff';g.fillText((thief?'🚨 도둑 ':'👤 ')+nm,128,43,236);}
  else{g.font='bold 30px '+FONT;g.fillStyle='#fff';g.fillText((thief?'🚨 도둑 ':'👤 ')+nm,128,33,236);}
  r.tag.tex.needsUpdate=true;r.tagName=remTagKey(r);
}
function updateRemotes(dt,t){
  for(var id in REM){
    var r=REM[id];if(!r.init)continue;
    var k=Math.min(1,dt*12);
    if(Math.abs(r.tx-r.x)+Math.abs(r.tz-r.z)>60){r.x=r.tx;r.z=r.tz;}
    r.x+=(r.tx-r.x)*k;r.y+=(r.ty-r.y)*k;r.z+=(r.tz-r.z)*k;
    if(r.skin!==r.curSkin){
      if(r.ch)r.ch.root.visible=false;
      r.ch=remSet(r,r.skin);r.ch.root.visible=true;r.curSkin=r.skin;
      if(r.tr)r.ch.root.add(r.tr);
    }
    var ch=r.ch;
    ch.root.position.set(r.x,r.y,r.z);ch.root.rotation.y=lerpAngle(ch.root.rotation.y,r.f,Math.min(1,dt*14));
    r.lie+=((r.stun?1:0)-r.lie)*Math.min(1,dt*10);
    ch.body.rotation.x=-Math.PI/2*r.lie;ch.body.position.y=0.75*r.lie;
    if(r.stun)swing(ch,0,0);
    else if(r.y-groundBelow(r.x,r.z,r.y)>0.05){ch.legL.rotation.x=-0.5;ch.legR.rotation.x=0.5;ch.armL.rotation.x=ch.armR.rotation.x=-2.4;}
    else{if(r.mv)r.ph+=dt*16;swing(ch,r.ph,r.mv?0.9:0);}
    if(r.vc!==r.trI){
      if(r.tr){dropTrophy(r.tr);r.tr=null;}
      if(r.vc>=0&&r.vc<N){r.tr=makeTrophy(ITEM_COLORS[r.vc],false,r.vc);r.tr.scale.set(1.2,1.2,1.2);ch.root.add(r.tr);if(!fxLevel)fxList.forEach(function(f){if(f.g===r.tr){if(f.ring)f.ring.visible=false;f.stars.forEach(function(x){x.visible=false;});if(f.halo)f.halo.visible=false;}});}
      r.trI=r.vc;
    }
    if(r.tr){
      if(!r.stun)ch.armL.rotation.x=ch.armR.rotation.x=-Math.PI*0.93;
      r.tr.position.y=6.7+Math.sin(t*6)*0.12+(r.stun?-4:0);r.tr.rotation.y+=dt*2;
    }
    if(!r.tag){r.tag=makeSprite(256,64,6.4,1.6);r.tag.sprite.renderOrder=5;scene.add(r.tag.sprite);}
    if(r.tagName!==remTagKey(r))drawRemTag(r);
    if(r.au&&r.init)auraEmit(r.x,r.y,r.z,r.au,dt);
    r.tag.sprite.position.set(r.x,r.y+8.6+(r.tr?3.6:0),r.z);
  }
}

/* ---------- 화면 (시작 화면 + 게임 중 표시) ---------- */
function netUI(){
  var b=$('netBox');if(!b)return;
  var bd=$('menuBadge');
  document.body.classList.toggle('inroom',NET.mode!=='solo');
  if(NET.mode==='solo'&&typeof chatClose==='function')chatClose();
  if(NET.mode==='solo'){b.style.display='none';if(bd)bd.textContent='';if(window.mpModalRender&&$('mpModal').style.display==='flex')mpModalRender();return;}
  b.style.display='block';
  var names=[(NET.name||'나')+' (나)'];for(var id in REM)if(REM[id].name)names.push(REM[id].name);
  if(bd)bd.textContent='👥'+names.length;
  if(window.mpModalRender&&$('mpModal').style.display==='flex')mpModalRender();
  $('netInfo').innerHTML='📡 방 코드 <b>'+NET.code+'</b> · '+(NET.mode==='host'?'👑 방장':'🙋 참가')+(NET.via==='ws'?' · 🛰️서버':' · 🔗직접')+' · 👥 '+names.length+'명<small>'+names.join(', ').replace(/</g,'&lt;')+'</small>';
}
function inviteLink(){return location.href.split('#')[0].split('?')[0]+'?room='+NET.code;}
(function(){
  var nm='';try{nm=localStorage.getItem('steal-a-roh-name')||'';}catch(e){}
  if(!nm)nm='플레이어'+((Math.random()*900+100)|0);
  $('mpName').value=nm;NET.name=nm;
  var q=/[?&]room=([A-Za-z0-9]{5})/.exec(location.search);
  if(q){$('mpCode').value=q[1].toUpperCase();$('mpMsg').textContent='👉 초대받은 방 코드가 입력됐어요. [참가]를 누르세요!';}
  function readName(){
    var v=$('mpName').value.trim().slice(0,10)||nm;NET.name=v;
    try{localStorage.setItem('steal-a-roh-name',v);}catch(e){}
  }
  function busy(on,msg,bad){
    $('mpHost').disabled=$('mpJoin').disabled=on;
    var e=$('mpMsg');e.textContent=msg||'';e.style.color=bad?'#ff8a80':'#b9f6ca';
  }
  function go(){netUI();mpModalClose();if(!started)$('startBtn').click();}
  /* 게임 중에 방을 바꿀 때: 던전에서는 먼저 나오기 */
  function prep(){if(started&&DG.on)exitDungeon(false);}
  $('mpHost').addEventListener('click',function(){
    if(NET.mode!=='solo')return;
    readName();prep();busy(true,'📡 방 만드는 중...');
    netHostAny(function(err,code){
      if(err){busy(false,err,true);return;}
      busy(false,'');go();
      toast('🏠 방을 만들었어요! 친구에게 방 코드 '+code+' 를 알려주세요','good');
    },function(t){busy(true,t);});
  });
  $('mpJoin').addEventListener('click',function(){
    if(NET.mode!=='solo')return;
    readName();prep();busy(true,'📡 방에 연결하는 중...');
    netJoinAny($('mpCode').value,function(err,code){
      if(err){busy(false,err,true);return;}
      busy(false,'');
      npcs.forEach(function(n){n.carrier=null;});
      if(P.carry>=0){P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});}
      bsKey='';if(typeof NET.slot0==='number')setMySlot(NET.slot0);
      go();netSendState();
      toast('🙋 방 '+code+' 에 들어왔어요! 같이 훔쳐보자','good');
    },function(t){busy(true,t);});
  });
  $('mpCode').addEventListener('keydown',function(e){if(e.key==='Enter')$('mpJoin').click();e.stopPropagation();});
  $('mpName').addEventListener('keydown',function(e){e.stopPropagation();});
  $('netCopy').addEventListener('click',function(){
    this.blur();var link=inviteLink(),btn=this;
    function ok(){btn.textContent='✅ 복사됨!';setTimeout(function(){btn.textContent='🔗 초대 링크 복사';},1500);}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(ok,function(){prompt('이 링크를 친구에게 보내세요',link);});
    else prompt('이 링크를 친구에게 보내세요',link);
  });
  $('netLeave').addEventListener('click',function(){this.blur();leaveRoom();mpModalRender();});
  /* 👥 멀티 버튼: 게임 중 언제든 방 만들기 / 참가 / 나가기 */
  var mpHome=$('mpBox').parentNode,mpNext=$('mpBox').nextSibling;
  window.mpModalRender=function(){
    var on=NET.mode!=='solo';
    $('mpRoom').style.display=on?'block':'none';
    $('mpBox').style.display=on?'none':'block';
    if(on){
      var names=[(NET.name||'나')+' (나)'];for(var id in REM)if(REM[id].name)names.push(REM[id].name);
      $('mpRoomInfo').innerHTML=(NET.mode==='host'?'👑 내가 만든 방':'🙋 참가 중인 방')+' · 방 코드 <b class="mpBig">'+NET.code+'</b>'
        +'<small>'+(NET.via==='ws'?'🛰️ 서버 연결':'🔗 직접 연결')+' · 👥 '+names.length+'명: '+names.join(', ').replace(/</g,'&lt;')+'</small>';
      $('mpRoomCopy').style.display=NET.code&&NET.code.length===5?'':'none';
    }
  };
  window.mpModalOpen=function(){
    modalOpen=true;keys={};joy.x=joy.y=0;
    $('mpSlot').appendChild($('mpBox'));
    var m=$('mpMsg');if(!/초대받은/.test(m.textContent))m.textContent='';
    $('mpHost').disabled=$('mpJoin').disabled=false;
    mpModalRender();$('mpModal').style.display='flex';
  };
  window.mpModalClose=function(){
    if($('mpModal').style.display!=='flex')return;
    $('mpModal').style.display='none';modalOpen=false;
    $('mpBox').style.display='';mpHome.insertBefore($('mpBox'),mpNext);
  };
  $('mpBtn').addEventListener('click',function(){this.blur();mpModalOpen();});
  $('mpClose').addEventListener('click',mpModalClose);
  $('mpModal').addEventListener('click',function(e){if(e.target===this)mpModalClose();});
  $('mpRoomCopy').addEventListener('click',function(){this.blur();$('netCopy').click();var b=this;b.textContent='✅ 복사됨!';setTimeout(function(){b.textContent='🔗 초대 링크 복사';},1500);});
  $('mpRoomLeave').addEventListener('click',function(){this.blur();leaveRoom();mpModalRender();});
})();

/* =========================================================
   Three.js 기본 세팅
   ========================================================= */
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isTouch?1.5:2));
renderer.setSize(VW(),VH());
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1330);
scene.fog=new THREE.Fog(0x0a1330,130,540);
var camera=new THREE.PerspectiveCamera(65,VW()/VH(),0.3,1500);

scene.add(new THREE.AmbientLight(0x8fa3d9,0.65));
scene.add(new THREE.HemisphereLight(0xcfe0ff,0x1d3a24,0.75));
var sun=new THREE.DirectionalLight(0xffffff,0.85);
sun.castShadow=true;
sun.shadow.mapSize.set(isTouch?1024:2048,isTouch?1024:2048);
sun.shadow.camera.left=-60;sun.shadow.camera.right=60;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-60;
sun.shadow.camera.near=1;sun.shadow.camera.far=300;
sun.shadow.bias=-0.0006;
scene.add(sun);scene.add(sun.target);

function canvasTex(w,h,draw){
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var g=c.getContext('2d');draw(g,w,h);
  var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}
function roundRect(g,x,y,w,h,r){
  g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
}
function makeSprite(w,h,sw,sh){
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var tex=new THREE.CanvasTexture(c);
  var mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
  var s=new THREE.Sprite(mat);s.scale.set(sw,sh,1);
  return {sprite:s,c:c,g:c.getContext('2d'),tex:tex};
}
var FONT='"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';

/* =========================================================
   맵: 축구장
   ========================================================= */
var PITCH_W=60, Z0=-45, Z1=90+(NPCS.length-1)*60+80, LEN=Z1-Z0, BASE_Z1=36;
/* 기지 칸: 멀티플레이에서 한 사람당 한 칸씩 (최대 4칸, 가로로 나란히)
   - 가운데 대문(x -29~29)으로만 경기장에 나갈 수 있어요
   - 혼자일 때는 SLOT_ORDER의 첫 칸(2번 칸)을 써요 · 5명부터는 사람이 적은 칸을 같이 써요 */
var SLOT_N=4, SLOT_W=60, SLOT_X=[-90,-30,30,90], SLOT_ORDER=[1,2,0,3], BASE_XMAX=SLOT_W*SLOT_N/2, GATE_X=28.6;
var SLOT_COL=[0xff8f00,0x2a6bd8,0x2eb84a,0x9c4dff], SLOT_CSS=['#ffb74d','#64b5f6','#81c784','#ce93d8'];
var mySlot=SLOT_ORDER[0],SPAWN_DX=0,SPAWN_Z=30; /* 기지 안 시작 위치 (1층 앞쪽, 대문 근처) */
/* 기지 3층 구조: 1층(y=0) 러닝머신 · 2층(y=9) 트로피 앞쪽 절반 · 3층(y=18) 트로피 뒤쪽
   - 층 바닥은 '위에서만 밟히는' 유리판이라 아래에서 점프 패드로 뚫고 올라가요
   - 층 앞쪽 끝에서 걸어 나가면 아래층으로 떨어져요 */
var FLOOR_Y=[0,9,18], FLOOR_FRONT=[BASE_Z1,0,-20], JUMP_PAD_V=40;
function groundBelow(x,z,y){
  if(typeof DG!=='undefined'&&DG.on)return 0;
  if(z>=BASE_Z1||z<Z0||Math.abs(x)>BASE_XMAX)return 0;
  for(var f=FLOOR_Y.length-1;f>0;f--)if(z<FLOOR_FRONT[f]&&y>=FLOOR_Y[f]-0.05)return FLOOR_Y[f];
  return 0;
}
function floorLanding(x,z,py,y){
  if(typeof DG!=='undefined'&&DG.on)return null;
  if(z>=BASE_Z1||z<Z0||Math.abs(x)>BASE_XMAX)return null;
  for(var f=FLOOR_Y.length-1;f>0;f--){var h=FLOOR_Y[f];if(z<FLOOR_FRONT[f]&&py>=h-0.05&&y<=h)return h;}
  return null;
}
function floorNo(y){return y>=FLOOR_Y[2]-0.5?3:y>=FLOOR_Y[1]-0.5?2:1;}
function slotX(s){return SLOT_X[s]||0;}
var CLEN=Z1-BASE_Z1, CMID=(BASE_Z1+Z1)/2, BLEN=BASE_Z1-Z0, BMID=(Z0+BASE_Z1)/2;

var stripeTex=canvasTex(8,256,function(g,w,h){
  g.fillStyle='#2b8a3c';g.fillRect(0,0,w,h/2);
  g.fillStyle='#37a049';g.fillRect(0,h/2,w,h/2);
});
stripeTex.wrapS=stripeTex.wrapT=THREE.RepeatWrapping;
stripeTex.repeat.set(1,LEN/30);
var pitch=new THREE.Mesh(new THREE.PlaneGeometry(PITCH_W,LEN),new THREE.MeshLambertMaterial({map:stripeTex}));
pitch.rotation.x=-Math.PI/2;pitch.position.set(0,0,(Z0+Z1)/2);pitch.receiveShadow=true;scene.add(pitch);

var outer=new THREE.Mesh(new THREE.PlaneGeometry(BASE_XMAX*2+240,LEN+300),new THREE.MeshLambertMaterial({color:0x16251d}));
outer.rotation.x=-Math.PI/2;outer.position.set(0,-0.06,(Z0+Z1)/2);scene.add(outer);

[-1,1].forEach(function(s){
  var track=new THREE.Mesh(new THREE.PlaneGeometry(3.6,CLEN),new THREE.MeshLambertMaterial({color:0x8d3a2a}));
  track.rotation.x=-Math.PI/2;track.position.set(s*32.3,0.01,CMID);scene.add(track);
  /* 넓어진 기지 바닥 (가운데는 축구장 잔디가 이미 깔려 있어요) */
  var bt=canvasTex(8,256,function(g,w,h){g.fillStyle='#2b8a3c';g.fillRect(0,0,w,h/2);g.fillStyle='#37a049';g.fillRect(0,h/2,w,h/2);});
  bt.wrapS=bt.wrapT=THREE.RepeatWrapping;bt.repeat.set(1,BLEN/30);
  var bw=BASE_XMAX-PITCH_W/2;
  var bf=new THREE.Mesh(new THREE.PlaneGeometry(bw,BLEN),new THREE.MeshLambertMaterial({map:bt}));
  bf.rotation.x=-Math.PI/2;bf.position.set(s*(PITCH_W/2+bw/2),0,BMID);bf.receiveShadow=true;scene.add(bf);
});

var lineMat=new THREE.MeshBasicMaterial({color:0xffffff});
function addLine(x,z,w,l){
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,0.05,l),lineMat);m.position.set(x,0.03,z);scene.add(m);
}
addLine(-29.4,CMID,0.5,CLEN);addLine(29.4,CMID,0.5,CLEN);
addLine(0,Z1-1,59,0.5);
NPCS.forEach(function(n){
  addLine(0,n.z-33,58.4,0.4);
  var ring=new THREE.Mesh(new THREE.RingGeometry(8.6,9.1,48),lineMat);
  ring.rotation.x=-Math.PI/2;ring.position.set(0,0.035,n.z-2.8);scene.add(ring);
});

/* 골대 (끝) */
(function(){
  var m=new THREE.MeshLambertMaterial({color:0xffffff});
  [-9,9].forEach(function(x){var p=new THREE.Mesh(new THREE.BoxGeometry(0.6,7,0.6),m);p.position.set(x,3.5,Z1-1);scene.add(p);});
  var bar=new THREE.Mesh(new THREE.BoxGeometry(18.6,0.6,0.6),m);bar.position.set(0,7,Z1-1);scene.add(bar);
})();

/* 기지 바닥 + 안전존 표시 (칸마다 색이 달라요) */
var SLOT_FLOOR=[];
(function(){
  var safeTex=canvasTex(512,128,function(g,w,h){
    g.clearRect(0,0,w,h);
    g.font='bold 90px '+FONT;g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='rgba(200,230,255,.85)';g.fillText('SAFE ZONE',w/2,h/2);
  });
  SLOT_X.forEach(function(ox,s){
    var f=new THREE.Mesh(new THREE.PlaneGeometry(SLOT_W-1.2,BLEN),new THREE.MeshBasicMaterial({color:SLOT_COL[s],transparent:true,opacity:0.14,depthWrite:false}));
    f.rotation.x=-Math.PI/2;f.position.set(ox,0.045,BMID);scene.add(f);SLOT_FLOOR.push(f);
    var st=new THREE.Mesh(new THREE.PlaneGeometry(24,6),new THREE.MeshBasicMaterial({map:safeTex,transparent:true,depthWrite:false}));
    st.rotation.x=-Math.PI/2;st.position.set(ox,0.06,28);scene.add(st);
  });
  /* 칸 경계선 + 바깥 테두리 */
  for(var k=0;k<=SLOT_N;k++)addLine(-BASE_XMAX+k*SLOT_W,BMID,0.5,BLEN);
  addLine(0,Z0+0.3,BASE_XMAX*2,0.5);
  /* 대문 바닥선 */
  var edge=new THREE.Mesh(new THREE.BoxGeometry(58.6,0.12,0.9),new THREE.MeshBasicMaterial({color:0x4fc3f7}));
  edge.position.set(0,0.07,BASE_Z1);scene.add(edge);
  /* 대문 양옆 울타리: 바깥쪽 칸은 가운데 대문으로 나가요 */
  var fm=new THREE.MeshLambertMaterial({color:0x1d2a3a}),tm=new THREE.MeshBasicMaterial({color:0x4fc3f7});
  [-1,1].forEach(function(s){
    var L=BASE_XMAX-30,cx=s*(30+L/2);
    var w=new THREE.Mesh(new THREE.BoxGeometry(L,2.4,0.6),fm);w.position.set(cx,1.2,BASE_Z1+0.3);scene.add(w);
    var t=new THREE.Mesh(new THREE.BoxGeometry(L,0.25,0.7),tm);t.position.set(cx,2.45,BASE_Z1+0.3);scene.add(t);
    var e=new THREE.Mesh(new THREE.BoxGeometry(0.6,2.4,BLEN),fm);e.position.set(s*(BASE_XMAX+0.3),1.2,BMID);scene.add(e);
  });
  var bk=new THREE.Mesh(new THREE.BoxGeometry(BASE_XMAX*2+1.2,2.4,0.6),fm);bk.position.set(0,1.2,Z0-0.3);scene.add(bk);
})();

/* 광고판 */
(function(){
  var ads=[['BLOCK COLA','#d32f2f'],['CUBE AIR','#1565c0'],['골든 치킨','#f9a825'],['PIXEL BANK','#2e7d32'],['NOOB 라면','#e65100'],['STUD MOBILE','#6a1b9a']];
  var tex=canvasTex(1536,64,function(g,w,h){
    var pw=w/ads.length;
    ads.forEach(function(a,i){
      g.fillStyle=a[1];g.fillRect(i*pw,0,pw,h);
      g.fillStyle='#fff';g.font='bold 40px '+FONT;g.textAlign='center';g.textBaseline='middle';
      g.fillText(a[0],i*pw+pw/2,h/2+2);
      g.fillStyle='rgba(255,255,255,.5)';g.fillRect(i*pw,0,3,h);
    });
  });
  tex.wrapS=THREE.RepeatWrapping;tex.repeat.set(CLEN/48,1);
  [-1,1].forEach(function(s){
    var p=new THREE.Mesh(new THREE.PlaneGeometry(CLEN,2),new THREE.MeshBasicMaterial({map:tex}));
    p.rotation.y=s<0?Math.PI/2:-Math.PI/2;
    p.position.set(s*30.6,1.1,CMID);scene.add(p);
    var back=new THREE.Mesh(new THREE.BoxGeometry(0.3,2.2,CLEN),new THREE.MeshLambertMaterial({color:0x222222}));
    back.position.set(s*30.9,1.1,CMID);scene.add(back);
  });
})();

/* 관중석 + 블록 관중 (InstancedMesh) */
var crowdTime={value:0};
(function(){
  var TIERS=6, tierW=2.6;
  var stoneMat=new THREE.MeshLambertMaterial({color:0x4a5a66});
  var persons=[];
  /* 한 줄 관중석: alongZ=true면 z 방향으로 길게, s=높아지는 방향, c0=첫 줄 위치, a0~a1=길이 */
  function stand(alongZ,s,c0,a0,a1){
    var L=a1-a0,mid=(a0+a1)/2;
    for(var k=0;k<TIERS;k++){
      var H=1.4*(k+1), c=c0+s*(k*tierW+tierW/2);
      var tier=new THREE.Mesh(alongZ?new THREE.BoxGeometry(tierW,H,L):new THREE.BoxGeometry(L,H,tierW),stoneMat);
      if(alongZ)tier.position.set(c,H/2,mid);else tier.position.set(mid,H/2,c);
      scene.add(tier);
      for(var a=a0+1;a<a1;a+=2.2){
        if(Math.random()<0.14)continue;
        persons.push(alongZ?[c+rand(-0.3,0.3),H,a+rand(-0.4,0.4)]:[a+rand(-0.4,0.4),H,c+rand(-0.3,0.3)]);
      }
    }
  }
  var SW=TIERS*tierW,BX=BASE_XMAX+2;
  [-1,1].forEach(function(s){
    stand(true,s,s*34,BASE_Z1,Z1);                     /* 경기장 양옆 */
    stand(true,s,s*BX,Z0-2-SW,BASE_Z1+2+SW);            /* 넓은 기지 양옆 */
    stand(false,1,BASE_Z1+2,s>0?34+SW:-BX-SW,s>0?BX+SW:-34-SW); /* 바깥 칸 앞쪽 */
  });
  stand(false,-1,Z0-2,-BX,BX);                          /* 기지 뒤쪽 */
  var palette=['#e53935','#1e88e5','#fdd835','#43a047','#ffffff','#ff7043','#8e24aa','#26c6da'];
  var skins=['#f5c9a0','#e0ac69','#c68642','#8d5524','#ffdbac'];
  var bm=new THREE.MeshLambertMaterial({color:0xffffff}), hm=new THREE.MeshLambertMaterial({color:0xffffff});
  function wiggle(mat){
    mat.onBeforeCompile=function(sh){
      sh.uniforms.uTime=crowdTime;
      sh.vertexShader=sh.vertexShader
        .replace('#include <common>','#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=instanceMatrix[3][0]*0.9+instanceMatrix[3][2]*1.7;\n transformed.y+=max(0.0,sin(uTime*4.0+ph))*0.4;\n#endif');
    };
  }
  wiggle(bm);wiggle(hm);
  var bodies=new THREE.InstancedMesh(new THREE.BoxGeometry(0.6,1.3,1.0),bm,persons.length);
  var heads=new THREE.InstancedMesh(new THREE.BoxGeometry(0.8,0.8,0.8),hm,persons.length);
  var d=new THREE.Object3D(),c=new THREE.Color();
  persons.forEach(function(p,i){
    d.position.set(p[0],p[1]+0.65,p[2]);d.updateMatrix();bodies.setMatrixAt(i,d.matrix);
    c.set(palette[(Math.random()*palette.length)|0]);bodies.setColorAt(i,c);
    d.position.set(p[0],p[1]+1.7,p[2]);d.updateMatrix();heads.setMatrixAt(i,d.matrix);
    c.set(skins[(Math.random()*skins.length)|0]);heads.setColorAt(i,c);
  });
  bodies.frustumCulled=false;heads.frustumCulled=false;
  scene.add(bodies);scene.add(heads);
})();

/* 조명탑 */
(function(){
  var poleM=new THREE.MeshLambertMaterial({color:0x607080});
  var panelM=new THREE.MeshBasicMaterial({color:0xfff4c8});
  function pole(x,z,s){
    var p=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,38,8),poleM);p.position.set(x,19,z);scene.add(p);
    var panel=new THREE.Mesh(new THREE.BoxGeometry(1.2,8,14),panelM);panel.position.set(x-s*1.5,40,z);panel.rotation.z=s*0.25;scene.add(panel);
  }
  for(var z=140;z<=Z1;z+=140)[-1,1].forEach(function(s){pole(s*60,z,s);});
  [-1,1].forEach(function(s){pole(s*(BASE_XMAX+20),-25,s);pole(s*(BASE_XMAX+20),25,s);});
})();

/* 별 */
var stars;
(function(){
  var n=700,pos=new Float32Array(n*3);
  for(var i=0;i<n;i++){
    var th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*0.9+0.1),r=900;
    pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.cos(ph);pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
  }
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false}));
  stars.frustumCulled=false;scene.add(stars);
})();

/* =========================================================
   블록 캐릭터
   ========================================================= */
var faceCache={};
function faceMat(skin,type){
  var k=skin+type;
  if(faceCache[k])return faceCache[k];
  var tex=canvasTex(64,64,function(g){
    g.fillStyle=skin;g.fillRect(0,0,64,64);
    g.fillStyle='#222';g.strokeStyle='#222';g.lineWidth=4;g.lineCap='round';
    if(type==='happy'){
      g.fillRect(18,22,6,10);g.fillRect(40,22,6,10);
      g.beginPath();g.arc(32,38,10,0.15*Math.PI,0.85*Math.PI);g.stroke();
    }else if(type==='sleep'){
      g.beginPath();g.moveTo(14,30);g.lineTo(27,30);g.moveTo(37,30);g.lineTo(50,30);g.stroke();
      g.fillStyle='#b55';g.beginPath();g.ellipse(32,47,4,5,0,0,7);g.fill();
    }else{
      g.beginPath();g.moveTo(14,20);g.lineTo(27,27);g.lineTo(14,34);g.moveTo(50,20);g.lineTo(37,27);g.lineTo(50,34);g.stroke();
      g.fillStyle='#4fc3f7';g.fillRect(15,36,5,20);g.fillRect(44,36,5,20);
      g.fillStyle='#5a1a1a';g.beginPath();g.ellipse(32,48,10,7,0,0,7);g.fill();
    }
  });
  return faceCache[k]=new THREE.MeshLambertMaterial({map:tex});
}
function box(w,h,d,color){
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:color}));
  m.castShadow=true;return m;
}
function makeChar(o){
  var root=new THREE.Group(),body=new THREE.Group();root.add(body);
  var torso=box(2,2,1,o.shirt);torso.position.y=3;body.add(torso);
  var sk=new THREE.MeshLambertMaterial({color:o.skin});
  var faces={happy:faceMat(o.skin,'happy'),sleep:faceMat(o.skin,'sleep'),cry:faceMat(o.skin,'cry')};
  var head=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5),[sk,sk,sk,sk,faces[o.face||'happy'],sk]);
  head.position.y=4.85;head.castShadow=true;body.add(head);
  var hair=box(1.6,0.45,1.6,o.hair);hair.position.y=5.65;body.add(hair);
  var hairB=box(1.6,1.0,0.3,o.hair);hairB.position.set(0,5.2,-0.65);body.add(hairB);
  function arm(sx){
    var g=new THREE.Group();g.position.set(sx*1.5,3.95,0);
    var a=box(1,1.2,1,o.shirt);a.position.y=-0.6;g.add(a);
    var b=box(1,0.8,1,o.skin);b.position.y=-1.6;g.add(b);
    body.add(g);return g;
  }
  function leg(sx){
    var g=new THREE.Group();g.position.set(sx*0.5,2,0);
    var a=box(1,0.9,1,o.pants);a.position.y=-0.45;g.add(a);
    var b=box(1,1.1,1,o.sock);b.position.y=-1.45;g.add(b);
    body.add(g);return g;
  }
  var armL=arm(-1),armR=arm(1),legL=leg(-1),legR=leg(1);
  return {root:root,body:body,head:head,faces:faces,armL:armL,armR:armR,legL:legL,legR:legR,face:o.face||'happy'};
}
function setFace(ch,type){if(ch.face!==type){ch.face=type;ch.head.material[4]=ch.faces[type];}}
function swing(ch,phase,amp){
  var s=Math.sin(phase)*amp;
  ch.armL.rotation.x=s;ch.armR.rotation.x=-s;ch.legL.rotation.x=-s;ch.legR.rotation.x=s;
}

/* =========================================================
   트로피(큰 손) 모델
   ========================================================= */
var texLoader=new THREE.TextureLoader();
var handTex=texLoader.load(window.__HAND__.src),projTex=texLoader.load(window.__PROJ__.src);
var HAND_H=3.3,HAND_W=HAND_H*window.__HAND__.w/window.__HAND__.h;
/* 등급별로 손 이미지를 그라디언트 맵으로 색칠 */
var gradeTex=[];
(function(){
  var cv=[];
  GRADES.forEach(function(g,gi){
    var c=document.createElement('canvas');c.width=window.__HAND__.w;c.height=window.__HAND__.h;
    var t=new THREE.CanvasTexture(c);t.anisotropy=4;gradeTex.push(t);cv.push(c);
  });
  function hex(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}
  function hsl2rgb(h,s,l){
    var a=s*Math.min(l,1-l);function f(n){var k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));}
    return [f(0)*255,f(8)*255,f(4)*255];
  }
  var img=new Image();
  img.onload=function(){
    var w=img.width,h=img.height,base=document.createElement('canvas');base.width=w;base.height=h;
    var bg=base.getContext('2d');bg.drawImage(img,0,0);
    var src=bg.getImageData(0,0,w,h).data;
    GRADES.forEach(function(g,gi){
      var ctx=cv[gi].getContext('2d'),out=ctx.createImageData(w,h),d=out.data;
      var sh=hex(g.c[0]),mi=hex(g.c[1]),hi=hex(g.c[2]);
      for(var y=0;y<h;y++)for(var x=0;x<w;x++){
        var k=(y*w+x)*4,a=src[k+3];
        if(a===0){d[k+3]=0;continue;}
        var l=(src[k]*0.299+src[k+1]*0.587+src[k+2]*0.114)/255;
        l=Math.max(0,Math.min(1,(l-0.18)/0.82));
        var r,gg,b;
        if(g.rainbow){var rgb=hsl2rgb(((y/h)*320+x/w*60)%360,0.9,0.28+0.5*l);r=rgb[0];gg=rgb[1];b=rgb[2];}
        else{
          var A,B,u;
          if(l<0.55){A=sh;B=mi;u=l/0.55;}else{A=mi;B=hi;u=(l-0.55)/0.45;}
          r=A[0]+(B[0]-A[0])*u;gg=A[1]+(B[1]-A[1])*u;b=A[2]+(B[2]-A[2])*u;
        }
        d[k]=r;d[k+1]=gg;d[k+2]=b;d[k+3]=a;
      }
      ctx.putImageData(out,0,0);gradeTex[gi].needsUpdate=true;
    });
  };
  img.src=window.__HAND__.src;
})();
var haloTex=(function(){
  var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');
  var gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
})();
var fxList=[];
function makeTrophy(color,dark,gi){
  var g=new THREE.Group();
  var baseM=dark?new THREE.MeshLambertMaterial({color:0x10141a})
    :new THREE.MeshPhongMaterial({color:color,shininess:80,emissive:color,emissiveIntensity:0.45});
  var base=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.15,0.3,20),baseM);base.position.y=0.15;g.add(base);
  gi=gi||0;
  var K=gi/(GRADES.length-1),sc=dark?1:0.9+0.03*gi,hh=HAND_H*sc,hw=HAND_W*sc;
  var fx={g:g,gi:gi,ring:null,stars:[],halo:null,haloBase:0,hue:gi>=15,hh:hh};
  if(!dark&&gi>=3){
    fx.haloBase=0.1+0.5*K;
    var hm=new THREE.SpriteMaterial({map:haloTex,color:color,transparent:true,opacity:fx.haloBase,depthWrite:false,blending:THREE.AdditiveBlending});
    var halo=new THREE.Sprite(hm);var hs=hh*(1.2+0.5*K);halo.scale.set(hs,hs,1);halo.position.y=0.3+hh/2;halo.renderOrder=1;g.add(halo);fx.halo=halo;
  }
  var sm=new THREE.SpriteMaterial({map:dark?handTex:gradeTex[gi],transparent:true,alphaTest:0.3,color:dark?0x0c0f14:0xffffff});
  var sp=new THREE.Sprite(sm);sp.scale.set(hw,hh,1);sp.position.y=0.3+hh/2;sp.renderOrder=2;g.add(sp);
  /* 등급이 높을수록: 커지고 → 회전 링 → 궤도 별 → 무지개 후광 */
  if(!dark&&gi>=5){
    var rg=new THREE.Group();rg.position.y=0.5;
    var rm=new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false});
    var ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,0.07,6,32),rm);ring.rotation.x=Math.PI/2;rg.add(ring);
    if(gi>=11){var r2=new THREE.Mesh(new THREE.TorusGeometry(2.1,0.05,6,32),rm);r2.rotation.x=Math.PI/2;rg.add(r2);}
    g.add(rg);fx.ring=rg;
  }
  if(!dark&&gi>=9){
    var cnt=gi>=14?5:3;
    for(var q=0;q<cnt;q++){
      var stm=new THREE.SpriteMaterial({map:haloTex,color:color,transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending});
      var st=new THREE.Sprite(stm);st.scale.set(0.7,0.7,1);st.renderOrder=3;g.add(st);fx.stars.push(st);
    }
  }
  if(!dark&&gi>=3)fxList.push(fx);
  return g;
}
var tv3=new THREE.Vector3();
function updateTrophyFx(t){
  if(!fxLevel)return;
  for(var i=0;i<fxList.length;i++){
    var f=fxList[i],g=f.g;
    if(!g.visible)continue;
    g.getWorldPosition(tv3);
    if(Math.abs(tv3.z-P.z)>140||Math.abs(tv3.x-P.x)>140)continue;
    if(f.ring)f.ring.rotation.y=t*(0.8+f.gi*0.12);
    for(var q=0;q<f.stars.length;q++){
      var a=t*1.6+q*6.2832/f.stars.length,r=1.9+0.15*Math.sin(t*3+q);
      f.stars[q].position.set(Math.cos(a)*r,0.3+f.hh*0.5+Math.sin(t*2+q*1.7)*f.hh*0.28,Math.sin(a)*r);
    }
    if(f.halo){
      f.halo.material.opacity=f.haloBase*(0.82+0.18*Math.sin(t*3+f.gi));
      if(f.hue)f.halo.material.color.setHSL((t*0.18+f.gi*0.07)%1,0.9,0.62);
    }
  }
}
function makeProj(size){
  var m=new THREE.SpriteMaterial({map:projTex,transparent:true,alphaTest:0.2});
  var sp=new THREE.Sprite(m);sp.scale.set(size,size,1);return sp;
}

/* =========================================================
   파티클
   ========================================================= */
var PN=900,pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pLife=new Float32Array(PN),pGrav=new Float32Array(PN),pIdx=0;
for(var pi=0;pi<PN;pi++)pPos[pi*3+1]=-999;
var pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
var pts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:0.6,vertexColors:true,transparent:true,depthWrite:false}));
pts.frustumCulled=false;scene.add(pts);
var tmpC=new THREE.Color();
function emit(x,y,z,vx,vy,vz,hex,life,grav){
  var i=(pIdx++)%PN;
  pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;
  pVel[i*3]=vx;pVel[i*3+1]=vy;pVel[i*3+2]=vz;
  tmpC.set(hex);pCol[i*3]=tmpC.r;pCol[i*3+1]=tmpC.g;pCol[i*3+2]=tmpC.b;
  pLife[i]=life;pGrav[i]=(grav===undefined?20:grav);
}
function burst(x,y,z,hex,n,sp){
  n=Math.max(1,Math.round(n*fxMul));
  for(var i=0;i<n;i++)emit(x,y,z,rand(-sp,sp),rand(sp*0.3,sp),rand(-sp,sp),hex,rand(0.4,0.9),20);
}
function updateParticles(dt){
  for(var i=0;i<PN;i++){
    if(pLife[i]<=0)continue;
    pLife[i]-=dt;
    if(pLife[i]<=0){pPos[i*3+1]=-999;continue;}
    pVel[i*3+1]-=pGrav[i]*dt;
    pPos[i*3]+=pVel[i*3]*dt;pPos[i*3+1]+=pVel[i*3+1]*dt;pPos[i*3+2]+=pVel[i*3+2]*dt;
    if(pPos[i*3+1]<0.05){pPos[i*3+1]=0.05;pVel[i*3+1]*=-0.3;}
  }
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
}

/* =========================================================
   오디오 (WebAudio 합성)
   ========================================================= */
var AC=null,master=null;
function initAudio(){
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
    if(AC.state==='suspended')AC.resume();
    loadDepositSound();
  }catch(e){AC=null;}
}
var depositBuf=null,caughtBuf=null,cryBuf=null,bgmBuf=null,bgmGain=null,bgmSrc=null,bgmMuted=false,BGM_VOL=0.32,xmasOn=false,xmasAudio=null,XMAS_VOL=0.5,xmasPlaying=false,xmasBuf=null,xmasSrc=null,xmasGain=null,xmasLoading=false;
try{bgmMuted=localStorage.getItem('steal-a-roh-bgm-muted')==='1';}catch(e){}
function startBgm(){
  if(!AC||!bgmBuf||bgmSrc)return;
  bgmGain=AC.createGain();bgmGain.gain.value=bgmLevel();bgmGain.connect(AC.destination);
  bgmSrc=AC.createBufferSource();bgmSrc.buffer=bgmBuf;bgmSrc.loop=true;bgmSrc.connect(bgmGain);bgmSrc.start();
}
function setBgmMuted(m){
  bgmMuted=m;
  if(bgmGain)bgmGain.gain.value=bgmLevel();
  if(xmasGain)xmasGain.gain.value=m?0:XMAS_VOL;
  if(xmasAudio)xmasAudio.volume=m?0:XMAS_VOL;
  var b=document.getElementById('muteBtn');if(b)b.textContent=m?'🔇 BGM 꺼짐':'🔊 BGM';
  try{localStorage.setItem('steal-a-roh-bgm-muted',m?'1':'0');}catch(e){}
}
function decodeB64(dataUri,cb){
  try{
    var b=atob(dataUri.split(',')[1]),u=new Uint8Array(b.length);
    for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
    var p=AC.decodeAudioData(u.buffer,cb,function(){});
    if(p&&p.catch)p.catch(function(){});
  }catch(e){}
}
function loadDepositSound(){
  decodeB64(window.__DEPOSIT__,function(buf){depositBuf=buf;});
  decodeB64(window.__CAUGHT__,function(buf){caughtBuf=buf;});
  decodeB64(window.__CRY__,function(buf){cryBuf=buf;});
  if(window.__FALL__)decodeB64(window.__FALL__,function(buf){fallBuf=buf;});
  decodeB64(window.__BGM__,function(buf){bgmBuf=buf;startBgm();});
}
var fallBuf=null;
function playFall(){
  if(!AC||!fallBuf)return false;
  var s=AC.createBufferSource(),g=AC.createGain();s.buffer=fallBuf;g.gain.value=1;
  s.connect(g);g.connect(master);s.start();return true;
}
function playCaught(){
  if(!AC||!caughtBuf)return false;
  var s=AC.createBufferSource(),g=AC.createGain();s.buffer=caughtBuf;g.gain.value=1;
  s.connect(g);g.connect(master);s.start();return true;
}
function playDeposit(){
  if(!AC)return false;
  if(!depositBuf)return false;
  var s=AC.createBufferSource(),g=AC.createGain();s.buffer=depositBuf;g.gain.value=1;
  s.connect(g);g.connect(master);s.start();return true;
}
function tone(freq,dur,type,vol,slide,delay){
  if(!AC)return;
  var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(freq,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
  g.gain.setValueAtTime(vol||0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.03);
}
function noise(dur,vol,freq){
  if(!AC)return;
  var len=Math.floor(AC.sampleRate*dur),buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  var s=AC.createBufferSource();s.buffer=buf;
  var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=freq||800;
  var g=AC.createGain();g.gain.value=vol||0.3;
  s.connect(f);f.connect(g);g.connect(master);s.start();
}
var activeCries=0,lastShootSfx=0;
function cry(vol,pitch){
  if(!AC||vol<0.02)return;
  if(cryBuf){
    if(activeCries>=2||(activeCries>=1&&vol<0.3))return;
    activeCries++;
    var cs=AC.createBufferSource(),cg=AC.createGain();cs.buffer=cryBuf;cs.playbackRate.value=pitch;cg.gain.value=Math.min(1,vol);
    cs.onended=function(){activeCries=Math.max(0,activeCries-1);};
    cs.connect(cg);cg.connect(master);cs.start();return;
  }
  var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter(),lfo=AC.createOscillator(),lg=AC.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(560*pitch,t);o.frequency.linearRampToValueAtTime(700*pitch,t+0.25);o.frequency.linearRampToValueAtTime(420*pitch,t+0.9);
  lfo.frequency.value=8;lg.gain.value=28;lfo.connect(lg);lg.connect(o.frequency);
  f.type='bandpass';f.frequency.value=1100;f.Q.value=2.5;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.12);g.gain.linearRampToValueAtTime(vol*0.7,t+0.6);g.gain.exponentialRampToValueAtTime(0.001,t+0.95);
  o.connect(f);f.connect(g);g.connect(master);o.start(t);lfo.start(t);o.stop(t+1);lfo.stop(t+1);
}
var sfx={
  steal:function(){tone(520,0.12,'square',0.15);tone(660,0.12,'square',0.15,0,0.1);tone(880,0.2,'square',0.15,0,0.2);},
  jump:function(){tone(300,0.18,'sine',0.12,350);},
  hit:function(){noise(0.35,0.5,500);tone(160,0.3,'sawtooth',0.25,-100);},
  shoot:function(){noise(0.25,0.25,2500);tone(500,0.2,'triangle',0.12,-300);},
  charge:function(){tone(400,0.12,'square',0.1);},
  deposit:function(){if(playDeposit())return;tone(784,0.12,'triangle',0.22);tone(988,0.12,'triangle',0.22,0,0.1);tone(1319,0.3,'triangle',0.22,0,0.2);},
  buy:function(){tone(660,0.1,'square',0.12);tone(990,0.18,'square',0.12,0,0.09);},
  tick:function(){tone(900,0.08,'sine',0.1,400);},
  deny:function(){tone(200,0.15,'square',0.1);}
};

/* =========================================================
   UI 도우미
   ========================================================= */
function toast(msg,cls){
  var box=$('toasts');
  var d=document.createElement('div');d.className='toast '+(cls||'');d.textContent=msg;
  box.appendChild(d);
  while(box.children.length>4)box.removeChild(box.firstChild);
  setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},2600);
}
var tmpV=new THREE.Vector3();
function floatText(text,x,y,z,cls){
  tmpV.set(x,y,z).project(camera);
  if(tmpV.z>1)return;
  var d=document.createElement('div');d.className='float '+(cls||'');d.textContent=text;
  d.style.left=((tmpV.x*0.5+0.5)*VW())+'px';d.style.top=((-tmpV.y*0.5+0.5)*VH())+'px';
  document.body.appendChild(d);
  setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},1300);
}

/* =========================================================
   플레이어
   ========================================================= */
var P={x:slotX(mySlot)+SPAWN_DX,y:0,z:SPAWN_Z,gy:0,vy:0,stun:0,face:0,lie:0,phase:0,carry:-1,treadAcc:0};
/* 플레이어: 사진 얼굴 + 정장 차림의 블록 캐릭터 (팔·다리 전부 있음) */
function makePlayerChar(o){
  o=o||{};var SKIN=o.skin||'#c99a7a',HAIR=o.hair||'#28262c',SUIT=o.suit||'#1d2233',STRIPE=o.stripe||'#343c58',SHIRT=o.shirt||'#cfe2f1',COLLAR=o.collar||'#e8f1f8',TIE=o.tie||'#5aa8d0',KNOT=o.knot||'#4b8db2',FACE=o.face||window.__PFACE__;
  var ch=makeChar({skin:SKIN,shirt:SUIT,pants:SUIT,sock:SUIT,hair:HAIR,face:'happy'});
  var suitTex=canvasTex(64,64,function(g,w,h){
    g.fillStyle=SUIT;g.fillRect(0,0,w,h);g.fillStyle=STRIPE;
    for(var x=3;x<w;x+=8)g.fillRect(x,0,1,h);
  });
  suitTex.wrapS=suitTex.wrapT=THREE.RepeatWrapping;
  var suitMat=function(){return new THREE.MeshLambertMaterial({map:suitTex});};
  /* 몸통: 앞면에 셔츠·넥타이·옷깃 */
  var torso=ch.body.children[0];
  var front=canvasTex(128,128,function(g,w,h){
    g.fillStyle=SUIT;g.fillRect(0,0,w,h);g.fillStyle=STRIPE;
    for(var x=3;x<w;x+=8)g.fillRect(x,0,1,h);
    g.fillStyle=SHIRT;g.beginPath();g.moveTo(42,0);g.lineTo(86,0);g.lineTo(64,62);g.closePath();g.fill();
    g.fillStyle=COLLAR;g.beginPath();g.moveTo(42,0);g.lineTo(54,0);g.lineTo(60,14);g.lineTo(52,12);g.closePath();g.fill();
    g.beginPath();g.moveTo(86,0);g.lineTo(74,0);g.lineTo(68,14);g.lineTo(76,12);g.closePath();g.fill();
    g.fillStyle=KNOT;g.beginPath();g.moveTo(58,8);g.lineTo(70,8);g.lineTo(68,19);g.lineTo(60,19);g.closePath();g.fill();
    g.fillStyle=TIE;g.beginPath();g.moveTo(60,19);g.lineTo(68,19);g.lineTo(73,66);g.lineTo(64,78);g.lineTo(55,66);g.closePath();g.fill();
    g.strokeStyle='#2f6c8c';g.lineWidth=2;g.beginPath();g.moveTo(64,22);g.lineTo(64,70);g.stroke();
    g.strokeStyle='#0d101b';g.lineWidth=5;g.beginPath();g.moveTo(40,0);g.lineTo(18,76);g.moveTo(88,0);g.lineTo(110,76);g.stroke();
    g.strokeStyle='#2a3148';g.lineWidth=2;g.beginPath();g.moveTo(46,0);g.lineTo(26,72);g.moveTo(82,0);g.lineTo(102,72);g.stroke();
    g.strokeStyle='#0d101b';g.lineWidth=3;g.beginPath();g.moveTo(60,80);g.lineTo(64,128);g.moveTo(68,80);g.lineTo(64,128);g.stroke();
    g.fillStyle='#0d101b';g.beginPath();g.arc(52,104,3,0,7);g.arc(76,104,3,0,7);g.fill();
  });
  var fm=new THREE.MeshLambertMaterial({map:front});
  torso.material=[suitMat(),suitMat(),suitMat(),suitMat(),fm,suitMat()];
  /* 머리: 사진 얼굴 (앞면) */
  var fcTex=new THREE.Texture();fcTex.anisotropy=4;
  var img=new Image();img.onload=function(){fcTex.image=img;fcTex.needsUpdate=true;};img.src=FACE;
  var photo=new THREE.MeshLambertMaterial({map:fcTex});
  function sideTex(hairFrac){return new THREE.MeshLambertMaterial({map:canvasTex(32,32,function(g,w,h){g.fillStyle=SKIN;g.fillRect(0,0,w,h);g.fillStyle=HAIR;g.fillRect(0,0,w,h*hairFrac);})});}
  ch.head.material=[sideTex(0.55),sideTex(0.55),new THREE.MeshLambertMaterial({color:HAIR}),new THREE.MeshLambertMaterial({color:SKIN}),photo,sideTex(0.7)];
  ch.head.scale.set(1.2,1.2,1.2);ch.head.position.y=4.95;
  ch.faces.happy=ch.faces.sleep=ch.faces.cry=photo;ch.face='happy';
  ch.body.children[2].visible=false;ch.body.children[3].visible=false;
  /* 소매·바지·구두 */
  [ch.armL,ch.armR].forEach(function(a){a.children[0].material=suitMat();});
  [ch.legL,ch.legR].forEach(function(l){
    l.children[0].material=suitMat();l.children[1].material=suitMat();
    var shoe=box(1.05,0.3,1.3,'#0c0c0f');shoe.position.set(0,-1.85,0.15);l.add(shoe);
  });
  return ch;
}
var pChar=makePlayerChar();
scene.add(pChar.root);
var holdTrophies=ITEM_COLORS.map(function(c,k){
  var t=makeTrophy(c,false,k);t.scale.set(1.2,1.2,1.2);t.visible=false;pChar.root.add(t);return t;
});
function inSafe(){return P.z<BASE_Z1;}

/* =========================================================
   NPC
   ========================================================= */
var ballTex=canvasTex(128,64,function(g,w,h){
  g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#222';
  for(var i=0;i<9;i++){var x=Math.random()*w,y=8+Math.random()*(h-16);g.beginPath();
    for(var k=0;k<5;k++){var a=k/5*Math.PI*2;g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9);}g.fill();}
});
var ballGeo=new THREE.SphereGeometry(0.7,16,12),ballMat=new THREE.MeshLambertMaterial({map:ballTex});
var aimGeo=new THREE.PlaneGeometry(0.5,1);aimGeo.rotateX(-Math.PI/2);aimGeo.translate(0,0,0.5);
var aimMat=new THREE.MeshBasicMaterial({color:0xff1111,transparent:true,opacity:0.8,depthWrite:false,side:THREE.DoubleSide});

var texLoader=new THREE.TextureLoader();
var NPC_H=15;
var npcs=NPCS.map(function(c,i){
  var h=NPC_H,w=h*c.iw/c.ih;if(w>12){w=12;h=w*c.ih/c.iw;}
  c.w=w;c.h=h;
  var root=new THREE.Group();root.position.set(c.x,0,c.z);scene.add(root);
  var tex=texLoader.load(c.img);tex.anisotropy=4;
  var geo=new THREE.PlaneGeometry(w,h);geo.translate(0,h/2,0);
  var mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:0.35,side:THREE.DoubleSide});
  var mesh=new THREE.Mesh(geo,mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=0.12;root.add(mesh);
  var blob=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35,depthWrite:false}));
  blob.rotation.x=-Math.PI/2;blob.position.set(c.x,0.07,c.z);blob.scale.set(w*0.42,w*0.22,1);blob.visible=false;scene.add(blob);
  var tag=makeSprite(256,96,12,4.5);
  tag.g.clearRect(0,0,256,96);roundRect(tag.g,4,4,248,88,18);tag.g.fillStyle='rgba(0,0,0,.62)';tag.g.fill();
  tag.g.textAlign='center';tag.g.font='bold 33px '+FONT;tag.g.fillStyle='#fff';tag.g.fillText(c.name,128,41,236);
  tag.g.font='bold 31px '+FONT;tag.g.fillStyle='#ffd54a';tag.g.fillText('⚡ '+fmt(c.speed),128,78);tag.tex.needsUpdate=true;
  scene.add(tag.sprite);
  var zz=makeSprite(128,64,4,2);
  zz.g.font='bold 44px '+FONT;zz.g.textAlign='center';zz.g.lineWidth=6;zz.g.strokeStyle='#123';zz.g.strokeText('Z z z',64,46);zz.g.fillStyle='#fff';zz.g.fillText('Z z z',64,46);zz.tex.needsUpdate=true;
  scene.add(zz.sprite);
  var aim=new THREE.Mesh(aimGeo,aimMat);aim.visible=false;aim.position.y=0.14;scene.add(aim);
  var aimX=[0,1].map(function(){var a=new THREE.Mesh(aimGeo,aimMat);a.visible=false;a.position.y=0.14;scene.add(a);return a;});
  var ball=makeProj(2.4);ball.visible=false;scene.add(ball);
  var px=c.side*11,pz=c.z-2.8;
  var pedMesh=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.6,2.8),new THREE.MeshLambertMaterial({color:0x37474f}));
  pedMesh.position.set(px,0.8,pz);pedMesh.castShadow=true;pedMesh.receiveShadow=true;scene.add(pedMesh);
  var cap=new THREE.Mesh(new THREE.BoxGeometry(3.1,0.2,3.1),new THREE.MeshLambertMaterial({color:ITEM_COLORS[i]}));
  cap.position.set(px,1.7,pz);scene.add(cap);
  var item=makeTrophy(ITEM_COLORS[i],false,i);item.position.set(px,1.8,pz);item.scale.set(1.2,1.2,1.2);scene.add(item);
  var beam=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,16,10,1,true),new THREE.MeshBasicMaterial({color:ITEM_COLORS[i],transparent:true,opacity:0.22,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  beam.position.set(px,9,pz);scene.add(beam);
  return {i:i,cfg:c,ch:{root:root},mesh:mesh,mat:mat,blob:blob,tag:tag,zz:zz,aim:aim,aimX:aimX,pat:(i<6?0:i<12?1:2),tagSt:-1,ball:ball,state:'sleep',lie:1,ct:0,nextCharge:0,tearT:0,cryT:0,phase:0,ballHide:0,
          tg:null,carrier:null,pst:'sleep',
          move:c.move,home:{x:c.x,z:c.z},ped:{x:px,z:pz,has:true,t:0,pop:1,item:item,beam:beam}};
});

function drawTag(n,st){
  var c=n.cfg,g=n.tag.g;
  g.clearRect(0,0,256,96);roundRect(g,4,4,248,88,18);
  g.fillStyle=st===2?'rgba(120,0,0,.8)':st===1?'rgba(110,70,0,.75)':'rgba(0,0,0,.62)';g.fill();
  g.textAlign='center';g.textBaseline='alphabetic';g.font='bold 33px '+FONT;g.fillStyle='#fff';g.fillText(c.name,128,41,236);
  g.font='bold 30px '+FONT;g.fillStyle=st===2?'#ff8a80':st===1?'#ffd180':'#9cff9c';
  g.fillText((st===2?'☠ ':st===1?'⚠ ':'✔ ')+'⚡ '+fmt(c.speed),128,78,236);
  n.tag.tex.needsUpdate=true;n.tagSt=st;
}
function tagState(n){var r=G.speed/n.cfg.speed;return r>=1?0:r>=0.5?1:2;}
var projectiles=[];
var lastShotToast=0;

/* =========================================================
   기지 칸 (최대 4칸): 전시관(왼쪽) + 러닝머신 패드(오른쪽)
   - 내 칸은 내 저장 데이터(G)로, 친구 칸은 친구가 보내준 수집 현황으로 그려요
   - 칸 안의 모델은 처음 쓰일 때 만들어요 (혼자 할 땐 내 칸 하나만 만들어짐)
   ========================================================= */
/* ---------- 기지 2·3층 (유리 바닥 + 기둥 + 점프 패드) ---------- */
var JPADS=[],jpadCd=0;
(function(){
  var W=BASE_XMAX*2;
  var glass=new THREE.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:0.22,depthWrite:false});
  var edgeM=new THREE.MeshBasicMaterial({color:0x4fc3f7});
  var pillarM=new THREE.MeshLambertMaterial({color:0x37475a});
  for(var f=1;f<FLOOR_Y.length;f++){
    var y=FLOOR_Y[f],zf=FLOOR_FRONT[f],D=zf-Z0;
    var slab=new THREE.Mesh(new THREE.BoxGeometry(W,0.35,D),glass);slab.position.set(0,y-0.18,Z0+D/2);scene.add(slab);
    var ed=new THREE.Mesh(new THREE.BoxGeometry(W,0.4,0.5),edgeM);ed.position.set(0,y-0.1,zf-0.25);scene.add(ed);
    var bk=new THREE.Mesh(new THREE.BoxGeometry(W,1.2,0.5),pillarM);bk.position.set(0,y+0.6,Z0+0.25);scene.add(bk);
    for(var k=0;k<=SLOT_N;k++){
      var px=-BASE_XMAX+k*SLOT_W;
      var pl=new THREE.Mesh(new THREE.BoxGeometry(1.1,y,1.1),pillarM);pl.position.set(px,y/2,zf-0.6);scene.add(pl);
      var pb=new THREE.Mesh(new THREE.BoxGeometry(1.1,y,1.1),pillarM);pb.position.set(px,y/2,Z0+0.6);scene.add(pb);
    }
  }
  /* 점프 패드: 1층 → 2층 (2층 앞 끝 바로 아래), 2층 → 3층 (3층 앞 끝 바로 아래) */
  var padTex=canvasTex(128,128,function(g,w,h){
    var gr=g.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,'#e1f5fe');gr.addColorStop(0.5,'#29b6f6');gr.addColorStop(1,'rgba(2,136,209,0)');
    g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#fff';g.beginPath();g.moveTo(64,22);g.lineTo(96,62);g.lineTo(76,62);g.lineTo(76,100);g.lineTo(52,100);g.lineTo(52,62);g.lineTo(32,62);g.closePath();g.fill();
  });
  SLOT_X.forEach(function(ox){
    [{x:ox+24,y:FLOOR_Y[0],z:FLOOR_FRONT[1]-2.2,to:2},{x:ox-22.5,y:FLOOR_Y[1],z:FLOOR_FRONT[2]-2.2,to:3}].forEach(function(q){
      var d=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.6,0.3,28),new THREE.MeshLambertMaterial({color:0x0277bd}));d.position.set(q.x,q.y+0.15,q.z);scene.add(d);
      var t=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),new THREE.MeshBasicMaterial({map:padTex,transparent:true,depthWrite:false}));
      t.rotation.x=-Math.PI/2;t.position.set(q.x,q.y+0.32,q.z);scene.add(t);q.tex=t;
      var lb=makeSprite(256,80,5.2,1.6);var g=lb.g;roundRect(g,4,4,248,72,16);g.fillStyle='rgba(2,60,110,.85)';g.fill();
      g.textAlign='center';g.textBaseline='middle';g.font='bold 40px '+FONT;g.fillStyle='#fff';g.fillText('⬆ '+q.to+'층',128,42);lb.tex.needsUpdate=true;
      lb.sprite.position.set(q.x,q.y+4.2,q.z);scene.add(lb.sprite);
      JPADS.push(q);
    });
  });
})();
var BASES=SLOT_X.map(function(ox,s){
  var tag=makeSprite(512,128,22,5.5);tag.sprite.position.set(ox,31,-10);tag.sprite.renderOrder=4;scene.add(tag.sprite);
  return {s:s,ox:ox,built:false,g:null,ex:null,pads:null,hall:null,tag:tag,tk:'',hk:'',ok:''};
});
function buildBase(b){
  var ox=b.ox,grp=new THREE.Group();scene.add(grp);
  b.g=grp;b.built=true;
  b.ex=NPCS.map(function(c,i){
    /* 전시대: 앞 절반(낮은 등급)은 2층, 뒤 절반(높은 등급)은 3층 · 한 층에 7열 */
    var per=Math.ceil(N/2),fl=i<per?1:2,j=fl===1?i:i-per,cols=7,rows=Math.ceil(per/cols);
    var col=j%cols,row=Math.floor(j/cols),y0=FLOOR_Y[fl];
    var zf=fl===1?-5:-27,zb=fl===1?-19:-42,zs=rows>1?Math.min(6.8,(zf-zb)/(rows-1)):0;
    var x=ox-27+col*9,z=zf-row*zs;
    var st=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.4,4.2),new THREE.MeshLambertMaterial({color:0x37474f}));
    st.position.set(x,y0+0.7,z);st.castShadow=true;st.receiveShadow=true;grp.add(st);
    var top=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.2,4.6),new THREE.MeshLambertMaterial({color:ITEM_COLORS[i]}));
    top.position.set(x,y0+1.5,z);grp.add(top);
    var dark=makeTrophy(0x222222,true);dark.position.set(x,y0+1.6,z);dark.scale.set(1.15,1.15,1.15);grp.add(dark);
    var lab=makeSprite(256,128,5.3,2.65);lab.sprite.position.set(x,y0+5.6,z);grp.add(lab.sprite);
    return {x:x,y:y0,z:z,real:null,dark:dark,lab:lab,n:-1};
  });
  /* 전시관 간판 */
  var c=document.createElement('canvas');c.width=1024;c.height=256;
  var tex=new THREE.CanvasTexture(c);
  var m=new THREE.Mesh(new THREE.PlaneGeometry(27,6.75),new THREE.MeshBasicMaterial({map:tex}));
  var HY=FLOOR_Y[2]+9;
  m.position.set(ox,HY,-43.9);grp.add(m);
  var frame=new THREE.Mesh(new THREE.BoxGeometry(28,7.7,0.6),new THREE.MeshLambertMaterial({color:0x222222}));
  frame.position.set(ox,HY,-44.5);grp.add(frame);
  [-13.2,13.2].forEach(function(x){var p=new THREE.Mesh(new THREE.BoxGeometry(1,9,1),new THREE.MeshLambertMaterial({color:0x444444}));p.position.set(ox+x,FLOOR_Y[2]+4.5,-44.4);grp.add(p);});
  b.hall={c:c,tex:tex};
  /* 러닝머신 패드 */
  b.pads=TREADS.map(function(t,i){
    var col=i%4,row=Math.floor(i/4),x=ox-18+col*12,z=5+row*9;
    var tx=canvasTex(64,64,function(g){
      g.fillStyle=t.color;g.fillRect(0,0,64,64);g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=6;g.lineCap='round';
      g.beginPath();g.moveTo(14,52);g.lineTo(32,34);g.lineTo(50,52);g.moveTo(14,30);g.lineTo(32,12);g.lineTo(50,30);g.stroke();
    });
    tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(3,3);
    var side=new THREE.MeshLambertMaterial({color:0x263238});
    var topM=new THREE.MeshLambertMaterial({map:tx,transparent:true,opacity:0.4});
    var mesh=new THREE.Mesh(new THREE.BoxGeometry(7.4,0.3,7.4),[side,side,topM,side,side,side]);
    mesh.position.set(x,0.15,z);mesh.receiveShadow=true;grp.add(mesh);
    var lab=makeSprite(256,112,7.6,3.3);lab.sprite.position.set(x,5.2,z);grp.add(lab.sprite);
    return {x:x,z:z,tex:tx,topM:topM,lab:lab,q:0,k:''};
  });
  return b;
}
function getBase(s){var b=BASES[s];if(!b.built)buildBase(b);return b;}
function drawExhibit(b,i,n){
  var e=b.ex[i];if(e.n===n)return;e.n=n;
  if(n>0&&!e.real){e.real=makeTrophy(ITEM_COLORS[i],false,i);e.real.position.set(e.x,e.y+1.6,e.z);e.real.scale.set(1.15,1.15,1.15);b.g.add(e.real);}
  if(e.real)e.real.visible=n>0;e.dark.visible=n<=0;
  var g=e.lab.g,gr=gradeOf(i);
  g.clearRect(0,0,256,128);roundRect(g,4,4,248,120,18);g.fillStyle='rgba(0,0,0,.62)';g.fill();
  g.lineWidth=4;g.strokeStyle=n>0?gr.m:'#455a64';g.stroke();
  g.textAlign='center';g.textBaseline='middle';
  if(n>0){
    g.font='bold 25px '+FONT;g.fillStyle=gr.m;g.fillText('★ '+gr.name+' 등급',128,25,236);
    g.font='bold 26px '+FONT;g.fillStyle='#fff';g.fillText(NPCS[i].name,128,60,236);
    g.font='bold 34px '+FONT;g.fillStyle='#ffd54a';g.fillText('×'+n,128,100);
  }else{g.font='bold 56px '+FONT;g.fillStyle='#78909c';g.fillText('?',128,64);}
  e.lab.tex.needsUpdate=true;
}
/* price: 내 칸이면 가격을 보여주고, 친구 칸이면 null */
function drawPad(b,i,q,price){
  var p=b.pads[i],t=TREADS[i],k=q+'|'+price;if(p.k===k)return;p.k=k;p.q=q;
  var g=p.lab.g;
  p.topM.opacity=q>0?1:0.4;p.topM.needsUpdate=true;
  g.clearRect(0,0,256,112);roundRect(g,4,4,248,104,16);g.fillStyle='rgba(0,0,0,.62)';g.fill();
  g.textAlign='center';g.textBaseline='middle';
  g.font='bold 25px '+FONT;g.fillStyle=t.color==='#37474f'?'#b0bec5':t.color;g.fillText((q>0?'':'🔒 ')+t.name+' 러닝머신'+(q>0?' ×'+q:''),128,30,240);
  g.font='bold 30px '+FONT;g.fillStyle=q>0?'#7fffd4':(price!==null?'#ffd54a':'#78909c');
  g.fillText(q>0?'+'+fmt(t.gain*q)+' 속도 / 1.5초':(price!==null?'💰 '+fmt(price):'아직 없음'),128,76,240);
  p.lab.tex.needsUpdate=true;
}
function drawHall(b,got,who){
  var k=got+'|'+who;if(b.hk===k)return;b.hk=k;
  var g=b.hall.c.getContext('2d');
  g.fillStyle='#10182c';g.fillRect(0,0,1024,256);
  g.strokeStyle='#ffd54a';g.lineWidth=10;g.strokeRect(10,10,1004,236);
  g.textAlign='center';g.textBaseline='middle';
  g.font='bold 92px '+FONT;g.fillStyle='#ffd54a';g.fillText(who?'🏆 '+who+'의 전시관':'🏆 큰 손 전시관',512,95,980);
  g.font='bold 70px '+FONT;g.fillStyle='#fff';g.fillText('수집 현황  '+got+' / '+N,512,191);
  b.hall.tex.needsUpdate=true;
}
function drawEmptyHall(b){
  var g=b.hall.c.getContext('2d');
  g.fillStyle='#10182c';g.fillRect(0,0,1024,256);
  g.strokeStyle='#546e7a';g.lineWidth=10;g.strokeRect(10,10,1004,236);
  g.textAlign='center';g.textBaseline='middle';
  g.font='bold 88px '+FONT;g.fillStyle='#b0bec5';g.fillText('🏠 빈 기지',512,95,980);
  g.font='bold 54px '+FONT;g.fillStyle='#90a4ae';g.fillText('친구가 들어오면 여기가 친구 기지!',512,191,980);
  b.hall.tex.needsUpdate=true;
}
/* 칸 위에 떠 있는 이름표 */
function drawSlotTag(b,txt,mine,empty){
  var k=txt+'|'+mine+'|'+empty;if(b.tk===k)return;b.tk=k;
  var g=b.tag.g;
  g.clearRect(0,0,512,128);roundRect(g,6,6,500,116,26);
  g.fillStyle=empty?'rgba(0,0,0,.35)':'rgba(10,20,45,.82)';g.fill();
  g.lineWidth=8;g.strokeStyle=mine?'#ffd54a':(empty?'rgba(255,255,255,.25)':SLOT_CSS[b.s]);g.stroke();
  g.textAlign='center';g.textBaseline='middle';g.font='bold 58px '+FONT;
  g.fillStyle=mine?'#ffd54a':(empty?'rgba(255,255,255,.45)':'#fff');g.fillText(txt,256,66,480);
  b.tag.tex.needsUpdate=true;b.tag.sprite.material.opacity=empty?0.7:1;
}
function myBase(){return getBase(mySlot);}
var exhibits=myBase().ex, pads=myBase().pads;
function updateExhibit(i){drawExhibit(myBase(),i,G.counts[i]);}
function updateHall(){drawHall(myBase(),G.counts.filter(function(c){return c>0;}).length,'');}
function treadPrice(i){return Math.round(TREADS[i].price*Math.pow(PRICE_GROWTH,G.qty[i]));}
function updatePad(i){drawPad(myBase(),i,G.qty[i],treadPrice(i));}
function redrawMyBase(){for(var i=0;i<N;i++)updateExhibit(i);for(var j=0;j<TREADS.length;j++)updatePad(j);updateHall();}
/* 내 칸 바꾸기 (방장이 정해줘요). 기지 안에 있으면 새 칸으로 이동 */
function setMySlot(s){
  s=s|0;if(s<0||s>=SLOT_N)s=SLOT_ORDER[0];
  if(s===mySlot)return;
  var old=mySlot;mySlot=s;
  var b=myBase();exhibits=b.ex;pads=b.pads;
  redrawMyBase();
  if(!DG.on&&P.z<BASE_Z1){
    P.x=slotX(s)+SPAWN_DX;P.z=SPAWN_Z;P.y=0;P.gy=0;P.vy=0;P.kx=P.kz=0;P.cz=P.z;
    camPos.set(P.x,12,P.z-12);
  }
  refreshBases(true);
  if(NET.mode!=='solo')toast('🏠 내 기지 칸이 정해졌어요! 노란 이름표 「🏠 내 기지」가 떠 있는 칸이에요','good');
}
/* 칸마다 누가 쓰는지 → 이름표·바닥색·친구 수집품 그리기 */
var basesT=0;
function nArr(a,len){var o=[];for(var i=0;i<len;i++)o.push(Math.max(0,(a&&a[i])|0));return o;}
function refreshBases(force){
  var occ=SLOT_X.map(function(){return [];});
  for(var id in REM){var r=REM[id];if(r.init&&r.slot>=0&&r.slot<SLOT_N)occ[r.slot].push(r);}
  BASES.forEach(function(b,s){
    var list=occ[s],mine=s===mySlot,names=list.map(function(r){return r.name||'친구';});
    var txt=mine?(names.length?'🏠 내 기지 · '+names.join(', '):'🏠 내 기지'):(names.length?'🏠 '+names.join(', ')+'의 기지':'🏠 빈 기지');
    drawSlotTag(b,txt,mine,!mine&&!names.length);
    SLOT_FLOOR[s].material.opacity=mine?0.3:0.18;
    if(mine){if(b.built)b.g.visible=true;return;}
    var o=null;for(var k=0;k<list.length;k++)if(list[k].bc){o=list[k];break;}
    b.owner=o?o.id:null;
    var bb=getBase(s);bb.g.visible=true;
    if(!o){
      /* 빈 칸도 기지 모양은 그대로 보여줘요 (받침대 ? · 잠긴 러닝머신) */
      if(!force&&bb.ok==='empty')return;bb.ok='empty';
      for(var ei=0;ei<N;ei++)drawExhibit(bb,ei,0);
      for(var pj=0;pj<TREADS.length;pj++)drawPad(bb,pj,0,null);
      drawHall(bb,0,'');bb.hk='empty';drawEmptyHall(bb);
      return;
    }
    var key=o.id+'|'+o.bc.join(',')+'|'+(o.bq||[]).join(',')+'|'+o.name;
    if(!force&&bb.ok===key)return;bb.ok=key;
    var got=0;
    for(var i=0;i<N;i++){drawExhibit(bb,i,o.bc[i]|0);if(o.bc[i]>0)got++;}
    for(var j=0;j<TREADS.length;j++)drawPad(bb,j,(o.bq&&o.bq[j])|0,null);
    drawHall(bb,got,o.name||'친구');
  });
}

/* 기지 대문 (가운데) */
(function(){
  var c=document.createElement('canvas');c.width=1024;c.height=200;
  var g=c.getContext('2d');
  g.fillStyle='#0d2b5c';g.fillRect(0,0,1024,200);g.strokeStyle='#4fc3f7';g.lineWidth=10;g.strokeRect(8,8,1008,184);
  g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.font='bold 74px '+FONT;g.fillText('🏠 기지 입구 · 안전존',512,70);
  g.fillStyle='#ffd54a';g.font='bold 48px '+FONT;g.fillText("Steal a Roh",512,142);
  var tex=new THREE.CanvasTexture(c);
  [-1,1].forEach(function(s){
    var m=new THREE.Mesh(new THREE.PlaneGeometry(36,7),new THREE.MeshBasicMaterial({map:tex}));
    m.position.set(0,16.5,BASE_Z1+s*0.7);m.rotation.y=s<0?Math.PI:0;scene.add(m);
  });
  var pm=new THREE.MeshLambertMaterial({color:0x1d4a8f});
  [-29,29].forEach(function(x){var p=new THREE.Mesh(new THREE.BoxGeometry(2,16,2),pm);p.position.set(x,8,BASE_Z1);scene.add(p);});
  var beam=new THREE.Mesh(new THREE.BoxGeometry(60,1.2,1.6),pm);beam.position.set(0,12.6,BASE_Z1);scene.add(beam);
  var top=new THREE.Mesh(new THREE.BoxGeometry(60,1.2,1.6),pm);top.position.set(0,20.4,BASE_Z1);scene.add(top);
})();

/* =========================================================
   상점
   ========================================================= */
var shopBtns=[],shopMeta=[];
TREADS.forEach(function(t,i){
  var row=document.createElement('div');row.className='row';
  var nm=document.createElement('div');nm.className='nm';
  var b=document.createElement('button');
  b.addEventListener('click',function(){buy(i);});
  row.appendChild(nm);row.appendChild(b);$('shopRows').appendChild(row);
  shopBtns.push(b);shopMeta.push(nm);
});
function refreshShop(){refreshSkins();
  TREADS.forEach(function(t,i){
    shopMeta[i].innerHTML='<b style="color:'+(t.color==='#37474f'?'#b0bec5':t.color)+'">'+t.name+' 러닝머신</b> <span style="color:#9fb3c8">보유 '+G.qty[i]+'</span><small>1.5초당 +'+fmt(t.gain)+' 속도'+(G.qty[i]>1?' (현재 +'+fmt(t.gain*G.qty[i])+')':'')+'</small>';
    shopBtns[i].textContent='💰 '+fmt(treadPrice(i));
    shopBtns[i].disabled=G.money<treadPrice(i);
  });
}
function buy(i){
  var pr=treadPrice(i);
  if(G.money<pr){sfx.deny();return;}
  G.money-=pr;G.qty[i]++;sfx.buy();
  toast('🏃 '+TREADS[i].name+' 러닝머신 구매! 기지의 패드 위에 올라가 보세요','good');
  updatePad(i);refreshShop();save();
}

/* =========================================================
   게임 로직
   ========================================================= */
var started=false,saveT=0,hudT=0,toastWarnT=0;
var keys={},joy={x:0,y:0},wantJump=false,jumpHeld=false;
var cam={yaw:Math.PI,pitch:0.42,dist:17},camPos=new THREE.Vector3(slotX(mySlot),10,-10);
var wasSafe=true;

function wake(n){
  n.state='chase';n.nextCharge=rand(1,9);n.tearT=0;n.cryT=0;
  var d=Math.hypot(P.x-n.ch.root.position.x,P.z-n.ch.root.position.z);
}
function comboMult(){return 1+0.1*Math.min(G.streak,10);}
function trySteal(){
  if(started&&DG.on){dgAttack();return;}
  if(started&&P.stun<=0&&P.carry<0&&Math.hypot(P.x-PORTAL.x,P.z-PORTAL.z)<5){dgPickOpen();return;}
  if(!started||P.stun>0)return;
  if(P.carry>=0){toast('이미 아이템을 들고 있어! 기지로 가자','warn');return;}
  var sn=findSnatch();if(sn){startSnatch(sn);return;}
  var rd=findRaid();if(rd){startRaid(rd);return;}
  var best=null,bd=6;
  for(var k=0;k<npcs.length;k++){
    var n=npcs[k],d=Math.hypot(P.x-n.ped.x,P.z-n.ped.z);
    if(d<bd){bd=d;best=n;}
  }
  if(!best)return;
  if(!best.ped.has){toast('받침대가 비었어! 곧 다시 생겨','warn');sfx.deny();return;}
  if(best.state!=='sleep'){toast('이미 깨어 있어!','warn');sfx.deny();return;}
  if(isClient()){
    /* 친구 방: 방장에게 "훔쳐도 돼?" 물어보고 허락받으면 들기 */
    var nowS=performance.now();if(stealPend>nowS)return;
    stealPend=nowS+1500;sendHost({t:'steal',i:best.i});return;
  }
  hostTake(NET.my,best);
  grantSteal(best.i);
}
var stealPend=0;
/* 방장(혼자일 때도): 받침대 비우고 주인을 깨워서 그 사람을 쫓게 함 */
function hostTake(id,n){
  n.ped.has=false;n.ped.t=RESPAWN;n.tg=id;n.carrier=id;wake(n);
  if(id!==NET.my&&REM[id])REM[id].carry=n.i;
}
function hostSteal(id,i,reply){
  var n=npcs[i],r=REM[id];
  if(!n||!r){reply(false,'훔치기 실패');return;}
  if(r.carry>=0){reply(false,'이미 아이템을 들고 있어!');return;}
  if(!n.ped.has){reply(false,'받침대가 비었어! 곧 다시 생겨');return;}
  if(n.state!=='sleep'){reply(false,'다른 친구가 먼저 훔쳤어!');return;}
  hostTake(id,n);reply(true);
}
function hostDrop(id,i){
  var n=npcs[i],r=REM[id];if(r)r.carry=-1;if(!n)return;
  if(n.carrier===id){n.carrier=null;if(!n.ped.has){n.ped.has=true;n.ped.pop=0;}}
  if(n.tg===id&&(n.state==='chase'||n.state==='charge')){n.state='return';n.tg=null;hideAim(n);}
}
function hostDep(id,i){
  var n=npcs[i],r=REM[id];if(r)r.carry=-1;if(!n)return;
  if(n.carrier===id)n.carrier=null;
  if(n.tg===id&&(n.state==='chase'||n.state==='charge')){n.state='return';n.tg=null;hideAim(n);}
}
function grantSteal(i){
  var best=npcs[i];
  if(P.carry>=0)return;
  best.ped.has=false;
  P.carry=best.i;
  holdTrophies.forEach(function(t,k){t.visible=(k===P.carry);});
  burst(best.ped.x,3,best.ped.z,'#ffe082',26,9);
  sfx.steal();
  var reward=Math.round((best.cfg.income*15+5)*comboMult());gainMoney(reward);
  floatText('+💰 '+fmt(reward),VW()/2,VH()*0.4,0,'money');
  burst(P.x,5,P.z,'#ffd54a',18,7);
  toast('🏆 '+best.cfg.name+'의 ['+gradeOf(best.i).name+'] 큰 손을 훔쳤다! 💰+'+fmt(reward)+' 기지로 도망쳐!','good');
  wake(best);
}
function dropItem(){
  if(P.carry<0)return -1;
  if(P.raid){var ri=P.carry;sendPeer(P.raid,{t:'raidBack',i:ri,why:'drop'});P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});return ri;}
  var i=P.carry,n=npcs[i];
  if(!n.ped.has){n.ped.has=true;n.ped.pop=0;}
  if(isClient())sendHost({t:'drop',i:i});else n.carrier=null;
  P.carry=-1;holdTrophies.forEach(function(t){t.visible=false;});
  return i;
}
function hitPlayer(n,pw,kx,kz){
  if(P.stun>0||inSafe())return;
  P.stun=STUN*(1+0.9*(pw||0));hitFx(pw,kx,kz);
  var wasRaid=!!P.raid,i=dropItem();
  burst(P.x,3,P.z,'#ffffff',22,8);burst(P.x,3,P.z,'#ffd54a',14,6);
  if(!(i>=0&&playCaught()))sfx.hit();
  if(i>=0&&G.streak>=2)toast('💔 콤보 '+G.streak+' 끊김...','bad');
  if(i>=0)G.streak=0;
  toast(i>=0?(wasRaid?'💥 맞았다! 훔친 큰 손이 주인에게 돌아갔어':'💥 잡혔다! 큰 손이 받침대로 돌아갔어'):'💥 맞았다!','bad');
  if(i>=0&&!wasRaid){var o=npcs[i];if(o.state==='chase'||o.state==='charge'){o.state='return';o.tg=null;hideAim(o);}}
}
/* =========================================================
   친구 기지 털기
   - 친구 칸 트로피 앞에서 [E] → 주인에게 "하나 가져갈게" 요청 → 주인 쪽에서 하나 빠짐
   - 내 칸(노란 이름표)까지 들고 가면 내 것 · 가는 길에 주인 몸에 닿으면 잡혀서 돌려줌
   - 들고 있다가 NPC에게 맞거나, 도둑이 나가버리면 주인에게 돌아가요
   ========================================================= */
var RAID_RANGE=3.6, RAID_CATCH=2.6, RAIDS_OUT={}, raidPend=0;
P.raid=null;P.raidName='';
function inMySlot(){return P.z<BASE_Z1&&Math.abs(P.x-slotX(mySlot))<SLOT_W/2;}
function slotAt(x,z){if(z>=BASE_Z1)return -1;var s=Math.floor((x+BASE_XMAX)/SLOT_W);return s>=0&&s<SLOT_N?s:-1;}
function findRaid(){
  if(NET.mode==='solo'||DG.on||P.carry>=0||P.stun>0)return null;
  var s=slotAt(P.x,P.z);if(s<0||s===mySlot)return null;
  var b=BASES[s];if(!b.built||!b.owner)return null;
  var o=REM[b.owner];if(!o||!o.bc)return null;
  var best=null,bd=RAID_RANGE;
  for(var i=0;i<N;i++){
    if(!(o.bc[i]>0))continue;
    var e=b.ex[i],d=Math.hypot(P.x-e.x,P.z-e.z);
    if(Math.abs(P.y-e.y)>3)continue; /* 같은 층에 있어야 훔칠 수 있어요 */
    if(d<bd){bd=d;best={b:b,o:o,i:i,e:e};}
  }
  return best;
}
/* 남이 들고 가는 큰 손 뺏기 ([E]) */
var SNATCH_RANGE=4.5,snatchPend=0;
function findSnatch(){
  if(NET.mode==='solo'||DG.on||P.carry>=0||P.stun>0)return null;
  var best=null,bd=SNATCH_RANGE;
  for(var id in REM){
    var r=REM[id];if(!r.init||r.dg||r.vc<0||r.vc>=N||r.stun)continue;
    var d=Math.hypot(r.x-P.x,r.z-P.z);
    if(d<bd&&Math.abs(r.y-P.y)<3){bd=d;best=r;}
  }
  return best;
}
function startSnatch(r){
  var now=performance.now();if(snatchPend>now)return;
  snatchPend=now+1200;sendPeer(r.id,{t:'snatch',i:Math.max(0,r.vc)});
}
/* 방장: NPC 큰 손을 든 사람이 바뀜 → 녀석이 새 사람을 쫓아요 */
function hostSnatch(id,i){
  var n=npcs[i];if(!n)return;
  for(var k in REM)if(REM[k].carry===i)REM[k].carry=-1;
  if(id!==NET.my&&REM[id])REM[id].carry=i;
  n.carrier=id;n.ped.has=false;n.tg=id;
  if(n.state!=='chase'&&n.state!=='charge'){n.state='chase';n.nextCharge=rand(1,9);}
}
function startRaid(rd){
  var now=performance.now();if(raidPend>now)return;
  raidPend=now+1500;
  sendPeer(rd.o.id,{t:'raid',i:rd.i});
}
function raidName(id){var r=REM[id];return (r&&r.name)||'친구';}
function raidRefund(i,msg){
  G.counts[i]++;updateExhibit(i);updateHall();
  var e=exhibits[i];burst(e.x,3,e.z,'#7fffd4',24,8);
  toast(msg,'good');save();
}
function onRaidMsg(m){
  var from=m.from,i=m.i|0;if(!from||i<0||i>=N)return;
  switch(m.t){
    case 'snatch': /* 내가 들고 가던 걸 누가 뺏으려 함 */
      var sr=REM[from],sd=sr?Math.hypot(sr.x-P.x,sr.z-P.z):99;
      if(P.carry<0||DG.on||sd>9){sendPeer(from,{t:'snatchR',i:0,ok:0});break;}
      var si=P.carry,so=P.raid||'';
      P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});
      P.stun=Math.max(P.stun,1.2);burst(P.x,3,P.z,'#ffffff',18,7);sfx.hit();
      if(!so&&NET.mode==='host')hostSnatch(from,si);
      toast('😱 '+raidName(from)+' 님이 내가 들고 있던 ['+gradeOf(si).name+'] 큰 손을 뺏어갔어!','bad');
      sendPeer(from,{t:'snatchR',i:si,ok:1,o:so});
      break;
    case 'snatchR': /* 뺏기 결과 */
      snatchPend=0;
      if(!m.ok){toast('놓쳤다! 이미 떨어뜨렸나 봐','warn');sfx.deny();break;}
      var own=typeof m.o==='string'?m.o:'';
      if(own===NET.my){ /* 내 트로피를 도둑에게서 되찾음 */
        if(RAIDS_OUT[from]!==undefined){var ri=RAIDS_OUT[from];delete RAIDS_OUT[from];raidRefund(ri,'🛡️ '+raidName(from)+' 님에게서 내 ['+gradeOf(ri).name+'] 큰 손을 되찾았다!');}
        break;
      }
      if(own)sendPeer(own,{t:'raidXfer',i:i,old:from});
      if(P.carry>=0){ /* 그 사이 다른 걸 들었으면 돌려보내기 */
        if(own)sendPeer(own,{t:'raidBack',i:i,why:'drop'});
        else if(NET.mode==='host'){var dn=npcs[i];dn.carrier=null;if(!dn.ped.has){dn.ped.has=true;dn.ped.pop=0;}}
        else sendHost({t:'drop',i:i});
        break;
      }
      P.carry=i;P.raid=own||null;P.raidName=own?raidName(own):'';G.x.st.snatch++;
      if(!own){if(NET.mode==='host')hostSnatch(NET.my,i);else sendHost({t:'snat',i:i});}
      holdTrophies.forEach(function(t,k){t.visible=(k===i);});
      burst(P.x,5,P.z,'#ffd54a',22,8);sfx.steal();
      toast('🫳 '+raidName(from)+' 님에게서 ['+gradeOf(i).name+'] 큰 손을 뺏었다! '+(own?'노란 「🏠 내 기지」 칸으로!':'기지로 도망쳐!'),'good');
      break;
    case 'raidXfer': /* 주인: 내 트로피를 든 사람이 바뀜 */
      var old=String(m.old||'');
      if(RAIDS_OUT[old]===undefined)break;
      RAIDS_OUT[from]=RAIDS_OUT[old];delete RAIDS_OUT[old];
      toast('🔁 이제 '+raidName(from)+' 님이 내 큰 손을 들고 있어! 쫓아가!','warn');
      break;
    case 'raid': /* 주인: 누가 내 트로피를 가져가려 해요 */
      var ok=G.counts[i]>0&&RAIDS_OUT[from]===undefined;
      if(ok){
        G.counts[i]--;RAIDS_OUT[from]=i;updateExhibit(i);updateHall();save();
        var e=exhibits[i];burst(e.x,3,e.z,'#ff5252',26,9);
        sfx.deny();
        toast('🚨 '+raidName(from)+' 님이 내 ['+gradeOf(i).name+'] 큰 손을 훔쳐갔어! 쫓아가서 몸으로 잡아!','bad');
      }
      sendPeer(from,{t:'raidR',i:i,ok:ok?1:0});
      break;
    case 'raidR': /* 도둑: 주인 대답 */
      raidPend=0;
      if(!m.ok){toast('이미 다른 사람이 가져갔어!','warn');sfx.deny();break;}
      if(P.carry>=0||DG.on){sendPeer(from,{t:'raidBack',i:i,why:'drop'});break;}
      P.carry=i;P.raid=from;P.raidName=raidName(from);
      holdTrophies.forEach(function(t,k){t.visible=(k===i);});
      burst(P.x,5,P.z,'#ffd54a',22,8);sfx.steal();
      toast('🦝 '+P.raidName+'의 ['+gradeOf(i).name+'] 큰 손을 훔쳤다! 노란 「🏠 내 기지」 칸으로 가져가! 주인에게 닿으면 뺏겨요','good');
      break;
    case 'raidBack': /* 주인: 돌려받음 */
      if(RAIDS_OUT[from]===undefined)break;
      var bi=RAIDS_OUT[from];delete RAIDS_OUT[from];
      raidRefund(bi,m.why==='caught'?'🛡️ 도둑 '+raidName(from)+' 님을 잡았다! ['+gradeOf(bi).name+'] 큰 손을 되찾았어':'🛡️ '+raidName(from)+' 님이 떨어뜨려서 ['+gradeOf(bi).name+'] 큰 손이 돌아왔어');
      break;
    case 'raidDone': /* 주인: 결국 뺏김 */
      if(RAIDS_OUT[from]===undefined)break;
      delete RAIDS_OUT[from];
      toast('😭 '+raidName(from)+' 님이 내 ['+gradeOf(i).name+'] 큰 손을 자기 기지로 가져갔어...','bad');
      break;
  }
}
/* 도둑: 주인 몸에 닿으면 잡힘 */
function raidCatchCheck(){
  if(P.stun>0)return;
  var r=REM[P.raid];if(!r||!r.init||r.dg||r.stun)return;
  if(Math.hypot(r.x-P.x,r.z-P.z)<RAID_CATCH&&Math.abs(r.y-P.y)<2.4){
    var i=P.carry,nm=P.raidName;
    sendPeer(P.raid,{t:'raidBack',i:i,why:'caught'});
    P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});
    P.stun=STUN;hitFx(0,0,0);burst(P.x,3,P.z,'#ffffff',22,8);sfx.hit();
    toast('💥 '+nm+' 님에게 잡혔다! 큰 손을 돌려줬어','bad');
  }
}
/* 도둑: 내 칸에 도착 → 내 것! */
function raidDeposit(){
  G.x.st.raid++;
  var i=P.carry,o=P.raid,nm=P.raidName;
  G.counts[i]++;P.carry=-1;P.raid=null;holdTrophies.forEach(function(t){t.visible=false;});
  updateExhibit(i);updateHall();
  var e=exhibits[i];burst(e.x,3,e.z,'#ffd54a',30,9);
  sfx.deposit();
  toast('✅ '+nm+' 님의 ['+gradeOf(i).name+'] 큰 손을 내 기지로 가져왔다! (+'+fmt(npcs[i].cfg.income)+'/초)','good');
  sendPeer(o,{t:'raidDone',i:i});
  save();
}
function deposit(){
  G.x.st.steal++;
  var i=P.carry,n=npcs[i];
  G.counts[i]++;G.streak++;P.carry=-1;holdTrophies.forEach(function(t){t.visible=false;});
  updateExhibit(i);updateHall();
  var e=exhibits[i];burst(e.x,3,e.z,'#ffd54a',30,9);
  sfx.deposit();
  toast('✅ 획득! ['+gradeOf(i).name+'] 큰 손 · '+n.cfg.name+' (+'+fmt(n.cfg.income)+'/초)','good');
  floatText('+'+fmt(n.cfg.income)+'/초',VW()/2,VH()*0.45,0,'money');
  var dBonus=Math.round(n.cfg.income*20*comboMult());gainMoney(dBonus);
  floatText('🔥 콤보 ×'+G.streak+' · 입금 보너스 +'+fmt(dBonus),VW()/2,VH()*0.52,0,'money');
  if(isClient())sendHost({t:'dep',i:i});else n.carrier=null;
  if(n.state==='chase'||n.state==='charge'){n.state='return';n.tg=null;hideAim(n);}
  save();
}
function hideAim(n){n.aim.visible=false;n.aimX[0].visible=false;n.aimX[1].visible=false;}
var PAT_LABEL=['⚠️ 발사 주의! 조준선을 피해!','⚠️ 2연발 주의! 한 번 더 와요!','⚠️ 부채꼴 3발! 점프하거나 크게 벗어나요!'];
var pendingShots=[];
function spawnProj(rp,ang,sp){
  var ux=Math.sin(ang),uz=Math.cos(ang);
  var m=makeProj(2.6);m.position.set(rp.x+ux*4,1.3,rp.z+uz*4);scene.add(m);
  projectiles.push({mesh:m,vx:ux*sp,vz:uz*sp,life:6});
}
function shoot(n){cast(n);return;
  var rp=n.ch.root.position,dx=P.x-rp.x,dz=P.z-rp.z,ang=Math.atan2(dx,dz),sp=n.move*1.5;
  if(n.pat===2){spawnProj(rp,ang-0.2,sp);spawnProj(rp,ang,sp);spawnProj(rp,ang+0.2,sp);}
  else{spawnProj(rp,ang,sp);if(n.pat===1)pendingShots.push({n:n,t:0.32});}
  n.state='chase';n.nextCharge=rand(1,9);n.ballHide=0.9;hideAim(n);n.ball.visible=false;
  var now=performance.now()/1000;
  if(AC&&Math.hypot(dx,dz)<120&&now-lastShootSfx>0.15){lastShootSfx=now;sfx.shoot();}
}
/* =========================================================
   수호자 고유 스킬 (속도↑ → 이펙트 화려 + 위력↑)
   p = 0(가장 느림) ~ 1(가장 빠름): 속도를 로그 스케일로 정규화
   ========================================================= */
P.vx=P.vz=P.kx=P.kz=0;
var shk=0,flashA=0,sx0=P.x,sz0=P.z,flashEl=document.createElement('div');
flashEl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:14;opacity:0;background:#fff';
document.body.appendChild(flashEl);
function pwr(n){return clamp(Math.log(n.cfg.speed/SPEED_MIN)/Math.log(SPEED_MAX/SPEED_MIN),0,1);}
function pcol(c,p,k){return p>0.8?'hsl('+(((k*47+clock*220)%360)|0)+',95%,62%)':c;}
var ringG=new THREE.RingGeometry(0.88,1,48).rotateX(-Math.PI/2),discG=new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2),
    pilG=new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,0.5,0),boxG=new THREE.BoxGeometry(1,1,1);
function gm(c,o){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});}
function mk(g,m,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o;}
var HZ=[];
function addH(o){HZ.push(o);return o;}
function after(d,f){HZ.push({t:d,q:1,f:f});}
function pred(d){return {x:P.x+P.vx*d*0.8,z:P.z+P.vz*d*0.8};}
function nearVol(x,z){return Math.hypot(P.x-x,P.z-z);}

function hitFx(pw,kx,kz){
  pw=pw||0;shk=Math.max(shk,1+pw*3);flashA=Math.max(flashA,0.15+pw*0.5);
  var m=Math.hypot(kx||0,kz||0),v=8+pw*42;
  if(m>0){P.kx=kx/m*v;P.kz=kz/m*v;}
  floatText('💥 위력 '+Math.round(100+pw*400)+'%',VW()/2,VH()*0.33,0,'money');
  if(pw>0.4)for(var i=0;i<60*pw*fxMul;i++)emit(P.x,3,P.z,rand(-14,14),rand(2,16),rand(-14,14),pcol('#ffffff',pw,i),rand(0.5,1),20);
}
function fxBoom(x,z,r,col,pw){
  var nR=fxLevel?1+Math.floor(pw*3):1,i;
  for(i=0;i<nR;i++)(function(i){
    var m=gm(col,0.9),o=mk(ringG,m,x,0.4+i*0.1,z),t=-i*0.08;
    addH({u:function(dt){t+=dt;var k=Math.max(0,t)/0.5,s=r*(0.3+k*1.1);o.scale.set(s,1,s);m.opacity=Math.max(0,0.9-k);return k>=1;},x:function(){scene.remove(o);m.dispose();}});
  })(i);
  if(fxLevel&&pw>0.2){
    var hgt=5+pw*40,pm=gm(col,0.55),pl=mk(pilG,pm,x,0,z),t2=0;
    addH({u:function(dt){t2+=dt;var k=t2/0.6,w=r*0.45*(1-k*0.6);pl.scale.set(w,hgt*(0.4+k*0.6),w);pm.opacity=0.55*(1-k);return k>=1;},x:function(){scene.remove(pl);pm.dispose();}});
  }
  var n=(14+pw*110)*fxMul;
  for(i=0;i<n;i++){var a=Math.random()*6.283,s=rand(0.3,1)*(6+r*1.4+pw*10);emit(x+Math.cos(a)*r*0.2,0.5,z+Math.sin(a)*r*0.2,Math.cos(a)*s,rand(2,8+pw*16),Math.sin(a)*s,pcol(col,pw,i),rand(0.5,1.1),22);}
  var d=nearVol(x,z);
  shk=Math.max(shk,(0.4+pw*2.4)*clamp(1-d/90,0,1));
  if(pw>0.45)flashA=Math.max(flashA,(pw-0.35)*0.7*clamp(1-d/60,0,1));
  if(AC&&d<140){noise(0.25+pw*0.6,0.25+pw*0.5,400+pw*1800);tone(180-pw*110,0.25+pw*0.4,'sawtooth',0.12+pw*0.18,-60);if(pw>0.6)tone(70,0.6,'sine',0.3,-30);}
}
/* 바닥 폭발 구역: 경고 → 폭발. 점프로 피할 수 있음 */
function Z(x,z,r,d,col,pw,o){
  o=o||{};x=clamp(x,-28,28);
  var fm=gm(0xff2020,0.2),fill=mk(discG,fm,x,0.2,z),rg=mk(ringG,gm(col,0.9),x,0.22,z),
      rg2=pw>0.3&&fxLevel?mk(ringG,gm(col,0.6),x,0.24,z):null,rg3=pw>0.7&&fxLevel?mk(ringG,gm(0xffffff,0.5),x,0.26,z):null,t=0;
  rg.scale.set(r,1,r);
  addH({u:function(dt){
    t+=dt;var k=Math.min(1,t/d);
    fill.scale.set(r*k,1,r*k);fm.opacity=0.15+0.3*k;rg.rotation.y=t*3;
    if(rg2){rg2.rotation.y=-t*4;rg2.scale.set(r*0.7,1,r*0.7);}
    if(rg3){rg3.rotation.y=t*6;rg3.scale.set(r*0.4,1,r*0.4);}
    if(o.pull&&!inSafe()){var dx=x-P.x,dz=z-P.z,dd=Math.hypot(dx,dz)||1;if(dd<r*1.6){P.x+=dx/dd*o.pull*dt;P.z+=dz/dd*o.pull*dt;}}
    if(t<d)return 0;
    if(!inSafe()&&P.stun<=0&&nearVol(x,z)<r&&P.y<(o.hi||1.6)){var a=Math.atan2(P.x-x,P.z-z);hitPlayer(o.n,pw,Math.sin(a),Math.cos(a));}
    fxBoom(x,z,r,col,pw);return 1;
  },x:function(){scene.remove(fill);scene.remove(rg);fm.dispose();rg.material.dispose();
    if(rg2){scene.remove(rg2);rg2.material.dispose();}if(rg3){scene.remove(rg3);rg3.material.dispose();}}});
}
/* 발사체 (유도/지면형 옵션) */
function O(n,ang,sp,size,col,pw,o){
  o=o||{};
  var rp=n.ch.root.position,ux=Math.sin(ang),uz=Math.cos(ang),s=makeProj(size);
  s.position.set(rp.x+ux*4,1.3,rp.z+uz*4);scene.add(s);
  var hm=new THREE.SpriteMaterial({map:haloTex,color:col,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending}),h=new THREE.Sprite(hm),hs=size*(1.6+pw*2.2);
  h.scale.set(hs,hs,1);h.renderOrder=3;scene.add(h);
  var vx=ux*sp,vz=uz*sp,life=o.life||6,hr=o.hr||size*0.55;
  addH({u:function(dt){
    var TT=o.T||P;
    if(o.turn&&TT.z>=BASE_Z1){var ca=lerpAngle(Math.atan2(vx,vz),Math.atan2(TT.x-s.position.x,TT.z-s.position.z),Math.min(1,o.turn*dt));vx=Math.sin(ca)*sp;vz=Math.cos(ca)*sp;}
    s.position.x+=vx*dt;s.position.z+=vz*dt;h.position.copy(s.position);s.material.rotation+=dt*14;life-=dt;
    var tr=(4+pw*40)*dt*fxMul;
    for(var i=0;i<tr;i++)emit(s.position.x+rand(-.5,.5),1.2+rand(-.4,.4),s.position.z+rand(-.5,.5),-vx*0.12+rand(-2,2),rand(-1,3),-vz*0.12+rand(-2,2),pcol(col,pw,i),rand(0.3,0.7),4);
    if(!inSafe()&&P.stun<=0&&nearVol(s.position.x,s.position.z)<hr&&P.y<(o.gnd?1.8:2.2)){
      hitPlayer(n,pw,vz/sp,-vx/sp);if(pw>0.3)fxBoom(s.position.x,s.position.z,size*(1+pw*1.5),col,pw*0.7);life=0;
    }
    return life<=0||Math.abs(s.position.x)>45;
  },x:function(){scene.remove(s);scene.remove(h);s.material.dispose();hm.dispose();}});
}
/* 광선: 가늘게 경고 → 굵게 발사. 옆으로 피해야 함 */
function Bm(n,ang,w,tel,dur,col,pw){
  var rp=n.ch.root.position,x0=rp.x,z0=rp.z,L=170,ux=Math.sin(ang),uz=Math.cos(ang),m=gm(0xff2020,0.5),b=mk(boxG,m,x0+ux*L/2,1.4,z0+uz*L/2),t=0,hit=0;
  b.rotation.y=ang;b.scale.set(0.5,0.2,L);
  addH({u:function(dt){
    t+=dt;
    if(t<tel){m.opacity=(Math.floor(t*16)%2)?0.7:0.15;return 0;}
    if(t-dt<tel){m.color.set(col);b.scale.y=w*0.8+1.5;}
    var k=(t-tel)/dur;b.scale.x=w*(1-k*0.4)*(0.85+0.15*Math.sin(t*60));m.opacity=0.85*(1-k*k);
    var tx=P.x-x0,tz=P.z-z0,al=tx*ux+tz*uz,sd=tx*uz-tz*ux;
    if(!hit&&!inSafe()&&P.stun<=0&&al>0&&al<L&&Math.abs(sd)<w*0.5+0.8&&P.y<4){hit=1;var sg=sd>=0?1:-1;hitPlayer(n,pw,uz*sg,-ux*sg);}
    var tr=(10+pw*60)*dt*fxMul;
    for(var i=0;i<tr;i++){var q=rand(3,L);emit(x0+ux*q+rand(-w,w)*0.5,rand(0.5,3),z0+uz*q+rand(-w,w)*0.5,rand(-3,3),rand(0,5),rand(-3,3),pcol(col,pw,i),0.5,10);}
    return k>=1;
  },x:function(){scene.remove(b);m.dispose();}});
}
/* 휩쓸기 벽: 점프로 넘기 */
function Wl(n,col,pw){
  var z=n.ch.root.position.z,m=gm(0xff2020,0.3),h=0.9+pw*0.7,b=mk(boxG,m,0,h/2*2,z),t=0,vz=-(n.move*1.2+10+pw*30),th=1.4+pw*2,hit=0;
  b.scale.set(60,h*2,th);b.position.y=h;
  addH({u:function(dt){
    t+=dt;
    if(t<0.7){m.opacity=(Math.floor(t*14)%2)?0.55:0.15;return 0;}
    if(t-dt<0.7)m.color.set(col);
    m.opacity=0.8;b.position.z+=vz*dt;
    if(!hit&&!inSafe()&&P.stun<=0&&Math.abs(P.z-b.position.z)<th/2+0.9&&P.y<h*2-0.1){hit=1;hitPlayer(n,pw,0,-1);}
    var tr=(20+pw*100)*dt*fxMul;
    for(var i=0;i<tr;i++)emit(rand(-29,29),rand(0.3,h*2),b.position.z+rand(-1,1),rand(-2,2),rand(0,4),-vz*0.2,pcol(col,pw,i),0.4,6);
    return b.position.z<P.z-30||b.position.z<Z0;
  },x:function(){scene.remove(b);m.dispose();}});
}
/* 파동: 중심에서 퍼지는 고리. 점프로 넘기 */
function Wv(n,x,z,R,col,pw){
  x=clamp(x,-28,28);
  var m=gm(col,0.9),o=mk(ringG,m,x,0.3,z),m2=gm(0xff2020,0.2),f=mk(discG,m2,x,0.2,z),t=0,hit=0;
  f.scale.set(R,1,R);
  addH({u:function(dt){
    t+=dt;
    if(t<0.7){o.scale.set(R,1,R);m.opacity=(Math.floor(t*14)%2)?0.8:0.2;m2.opacity=0.1+0.2*t;return 0;}
    var k=(t-0.7)/0.55,rr=Math.max(0.1,R*k);o.scale.set(rr,1,rr);m.opacity=0.95;m2.opacity=0.06;
    if(!hit&&!inSafe()&&P.stun<=0&&Math.abs(nearVol(x,z)-rr)<2.2+pw*2&&P.y<1.5){hit=1;var a=Math.atan2(P.x-x,P.z-z);hitPlayer(n,pw,Math.sin(a),Math.cos(a));}
    var c=(8+pw*40)*dt*fxMul;
    for(var i=0;i<c;i++){var a2=Math.random()*6.283;emit(x+Math.cos(a2)*rr,0.5,z+Math.sin(a2)*rr,Math.cos(a2)*4,rand(1,6),Math.sin(a2)*4,pcol(col,pw,i),0.5,12);}
    if(k>=1){fxBoom(x,z,R*0.3,col,pw*0.6);return 1;}return 0;
  },x:function(){scene.remove(o);scene.remove(f);m.dispose();m2.dispose();}});
}
function sfan(n,a,sp,size,c,p,list){list.forEach(function(d){O(n,a+d,sp,size,c,p);});}
/* 스킬 목록: nm 이름 · na 조준선 숨김 · fan 부채꼴 조준선 · tip 경고 문구 */
var SK=[
 {nm:'맘마 탄',col:'#ffe0b2',tip:'조준선을 피해!',f:function(n,p,a,c){O(n,a,n.move*1.5,2.4+p*3,c,p);}},
 {nm:'주머니 폭탄',col:'#7fd3ff',na:1,tip:'붉은 원 밖으로!',f:function(n,p,a,c,q){Z(q.x,q.z,5+p*13,1.0,c,p,{n:n});}},
 {nm:'뿔 돌진',col:'#ffcc80',na:1,tip:'돌진! 거리를 벌려요!',f:function(n,p,a,c){n.dash=0.7+0.6*p;n.dashM=2.2+2.4*p;fxBoom(n.ch.root.position.x,n.ch.root.position.z,6+p*8,c,p*0.8);}},
 {nm:'토마토 투척',col:'#ff5252',na:1,tip:'토마토 폭격! 원을 피해요!',f:function(n,p,a,c,q){for(var k=0;k<3+Math.floor(p*4);k++)(function(k){after(k*0.12,function(){Z(q.x+rand(-1,1)*(7+p*8),q.z+rand(-1,1)*(7+p*8),4+p*6,0.9,c,p,{n:n});});})(k);}},
 {nm:'발롬 광선',col:'#69f0ae',tip:'광선! 옆으로 크게 피해요!',f:function(n,p,a,c){Bm(n,a,3+p*9,0.75,0.45+p*0.6,c,p);}},
 {nm:'채찍 휩쓸기',col:'#fff176',na:1,tip:'휩쓸기! 점프로 넘어요!',f:function(n,p,a,c){Wl(n,c,p);if(p>0.5)after(0.9,function(){Wl(n,c,p);});}},
 {nm:'저승 유도탄',col:'#b388ff',tip:'유도탄! 계속 방향을 틀어요!',f:function(n,p,a,c,q,rp,T){O(n,a,n.move*1.1,3+p*3.5,c,p,{turn:0.9+p*1.6,life:4+p*2,T:T});}},
 {nm:'유칼립 비',col:'#a5d6a7',na:1,tip:'비처럼 쏟아져요!',f:function(n,p,a,c,q){for(var k=0;k<6+Math.floor(p*12);k++)after(k*0.12,function(){Z(q.x+rand(-1,1)*(12+p*10),q.z+rand(-1,1)*(14+p*10),3+p*3,0.9,c,p,{n:n});});}},
 {nm:'하트 링',col:'#ff80ab',na:1,tip:'링 한가운데가 안전해요!',f:function(n,p,a,c,q){var k=5+Math.floor(p*5),R=10+p*6;for(var i=0;i<k;i++){var g=i/k*6.283;Z(q.x+Math.cos(g)*R,q.z+Math.sin(g)*R,5+p*4,1.1,c,p,{n:n});}}},
 {nm:'얼음 가시 대로',col:'#80deea',na:1,tip:'가시가 몰려와요! 옆으로!',f:function(n,p,a,c,q,rp){var k=4+Math.floor(p*7),dx=Math.sin(a),dz=Math.cos(a);for(var i=0;i<k;i++)Z(q.x+dx*(k-1-i)*9,q.z+dz*(k-1-i)*9,4+p*5,0.7+i*0.14,c,p,{n:n});}},
 {nm:'중력 우물',col:'#ce93d8',na:1,tip:'중력장! 원 밖으로 벗어나요!',f:function(n,p,a,c,q){Z(q.x,q.z,9+p*12,1.7,c,p,{n:n,pull:12+p*30});}},
 {nm:'속사 연발',col:'#ffab40',tip:'속사! 좌우로 흔들어요!',f:function(n,p,a,c,q,rp,T){for(var k=0;k<4+Math.floor(p*8);k++)after(k*0.09,function(){O(n,Math.atan2(T.x-rp.x,T.z-rp.z)+rand(-.05,.05),n.move*1.7,2.2+p*2.5,c,p);});}},
 {nm:'번개 폭풍',col:'#fff59d',na:1,tip:'낙뢰! 계속 움직여요!',f:function(n,p,a,c,q,rp,T){for(var k=0;k<4+Math.floor(p*9);k++)after(k*0.1,function(){Z(T.x+rand(-1,1)*12,T.z+(T.vz||0)*0.5+rand(-1,1)*12,3+p*2.5,0.7+rand(0,0.3),c,p,{n:n,hi:2.5});});}},
 {nm:'신수 낙하',col:'#ff7043',na:1,tip:'거대 낙하! 멀리 벗어나요!',f:function(n,p,a,c,q){Z(q.x,q.z,12+p*15,1.4,c,p,{n:n,hi:2.2});}},
 {nm:'불꽃 회오리',col:'#ff6e40',tip:'회오리! 점프로 넘거나 돌아가요!',f:function(n,p,a,c,q,rp,T){O(n,a,n.move*0.6,5+p*5,c,p,{turn:0.6+p*0.8,life:7,hr:3+p*3,gnd:1,T:T});}},
 {nm:'뿔 삼연포',col:'#ffd180',fan:1,tip:'3연 부채꼴! 점프하거나 크게 벗어나요!',f:function(n,p,a,c){sfan(n,a,n.move*1.9,3.5+p*4,c,p,[-0.2,0,0.2]);}},
 {nm:'붉은 파동',col:'#ff1744',na:1,tip:'파동! 점프로 넘어요!',f:function(n,p,a,c,q){for(var k=0;k<2+Math.floor(p*3);k++)(function(k){after(k*0.35,function(){Wv(n,q.x,q.z,10+p*20,c,p);});})(k);}},
 {nm:'신의 심판',col:'#ffd700',na:1,fan:1,tip:'심판! 광선·낙하·탄막 동시!',f:function(n,p,a,c,q){Bm(n,a,5+p*8,0.9,0.8,c,p);after(0.3,function(){for(var k=0;k<6;k++)Z(q.x+rand(-1,1)*16,q.z+rand(-1,1)*16,7,1.0,c,p,{n:n});sfan(n,a,n.move*1.6,4+p*3,c,p,[-0.35,-0.17,0,0.17,0.35]);});}}
];
function skillWarn(n){var s=SK[n.i%SK.length];return '⚠️ '+n.cfg.name+' ['+s.nm+'] '+s.tip;}
var lastCastT=0;
/* 방장이 스킬 발동을 결정 → 모두에게 전달 → 각자 화면에서 똑같이 재생 (맞았는지는 각자 판정) */
function cast(n){
  var T=tgtObj(n.tg)||P,rp=n.ch.root.position,a=Math.atan2(T.x-rp.x,T.z-rp.z),q={x:T.x+(T.vx||0)*0.8,z:T.z+(T.vz||0)*0.8};
  n.state='chase';n.nextCharge=rand(1,9);
  bcast({t:'cast',i:n.i,a:r3(a),qx:r2(q.x),qz:r2(q.z),tg:n.tg,rx:r2(rp.x),rz:r2(rp.z)});
  runCast(n,a,q,T);
}
function runCast(n,a,q,T){
  var s=SK[n.i%SK.length],p=pwr(n),rp=n.ch.root.position;
  s.f(n,p,a,s.col,q,rp,T);
  n.ballHide=0.9;hideAim(n);n.ball.visible=false;
  var cnt=(10+p*80)*fxMul;
  for(var i=0;i<cnt;i++)emit(rp.x+rand(-3,3),rand(1,n.cfg.h*0.8),rp.z+rand(-3,3),rand(-9,9)*(1+p),rand(0,10),rand(-9,9)*(1+p),pcol(s.col,p,i),rand(0.5,1),12);
  if(fxLevel&&p>0.25)fxBoom(rp.x,rp.z,4+p*10,s.col,p*0.5);
  if(AC&&nearVol(rp.x,rp.z)<120){sfx.shoot();if(p>0.5)tone(110,0.4,'sawtooth',0.2,-40);}
  var now=performance.now()/1000;
  if(now-lastCastT>1.2&&nearVol(rp.x,rp.z)<200){lastCastT=now;toast('⚔️ '+n.cfg.name+' · '+s.nm+'! (위력 '+Math.round(100+p*400)+'%)','warn');}
}
function updateSkills(dt){
  P.vx+=((P.x-sx0)/Math.max(dt,0.001)-P.vx)*Math.min(1,dt*8);
  P.vz+=((P.z-sz0)/Math.max(dt,0.001)-P.vz)*Math.min(1,dt*8);
  if(Math.abs(P.kx)+Math.abs(P.kz)>0.1){
    P.x+=P.kx*dt;P.z+=P.kz*dt;clampP();
    var dc=Math.exp(-5*dt);P.kx*=dc;P.kz*=dc;
  }
  sx0=P.x;sz0=P.z;
  for(var j=HZ.length-1;j>=0;j--){
    var h=HZ[j];
    if(h.q){h.t-=dt;if(h.t<=0){HZ.splice(j,1);h.f();}continue;}
    if(h.u(dt)){HZ.splice(j,1);h.x();}
  }
  for(var k=0;k<npcs.length;k++){
    var n=npcs[k],rp=n.ch.root.position,p=pwr(n);
    if(n.dash>0){
      n.dash-=dt;
      var DT=tgtObj(n.tg);
      if(n.state==='chase'&&DT&&hostSide()){
        var dx=DT.x-rp.x,dz=DT.z-rp.z,dd=Math.hypot(dx,dz)||1;
        rp.x+=dx/dd*n.move*n.dashM*dt;rp.z+=dz/dd*n.move*n.dashM*dt;
        var tn=(20+p*120)*dt*fxMul;for(var q=0;q<tn;q++)emit(rp.x+rand(-3,3),rand(0.5,n.cfg.h*0.7),rp.z+rand(-2,2)-dz/dd*3,rand(-3,3),rand(0,4),-dz/dd*rand(4,14),pcol(SK[n.i%SK.length].col,p,q),0.5,6);
      }else n.dash=0;
    }
    if(n.state==='charge'){
      var cc=(3+p*40)*dt*fxMul;
      for(var c=0;c<cc;c++){var g=Math.random()*6.283;emit(rp.x+Math.cos(g)*7,rand(0.5,n.cfg.h*0.8),rp.z+Math.sin(g)*7,-Math.cos(g)*12,rand(0,3),-Math.sin(g)*12,pcol(SK[n.i%SK.length].col,p,c),0.5,0);}
    }
  }
  shk*=Math.exp(-6*dt);flashA*=Math.exp(-5*dt);
  flashEl.style.opacity=flashA>0.01?flashA.toFixed(3):'0';
}


/* =========================================================
   캐릭터 스킨 (사진 컷아웃) — 비쌀수록 러닝머신 속도 획득 배율 ↑
   ========================================================= */
var SKINS=[
  {name:'브론즈 캐릭터',price:3000000,mult:2,color:'#cd7f32',o:{skin:'#d1aa92',hair:'#35312a',suit:'#192634',stripe:'#2b3d52',shirt:'#f1f4f7',collar:'#ffffff',tie:'#c9788f',knot:'#a85a72'}},
  {name:'실버 캐릭터',price:30000000,mult:4,color:'#d5dbe2',o:{skin:'#e3b2a1',hair:'#6a6368',suit:'#2c3744',stripe:'#46566a',shirt:'#c9ddee',collar:'#dbe9f5',tie:'#2a2d4a',knot:'#1c1f38'}},
  {name:'골드 캐릭터',price:300000000,mult:8,color:'#ffc107',o:{skin:'#fbcba5',hair:'#211a15',suit:'#2a3631',stripe:'#42564d',shirt:'#dfe9ee',collar:'#f0f6f8',tie:'#b6bf9f',knot:'#98a283'}}
];
function skinMult(){return G.skin>=0?SKINS[G.skin].mult:1;}
var skinPanel=document.createElement('div');
skinPanel.innerHTML='<h3>🎭 캐릭터 스킨</h3><div class="row" style="border-top:0"><button id="skinDefault" style="flex:1;background:#546e7a">기본스킨으로 변경</button></div>';
$('shopRows').parentNode.insertBefore(skinPanel,$('shopRows'));
var skinNm=[],skinBtn=[];
SKINS.forEach(function(s,i){
  var row=document.createElement('div');row.className='row';
  var nm=document.createElement('div');nm.className='nm';
  nm.innerHTML='<b style="color:'+s.color+'">'+s.name+'</b><small>러닝머신 속도 획득 ×'+s.mult+'</small>';
  var b=document.createElement('button');b.addEventListener('click',function(){skinClick(i);});
  row.appendChild(nm);row.appendChild(b);skinPanel.appendChild(row);skinBtn.push(b);
});
var skinHead=document.createElement('h3');skinHead.style.marginTop='10px';skinHead.textContent='🏃 러닝머신';
skinPanel.appendChild(skinHead);
$('skinDefault').addEventListener('click',function(){if(G.skin===-1)return;G.skin=-1;sfx.buy();toast('🧍 기본 스킨으로 변경!','good');refreshSkins();save();});
function skinClick(i){
  if(!G.owned[i]){
    if(G.money<SKINS[i].price){sfx.deny();return;}
    G.money-=SKINS[i].price;G.owned[i]=1;toast('🎭 '+SKINS[i].name+' 구매! 속도 획득 ×'+SKINS[i].mult,'good');
    burst(P.x,5,P.z,SKINS[i].color,30,8);
  }else toast('🎭 '+SKINS[i].name+' 착용! 속도 획득 ×'+SKINS[i].mult,'good');
  G.skin=i;sfx.buy();refreshSkins();save();
}
function refreshSkins(){
  if(!window.__SKINIMG__||typeof skinBtn==='undefined')return;
  skinBtn.forEach(function(b,i){
    var own=G.owned[i],cur=G.skin===i;
    b.textContent=cur?'✔ 착용중':own?'착용':'💰 '+fmt(SKINS[i].price);
    b.disabled=cur||(!own&&G.money<SKINS[i].price);
  });
  var d=$('skinDefault');if(d){d.disabled=G.skin===-1;d.textContent=G.skin===-1?'✔ 기본스킨 사용중':'기본스킨으로 변경';}
}
var skinApplied=-1;
function buildSet(o,face){
  o=Object.assign({},o);o.face=face;
  var ch=makePlayerChar(o);ch.root.visible=false;scene.add(ch.root);
  var tr=ITEM_COLORS.map(function(c,k){var t=makeTrophy(c,false,k);t.scale.set(1.2,1.2,1.2);t.visible=false;ch.root.add(t);return t;});
  return {ch:ch,tr:tr};
}
var baseSet={ch:pChar,tr:holdTrophies};
SKINS.forEach(function(s,i){s.set=buildSet(s.o,window.__SKINIMG__[i]);});
/* ---------- 🎄 크리스마스 모드: 산타 블록 캐릭터 + 캐럴 BGM ---------- */
var XMAS_SET=null;
if(window.__XMASIMG__)XMAS_SET=buildSet({skin:'#f0c9a6',hair:'#c62828',suit:'#c62828',stripe:'#e04848',shirt:'#ffffff',collar:'#ffffff',tie:'#1b5e20',knot:'#124a18'},window.__XMASIMG__);
function bgmLevel(){return (bgmMuted||xmasPlaying)?0:(typeof bmOn!=='undefined'&&bmOn?BGM_VOL*0.12:BGM_VOL);}
var xmasWait=false;
function xmasWaitGesture(){
  if(xmasWait)return;xmasWait=true;
  var ev=['pointerup','touchend','click','keydown'];
  var f=function(){
    if(!xmasOn||!xmasAudio){ev.forEach(function(e){removeEventListener(e,f,true);});xmasWait=false;return;}
    var p=xmasAudio.play();
    if(p&&p.then)p.then(function(){ev.forEach(function(e){removeEventListener(e,f,true);});xmasWait=false;xmasPlaying=true;if(bgmGain)bgmGain.gain.value=bgmLevel();}).catch(function(){});
  };
  ev.forEach(function(e){addEventListener(e,f,true);});
}
/* 1순위: 기본 BGM과 같은 WebAudio 방식으로 재생 */
function xmasStopWA(){
  if(xmasSrc){try{xmasSrc.stop();}catch(e){}try{xmasSrc.disconnect();}catch(e){}xmasSrc=null;}
}
function xmasStartWA(){
  if(!AC||!xmasBuf||xmasSrc||!xmasOn)return;
  try{
    if(AC.state==='suspended')AC.resume();
    if(!xmasGain){xmasGain=AC.createGain();xmasGain.connect(AC.destination);}
    xmasGain.gain.value=bgmMuted?0:XMAS_VOL;
    xmasSrc=AC.createBufferSource();xmasSrc.buffer=xmasBuf;xmasSrc.loop=true;xmasSrc.connect(xmasGain);xmasSrc.start();
    xmasPlaying=true;if(bgmGain)bgmGain.gain.value=bgmLevel();
    if(started)toast('🎶 캐럴 시작!','good');
  }catch(e){xmasSrc=null;xmasElem();}
}
function xmasLoad(){
  if(xmasBuf||xmasLoading||!window.__XMAS__)return;
  xmasLoading=true;
  if(started)toast('🎄 캐럴 불러오는 중... (잠깐만요)','good');
  var ok=function(buf){xmasLoading=false;xmasBuf=buf;xmasStartWA();};
  var fail=function(){xmasLoading=false;xmasElem();};
  try{
    var bin=atob(window.__XMAS__.split(',')[1]),u=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    var p=AC.decodeAudioData(u.buffer,ok,fail);
    if(p&&p.catch)p.catch(function(){});
  }catch(e){fail();}
}
/* 2순위: WebAudio 디코딩이 안 될 때 <audio> 로 재생 */
function xmasElem(){
  if(!xmasOn)return;
  if(!xmasAudio&&window.__XMAS__){
    try{
      var bin=atob(window.__XMAS__.split(',')[1]),u=new Uint8Array(bin.length);
      for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      xmasAudio=new Audio(URL.createObjectURL(new Blob([u],{type:'audio/mpeg'})));
    }catch(e){try{xmasAudio=new Audio(window.__XMAS__);}catch(e2){xmasAudio=null;}}
    if(xmasAudio){
      xmasAudio.loop=true;xmasAudio.preload='auto';
      xmasAudio.addEventListener('error',function(){
        if(!xmasAudio||xmasAudio._fb){if(started&&xmasOn)toast('🎄 캐럴을 재생하지 못했어요 (이 브라우저에서 막힘)','bad');return;}
        xmasAudio._fb=1;xmasAudio.src=window.__XMAS__;
        if(xmasOn)xmasAudio.play().catch(function(){});
      });
    }
  }
  if(!xmasAudio){if(started)toast('🎄 캐럴을 재생하지 못했어요','bad');return;}
  xmasAudio.volume=bgmMuted?0:XMAS_VOL;
  var p=xmasAudio.play();
  if(p&&p.then)p.then(function(){if(xmasOn){xmasPlaying=true;if(bgmGain)bgmGain.gain.value=bgmLevel();}});
  if(p&&p.catch)p.catch(function(err){
    if(err&&err.name==='NotAllowedError'){
      xmasWaitGesture();
      if(started)toast('🎄 브라우저가 소리를 막았어요 — 화면을 한 번 누르면 캐럴이 시작돼요','warn');
    }
  });
}
function xmasMusic(on){
  if(on){
    if(AC){if(xmasBuf)xmasStartWA();else xmasLoad();}
    else if(started)xmasElem();
  }else{
    xmasStopWA();if(xmasAudio)xmasAudio.pause();
    xmasPlaying=false;
  }
  if(bgmGain)bgmGain.gain.value=bgmLevel();
}
/* ---------- ❄️ 눈 오는 효과 (크리스마스 모드에서 켜짐) ---------- */
var snowCv=null,snowCtx=null,snowOn=false,snowFl=[],snowRaf=0,snowLast=0;
function snowSize(){if(!snowCv)return;snowCv.width=innerWidth;snowCv.height=innerHeight;}
function snowCount(){return fxLevel?(isTouch?70:130):35;}
function snowMk(top){
  var r=1.2+Math.random()*2.8;
  return {x:Math.random()*innerWidth,y:top?-8:Math.random()*innerHeight,r:r,vy:22+r*13+Math.random()*18,sw:0.4+Math.random()*1.1,ph:Math.random()*6.283,a:0.5+Math.random()*0.45};
}
function snowTick(ts){
  if(!snowOn){snowRaf=0;return;}
  var dt=Math.min(0.05,(ts-snowLast)/1000||0.016);snowLast=ts;
  var W=snowCv.width,H=snowCv.height,want=snowCount(),i;
  if(snowFl.length<want){for(i=0;i<3&&snowFl.length<want;i++)snowFl.push(snowMk(true));}
  else if(snowFl.length>want)snowFl.length=want;
  snowCtx.clearRect(0,0,W,H);
  for(i=0;i<snowFl.length;i++){
    var f=snowFl[i];
    f.ph+=dt*f.sw;f.y+=f.vy*dt;f.x+=Math.sin(f.ph)*18*dt+9*dt;
    if(f.y>H+8||f.x>W+8){f.x=Math.random()*W;f.y=-8;}
    snowCtx.globalAlpha=f.a;snowCtx.beginPath();snowCtx.arc(f.x,f.y,f.r,0,6.2832);snowCtx.fillStyle='#fff';snowCtx.fill();
  }
  snowCtx.globalAlpha=1;
  snowRaf=requestAnimationFrame(snowTick);
}
function snowSet(on){
  if(on){
    if(!snowCv){
      snowCv=document.createElement('canvas');snowCv.id='snow';
      snowCv.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:6';
      document.body.insertBefore(snowCv,document.body.firstChild);snowCtx=snowCv.getContext('2d');
      snowSize();addEventListener('resize',snowSize);
    }
    snowCv.style.display='block';
    if(!snowFl.length)for(var i=0;i<snowCount();i++)snowFl.push(snowMk(false));
    snowOn=true;snowLast=performance.now();
    if(!snowRaf)snowRaf=requestAnimationFrame(snowTick);
  }else{
    snowOn=false;
    if(snowCv){snowCv.style.display='none';snowCtx.clearRect(0,0,snowCv.width,snowCv.height);}
    snowFl=[];
  }
}
function setXmas(on,quiet){
  if(!XMAS_SET)return;
  if(on&&!quiet&&bgmMuted)setBgmMuted(false);
  xmasOn=on;xmasMusic(on);snowSet(on);
  var b=$('xmasBtn');b.textContent=on?'🎄 크리스마스 ON':'🎄 크리스마스';b.classList.toggle('on',on);
  try{localStorage.setItem('steal-a-roh-xmas',on?'1':'0');}catch(e){}
  if(!quiet){toast(on?'🎅 메리 크리스마스! 산타 캐릭터 + 캐럴 BGM + 눈':'🎄 크리스마스 모드를 껐어요','good');sfx.buy();burst(P.x,5,P.z,on?'#ff5252':'#ffffff',30,8);}
}
$('xmasBtn').addEventListener('click',function(){this.blur();setXmas(!xmasOn);});
try{if(localStorage.getItem('steal-a-roh-xmas')==='1')setXmas(true,true);}catch(e){}
function updateSkin(dt,moving){
  var want=xmasOn&&XMAS_SET?99:G.skin;
  if(skinApplied===want)return;
  var set=want===99?XMAS_SET:(G.skin>=0?SKINS[G.skin].set:baseSet);
  pChar.root.visible=false;
  pChar=set.ch;holdTrophies=set.tr;pChar.root.visible=true;
  holdTrophies.forEach(function(t,k){t.visible=(k===P.carry);});
  skinApplied=want;
}
/* 친구들에게 보낼 내 겉모습 (크리스마스면 99 = 산타) */
function netSkin(){return xmasOn&&XMAS_SET?99:G.skin;}

/* =========================================================
   개발자 모드: 게임 중 키보드로 "shangus" 입력 (다시 입력하면 해제)
   ========================================================= */
var DEV=false,DEV_MONEY=1e15,DEV_SPEED=1e12,devBuf='';
addEventListener('keydown',function(e){
  if(modalOpen){if(e.code==='Escape'){bkClose();mpModalClose();}return;}
  if(!started||e.repeat||!e.key||e.key.length!==1)return;
  devBuf=(devBuf+e.key.toLowerCase()).slice(-7);
  if(devBuf==='shangus'){devBuf='';toggleDev();}
});
function toggleDev(){
  DEV=!DEV;
  if(DEV){
    for(var i=0;i<N;i++){G.counts[i]=Math.max(1,G.counts[i]);updateExhibit(i);}
    for(var j=0;j<TREADS.length;j++){G.qty[j]=Math.max(1,G.qty[j]);updatePad(j);}
    G.owned=[1,1,1];
    devTick();updateHall();refreshShop();save();
    sfx.steal();burst(P.x,4,P.z,'#ff4fe0',60,12);
    toast('🛠️ 개발자 모드 ON — 전부 언락 · 돈 무한 · 속도 MAX','good');
  }else toast('🛠️ 개발자 모드 OFF (돈·속도 고정 해제)','warn');
}
function devTick(){
  if(!DEV)return;
  if(G.money<DEV_MONEY)G.money=DEV_MONEY;
  if(G.speed<DEV_SPEED)G.speed=DEV_SPEED;
}

/* =========================================================
   던전: 메달(수집한 큰 손 종류)이 3개 이상이면 입장 · 웨이브 3 → 보스
   ========================================================= */
var DX=0,DZ=-420,TS=10,TN=19,HALF=TS*TN/2,TC=(TN-1)/2,PORTAL={x:0,z:22};
var DG={df:1,myDf:1,spawnT:0,q:[],qn:0,runSt:0,on:false,hp:0,max:0,inv:0,cd:0,wave:0,mobs:[],pr:[],boss:null,tiles:[],goal:'',ripT:3,over:0,next:0,hudT:0,lblT:0,ret:null,chk:0,warnT:0};
var dgStyle=document.createElement('style');
dgStyle.textContent='.float.dmg{color:#ff5252}.float.hit{color:#fff;font-size:18px}#dgHud{position:fixed;left:10px;top:368px;width:210px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:8px 10px;font-size:13px;z-index:12;display:none}#dgHud .bar{background:#333;border-radius:6px;height:12px;overflow:hidden}#dgHud .bar i{display:block;height:100%}#dgPick{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:60}#dgPick .bkPanel{max-width:420px;width:92vw;background:#0f1d3a;border:1px solid rgba(255,255,255,.25);border-radius:16px;padding:16px 18px;color:#fff}#dgPick h3{margin:0 0 10px}.dgPickBtn{display:block;width:100%;margin:0 0 8px;padding:10px 12px;border-radius:10px;border:3px solid;background:rgba(20,25,45,.95);color:#fff;text-align:left;cursor:pointer;font-size:16px;touch-action:manipulation}.dgPickBtn small{display:block;color:#b0bec5;font-size:12px;margin-top:3px}#dgPickNo{width:100%;padding:8px;border:0;border-radius:8px;background:#546e7a;color:#fff;font-weight:700;cursor:pointer}#dgExit{margin-top:8px;width:100%;padding:6px;border:0;border-radius:8px;background:#6a1b9a;color:#fff;font-weight:700;cursor:pointer;touch-action:manipulation}';
document.head.appendChild(dgStyle);
var dgHudEl=document.createElement('div');dgHudEl.id='dgHud';
dgHudEl.innerHTML='<div id="dgInfo" style="font-weight:700;margin-bottom:4px"></div><div class="bar"><i id="dgHp" style="background:#4caf50;width:100%"></i></div><div id="dgBossRow" style="display:none;margin-top:6px"><div style="font-size:12px;color:#ffab91">👹 보스</div><div class="bar"><i id="dgBHp" style="background:#e53935;width:100%"></i></div></div><button id="dgExit">🚪 던전 나가기</button>';
document.body.appendChild(dgHudEl);
function medals(){var c=0;for(var i=0;i<N;i++)if(G.counts[i]>0)c++;return c;}
function clampP(){
  if(DG.on){P.x=clamp(P.x,DX-HALF+0.5,DX+HALF-0.5);P.z=clamp(P.z,DZ-HALF+0.5,DZ+HALF-0.5);}
  else{
    P.z=clamp(P.z,Z0+3,Z1-3);
    /* 넓은 기지(4칸) 안에서는 옆으로 자유롭게, 경기장으로는 가운데 대문으로만 */
    var bz=BASE_Z1-0.6;
    if(P.z<bz)P.x=clamp(P.x,-BASE_XMAX+1.4,BASE_XMAX-1.4);
    else if(Math.abs(P.x)>GATE_X){
      if(P.cz!==undefined&&P.cz<bz)P.z=bz-0.001;
      else P.x=clamp(P.x,-GATE_X,GATE_X);
    }
  }
  P.cz=P.z;
}
/* 아레나: 7x7 바닥 타일 (보스가 찢어서 없앰) */
(function(){
  var vm=new THREE.Mesh(new THREE.PlaneGeometry(HALF*6,HALF*6),new THREE.MeshBasicMaterial({color:0x07040f}));
  vm.rotation.x=-Math.PI/2;vm.position.set(DX,-6,DZ);scene.add(vm);
  var gl=mk(discG,gm(0x7a3cff,0.25),DX,-5.5,DZ);gl.scale.set(HALF*1.7,1,HALF*1.7);
  for(var ix=0;ix<TN;ix++)for(var iz=0;iz<TN;iz++){
    var m=box(TS-0.15,1,TS-0.15,(ix+iz)%2?'#3b2f57':'#2d2347');
    m.position.set(DX+(ix-TC)*TS,-0.5,DZ+(iz-TC)*TS);m.receiveShadow=true;scene.add(m);
    DG.tiles.push({m:m,st:0,t:0,ix:ix,iz:iz,cr:null});
  }
  var rm=new THREE.MeshBasicMaterial({color:0x7e3fe0}),R=TS*TN/2+0.4;
  [[0,-R,TS*TN+1,0.7],[0,R,TS*TN+1,0.7],[-R,0,0.7,TS*TN+1],[R,0,0.7,TS*TN+1]].forEach(function(a){
    var b=new THREE.Mesh(new THREE.BoxGeometry(a[2],1.2,a[3]),rm);b.position.set(DX+a[0],0.6,DZ+a[1]);scene.add(b);
  });
})();
/* 포털 */
var portalG=new THREE.Group();portalG.position.set(PORTAL.x,0,PORTAL.z);scene.add(portalG);
var swirl=new THREE.Mesh(new THREE.CircleGeometry(3.1,32),new THREE.MeshBasicMaterial({color:0x6a2cff,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
swirl.position.y=4;portalG.add(swirl);
var pring=new THREE.Mesh(new THREE.TorusGeometry(3.4,0.4,10,36),new THREE.MeshBasicMaterial({color:0xb36bff}));pring.position.y=4;portalG.add(pring);
var plab=makeSprite(256,128,7.5,3.75);plab.sprite.position.set(PORTAL.x,9.5,PORTAL.z);scene.add(plab.sprite);
function drawPortalLabel(){
  var g=plab.g,m=medals();
  g.clearRect(0,0,256,128);roundRect(g,4,4,248,120,18);g.fillStyle='rgba(0,0,0,.65)';g.fill();
  g.lineWidth=4;g.strokeStyle=m>=3?'#b36bff':'#78909c';g.stroke();
  g.textAlign='center';g.textBaseline='middle';
  g.font='bold 30px '+FONT;g.fillStyle='#e1bee7';g.fillText('🕳️ 던전 입구',128,34);
  g.font='bold 26px '+FONT;g.fillStyle=m>=3?'#ffd54a':'#ff8a80';g.fillText('🏅 메달 '+m+' / 3 필요',128,76,236);
  g.font='bold 20px '+FONT;g.fillStyle='#b0bec5';g.fillText(m>=3?'[E] 입장':'큰 손을 더 모으세요',128,108,236);
  plab.tex.needsUpdate=true;
}
drawPortalLabel();

/* [E] 베기 공격력: 속도에 정비례 (속도 10일 때 기본값, 속도 100이면 10배) */
var DG_DMG_PER_SPEED=0.1;
function dgDmg(){return Math.round((10+medals()*4)*Math.max(1,G.speed*DG_DMG_PER_SPEED));}
/* 던전 난이도: 몹 수 · 보스 체력 · 보스 공격력 · 바닥 찢기 속도 · 보상 */
/* mob: 잡몹 수 배율 · mobHits: 던전 안 최고 공격력으로 잡몹을 몇 대 때려야 죽는지 · bossHpFix: 보스 체력(고정)
   (공격력이 아무리 세도 원콤이 안 되게 체력이 공격력을 따라 커져요) */
var DG_DIFFS=[
  {name:'쉬움',ico:'🟢',col:'#66bb6a',mob:1.0,mobHits:1,mobDmg:0.8,bossHpFix:5e6,bossDmg:0.7,atk:1.2,rip:1.3,reward:0.5,chest:1,desc:'잡몹 ×1 · 보스 체력 500만 · 보상 ×0.5'},
  {name:'보통',ico:'🟡',col:'#ffca28',mob:1.7,mobHits:2,mobDmg:1.1,bossHpFix:3e7,bossDmg:1.2,atk:1,rip:1,reward:1,chest:2,desc:'잡몹 ×1.7 · 보스 체력 3천만 · 보상 ×1'},
  {name:'어려움',ico:'🔴',col:'#ef5350',mob:3,mobHits:5,mobDmg:1.8,bossHpFix:1.5e8,bossDmg:2.5,atk:0.65,rip:0.6,reward:3,chest:3,desc:'잡몹 ×3 (몹 5대) · 보스 체력 1.5억 · 보스 공격 ×2.5 · 보상 ×3'},
  {name:'무한',ico:'♾️',col:'#b36bff',inf:1,reward:1,chest:2,desc:'끝없는 스테이지 · 10스테이지마다 보스 (첫 보스 = 어려움 1.5억, 다음 보스마다 ×2.5) · 깬 스테이지만큼 골드·속도'}
];
var MOB_CAP=60; /* 한 번에 나와 있는 잡몹 최대 수 (나머지는 잡을 때마다 이어서 나와요) */
/* 무한 모드: 스테이지가 오를수록 어려움 기준에서 점점 세져요 */
function dgDiff(){
  var d=DG_DIFFS[DG.df]||DG_DIFFS[1];if(!d.inf)return d;
  var h=DG_DIFFS[2],st=Math.max(1,DG.wave||1),k=Math.max(1,Math.ceil(st/10));
  return {name:'무한',ico:'♾️',col:d.col,inf:1,reward:d.reward,desc:d.desc,
    mob:2*(1+0.05*st),mobHits:h.mobHits*Math.pow(1.07,st),mobDmg:h.mobDmg*(1+0.05*st),
    bossHpFix:h.bossHpFix*Math.pow(2.5,k-1),chest:2,bossDmg:h.bossDmg*(1+0.25*(k-1)),
    atk:Math.max(0.4,h.atk*Math.pow(0.93,k-1)),rip:Math.max(0.35,h.rip*Math.pow(0.93,k-1))};
}
/* 플레이어 체력: 메달 + 속도에 따라 커져요 (보스 데미지는 예전 기준 체력으로 계산해서 체력이 늘면 그만큼 버텨요) */
var DG_HP_BASE=250,DG_HP_PER_MEDAL=50,DG_HP_SPEED=0.25;
function dgBaseHp(){return 100+medals()*20;}
function dgMaxHp(){return Math.round((DG_HP_BASE+medals()*DG_HP_PER_MEDAL)*(1+DG_HP_SPEED*Math.log10(Math.max(10,G.speed))));}
function dgDfOk(df){return df===0||df===1||df===2||df===3;}
/* 방장: 던전 안에서 제일 센 사람의 공격력 (몹·보스 체력 기준) */
function dgRefDmg(){
  var m=DG.on?dgDmg():0;
  for(var id in REM){var r=REM[id];if(r.dg&&r.dd>m)m=r.dd;}
  return m||dgDmg();
}
var INF_KEY='steal-a-roh-inf-best',infBest=0;try{infBest=+localStorage.getItem(INF_KEY)||0;}catch(e){}
function dgDamage(dmg,kx,kz,force){
  if(DG.over||(!force&&DG.inv>0))return;
  var S=DG.S;
  if(!force&&S.dodge>0&&Math.random()<S.dodge){DG.inv=0.35;floatText('회피!',VW()/2,VH()*0.38,0,'spd');return;}
  dmg*=1-S.dr;
  if(DG.shield>0){var ab=Math.min(DG.shield,dmg);DG.shield-=ab;dmg-=ab;}
  DG.hp-=dmg;DG.inv=(force?1.5:0.7)*S.inv;
  if(S.thorns&&DG.hp>0){augHit(P.x,P.z,augDmg(false)*3*S.thorns,10);fxBoom(P.x,P.z,10,'#66bb6a',0.5);}
  shk=Math.max(shk,1.2+dmg/DG.max*5);flashA=Math.max(flashA,0.2+dmg/DG.max*0.5);
  var m=Math.hypot(kx||0,kz||0);if(m>0){P.kx=kx/m*16;P.kz=kz/m*16;}
  floatText('-'+Math.round(dmg),VW()/2,VH()*0.38,0,'dmg');
  if(AC)sfx.hit();
  if(DG.hp<=0&&DG.S.revive>DG.revUsed){DG.revUsed++;DG.hp=DG.max*0.5;DG.inv=2.5;fxBoom(P.x,P.z,10,'#ff7043',0.8);toast('🔥 불사조! 체력 50%로 부활했다 (남은 부활 '+(DG.S.revive-DG.revUsed)+')','good');return;}
  if(DG.hp<=0&&G.x.it.feather>0){G.x.it.feather--;DG.hp=DG.max*0.6;DG.inv=2.5;fxBoom(P.x,P.z,10,'#fff59d',0.8);toast('🪶 부활 깃털! 체력 60%로 부활 (남은 깃털 '+G.x.it.feather+')','good');save();return;}
  if(DG.hp<=0){DG.hp=0;DG.over=1;toast('💀 쓰러졌다... 기지로 돌아갑니다','bad');after(1.8,function(){exitDungeon(false);});}
}
/* ---------------------------------------------------------
   던전은 "한 판"을 같이 써요: 방장이 몹·보스·바닥을 계산하고,
   친구들은 받은 정보를 화면에 그리면서 자기 캐릭터가 맞았는지만 판정
   --------------------------------------------------------- */
DG.act=false;DG.wdone=0;DG.inst=0;DG.mid=0;
function dgToast(msg,cls){if(DG.on)toast(msg,cls);bcast({t:'dgt',m:msg,c:cls});}
/* 던전 안에 있는 사람들 (방장 화면 기준) */
function dgPlayers(){
  var a=[];if(DG.on&&!DG.over)a.push(P);
  for(var id in REM){var r=REM[id];if(r.dg&&r.init)a.push(r);}
  return a;
}
function dgAnyInside(){if(DG.on)return true;for(var id in REM)if(REM[id].dg)return true;return false;}
function nearestOf(list,x,z){
  var best=null,bd=1e9;
  for(var i=0;i<list.length;i++){var d=Math.hypot(list[i].x-x,list[i].z-z);if(d<bd){bd=d;best=list[i];}}
  return best;
}
function dgWorldReset(){
  DG.mobs.forEach(function(o){scene.remove(o.g);});DG.mobs=[];
  DG.pr.forEach(function(q){scene.remove(q.s);q.s.material.dispose();});DG.pr=[];
  DG.zones.forEach(function(o){scene.remove(o.ring);if(o.disc)scene.remove(o.disc);});DG.zones=[];
  if(DG.boss){scene.remove(DG.boss.g);DG.boss=null;}
  resetTiles();DG.wave=0;DG.next=0;DG.ripT=3;DG.q=[];
}
function dgWorldJoin(df){
  if(!hostSide())return;
  if(!DG.act||DG.wdone){
    dgWorldReset();DG.act=true;DG.wdone=0;var inst=++DG.inst;
    DG.df=dgDfOk(df)?df:1; /* 처음 들어간 사람이 고른 난이도 */
    after(DG.df===3?7:1.2,function(){if(DG.inst===inst)startWave(1);}); /* 무한 모드는 시작 증강 고르는 시간 */
  }
}
function dgWorldCheckEnd(){
  if(hostSide()&&DG.act&&!dgAnyInside()){dgWorldReset();DG.act=false;DG.wdone=0;DG.inst++;}
}
/* 잡몹 머리 위 체력바 (스프라이트 2장: 검은 바탕 + 색 막대) */
var HB_BG=new THREE.SpriteMaterial({color:0x000000,transparent:true,opacity:0.65,depthWrite:false});
var HB_FG=[0x4cff6a,0xffd54a,0xff4040].map(function(c){return new THREE.SpriteMaterial({color:c,depthWrite:false});});
var HB_INFO={slime:[3.6,4.2],bat:[3,2.4],golem:[6,10],imp:[3.6,5.2]}; /* [너비, 높이] */
function addHpBar(o){
  var inf=HB_INFO[o.t]||[3.6,4.5],w=inf[0];
  var bg=new THREE.Sprite(HB_BG);bg.scale.set(w+0.3,0.62,1);bg.position.set(0,inf[1],0);bg.renderOrder=6;o.g.add(bg);
  var fg=new THREE.Sprite(HB_FG[0]);fg.scale.set(w,0.38,1);fg.position.set(0,inf[1],0);fg.renderOrder=7;o.g.add(fg);
  o.hbW=w;o.hbF=fg;o.hbR=-1;
}
function updHpBar(o){
  var r=clamp(o.hp/(o.max||1),0,1);if(Math.abs(r-o.hbR)<0.004)return;o.hbR=r;
  var f=o.hbF;f.visible=r>0;if(r<=0)return;
  f.scale.x=o.hbW*r;f.center.set(0.5/r,0.5); /* 왼쪽 끝을 맞춰서 오른쪽부터 줄어들게 */
  f.material=HB_FG[r>0.6?0:r>0.3?1:2];
}
/* 잡몹 4종 */
function mkMob(type,x,z,id){
  var g=new THREE.Group(),m=medals(),sc=1+m*0.05,o={t:type,ph:Math.random()*6,cd:rand(1,2.5)};
  function eye(s,y,zz,c,w){var e=box(w||0.6,w||0.6,0.2,c);e.position.set(s,y,zz);g.add(e);}
  if(type==='slime'){
    var b=box(3,2.6,3,'#43d17a');b.position.y=1.3;g.add(b);eye(-0.7,1.7,1.55,'#10301c');eye(0.7,1.7,1.55,'#10301c');
    o.body=b;o.hp=30;o.sp=7;o.dmg=8;o.r=2;o.col='#43d17a';
  }else if(type==='bat'){
    var bb=box(1.4,1.1,1.4,'#7e57c2');g.add(bb);eye(-0.35,0.2,0.75,'#ffeb3b',0.3);eye(0.35,0.2,0.75,'#ffeb3b',0.3);
    o.wl=new THREE.Group();o.wr=new THREE.Group();
    var wl=box(2.6,0.15,1.3,'#5e35b1');wl.position.x=-1.5;o.wl.add(wl);var wr=box(2.6,0.15,1.3,'#5e35b1');wr.position.x=1.5;o.wr.add(wr);
    o.wl.position.x=-0.6;o.wr.position.x=0.6;g.add(o.wl);g.add(o.wr);
    o.hp=18;o.sp=13;o.dmg=6;o.r=1.4;o.col='#7e57c2';o.fly=1;
  }else if(type==='golem'){
    var gb=box(4.6,5,3.4,'#8d8f98');gb.position.y=3.6;g.add(gb);var gh=box(2.4,2.2,2.4,'#a1a3ab');gh.position.y=7;g.add(gh);
    eye(-0.6,7.1,1.25,'#ff5252',0.5);eye(0.6,7.1,1.25,'#ff5252',0.5);
    [-1,1].forEach(function(s){var a=box(1.4,4,1.4,'#7a7c85');a.position.set(s*3.2,3.6,0);g.add(a);});
    var lg=box(1.6,1.2,1.6,'#6b6d75');lg.position.set(-1.2,0.6,0);g.add(lg);var lg2=box(1.6,1.2,1.6,'#6b6d75');lg2.position.set(1.2,0.6,0);g.add(lg2);
    o.hp=110;o.sp=3.6;o.dmg=18;o.r=3.4;o.col='#9e9e9e';
  }else{
    type='imp';o.t='imp';
    var ib=box(2,2.6,2,'#e53935');ib.position.y=1.8;g.add(ib);eye(-0.45,2.2,1.05,'#ffee58',0.4);eye(0.45,2.2,1.05,'#ffee58',0.4);
    [-0.7,0.7].forEach(function(s){var h=box(0.35,0.9,0.35,'#fff8e1');h.position.set(s,3.5,0);g.add(h);});
    var il=box(1.6,0.5,1.6,'#b71c1c');il.position.y=0.25;g.add(il);
    o.hp=40;o.sp=5;o.dmg=10;o.r=1.8;o.col='#e53935';o.rng=1;
  }
  var df=dgDiff(),wgt=o.hp/30;
  o.hp=Math.round(Math.max(o.hp*sc,hostSide()?dgRefDmg()*df.mobHits*wgt:0));o.max=o.hp;o.sp=Math.round(o.sp*1.4*10)/10;o.dmg=Math.round(o.dmg*(1+m*0.03)*df.mobDmg);o.g=g;
  o.id=id||++DG.mid;o.nx=x;o.nz=z;
  g.position.set(x,0,z);scene.add(g);addHpBar(o);updHpBar(o);DG.mobs.push(o);return o;
}
function spawnMob(type){
  var a,x,z,k=0,pl=dgPlayers(),near;
  do{a=Math.random()*6.283;x=DX+Math.cos(a)*HALF*0.55;z=DZ+Math.sin(a)*HALF*0.55;k++;near=nearestOf(pl,x,z);}while(near&&Math.hypot(x-near.x,z-near.z)<14&&k<8);
  burst(x,2,z,'#b36bff',8,5);mkMob(type,x,z);
}
function startWave(w){
  if(!DG.act||DG.wdone)return;
  DG.wave=w;DG.next=0;var ex=Math.floor(medals()/6),plan;
  var df=dgDiff();
  if(df.inf){ /* 무한 모드: 스테이지가 오를수록 센 몹이 섞여요 */
    plan={slime:6,bat:5};if(w>=3)plan.imp=4;if(w>=6)plan.golem=2+Math.floor(w/15);
  }else plan=w===1?{slime:6+ex,bat:4+ex}:w===2?{slime:4+ex,bat:4+ex,imp:4+ex}:{golem:3+ex,imp:5+ex,bat:5+ex,slime:4};
  var list=[];
  for(var k in plan){var cnt=Math.max(1,Math.round(plan[k]*df.mob));for(var i=0;i<cnt;i++)list.push(k);}
  for(var j=list.length-1;j>0;j--){var r=Math.floor(Math.random()*(j+1)),t=list[j];list[j]=list[r];list[r]=t;}
  DG.q=list;
  while(DG.q.length&&DG.mobs.length<MOB_CAP)spawnMob(DG.q.shift());
  dgToast(df.inf?'♾️ 스테이지 '+w+' 시작! (잡몹 '+list.length+'마리)':'⚔️ 웨이브 '+w+'/3 시작! ('+df.ico+' '+df.name+' · 잡몹 '+list.length+'마리)','warn');
}
function mobDeadFx(x,z,col){burst(x,2,z,col,18,8);burst(x,2,z,'#ffffff',8,6);if(DG.on)gainMoney(Math.round((income()+20)*3));if(DG.on&&DG.S.killHeal&&Math.hypot(x-P.x,z-P.z)<22)augHeal(DG.S.killHeal);}
function killMob(o){
  var i=DG.mobs.indexOf(o);if(i>=0)DG.mobs.splice(i,1);scene.remove(o.g);
  var p=o.g.position;mobDeadFx(p.x,p.z,o.col);
  bcast({t:'mobK',id:o.id,x:r1(p.x),z:r1(p.z),c:o.col});
}
function hurtMob(o,dmg,ax,az){
  var p=o.g.position,dx=p.x-ax,dz=p.z-az,d=Math.hypot(dx,dz)||1;
  o.hp-=dmg;if(DG.on)floatText(fmt(dmg),p.x,p.y+4,p.z,'hit');
  if(o.t!=='golem'){p.x+=dx/d*2.5;p.z+=dz/d*2.5;}
  burst(p.x,2,p.z,'#ffffff',4,5);
  if(o.hp<=0)killMob(o);
}
/* ---------- 보스전 연출 ---------- */
var bossUiStyle=document.createElement('style');
bossUiStyle.textContent='#bossBanner{position:fixed;left:0;right:0;top:22%;z-index:40;text-align:center;pointer-events:none;display:none}'+
 '#bossBanner .bb1{font-size:clamp(34px,7vw,72px);font-weight:900;letter-spacing:2px;text-shadow:0 0 18px currentColor,0 4px 0 #000,0 0 40px #000}'+
 '#bossBanner .bb2{font-size:clamp(15px,2.6vw,24px);font-weight:800;color:#fff;margin-top:6px;text-shadow:0 2px 6px #000}'+
 '#bossBanner .bbBar{height:4px;margin:10px auto 0;width:min(520px,70vw);background:linear-gradient(90deg,transparent,currentColor,transparent)}'+
 '#bossBanner.show{display:block;animation:bbIn 2.8s ease forwards}@keyframes bbIn{0%{opacity:0;transform:scale(1.6)}12%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(.96)}}'+
 '#bossBar{position:fixed;left:50%;top:12px;transform:translateX(-50%);width:min(560px,70vw);z-index:14;display:none;pointer-events:none;text-align:center}'+
 '#bossBar .bnm{font-weight:900;font-size:17px;text-shadow:0 2px 4px #000}#bossBar .bph{font-size:12px;color:#ffccbc;margin-left:6px}'+
 '#bossBar .btr{position:relative;height:16px;margin-top:3px;background:rgba(0,0,0,.65);border:2px solid rgba(255,255,255,.55);border-radius:9px;overflow:hidden}'+
 '#bossBar .bfl{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ff1744,#ff9100);transition:width .12s}'+
 '#bossBar .bgh{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.45);transition:width .6s .25s}'+
 '#bossBar .tk{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.8)}#bossBar .bhp{font-size:11px;color:#fff;margin-top:2px;text-shadow:0 1px 3px #000}'+
 '#lootPop{position:fixed;left:50%;top:36%;transform:translateX(-50%);z-index:41;min-width:min(420px,86vw);background:linear-gradient(160deg,#3b2a05,#140d00);border:3px solid #ffd54a;border-radius:16px;padding:12px 16px;color:#fff;display:none;box-shadow:0 0 30px rgba(255,213,74,.6);pointer-events:none}'+
 '#lootPop h4{margin:0 0 6px;font-size:20px;color:#ffd54a;text-align:center}#lootPop div{font-size:14px;line-height:1.6}'+
 'body.touch #bossBar{top:calc(6px + var(--sat));width:min(420px,60vw)}';
document.head.appendChild(bossUiStyle);
var bossBannerEl=document.createElement('div');bossBannerEl.id='bossBanner';document.body.appendChild(bossBannerEl);
var bossBarEl=document.createElement('div');bossBarEl.id='bossBar';
bossBarEl.innerHTML='<div><span class="bnm"></span><span class="bph"></span></div><div class="btr"><div class="bgh"></div><div class="bfl"></div><div class="tk" style="left:60%"></div><div class="tk" style="left:30%"></div></div><div class="bhp"></div>';
document.body.appendChild(bossBarEl);
var lootEl=document.createElement('div');lootEl.id='lootPop';document.body.appendChild(lootEl);
var bannerT=0,lootT=0;
function bossBanner(t1,t2,col){
  bossBannerEl.style.color=col||'#ff5252';
  bossBannerEl.innerHTML='<div class="bb1">'+t1+'</div><div class="bbBar"></div><div class="bb2">'+t2+'</div>';
  bossBannerEl.classList.remove('show');void bossBannerEl.offsetWidth;bossBannerEl.classList.add('show');
  clearTimeout(bannerT);bannerT=setTimeout(function(){bossBannerEl.classList.remove('show');},2900);
}
function lootPopup(title,lines){
  lootEl.innerHTML='<h4>'+title+'</h4>'+lines.map(function(l){return '<div>'+l.replace(/</g,'&lt;')+'</div>';}).join('');
  lootEl.style.display='block';clearTimeout(lootT);lootT=setTimeout(function(){lootEl.style.display='none';},5500);
}
/* 슬로모션 (보스 처치 순간) */
var TSCALE=1,tsT=0;
function slowMo(s,dur){TSCALE=s;tsT=dur;}
/* 보스 등장·페이즈 전환 (모두 각자 화면에서) */
function bossPresent(b,dt){
  var bt=b.bt||BOSS_TYPES[0];
  if(!b.intro){b.intro=1;if(DG.on){bossBanner('👹 '+bt.nm,bt.ti+' · 체력 '+fmt(b.max)+(DG.df===3?' · 스테이지 '+DG.wave:''),bt.col);shk=Math.max(shk,3.5);flashA=Math.max(flashA,0.5);if(AC){tone(70,1.2,'sawtooth',0.3,-30);noise(0.8,0.3,300);}}}
  if(b.rage>b.seenRage){b.seenRage=b.rage;if(DG.on){bossBanner(b.rage===2?'💀 3페이즈 — 광폭화':'🔥 2페이즈 — 분노',b.rage===2?'모든 패턴이 미친듯이 몰아친다!':'새로운 패턴이 추가된다!','#ff3d00');shk=Math.max(shk,3);flashA=Math.max(flashA,0.5);if(AC)tone(90,0.8,'sawtooth',0.25,-40);}}
  if(DG.on){
    bossBarEl.style.display='block';
    bossBarEl.querySelector('.bnm').textContent='👹 '+bt.nm;bossBarEl.querySelector('.bnm').style.color=bt.col;
    bossBarEl.querySelector('.bph').textContent=['1페이즈','2페이즈 · 분노','3페이즈 · 광폭화'][b.rage]||'';
    var pc=Math.max(0,b.hp/b.max*100);bossBarEl.querySelector('.bfl').style.width=pc+'%';bossBarEl.querySelector('.bgh').style.width=pc+'%';
    bossBarEl.querySelector('.bhp').textContent=fmt(Math.max(0,b.hp))+' / '+fmt(b.max)+' ('+pc.toFixed(1)+'%)';
  }
}
/* 보스전 전용 BGM (코드로 만든 비트: 킥·스네어·하이햇·베이스) */
var bmOn=false,bmNext=0,bmStep=0,bmGain=null,bmTimer=0,bmNoise=null;
var BM_BASS=[45,45,57,45,43,43,55,43,41,41,53,41,40,40,52,47];
function bossMusic(on){
  if(on===bmOn)return;bmOn=on;
  if(bgmGain)bgmGain.gain.value=bgmLevel();
  if(xmasGain)xmasGain.gain.value=bgmMuted?0:(on?XMAS_VOL*0.15:XMAS_VOL);
  if(!AC)return;
  if(on){
    if(!bmGain){bmGain=AC.createGain();bmGain.connect(AC.destination);}
    if(!bmNoise){var len=AC.sampleRate*0.3;bmNoise=AC.createBuffer(1,len,AC.sampleRate);var d=bmNoise.getChannelData(0);for(var i=0;i<len;i++)d[i]=Math.random()*2-1;}
    bmGain.gain.value=bgmMuted?0:0.3;bmNext=AC.currentTime+0.05;bmStep=0;clearInterval(bmTimer);bmTimer=setInterval(bmSched,50);
  }else{clearInterval(bmTimer);}
}
function bmSched(){
  if(!AC||!bmOn)return;if(bmGain)bmGain.gain.value=bgmMuted?0:0.3;
  var spb=60/156/2,rg=DG.boss?DG.boss.rage:0;
  while(bmNext<AC.currentTime+0.2){bmPlay(bmStep,bmNext,rg);bmNext+=spb*(rg>=2?0.85:1);bmStep=(bmStep+1)%32;}
}
function bmPlay(s,t,rg){
  try{
    if(s%4===0||(rg>=1&&s%8===6)){var o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);o.connect(g);g.connect(bmGain);o.start(t);o.stop(t+0.26);}
    if(s%8===4||(rg>=2&&s%8===7)){var n=AC.createBufferSource(),f=AC.createBiquadFilter(),g2=AC.createGain();n.buffer=bmNoise;f.type='highpass';f.frequency.value=1500;g2.gain.setValueAtTime(0.5,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.15);n.connect(f);f.connect(g2);g2.connect(bmGain);n.start(t);n.stop(t+0.16);}
    if(s%2===1){var h=AC.createBufferSource(),fh=AC.createBiquadFilter(),gh=AC.createGain();h.buffer=bmNoise;fh.type='highpass';fh.frequency.value=7000;gh.gain.setValueAtTime(0.15,t);gh.gain.exponentialRampToValueAtTime(0.001,t+0.04);h.connect(fh);fh.connect(gh);gh.connect(bmGain);h.start(t);h.stop(t+0.05);}
    if(s%2===0){var midi=BM_BASS[(s/2)%16]+(rg>=2?12:0),b=AC.createOscillator(),gb=AC.createGain(),lp=AC.createBiquadFilter();b.type='sawtooth';b.frequency.value=440*Math.pow(2,(midi-69)/12);lp.type='lowpass';lp.frequency.value=600+rg*400;gb.gain.setValueAtTime(0.22,t);gb.gain.exponentialRampToValueAtTime(0.001,t+0.17);b.connect(lp);lp.connect(gb);gb.connect(bmGain);b.start(t);b.stop(t+0.18);}
  }catch(e){}
}
/* 보스 (업로드한 사진 컷아웃) */
/* 보스 종류: 원래 보스 + 수호자 이미지로 만든 보스 6종 (공격 패턴이 서로 달라요)
   pool=1페이즈, p2=2페이즈(체력 60%↓) 추가, p3=3페이즈(30%↓) 추가 */
var BOSS_TYPES=[
  {nm:'노무현 대왕',ti:'던전의 지배자',col:'#b36bff',size:1,hp:1,spd:1,atk:1,pool:['fan','ring','dash'],p2:['sum','fan','spiral'],p3:['ring','dash','shock']},
  {nm:'분노의 화신',ti:'멈추지 않는 돌진',npc:'분노',col:'#ff3d00',size:0.95,hp:0.9,spd:1.45,atk:0.85,pool:['dash','dash','fan'],p2:['dash','shock','fan'],p3:['dash','dash','ring','shock']},
  {nm:'강철의 노',ti:'탄막 기계',npc:'아이언 노',col:'#ff5252',size:1,hp:1,spd:0.9,atk:0.9,pool:['fan','spiral','ring'],p2:['spiral','fan','rain'],p3:['spiral','ring','spiral']},
  {nm:'차원술사 노',ti:'차원을 찢는 자',npc:'닥터 노트레인지',col:'#00e5ff',size:1,hp:1,spd:1,atk:1,rip:0.75,pool:['blink','ring','fan'],p2:['blink','rain','spiral'],p3:['blink','ring','rain']},
  {nm:'폭격 사령관',ti:'하늘에서 떨어지는 재앙',npc:'노정은',col:'#ffab00',size:1.1,hp:1.1,spd:0.8,atk:1,pool:['rain','fan','rain'],p2:['rain','ring','sum'],p3:['rain','rain','shock']},
  {nm:'부족의 소환사',ti:'끝없는 졸개들',npc:'원주민 노무현',col:'#76ff03',size:1,hp:1,spd:0.9,atk:1,pool:['sum','fan','ring'],p2:['sum','rain','sum'],p3:['sum','shock','ring']},
  {nm:'거대 수호자',ti:'땅을 울리는 거인',npc:'노트라맨',col:'#448aff',size:1.5,hp:1.5,spd:0.75,atk:1.15,pool:['shock','fan','dash'],p2:['shock','ring','sum'],p3:['shock','shock','ring','dash']}
];
var bossOrder=[];
function bossPickType(){
  /* 무한 모드: 첫 보스는 원래 보스, 그다음은 안 겹치게 돌아가며 · 다른 난이도: 무작위 */
  if(DG.df===3){var k=Math.max(1,Math.ceil(DG.wave/10));if(k===1)return 0;
    if(!bossOrder.length){for(var i=1;i<BOSS_TYPES.length;i++)bossOrder.push(i);for(var j=bossOrder.length-1;j>0;j--){var r=Math.floor(Math.random()*(j+1)),t=bossOrder[j];bossOrder[j]=bossOrder[r];bossOrder[r]=t;}}
    return bossOrder.shift();}
  return Math.floor(Math.random()*BOSS_TYPES.length);
}
function bossImg(v){
  var t=BOSS_TYPES[v]||BOSS_TYPES[0];
  if(t.npc){for(var i=0;i<NPCS.length;i++)if(NPCS[i].name===t.npc)return {src:NPCS[i].img,ar:NPCS[i].iw/NPCS[i].ih};}
  return {src:window.__BOSSIMG__,ar:window.__BOSSAR__};
}
function makeBossVis(x,z,v){
  v=v|0;var bt=BOSS_TYPES[v]||BOSS_TYPES[0],im=bossImg(v);
  var H=24*bt.size,w=H*im.ar,tex=texLoader.load(im.src),g=new THREE.Group();
  g.position.set(x,0,z);
  var geo=new THREE.PlaneGeometry(w,H);geo.translate(0,H/2,0);
  var mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:0.35,side:THREE.DoubleSide});
  var mesh=new THREE.Mesh(geo,mat);g.add(mesh);scene.add(g);
  return {g:g,mesh:mesh,mat:mat,ph:0,r:6*bt.size,rage:0,flash:0,atkT:3,wind:0,wt:'',dash:0,dx:0,dz:0,v:v,bt:bt,intro:0,seenRage:0};
}
function spawnBoss(){
  if(!DG.act||DG.wdone)return;
  var df=dgDiff(),v=bossPickType(),b=makeBossVis(DX,DZ-HALF*0.3,v),max=Math.round(df.bossHpFix*BOSS_TYPES[v].hp); /* 보스 체력: 난이도별 고정 큰 숫자 × 보스 종류 */
  b.dmgBy={};b.last=null;
  b.hp=max;b.max=max;DG.boss=b;
  DG.ripT=2.5;if(DG.on){shk=3;flashA=0.5;}fxBoom(DX,DZ-HALF*0.3,16,'#b36bff',0.8);
  dgToast(df.inf?'👹 스테이지 '+DG.wave+' 보스 등장! (체력 '+fmt(max)+') 바닥이 찢어진다!':'👹 보스 등장! (체력 '+fmt(max)+') 바닥이 찢어진다 — 구멍에 빠지면 즉사!','warn');
}
function hurtBoss(dmg,who){
  var b=DG.boss;if(!b)return;
  if(who){b.dmgBy[who]=(b.dmgBy[who]||0)+Math.min(dmg,Math.max(0,b.hp));b.last=who;}
  b.hp-=dmg;b.flash=0.1;if(DG.on)floatText(fmt(dmg),b.g.position.x,10,b.g.position.z,'hit');
  burst(b.g.position.x,6,b.g.position.z,'#ffffff',6,7);
  var lv=b.hp<b.max*0.3?2:b.hp<b.max*0.6?1:0;
  if(lv>b.rage){b.rage=lv;}
  if(b.hp<=0)bossDie();
}
function bossDie(){
  var b=DG.boss,p=b.g.position,inf=!!dgDiff().inf;DG.boss=null;if(!inf)DG.wdone=1;
  scene.remove(b.g);
  var mvp=null,mv=-1;for(var id in b.dmgBy)if(b.dmgBy[id]>mv){mv=b.dmgBy[id];mvp=id;}
  var who=Object.keys(b.dmgBy).length;
  bcast({t:'bossK',x:r1(p.x),z:r1(p.z),mvp:mvp,lh:b.last,v:b.v,n:who});
  bossDeadFx(p.x,p.z,mvp,b.last,b.v,who);
  if(inf){ /* 무한 모드: 보스 스테이지 클리어 → 다음 스테이지로 */
    var st=DG.wave,inst=DG.inst;dgStageClear(st,true);resetTilesSoon();
    dgToast('✨ 증강 선택 시간! 다음 스테이지까지 8초','good');
    after(8,function(){if(DG.inst===inst&&DG.act)startWave(st+1);});
  }
}
/* 무한 모드: 보스를 잡으면 찢어진 바닥을 천천히 복구 */
function resetTilesSoon(){DG.ripT=99;var ids=[];DG.tiles.forEach(function(t,k){if(t.st===1){t.st=0;t.t=0;if(t.cr){t.cr.forEach(function(c){scene.remove(c);c.material.dispose();});t.cr=null;}t.m.material.emissive.setRGB(0,0,0);}});bcast({t:'tiles',s:tileState()});}
/* 무한 모드 스테이지 클리어: 방장이 모두에게 알리고, 던전 안에 있는 사람은 각자 보상 */
function dgStageClear(st,boss){bcast({t:'dgst',s:st,b:boss?1:0});dgStageReward(st,boss);}
function dgStageReward(st,boss){
  if(!DG.on||DG.over)return;
  var mul=boss?5:1;
  var gold=Math.round((income()*8+20000)*st*mul*DG.S.gold);
  var spd=Math.round((G.speed*0.004+25)*st*mul*DG.S.spdRw);
  gainMoney(gold);gainSpeed(spd);DG.runSt=Math.max(DG.runSt,st);G.x.st.inf=Math.max(G.x.st.inf,st);
  if(st>infBest){infBest=st;try{localStorage.setItem(INF_KEY,String(st));}catch(e){}}
  floatText('♾️ '+st+'스테이지 클리어! 💰+'+fmt(gold)+' ⚡+'+fmt(spd),VW()/2,VH()*0.33,0,'money');
  toast((boss?'👑 보스 ':'✅ ')+'스테이지 '+st+' 클리어! 💰 +'+fmt(gold)+' · ⚡ 속도 +'+fmt(spd),'good');
  sfx.deposit();save();
  if(boss&&DG.df===3)after(1,function(){augOpen(st);}); /* 보스 잡으면 증강 고르기 */
}
/* 보스가 죽었을 때: 던전 안에 있던 사람은 각자 자기 보상을 받음 */
function bossDeadFx(x,z,mvp,lh,v,nPl){
  fxBoom(x,z,22,'#ffd54a',1);fxBoom(x,z,34,'#ffffff',1);
  for(var i=0;i<260*fxMul;i++)emit(x+rand(-4,4),rand(1,14),z+rand(-3,3),rand(-16,16),rand(4,22),rand(-16,16),i%3?'#ffd54a':'hsl('+((Math.random()*360)|0)+',95%,62%)',rand(0.6,1.4),18);
  if(!DG.on||DG.over)return;
  slowMo(0.25,1.3);shk=Math.max(shk,4);flashA=Math.max(flashA,0.7);
  var bt=BOSS_TYPES[v|0]||BOSS_TYPES[0],df=dgDiff(),inf=!!df.inf,isMvp=mvp===NET.my&&(nPl||1)>1,isLh=lh===NET.my;
  G.x.st.boss++;if(DG.df===2)G.x.st.hard++;addCoin(DG.df>=2?2:1,'보스 처치');
  bossBanner('👑 BOSS DOWN!',bt.nm+' 격파'+(isMvp?' · 🏅 MVP':'')+(isLh?' · 🗡️ 막타':''),'#ffd54a');
  var lines=[];
  if(!inf){ /* 일반 던전: 큰 보상 + 속도 */
    var m=medals(),rw=Math.round((income()*900+1500000)*(1+m*0.25)*df.reward*(isMvp?1.5:1));
    var sp=Math.round(G.speed*0.08*df.reward*(isMvp?1.5:1)+100);
    gainMoney(rw);gainSpeed(sp);lines.push('💰 보스 보상 +'+fmt(rw),'⚡ 속도 +'+fmt(sp));
  }
  /* 보스 상자: 난이도만큼 + MVP·막타 보너스 */
  var rolls=(df.chest||1)+(isMvp?1:0)+(isLh?1:0);
  for(var k=0;k<rolls;k++)lines.push(bossChestRoll(df.reward));
  if(isMvp)lines.push('🏅 MVP (보스에게 가장 많은 피해) — 보상 ×1.5 + 상자 1개');
  if(isLh)lines.push('🗡️ 막타 — 상자 1개 추가');
  lootPopup('🎁 보스 상자 ×'+rolls,lines);
  save();sfx.deposit();
  if(inf){toast('👑 보스 격파! 다음 스테이지로...','good');return;}
  DG.over=2;
  after(5,function(){if(DG.on)exitDungeon(true);});
}
/* 보스 상자 한 칸: 골드 대박 / 속도 / 트로피(높은 등급일수록 드묾) */
function bossChestRoll(mul){
  var r=Math.random();
  if(r<0.45){var g=Math.round((income()*240+400000)*rand(1,3)*Math.max(0.5,mul));gainMoney(g);return '💰 골드 주머니 +'+fmt(g);}
  if(r<0.75){var s=Math.round(G.speed*rand(0.04,0.1)*Math.max(0.5,mul)+50);gainSpeed(s);return '⚡ 속도 물약 +'+fmt(s);}
  var tot=0,i;for(i=0;i<N;i++)tot+=1/(i+1);var x=Math.random()*tot,pick=0;for(i=0;i<N;i++){x-=1/(i+1);if(x<=0){pick=i;break;}}
  G.counts[pick]++;updateExhibit(pick);updateHall();
  return '🏆 트로피! ['+gradeOf(pick).name+'] '+NPCS[pick].name+' (+'+fmt(NPCS[pick].income)+'/초)';
}
/* 보스 스킬: 랜덤 구역을 찢어서 없애버림 */
function addCracks(t){
  var x=DX+(t.ix-TC)*TS,z=DZ+(t.iz-TC)*TS;t.cr=[];
  for(var i=0;i<3;i++){var c=new THREE.Mesh(boxG,gm(0xff3050,0.9));c.scale.set(0.25,0.1,TS*1.05);c.position.set(x,0.08,z);c.rotation.y=Math.random()*3.14;scene.add(c);t.cr.push(c);}
}
function ripPlan(){
  var b=DG.boss,rg=b.rage,list=[],pool,i,pt=Math.random(),m3=Math.floor(medals()/3);
  var pl=dgPlayers(),TG=pl.length?pl[Math.floor(Math.random()*pl.length)]:{x:DX,z:DZ,vx:0,vz:0};
  function add(t){if(t&&list.indexOf(t)<0)list.push(t);}
  function around(x,z,r){
    var cx=clamp(Math.floor((x-DX)/TS+TN/2),0,TN-1),cz=clamp(Math.floor((z-DZ)/TS+TN/2),0,TN-1);
    for(var a=-r;a<=r;a++)for(var c=-r;c<=r;c++){var ix=cx+a,iz=cz+c;if(ix>=0&&ix<TN&&iz>=0&&iz<TN)add(DG.tiles[ix*TN+iz]);}
  }
  var w=[1.5,1.25,1.05][rg];
  if(pt<0.28){
    var k=24+rg*14+m3;pool=DG.tiles.slice();
    for(i=0;i<k&&pool.length;i++)add(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }else if(pt<0.5||(!rg&&pt<0.7)){
    var row=Math.random()<0.5,idx=Math.floor(Math.random()*TN),wd=1+rg;
    DG.tiles.forEach(function(t){var v=row?t.iz:t.ix;if(v>=idx&&v<idx+wd)add(t);});
  }else if(pt<0.85||!rg){
    around(TG.x+(TG.vx||0)*0.5,TG.z+(TG.vz||0)*0.5,1);
    if(rg>=1)around(TG.x,TG.z,1);
    if(rg>=2)for(i=0;i<3;i++)around(TG.x+rand(-35,35),TG.z+rand(-35,35),1);
  }else{
    w+=0.2;
    DG.tiles.forEach(function(t){if((t.ix+t.iz)%2===DG.chk)add(t);});DG.chk^=1;
  }
  var ids=[];
  list.forEach(function(t){if(t.st===0)ids.push(t.ix*TN+t.iz);});
  applyRip(ids,w);bcast({t:'rip',l:ids,w:w});
  DG.ripT=w+[2.8,2.0,1.4][rg]*dgDiff().rip*(b.bt.rip||1);
  var now=performance.now()/1000;if(now-DG.warnT>2.5){DG.warnT=now;dgToast('⚠️ 붉은 칸이 찢어져요! 구멍에 빠지면 즉사! 벗어나거나 점프!','warn');}
}
function applyRip(ids,w){
  ids.forEach(function(k){var t=DG.tiles[k];if(t&&t.st===0){t.st=1;t.t=w;addCracks(t);}});
  if(AC&&DG.on)tone(140,0.5,'sawtooth',0.2,-60);
}
function tileState(){return DG.tiles.map(function(t){return [t.st,r2(t.t)];});}
function applyTiles(s){
  resetTiles();
  s.forEach(function(a,k){
    var t=DG.tiles[k];if(!t)return;t.st=a[0];t.t=a[1];
    if(t.st===1)addCracks(t);
    else if(t.st===2){t.m.visible=false;showRim(t,true);}
    else if(t.st===3)t.m.scale.y=Math.min(1,0.05+t.t);
  });
}
/* 발밑 판정: 캐릭터 발 전체(가운데 + 네 모서리)가 다 구멍 위에 있어야 떨어져요 */
var FOOT_R=0.9;
function tileAtXZ(x,z){
  var ix=Math.floor((x-DX)/TS+TN/2),iz=Math.floor((z-DZ)/TS+TN/2);
  if(ix<0||iz<0||ix>=TN||iz>=TN)return null;return DG.tiles[ix*TN+iz];
}
function onHoleAll(){
  var r=FOOT_R,pts=[[0,0],[r,r],[r,-r],[-r,r],[-r,-r]];
  for(var i=0;i<pts.length;i++){var t=tileAtXZ(P.x+pts[i][0],P.z+pts[i][1]);if(!t||t.st!==2)return false;}
  return true;
}
var rimMat=new THREE.MeshBasicMaterial({color:0xff1744});
function showRim(t,on){
  if(on&&!t.rim){
    var x=DX+(t.ix-TC)*TS,z=DZ+(t.iz-TC)*TS,g=new THREE.Group(),L=TS-0.15;
    [[0,-L/2,L,0.3],[0,L/2,L,0.3],[-L/2,0,0.3,L],[L/2,0,0.3,L]].forEach(function(a){var m=new THREE.Mesh(boxG,rimMat);m.scale.set(a[2],0.12,a[3]);m.position.set(a[0],0.03,a[1]);g.add(m);});
    g.position.set(x,0,z);scene.add(g);t.rim=g;
  }
  if(t.rim)t.rim.visible=!!on;
}
function tileAt(){
  var ix=clamp(Math.floor((P.x-DX)/TS+TN/2),0,TN-1),iz=clamp(Math.floor((P.z-DZ)/TS+TN/2),0,TN-1);
  return DG.tiles[ix*TN+iz];
}
function ripTile(t){
  var x=DX+(t.ix-TC)*TS,z=DZ+(t.iz-TC)*TS,pw=DG.boss&&DG.boss.rage?0.7:0.5;
  if(t.cr){t.cr.forEach(function(c){scene.remove(c);c.material.dispose();});t.cr=null;}
  var ck=new THREE.Mesh(boxG,new THREE.MeshLambertMaterial({color:t.m.material.color}));
  ck.scale.set(TS-0.15,1,TS-0.15);ck.position.set(x,-0.5,z);scene.add(ck);
  var tm=0,rx=rand(-6,6),rz=rand(-6,6);
  addH({u:function(dt){tm+=dt;ck.position.y=-0.5+tm*16-tm*tm*30;ck.rotation.x+=rx*dt;ck.rotation.z+=rz*dt;var s=Math.max(0.01,1-tm*1.6);ck.scale.set((TS-0.15)*s,s,(TS-0.15)*s);return tm>0.6;},x:function(){scene.remove(ck);ck.material.dispose();}});
  if(DG.on)fxBoom(x,z,TS*0.75,'#ff4060',pw);
  if(DG.on)for(var i=0;i<40*fxMul;i++)emit(x+rand(-3.5,3.5),0.5,z+rand(-3.5,3.5),rand(-6,6),rand(4,14),rand(-6,6),i%2?'#ff4060':'#b36bff',rand(0.5,1),22);
  t.m.visible=false;t.m.material.emissive.setRGB(0,0,0);t.st=2;t.t=5.5;showRim(t,true);
  if(DG.on&&!DG.over&&P.y<1.3&&onHoleAll())fallDeath();
}
function resetTiles(){
  DG.tiles.forEach(function(t){showRim(t,false);if(t.cr){t.cr.forEach(function(c){scene.remove(c);c.material.dispose();});t.cr=null;}t.st=0;t.t=0;t.m.visible=true;t.m.scale.y=1;t.m.material.emissive.setRGB(0,0,0);});
}
function updateTiles(dt){
  var tt=performance.now()/1000;
  DG.tiles.forEach(function(t){
    if(t.st===1){t.t-=dt;t.m.material.emissive.setRGB(0.35+0.35*Math.sin(tt*25),0,0);if(t.t<=0)ripTile(t);}
    else if(t.st===2){t.t-=dt;if(t.t<=0){t.st=3;t.t=0;t.m.visible=true;t.m.scale.y=0.05;showRim(t,false);}}
    else if(t.st===3){t.t+=dt*3;t.m.scale.y=Math.min(1,0.05+t.t);if(t.t>=1){t.st=0;}}
  });
}
/* 입장 / 퇴장 (내 캐릭터) */
/* 찢어진(또는 곧 찢어질) 칸을 피해서, 기본 위치에서 가장 가까운 멀쩡한 칸에 내려줘요 */
function dgSafeSpawn(){
  var x0=DX,z0=DZ+HALF*0.5,best=null,bd=1e9,b=DG.boss;
  DG.tiles.forEach(function(t){
    if(t.st!==0)return;
    var x=DX+(t.ix-TC)*TS,z=DZ+(t.iz-TC)*TS,d=Math.hypot(x-x0,z-z0);
    if(b&&Math.hypot(x-b.g.position.x,z-b.g.position.z)<b.r+8)d+=500;
    if(d<bd){bd=d;best={x:x,z:z};}
  });
  if(!best)best={x:x0,z:z0};
  P.x=best.x;P.z=best.z;P.y=0;P.vy=0;P.kx=P.kz=0;
  camPos.set(P.x,12,P.z-12);
}
/* 난이도 고르기 창 */
var dgPickEl=document.createElement('div');dgPickEl.id='dgPick';
dgPickEl.innerHTML='<div class="bkPanel"><h3>🕳️ 던전 난이도</h3><div id="dgPickBtns"></div><button id="dgPickNo" type="button">취소</button></div>';
document.body.appendChild(dgPickEl);
DG_DIFFS.forEach(function(d,i){
  var b=document.createElement('button');b.type='button';b.className='dgPickBtn';b.style.borderColor=d.col;
  b.innerHTML='<b>'+(i+1)+'. '+d.ico+' '+d.name+(d.inf?' <span class="infBest"></span>':'')+'</b><small>'+d.desc+'</small>';
  b.addEventListener('click',function(){dgPickClose();enterDungeon(i);});
  $('dgPickBtns').appendChild(b);
});
function dgPickOpen(){
  var m=medals();
  if(m<3){toast('🏅 메달(수집한 큰 손 종류)이 3개 이상 필요해요! 지금 '+m+'개','warn');sfx.deny();return;}
  /* 친구가 이미 던전 안에 있으면 그 난이도로 바로 같이 들어가요 */
  if(DG.act&&!DG.wdone&&dgAnyInsideOthers()){enterDungeon(DG.df);return;}
  var ib=dgPickEl.querySelector('.infBest');if(ib)ib.textContent=infBest?'(최고 '+infBest+'스테이지)':'';
  dgPickEl.style.display='flex';modalOpen=true;keys={};joy.x=joy.y=0;
}
function dgPickClose(){dgPickEl.style.display='none';modalOpen=false;}
function dgAnyInsideOthers(){for(var id in REM)if(REM[id].dg)return true;return false;}
$('dgPickNo').addEventListener('click',dgPickClose);
addEventListener('keydown',function(e){
  if(dgPickEl.style.display!=='flex')return;
  if(e.key==='1'||e.key==='2'||e.key==='3'||e.key==='4'){var i=+e.key-1;dgPickClose();enterDungeon(i);}
  else if(e.key==='Escape')dgPickClose();
});
function enterDungeon(df){
  var m=medals();
  if(m<3){toast('🏅 메달(수집한 큰 손 종류)이 3개 이상 필요해요! 지금 '+m+'개','warn');sfx.deny();return;}
  DG.myDf=dgDfOk(df)?df:1;
  if(!(DG.act&&!DG.wdone&&dgAnyInsideOthers()))DG.df=DG.myDf;
  augReset();
  DG.on=true;DG.runSt=0;DG.max=Math.round(dgMaxHp()*DG.S.hp);DG.hp=DG.max;DG.inv=1;DG.over=0;DG.cd=0;
  DG.fall=0;P.stun=0;DG.spawnT=1.5;dgSafeSpawn();
  camPos.set(P.x,12,P.z-12);
  dgHudEl.style.display='block';$('shop').classList.add('hide');
  burst(P.x,3,P.z,'#b36bff',40,10);sfx.steal();
  var others=0;for(var id in REM)if(REM[id].dg)others++;
  var dfc=dgDiff();
  toast('🕳️ 던전 입장! '+dfc.ico+' '+dfc.name+' · [E] 베기 공격력 '+fmt(dgDmg())+' (속도에 비례) · HP '+DG.max+' · ⚠️ 구멍에 빠지면 즉사!'+(others?' · 👥 친구 '+others+'명과 함께!':''),'good');
  if(hostSide())dgWorldJoin(DG.myDf);else netSendState();
  if(DG.df===3)after(0.5,function(){augOpen(0);}); /* 무한 모드: 시작 증강 */
}
function exitDungeon(win){
  augReset();
  DG.on=false;DG.over=0;DG.fall=0;P.stun=0;P.vy=0;
  P.x=slotX(mySlot)+SPAWN_DX;P.z=SPAWN_Z;P.y=0;P.gy=0;P.kx=P.kz=0;P.cz=P.z;camPos.set(P.x,12,P.z-12);
  dgHudEl.style.display='none';$('shop').classList.remove('hide');pChar.root.visible=true;
  if(DG.df===3&&DG.runSt>0)toast('♾️ 무한 모드 기록: '+DG.runSt+'스테이지 클리어! (최고 '+infBest+')','good');
  else toast(win?'🏠 던전 클리어! 기지로 귀환':'🏠 기지로 귀환','good');
  if(hostSide())dgWorldCheckEnd();else netSendState();
}
$('dgExit').addEventListener('click',function(){if(DG.on)exitDungeon(false);});
/* =========================================================
   ♾️ 무한 모드 증강 (롤 아레나 느낌)
   - 무한 모드 시작할 때 + 보스(10·20·30…스테이지)를 잡을 때마다 3개 중 1개 고르기
   - 한 번 고를 때 3개는 같은 등급: 실버 / 골드 / 프리즘 (뒤로 갈수록 좋은 등급이 잘 나와요)
   - 증강은 내 캐릭터에만 적용되고, 던전에서 나오면 사라져요
   ========================================================= */
var AUG_TIERS=[
  {name:'실버',col:'#cfd8dc',bg:'linear-gradient(160deg,#4a5563,#1b222c)'},
  {name:'골드',col:'#ffca28',bg:'linear-gradient(160deg,#6b4e0f,#251a03)'},
  {name:'프리즘',col:'#ffffff',bg:'linear-gradient(135deg,#ff4fd8,#7c6cff 35%,#22d3ee 65%,#facc15)'}
];
/* st:1 = 여러 번 고를 수 있어요(겹쳐 쌓임) */
var AUGS=[
  /* ----- 실버 ----- */
  {id:'sharp',t:0,ic:'🗡️',nm:'날 선 주먹',ds:'공격력 +25%',st:1,f:function(S){S.dmg*=1.25;}},
  {id:'quick',t:0,ic:'💨',nm:'가벼운 손놀림',ds:'공격 쿨타임 -12%',st:1,f:function(S){S.cd*=0.88;}},
  {id:'tough',t:0,ic:'🧱',nm:'튼튼한 몸',ds:'최대 체력 +30%',st:1,f:function(S){S.hp*=1.3;}},
  {id:'bandage',t:0,ic:'🩹',nm:'반창고',ds:'매초 최대 체력의 1% 회복',st:1,f:function(S){S.regen+=0.01;}},
  {id:'sneakers',t:0,ic:'👟',nm:'운동화',ds:'이동 속도 +15%',st:1,f:function(S){S.move*=1.15;}},
  {id:'longarm',t:0,ic:'🦾',nm:'긴 팔',ds:'공격 범위 +20%',st:1,f:function(S){S.range*=1.2;}},
  {id:'lucky',t:0,ic:'🍀',nm:'행운의 일격',ds:'치명타 확률 +15% (치명타 = 2배 피해)',st:1,f:function(S){S.crit+=0.15;}},
  {id:'padding',t:0,ic:'🧥',nm:'두꺼운 옷',ds:'받는 피해 -10%',st:1,f:function(S){S.dr+=0.1;}},
  {id:'spring',t:0,ic:'🦘',nm:'스프링 신발',ds:'점프 높이 +35%',st:1,f:function(S){S.jump*=1.35;}},
  {id:'piggy',t:0,ic:'🐷',nm:'돼지 저금통',ds:'스테이지 골드 보상 +30%',st:1,f:function(S){S.gold*=1.3;}},
  {id:'snack',t:0,ic:'🍙',nm:'간식 주머니',ds:'근처에서 몹이 죽을 때마다 최대 체력 2% 회복',st:1,f:function(S){S.killHeal+=0.02;}},
  {id:'nimble',t:0,ic:'🐈',nm:'날렵함',ds:'10% 확률로 피해 회피',st:1,f:function(S){S.dodge+=0.1;}},
  {id:'blink',t:0,ic:'✨',nm:'무적 반사',ds:'맞은 뒤 무적 시간 +50%',st:0,f:function(S){S.inv*=1.5;}},
  {id:'hunter',t:0,ic:'🏹',nm:'보스 사냥꾼',ds:'보스에게 주는 피해 +30%',st:1,f:function(S){S.bossDmg*=1.3;}},
  /* ----- 골드 ----- */
  {id:'titan',t:1,ic:'🗿',nm:'거인화',ds:'최대 체력 +60% · 공격 범위 +25% · 이동 속도 -10%',st:1,f:function(S){S.hp*=1.6;S.range*=1.25;S.move*=0.9;}},
  {id:'vamp',t:1,ic:'🧛',nm:'흡혈',ds:'공격에 맞은 적 하나당 최대 체력 1.5% 회복',st:1,f:function(S){S.vamp+=0.015;}},
  {id:'nova',t:1,ic:'💥',nm:'충격파',ds:'3초마다 주변에 공격력 150% 충격파 (겹치면 더 자주)',st:1,f:function(S){S.nova+=1;}},
  {id:'bolt',t:1,ic:'⚡',nm:'번개 소환',ds:'2초마다 가까운 적에게 공격력 200% 번개',st:1,f:function(S){S.bolt+=1;}},
  {id:'execute',t:1,ic:'🪓',nm:'처형인',ds:'체력 15% 미만인 잡몹을 즉시 처치',st:0,f:function(S){S.exec=Math.max(S.exec,0.15);}},
  {id:'berserk',t:1,ic:'😡',nm:'광전사',ds:'체력이 낮을수록 공격력 최대 +100%',st:1,f:function(S){S.berserk+=1;}},
  {id:'shield',t:1,ic:'🛡️',nm:'보호막',ds:'8초마다 최대 체력 20% 보호막',st:1,f:function(S){S.shield+=0.2;}},
  {id:'thorns',t:1,ic:'🌵',nm:'가시 갑옷',ds:'맞으면 주변에 공격력 300% 반격 폭발',st:1,f:function(S){S.thorns+=1;}},
  {id:'djump',t:1,ic:'🪽',nm:'2단 점프',ds:'공중에서 한 번 더 점프 (겹치면 +1번)',st:1,f:function(S){S.dj+=1;}},
  {id:'wings',t:1,ic:'😇',nm:'천사 날개',ds:'구멍에 빠지면 스테이지마다 1번 구조',st:1,f:function(S){S.wings+=1;}},
  {id:'goldhand',t:1,ic:'🤑',nm:'황금 손',ds:'스테이지 골드 +80% · 속도 보상 +40%',st:1,f:function(S){S.gold*=1.8;S.spdRw*=1.4;}},
  {id:'glass',t:1,ic:'🔮',nm:'유리 대포',ds:'공격력 +80% · 최대 체력 -25%',st:1,f:function(S){S.dmg*=1.8;S.hp*=0.75;}},
  {id:'frenzy',t:1,ic:'🥊',nm:'연타',ds:'공격 쿨타임 -25% · 공격력 -10%',st:1,f:function(S){S.cd*=0.75;S.dmg*=0.9;}},
  /* ----- 프리즘 ----- */
  {id:'phoenix',t:2,ic:'🔥',nm:'불사조',ds:'쓰러지면 체력 50%로 1번 부활 (구멍 즉사 포함)',st:1,f:function(S){S.revive+=1;}},
  {id:'twin',t:2,ic:'👊',nm:'쌍둥이 주먹',ds:'공격할 때마다 70% 피해로 한 번 더 때려요',st:0,f:function(S){S.double=1;}},
  {id:'storm',t:2,ic:'🌩️',nm:'폭풍의 눈',ds:'0.8초마다 적 3명에게 공격력 200% 번개',st:0,f:function(S){S.bolt+=3;S.boltN=Math.max(S.boltN,3);S.boltFast=1;}},
  {id:'wargod',t:2,ic:'⚔️',nm:'전투의 신',ds:'공격력 +100% · 쿨타임 -20% · 범위 +20%',st:1,f:function(S){S.dmg*=2;S.cd*=0.8;S.range*=1.2;}},
  {id:'fortress',t:2,ic:'🏰',nm:'철옹성',ds:'받는 피해 -40% · 최대 체력 +100%',st:0,f:function(S){S.dr+=0.4;S.hp*=2;}},
  {id:'orbit',t:2,ic:'🌀',nm:'회전 칼날',ds:'내 주변을 도는 칼날 3개가 계속 공격 (공격력 60%)',st:1,f:function(S){S.orbit+=1;}},
  {id:'midas',t:2,ic:'👑',nm:'미다스의 손',ds:'스테이지 골드·속도 보상 ×2.5',st:1,f:function(S){S.gold*=2.5;S.spdRw*=2.5;}},
  {id:'precise',t:2,ic:'🎯',nm:'치명적 정밀함',ds:'치명타 확률 +40% · 치명타 피해 3배',st:0,f:function(S){S.crit+=0.4;S.critMul=Math.max(S.critMul,3);}},
  {id:'bossbane',t:2,ic:'☠️',nm:'보스 학살자',ds:'보스 피해 +150% · 체력 10% 미만 보스 처형',st:0,f:function(S){S.bossDmg*=2.5;S.bexec=Math.max(S.bexec,0.1);}},
  {id:'meteor',t:2,ic:'☄️',nm:'유성우',ds:'4초마다 주변 5곳에 공격력 250% 유성',st:1,f:function(S){S.meteor+=1;}},
  {id:'hermes',t:2,ic:'🪶',nm:'헤르메스',ds:'이동 속도 +40% · 점프 2번 추가 · 회피 +20%',st:0,f:function(S){S.move*=1.4;S.dj+=2;S.dodge+=0.2;}}
];
var AUG_BY={};AUGS.forEach(function(a){AUG_BY[a.id]=a;});
function augBase(){var S={dmg:1,cd:1,range:1,crit:0,critMul:2,hp:1,regen:0,move:1,jump:1,dj:0,dr:0,dodge:0,inv:1,gold:1,spdRw:1,bossDmg:1,exec:0,bexec:0,berserk:0,killHeal:0,vamp:0,nova:0,bolt:0,boltN:1,boltFast:0,orbit:0,meteor:0,shield:0,thorns:0,revive:0,wings:0,double:0};if(G.x)gearDungeon(S);return S;} /* 장비(무기·장신구·칭호·물약)가 기본값에 들어가요 */
function augStats(){var S=augBase();for(var id in DG.aug){var a=AUG_BY[id];for(var k=0;k<DG.aug[id];k++)a.f(S);}S.dr=Math.min(0.8,S.dr);S.dodge=Math.min(0.6,S.dodge);S.crit=Math.min(1,S.crit);return S;}
DG.aug={};DG.S=augBase();DG.augN=0;DG.shield=0;DG.at={nova:0,bolt:0,orbit:0,meteor:0,shield:0};DG.revUsed=0;DG.wingUsed=0;DG.wingWave=-1;DG.blades=[];
function augReset(){
  DG.aug={};DG.S=augBase();DG.augN=0;DG.shield=0;DG.revUsed=0;DG.wingUsed=0;DG.wingWave=-1;
  DG.at={nova:0,bolt:0,orbit:0,meteor:0,shield:0};
  DG.blades.forEach(function(b){scene.remove(b);});DG.blades=[];augClose(true);augHud();
}
function augApply(){
  var old=DG.max||1;DG.S=augStats();DG.max=Math.round(dgMaxHp()*DG.S.hp);DG.hp=Math.min(DG.max,DG.hp*DG.max/old);
  /* 회전 칼날 모양 */
  var want=DG.S.orbit>0?3:0;
  while(DG.blades.length<want){var b=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.35,0.7),new THREE.MeshBasicMaterial({color:0xb3e5fc}));scene.add(b);DG.blades.push(b);}
  augHud();
}
/* 내 공격력 (증강 포함) */
function augDmg(canCrit){
  var S=DG.S,d=dgDmg()*S.dmg*(1+S.berserk*(1-DG.hp/(DG.max||1)));
  if(canCrit&&S.crit>0&&Math.random()<S.crit){d*=S.critMul;DG.crit=1;}else DG.crit=0;
  return Math.round(d);
}
/* 위치 공격 (방장은 바로, 친구는 방장에게 보내기) */
function augHit(x,z,dmg,r){
  dmg=Math.round(dmg);if(dmg<=0||!DG.on||DG.over)return;var S=DG.S;
  if(hostSide())dgHitAt(x,z,dmg,r,S.bossDmg,S.exec,S.bexec);
  else sendHost({t:'atk',x:r2(x),z:r2(z),d:dmg,r:r,bm:S.bossDmg,ex:S.exec,bx:S.bexec});
}
function augTargets(n,maxD){
  var list=[];
  DG.mobs.forEach(function(o){var d=Math.hypot(o.g.position.x-P.x,o.g.position.z-P.z);if(d<maxD)list.push({x:o.g.position.x,z:o.g.position.z,d:d});});
  if(DG.boss){var b=DG.boss.g.position,db=Math.hypot(b.x-P.x,b.z-P.z);if(db<maxD+8)list.push({x:b.x,z:b.z,d:db});}
  list.sort(function(a,b){return a.d-b.d;});return list.slice(0,n);
}
function augHeal(f){if(f>0&&DG.on&&!DG.over)DG.hp=Math.min(DG.max,DG.hp+DG.max*f);}
/* 매 프레임: 회복·보호막·자동 공격 */
function augTick(dt){
  var S=DG.S,A=DG.at;if(!DG.on||DG.over)return;
  if(DG.wingWave!==DG.wave){DG.wingWave=DG.wave;DG.wingUsed=0;}
  if(S.regen)augHeal(S.regen*dt);
  if(S.shield){A.shield+=dt;if(A.shield>=8){A.shield=0;DG.shield=Math.max(DG.shield,DG.max*S.shield);floatText('🛡️ 보호막',VW()/2,VH()*0.42,0,'spd');}}
  if(S.nova){A.nova+=dt;var np=3/(1+0.5*(S.nova-1));if(A.nova>=np){A.nova=0;augHit(P.x,P.z,augDmg(false)*1.5,12);fxBoom(P.x,P.z,12,'#ffab40',0.6);}}
  if(S.bolt){A.bolt+=dt;var bp=S.boltFast?0.8:2/(1+0.4*(S.bolt-1));if(A.bolt>=bp){A.bolt=0;
    augTargets(S.boltN+(S.boltFast?0:S.bolt-1),45).forEach(function(t){augHit(t.x,t.z,augDmg(false)*2,3.5);
      for(var i=0;i<14*fxMul;i++)emit(t.x+rand(-0.4,0.4),rand(0,18),t.z+rand(-0.4,0.4),0,-rand(10,30),0,'#fff59d',0.35,0);fxBoom(t.x,t.z,4,'#fff176',0.4);});}}
  if(S.orbit){A.orbit+=dt;var tt=performance.now()/1000;
    DG.blades.forEach(function(b,i){var a=tt*4+i*2.094;b.position.set(P.x+Math.cos(a)*6.5,P.y+1.6,P.z+Math.sin(a)*6.5);b.rotation.y=-a;});
    if(A.orbit>=0.5){A.orbit=0;DG.blades.forEach(function(b){augHit(b.position.x,b.position.z,augDmg(false)*0.6*S.orbit,3);});}}
  if(S.meteor){A.meteor+=dt;var mp=4/(1+0.4*(S.meteor-1));if(A.meteor>=mp){A.meteor=0;
    var tg=augTargets(5,30);
    for(var k=0;k<5;k++){var m=tg[k]||{x:P.x+rand(-18,18),z:P.z+rand(-18,18)};(function(x,z){
      for(var i=0;i<10*fxMul;i++)emit(x+rand(-1,1),rand(12,24),z+rand(-1,1),rand(-2,2),-rand(25,40),rand(-2,2),'#ff7043',0.6,0);
      after(0.35,function(){fxBoom(x,z,5,'#ff5722',0.6);augHit(x,z,augDmg(false)*2.5,5.5);});})(m.x,m.z);}}}
  if(augOpenNow)DG.inv=Math.max(DG.inv,0.3); /* 고르는 동안은 무적 */
}
/* ---------- 고르기 창 ---------- */
var augEl=document.createElement('div');augEl.id='augModal';
augEl.innerHTML='<div class="augBox"><h3 id="augTitle"></h3><div id="augSub"></div><div id="augCards"></div><div class="augFoot"><button id="augReroll" type="button">🎲 다시 뽑기 (1번)</button><span id="augTimer"></span></div></div>';
document.body.appendChild(augEl);
var augSt=0,augOpenNow=false,augOpts=[],augTier=0,augRerolls=0,augLeft=0,augTimerId=0;
function augRollTier(){
  var k=DG.augN,w=[Math.max(10,60-12*k),30+4*k,10+8*k],r=Math.random()*(w[0]+w[1]+w[2]);
  return r<w[0]?0:r<w[0]+w[1]?1:2;
}
function augRoll(){
  var pool=AUGS.filter(function(a){return a.t===augTier&&(a.st||!DG.aug[a.id]);});
  augOpts=[];while(augOpts.length<3&&pool.length)augOpts.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  var T=AUG_TIERS[augTier];
  $('augTitle').innerHTML='✨ 증강 선택 <span style="color:'+T.col+'">'+T.name+'</span>';
  $('augSub').textContent=(augSt?'스테이지 '+augSt+' 보스 격파!':'무한 모드 시작!')+' 하나를 골라요 · 고르는 동안 무적 · 키보드 1·2·3';
  var box=$('augCards');box.innerHTML='';
  augOpts.forEach(function(a,i){
    var c=document.createElement('button');c.type='button';c.className='augCard t'+a.t;c.style.background=T.bg;c.style.borderColor=T.col;
    var cnt=DG.aug[a.id]||0;
    c.innerHTML='<div class="augIc">'+a.ic+'</div><b>'+(i+1)+'. '+a.nm+'</b><small>'+a.ds+'</small>'+(cnt?'<em>보유 ×'+cnt+'</em>':'');
    c.addEventListener('click',function(){augTake(a.id);});box.appendChild(c);
  });
  $('augReroll').disabled=augRerolls<=0;$('augReroll').textContent='🎲 다시 뽑기 ('+augRerolls+'번)';
}
function augOpen(st){
  if(!DG.on||DG.over||augOpenNow)return;augSt=st||0;
  augOpenNow=true;augTier=augRollTier();augRerolls=1;augRoll();
  augEl.style.display='flex';modalOpen=true;keys={};joy.x=joy.y=0;
  sfx.buy();augLeft=15;$('augTimer').textContent='⏳ '+augLeft;
  clearInterval(augTimerId);augTimerId=setInterval(function(){augLeft--;$('augTimer').textContent='⏳ '+augLeft;if(augLeft<=0&&augOpts.length)augTake(augOpts[Math.floor(Math.random()*augOpts.length)].id);},1000);
}
function augClose(silent){clearInterval(augTimerId);if(!augOpenNow)return;augOpenNow=false;augEl.style.display='none';modalOpen=false;}
function augTake(id){
  var a=AUG_BY[id];if(!a||!augOpenNow)return;
  DG.aug[id]=(DG.aug[id]||0)+1;DG.augN++;augClose();augApply();
  burst(P.x,4,P.z,AUG_TIERS[a.t].col==='#ffffff'?'#ff80ff':AUG_TIERS[a.t].col,36,9);sfx.deposit();
  toast(a.ic+' ['+AUG_TIERS[a.t].name+'] '+a.nm+' — '+a.ds,'good');
}
$('augReroll').addEventListener('click',function(){if(augRerolls>0){augRerolls--;augRoll();sfx.tick();}});
addEventListener('keydown',function(e){
  if(!augOpenNow)return;
  if(e.key==='1'||e.key==='2'||e.key==='3'){var o=augOpts[+e.key-1];if(o)augTake(o.id);}
  else if(e.key==='r'||e.key==='R'){$('augReroll').click();}
});
/* 던전 HUD에 가진 증강 표시 */
var augHudEl=document.createElement('div');augHudEl.id='dgAug';dgHudEl.insertBefore(augHudEl,$('dgExit'));
function augHud(){
  var h='';for(var id in DG.aug){var a=AUG_BY[id];h+='<span title="'+a.nm+': '+a.ds+'" class="t'+a.t+'">'+a.ic+(DG.aug[id]>1?'<sub>'+DG.aug[id]+'</sub>':'')+'</span>';}
  augHudEl.innerHTML=h;augHudEl.style.display=h?'block':'none';
}
var augStyle=document.createElement('style');
augStyle.textContent='#augModal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:70;padding:10px}'+
 '#augModal .augBox{width:100%;max-width:760px;text-align:center;color:#fff}#augModal h3{margin:0;font-size:26px;text-shadow:0 2px 8px #000}#augSub{color:#cfd8dc;font-size:13px;margin:4px 0 12px}'+
 '#augCards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.augCard{flex:1 1 200px;max-width:240px;min-height:190px;border:3px solid;border-radius:16px;padding:14px 12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,.5);transition:transform .12s;touch-action:manipulation}'+
 '.augCard:hover{transform:translateY(-4px) scale(1.03)}.augCard.t2{box-shadow:0 0 22px rgba(255,120,255,.8)}.augIc{font-size:44px;line-height:1}.augCard b{font-size:17px}.augCard small{font-size:13px;color:#eceff1;line-height:1.4}.augCard em{font-style:normal;font-size:12px;color:#ffd54a}'+
 '.augFoot{margin-top:12px;display:flex;gap:12px;justify-content:center;align-items:center}#augReroll{padding:8px 14px;border:0;border-radius:10px;background:#455a64;color:#fff;font-weight:700;cursor:pointer}#augReroll:disabled{opacity:.4;cursor:default}#augTimer{color:#ffd54a;font-weight:700}'+
 '#dgAug{margin-top:6px;font-size:18px;line-height:1.3;word-break:break-all}#dgAug span{margin-right:2px}#dgAug sub{font-size:10px;color:#ffd54a}#dgAug .t2{filter:drop-shadow(0 0 3px #ff80ff)}#dgAug .t1{filter:drop-shadow(0 0 2px #ffca28)}'+
 'body.touch .augCard{min-height:150px;flex-basis:150px;padding:10px 8px}body.touch .augIc{font-size:34px}';
document.head.appendChild(augStyle);

/* 방장: (x,z) 주변에 공격 판정 */
function dgHitAt(x,z,dmg,R,bm,ex,bx,who){
  R=R||9;bm=bm||1;var i,o;
  for(i=DG.mobs.length-1;i>=0;i--){o=DG.mobs[i];if(Math.hypot(o.g.position.x-x,o.g.position.z-z)<R+o.r){var d=dmg;if(ex&&(o.hp-d)/o.max<ex)d=Math.max(d,o.hp);hurtMob(o,d,x,z);}}
  var b=DG.boss;if(b&&Math.hypot(b.g.position.x-x,b.g.position.z-z)<R+b.r+3){var db=dmg*bm;if(bx&&(b.hp-db)/b.max<bx)db=Math.max(db,b.hp);hurtBoss(Math.round(db),who||NET.my);}
}
function dgAttack(){
  if(!DG.on||DG.over||DG.cd>0||P.stun>0)return;
  var wp=curWeapon();if(wp.k==='gun'){gunFire(wp);return;} /* 총: 자동 조준 */
  var S=DG.S;DG.cd=0.38*S.cd;var R=9*S.range,dmg=augDmg(true),i,o;
  if(DG.crit)floatText('치명타!',VW()/2,VH()*0.45,0,'hit');
  if(S.vamp){var hitN=augTargets(6,R+3).length;augHeal(S.vamp*hitN);}
  if(S.double)after(0.13,function(){augHit(P.x,P.z,dmg*0.7,R);});
  var m=gm(0xffffff,0.8),rg=mk(ringG,m,P.x,1.2,P.z),tm=0;
  addH({u:function(dt){tm+=dt;var k=tm/0.22,s=R*(0.4+k*0.7);rg.scale.set(s,1,s);m.opacity=0.8*(1-k);rg.position.set(P.x,1.2,P.z);return k>=1;},x:function(){scene.remove(rg);m.dispose();}});
  for(i=0;i<14*fxMul;i++){var a=Math.random()*6.283;emit(P.x+Math.cos(a)*R*0.8,rand(1,4),P.z+Math.sin(a)*R*0.8,Math.cos(a)*6,rand(0,3),Math.sin(a)*6,'#ffffff',0.3,0);}
  if(AC){noise(0.12,0.2,2500);tone(520,0.08,'triangle',0.1,-200);}
  if(hostSide()){dgHitAt(P.x,P.z,dmg,R,S.bossDmg,S.exec,S.bexec);return;}
  sendHost({t:'atk',x:r2(P.x),z:r2(P.z),d:dmg,r:R,bm:S.bossDmg,ex:S.exec,bx:S.bexec});
  for(i=0;i<DG.mobs.length;i++){o=DG.mobs[i];if(Math.hypot(o.g.position.x-P.x,o.g.position.z-P.z)<R+o.r){floatText(fmt(dmg),o.g.position.x,4,o.g.position.z,'hit');burst(o.g.position.x,2,o.g.position.z,'#ffffff',4,5);}}
  var b=DG.boss;if(b&&Math.hypot(b.g.position.x-P.x,b.g.position.z-P.z)<R+b.r+3){floatText(fmt(dmg),b.g.position.x,10,b.g.position.z,'hit');b.flash=0.1;}
}
function enemyNear(){
  var R=11,i;for(i=0;i<DG.mobs.length;i++)if(Math.hypot(DG.mobs[i].g.position.x-P.x,DG.mobs[i].g.position.z-P.z)<R)return true;
  var b=DG.boss;return !!(b&&Math.hypot(b.g.position.x-P.x,b.g.position.z-P.z)<R+7);
}
/* 투사체: 방장이 만들고 모두에게 알림 → 각자 움직이고, 내 캐릭터만 맞았는지 판정 */
function addDgProj(x,y,z,vx,vz,dmg,col,size,life,bd){
  var s=makeProj(size);s.material.color.set(col);s.position.set(x,y,z);scene.add(s);
  DG.pr.push({s:s,vx:vx,vz:vz,life:life,dmg:bd?Math.round((dgBaseHp()*0.12+8)*dgDiff().bossDmg):dmg});
}
function spawnDgProj(x,y,z,vx,vz,dmg,col,size,life,bd){
  addDgProj(x,y,z,vx,vz,dmg,col,size,life,bd);
  bcast({t:'pr',x:r2(x),y:y,z:r2(z),vx:r2(vx),vz:r2(vz),d:dmg,c:col,s:size,l:life,b:bd?1:0});
}
function updateMobsLogic(dt){
  var i,j,o,p,dx,dz,d,ang,pl=dgPlayers(),T;
  for(i=0;i<DG.mobs.length;i++){
    o=DG.mobs[i];p=o.g.position;T=nearestOf(pl,p.x,p.z);
    if(!T)continue;
    dx=T.x-p.x;dz=T.z-p.z;d=Math.hypot(dx,dz)||1;ang=Math.atan2(dx,dz);
    o.g.rotation.y=ang;
    var mv=o.sp;
    if(o.t==='imp'){
      if(d<10)mv=-o.sp;else if(d<16)mv=0;
      o.cd-=dt;
      if(o.cd<=0&&d<80&&!DG.wdone){
        o.cd=2.2;spawnDgProj(p.x,3,p.z,dx/d*20,dz/d*20,o.dmg,'#ff7043',2.2,5,0);
        if(AC&&DG.on)sfx.charge();
      }
    }
    var side=o.t==='bat'?Math.sin(o.ph*0.35)*0.9:0;
    p.x+=(dx/d*mv+(-dz/d)*side*o.sp*0.5)*dt;p.z+=(dz/d*mv+(dx/d)*side*o.sp*0.5)*dt;
    for(j=i+1;j<DG.mobs.length;j++){
      var q=DG.mobs[j].g.position,ex=p.x-q.x,ez=p.z-q.z,ed=Math.hypot(ex,ez);
      if(ed<2.6&&ed>0.01){p.x+=ex/ed*dt*4;p.z+=ez/ed*dt*4;q.x-=ex/ed*dt*4;q.z-=ez/ed*dt*4;}
    }
    p.x=clamp(p.x,DX-HALF+1,DX+HALF-1);p.z=clamp(p.z,DZ-HALF+1,DZ+HALF-1);
  }
}
/* 몹 애니메이션 (모두) */
function updateMobsVis(dt){
  for(var i=0;i<DG.mobs.length;i++){
    var o=DG.mobs[i],p=o.g.position;
    if(isClient()){
      var k=Math.min(1,dt*10),ox=p.x,oz=p.z;p.x+=(o.nx-p.x)*k;p.z+=(o.nz-p.z)*k;
      if(Math.abs(p.x-ox)+Math.abs(p.z-oz)>0.002)o.g.rotation.y=Math.atan2(p.x-ox,p.z-oz);
    }
    o.ph+=dt*(o.t==='bat'?14:o.t==='slime'?6:4);
    if(o.t==='slime'){var sq=Math.abs(Math.sin(o.ph));p.y=sq*1.4;o.body.scale.set(1+(1-sq)*0.15,0.85+sq*0.3,1+(1-sq)*0.15);}
    else if(o.t==='bat'){p.y=3.5+Math.sin(o.ph*0.5);var f=Math.sin(o.ph)*0.7;o.wl.rotation.z=f;o.wr.rotation.z=-f;}
    else if(o.t==='golem'){p.y=Math.abs(Math.sin(o.ph))*0.35;}
    updHpBar(o);
  }
}
/* 내 캐릭터 피격 판정 (모두) */
function dgLocalHits(dt){
  var i,o,p,dx,dz,d;
  for(i=DG.pr.length-1;i>=0;i--){
    var q2=DG.pr[i];q2.s.position.x+=q2.vx*dt;q2.s.position.z+=q2.vz*dt;q2.s.material.rotation+=dt*12;q2.life-=dt;
    if(DG.on&&Math.hypot(P.x-q2.s.position.x,P.z-q2.s.position.z)<1.8&&P.y<2.6){dgDamage(q2.dmg,q2.vx,q2.vz);q2.life=0;}
    if(q2.life<=0||Math.abs(q2.s.position.x-DX)>HALF+7||Math.abs(q2.s.position.z-DZ)>HALF+7){scene.remove(q2.s);q2.s.material.dispose();DG.pr.splice(i,1);}
  }
  if(!DG.on||DG.over)return;
  for(i=0;i<DG.mobs.length;i++){
    o=DG.mobs[i];p=o.g.position;dx=P.x-p.x;dz=P.z-p.z;d=Math.hypot(dx,dz)||1;
    if(d<o.r+1.5&&(o.fly||P.y<2.2))dgDamage(o.dmg,-dx,-dz);
  }
  var b=DG.boss;
  if(b){
    p=b.g.position;dx=P.x-p.x;dz=P.z-p.z;d=Math.hypot(dx,dz)||1;
    if(d<b.r+(b.dash>0?2.5:1.6)&&P.y<3)dgDamage((10+dgBaseHp()*(b.dash>0?0.2:0.1))*dgDiff().bossDmg,dx,dz);
  }
}
function fallDeath(){
  if(DG.over)return;
  if(DG.on&&DG.S.wings>DG.wingUsed){DG.wingUsed++;dgSafeSpawn();DG.inv=1.5;P.vy=0;toast('😇 천사 날개! 구멍에서 구조됐다 (이번 스테이지 남은 구조 '+(DG.S.wings-DG.wingUsed)+')','good');return;}
  if(DG.on&&DG.S.revive>DG.revUsed){DG.revUsed++;dgSafeSpawn();DG.hp=DG.max*0.5;DG.inv=2.5;P.vy=0;toast('🔥 불사조! 구멍에서 부활했다','good');return;}
  if(DG.on&&G.x.it.feather>0){G.x.it.feather--;dgSafeSpawn();DG.hp=DG.max*0.6;DG.inv=2.5;P.vy=0;toast('🪶 부활 깃털! 구멍에서 부활 (남은 깃털 '+G.x.it.feather+')','good');save();return;}
  DG.hp=0;DG.over=1;DG.fall=1;P.stun=5;P.vy=-6;P.kx=P.kz=0;
  shk=Math.max(shk,2);flashA=Math.max(flashA,0.6);
  toast('🕳️ 구멍에 떨어졌다! 즉사... 기지로 돌아갑니다','bad');
  if(AC&&!playFall()){sfx.hit();tone(380,1.2,'sine',0.25,-340);}
  after(1.7,function(){if(DG.on)exitDungeon(false);});
}
DG.zones=[];
function spawnZone(x,z,r,delay,k,sp){addZone(x,z,r,delay,k,sp);bcast({t:'zn',x:r2(x),z:r2(z),r:r,dl:delay,k:k,sp:sp});}
function addZone(x,z,r,delay,k,sp){
  var o={x:x,z:z,r:r,t:delay,k:k,sp:sp||0,age:0,hit:0};
  if(k==='c'){o.ring=mk(ringG,gm(0xff1744,0.85),x,0.12,z);o.ring.scale.set(r,1,r);o.disc=mk(discG,gm(0xff1744,0.18),x,0.1,z);o.disc.scale.set(0.01,1,0.01);}
  else{o.ring=mk(ringG,gm(0x40c4ff,0.9),x,0.4,z);o.ring.scale.set(0.5,1,0.5);}
  DG.zones.push(o);
}
function zoneDmg(k){return Math.round((dgBaseHp()*(k==='c'?0.16:0.2)+10)*dgDiff().bossDmg);}
function updateZones(dt){
  for(var i=DG.zones.length-1;i>=0;i--){
    var o=DG.zones[i],done=false;o.age+=dt;
    if(o.k==='c'){
      o.t-=dt;var f=1-Math.max(0,o.t)/Math.max(0.01,o.t+o.age);o.disc.scale.set(o.r*f,1,o.r*f);o.disc.material.opacity=0.15+0.3*f;
      if(o.t<=0){
        fxBoom(o.x,o.z,o.r,'#ff5722',0.55);
        if(DG.on&&!DG.over&&Math.hypot(P.x-o.x,P.z-o.z)<o.r&&P.y<1.6)dgDamage(zoneDmg('c'),P.x-o.x,P.z-o.z);
        done=true;
      }
    }else{
      var rr=o.age*o.sp;o.ring.scale.set(rr,1,rr);o.ring.material.opacity=0.9*(1-rr/o.r);
      var dd=Math.hypot(P.x-o.x,P.z-o.z);
      if(!o.hit&&DG.on&&!DG.over&&Math.abs(dd-rr)<1.7&&P.y<1.2){o.hit=1;dgDamage(zoneDmg('w'),P.x-o.x,P.z-o.z);}
      if(DG.on&&Math.random()<dt*30*fxMul){var a=Math.random()*6.283;emit(o.x+Math.cos(a)*rr,0.5,o.z+Math.sin(a)*rr,0,rand(2,5),0,'#80d8ff',0.5,4);}
      if(rr>=o.r)done=true;
    }
    if(done){scene.remove(o.ring);if(o.disc)scene.remove(o.disc);o.ring.material.dispose();if(o.disc)o.disc.material.dispose();DG.zones.splice(i,1);}
  }
}
function bossShot(a,sp,sz){
  var b=DG.boss,p=b.g.position;
  spawnDgProj(p.x+Math.sin(a)*3,4,p.z+Math.cos(a)*3,Math.sin(a)*sp,Math.cos(a)*sp,0,'#ff3d9a',sz||3,8,1);
}
var BOSS_NM={fan:'🔱 부채꼴 탄막! 점프하거나 사이로 피해!',ring:'🌀 전방위 탄막! 점프!',dash:'💨 돌진! 옆으로 피해!',sum:'👺 졸개 소환!',spiral:'🌪️ 나선 탄막! 계속 움직여!',rain:'☄️ 폭격! 붉은 원에서 벗어나!',shock:'🌊 지진파! 파도가 올 때 점프!',blink:'🌀 순간이동! 보스가 옆에 나타난다!'};
function pickAtk(){
  var b=DG.boss,rg=b.rage,t=b.bt||BOSS_TYPES[0],pool=t.pool.slice();
  if(rg>=1)pool=pool.concat(t.p2);
  if(rg>=2)pool=pool.concat(t.p3);
  return pool[Math.floor(Math.random()*pool.length)];
}
function bossAttack(type){
  var b=DG.boss,p=b.g.position,T=nearestOf(dgPlayers(),p.x,p.z)||{x:DX,z:DZ},dx=T.x-p.x,dz=T.z-p.z,d=Math.hypot(dx,dz)||1,a=Math.atan2(dx,dz),rg=b.rage,i,n;
  if(type==='fan'){n=5+rg*3;for(i=0;i<n;i++)bossShot(a+(i-(n-1)/2)*0.16,30+rg*4);}
  else if(type==='ring'){n=20+rg*10;var o=Math.random()*6.283;for(i=0;i<n;i++)bossShot(o+i*6.283/n,20+rg*3);}
  else if(type==='dash'){b.dash=0.75;b.dx=dx/d;b.dz=dz/d;}
  else if(type==='spiral'){ /* 나선: 1.6초 동안 돌아가며 발사 */
    var base=Math.random()*6.283,inst=DG.inst;
    for(i=0;i<20;i++)(function(k){after(k*0.08,function(){if(DG.inst!==inst||!DG.boss)return;bossShot(base+k*0.33,24+rg*3,2.6);bossShot(base+k*0.33+Math.PI,24+rg*3,2.6);if(rg>=2){bossShot(base+k*0.33+Math.PI/2,24,2.6);bossShot(base+k*0.33-Math.PI/2,24,2.6);}});})(i);
  }
  else if(type==='rain'){ /* 폭격: 플레이어 발밑과 주변에 붉은 원 → 1.1초 뒤 폭발 */
    dgPlayers().forEach(function(pl){
      spawnZone(pl.x,pl.z,5.5,1.1,'c',0);
      for(var q=0;q<2+rg;q++)spawnZone(pl.x+rand(-12,12),pl.z+rand(-12,12),5,1.1+q*0.15,'c',0);
    });
  }
  else if(type==='shock'){ /* 지진파: 보스에서 퍼지는 땅 파도 (점프로 피하기) */
    spawnZone(p.x,p.z,HALF*1.4,0,'w',26+rg*4);
    if(rg>=2)after(0.7,function(){if(DG.boss)spawnZone(DG.boss.g.position.x,DG.boss.g.position.z,HALF*1.4,0,'w',30);});
  }
  else if(type==='blink'){ /* 순간이동 → 바로 전방위 탄막 */
    fxBoom(p.x,p.z,8,b.bt.col,0.6);
    p.x=clamp(T.x+rand(-12,12),DX-HALF+5,DX+HALF-5);p.z=clamp(T.z+rand(-12,12),DZ-HALF+5,DZ+HALF-5);
    fxBoom(p.x,p.z,10,b.bt.col,0.7);
    after(0.45,function(){if(!DG.boss)return;var bp=DG.boss.g.position,nn=14+rg*6,oo=Math.random()*6.283;for(var k=0;k<nn;k++)bossShot(oo+k*6.283/nn,22);});
  }
  else if(type==='sum'){
    n=Math.min(2+rg*2,12-DG.mobs.length);
    for(i=0;i<n;i++){var aa=Math.random()*6.283;mkMob(Math.random()<0.5?'imp':'bat',p.x+Math.cos(aa)*8,p.z+Math.sin(aa)*8);}
  }
  fxBoom(p.x,p.z,10,'#ff3d9a',0.5);
  if(AC&&DG.on)sfx.shoot();
}
function updateBossLogic(dt){
  var b=DG.boss;if(!b)return;
  var p=b.g.position,T=nearestOf(dgPlayers(),p.x,p.z),rg=b.rage;
  if(b.dash>0){
    b.dash-=dt;p.x+=b.dx*58*dt;p.z+=b.dz*58*dt;
  }else if(b.wind>0){
    b.wind-=dt;if(b.wind<=0)bossAttack(b.wt);
  }else if(T){
    var dx=T.x-p.x,dz=T.z-p.z,d=Math.hypot(dx,dz)||1,sp=[7,10,13][rg]*b.bt.spd;if(d>9){p.x+=dx/d*sp*dt;p.z+=dz/d*sp*dt;}
    if(!DG.wdone){b.atkT-=dt;if(b.atkT<=0){b.wt=pickAtk();b.wind=b.wt==='dash'?0.7:0.55;b.atkT=[3.2,2.3,1.6][rg]*dgDiff().atk*b.bt.atk+b.wind;dgToast('⚠️ '+BOSS_NM[b.wt],'warn');}}
  }
  p.x=clamp(p.x,DX-HALF+5,DX+HALF-5);p.z=clamp(p.z,DZ-HALF+5,DZ+HALF-5);
  if(!DG.wdone){DG.ripT-=dt;if(DG.ripT<=0)ripPlan();}
}
function updateBossVis(dt){
  var b=DG.boss;if(!b)return;
  var p=b.g.position,rg=b.rage;
  if(isClient()){if(Math.hypot(b.nx-p.x,b.nz-p.z)>25){p.x=b.nx;p.z=b.nz;}var k=Math.min(1,dt*12);p.x+=(b.nx-p.x)*k;p.z+=(b.nz-p.z)*k;}
  bossPresent(b,dt);
  b.ph+=dt*2;b.mesh.position.y=1.2+Math.sin(b.ph)*0.8;
  b.g.rotation.y=Math.atan2(camera.position.x-p.x,camera.position.z-p.z);
  if(b.dash>0&&Math.random()<dt*60*fxMul)emit(p.x+rand(-3,3),rand(1,10),p.z+rand(-3,3),rand(-3,3),rand(0,4),rand(-3,3),'#ff3d9a',0.5,2);
  if(b.flash>0){b.flash-=dt;b.mat.color.setRGB(1,0.35,0.35);}
  else if(b.wind>0)b.mat.color.setRGB(1,1,0.3);
  else if(rg)b.mat.color.setRGB(1,rg>1?0.5:0.65,rg>1?0.5:0.65);
  else b.mat.color.setRGB(1,1,1);
  if(rg&&Math.random()<dt*20*fxMul)emit(p.x+rand(-3,3),rand(1,14),p.z+rand(-1,1),rand(-2,2),rand(2,6),rand(-2,2),'#ff3d00',0.7,-2);
}
function dgWorld(dt){
  if(!dgAnyInside()){dgWorldCheckEnd();return;}
  updateMobsLogic(dt);updateBossLogic(dt);
  while(DG.q.length&&DG.mobs.length<MOB_CAP)spawnMob(DG.q.shift()); /* 잡은 만큼 이어서 등장 */
  if(!DG.wdone&&!DG.boss&&DG.wave>0&&DG.mobs.length===0&&!DG.q.length&&!DG.next){
    DG.next=1;var inst=DG.inst;
    if(dgDiff().inf){
      var st=DG.wave;dgStageClear(st,false);
      if((st+1)%10===0){dgToast('👹 스테이지 '+(st+1)+' — 보스가 나타난다!','warn');after(1.8,function(){if(DG.inst===inst){DG.wave=st+1;spawnBoss();}});}
      else after(1.4,function(){if(DG.inst===inst)startWave(st+1);});
    }
    else if(DG.wave<3)after(1.4,function(){if(DG.inst===inst)startWave(DG.wave+1);});
    else{dgToast('✅ 잡몹 정리 완료! 보스가 나타난다...','good');after(1.8,function(){if(DG.inst===inst)spawnBoss();});}
  }
}
function updateDungeon(dt){
  if(DG.act){
    if(hostSide())dgWorld(dt);
    updateTiles(dt);updateMobsVis(dt);updateBossVis(dt);
  }
  if(DG.act||DG.on||DG.pr.length)dgLocalHits(dt);
  if(DG.zones.length)updateZones(dt);
  bossMusic(!!(DG.on&&DG.boss&&!DG.over));
  if(!(DG.on&&DG.boss))bossBarEl.style.display='none';
  if(!DG.on){
    swirl.rotation.z+=dt*1.5;pring.rotation.z-=dt*0.5;
    if(Math.random()<dt*14*fxMul)emit(PORTAL.x+rand(-3,3),rand(1,7),PORTAL.z+rand(-.5,.5),0,rand(1,3),0,'#b36bff',0.8,-1);
    DG.lblT+=dt;if(DG.lblT>1){DG.lblT=0;drawPortalLabel();}
    if(started&&P.carry<0&&P.stun<=0&&Math.hypot(P.x-PORTAL.x,P.z-PORTAL.z)<5){
      var pr=$('prompt');pr.style.display='block';pr.textContent=(isTouch?'[훔치기] 버튼':'[E] 키')+' — 🕳️ 던전 입장 (메달 '+medals()+'개)';
    }
    return;
  }
  DG.inv=Math.max(0,DG.inv-dt);DG.cd=Math.max(0,DG.cd-dt);
  augTick(dt);
  pChar.root.visible=!(DG.inv>0&&Math.floor(DG.inv*20)%2===0);
  $('shop').classList.add('hide');
  if(!DG.over&&(keys.KeyE||(isTouch&&enemyNear())))dgAttack();
  var tl=tileAt();
  DG.spawnT=Math.max(0,DG.spawnT-dt);
  if(DG.spawnT>0&&tl.st!==0&&!DG.over){dgSafeSpawn();tl=tileAt();} /* 막 들어왔는데 구멍/금 간 칸이면 옮겨줘요 */
  else if(!DG.over&&P.y<0.4&&onHoleAll()){
    fallDeath();
  }
  var others=0;for(var id in REM)if(REM[id].dg)others++;
  var left=DG.mobs.length+(hostSide()?DG.q.length:DG.qn);
  DG.goal=(DG.df===3?(DG.boss?'♾️ 스테이지 '+DG.wave+' · 👹 보스! 붉은 칸 = 곧 구멍':DG.wave>0?'♾️ 스테이지 <b>'+DG.wave+'</b> · 남은 몹 <b>'+left+'</b> · 다음 보스 '+(Math.ceil((DG.wave+0.5)/10)*10)+'스테이지':'♾️ 무한 모드')
    :(DG.boss?'👹 보스 격파! 붉은 칸 = 곧 구멍 · 빠지면 즉사!':DG.wave<=3&&DG.wave>0?'⚔️ 웨이브 '+DG.wave+'/3 · 남은 몹 <b>'+left+'</b>':'🕳️ 던전'))+(others?' · 👥 '+(others+1)+'명':'');
  DG.hudT+=dt;
  if(DG.hudT>0.08){
    DG.hudT=0;$('dgInfo').textContent='❤ '+Math.ceil(DG.hp)+' / '+DG.max+'  '+dgDiff().ico+' '+dgDiff().name+(DG.df===3?' '+DG.wave+'단계':'')+'  ⚔ '+fmt(Math.round(dgDmg()*DG.S.dmg))+(DG.shield>1?'  🛡'+fmt(DG.shield):'');
    $('dgHp').style.width=(DG.hp/DG.max*100)+'%';
    var br=$('dgBossRow');br.style.display=DG.boss?'block':'none';
    if(DG.boss)$('dgBHp').style.width=Math.max(0,DG.boss.hp/DG.boss.max*100)+'%';
  }
}

function updatePending(dt){
  for(var j=pendingShots.length-1;j>=0;j--){
    var q=pendingShots[j];q.t-=dt;
    if(q.t>0)continue;
    pendingShots.splice(j,1);
    var n=q.n;
    if((n.state==='chase'||n.state==='charge')&&npcCarry()===n.i&&!inSafe()){
      var rp=n.ch.root.position;spawnProj(rp,Math.atan2(P.x-rp.x,P.z-rp.z),n.move*1.5);
      var now=performance.now()/1000;if(AC&&now-lastShootSfx>0.15){lastShootSfx=now;sfx.shoot();}
    }
  }
}
/* 방장(또는 혼자)만 실행: NPC가 누구를 쫓을지, 언제 스킬을 쓸지 결정 */
function npcLogic(n,dt,t){
  var rp=n.ch.root.position,T;
  if(n.state==='chase'||n.state==='charge'){
    T=tgtObj(n.tg);
    if(!T||tgtCarry(n.tg)!==n.i||T.z<BASE_Z1){n.state='return';n.tg=null;hideAim(n);}
  }
  if(n.state==='chase'){
    T=tgtObj(n.tg);
    var dx=T.x-rp.x,dz=T.z-rp.z,dist=Math.hypot(dx,dz);
    rp.x+=dx/(dist||1)*n.move*dt;rp.z+=dz/(dist||1)*n.move*dt;
    n.nextCharge-=dt;
    if(n.nextCharge<=0){
      if(dist>7){n.state='charge';n.ct=CHARGE;}
      else n.nextCharge=0.3;
    }
  }
  if(n.state==='charge'){n.ct-=dt;if(n.ct<=0)shoot(n);}
  if(n.state==='return'){
    var hx=n.home.x-rp.x,hz=n.home.z-rp.z,hd=Math.hypot(hx,hz);
    if(hd<1.5){rp.x=n.home.x;rp.z=n.home.z;n.state='sleep';n.ball.visible=false;}
    else{rp.x+=hx/hd*n.move*dt;rp.z+=hz/hd*n.move*dt;}
  }
}
/* 모두 실행: 화면 표시 + 내 캐릭터가 부딪혔는지 판정 */
function updateNPC(n,dt,t){
  var rp=n.ch.root.position;
  if(isClient()&&n.nx!==undefined){
    var kk=Math.min(1,dt*10);rp.x+=(n.nx-rp.x)*kk;rp.z+=(n.nz-rp.z)*kk;
    if(Math.abs(n.nx-rp.x)+Math.abs(n.nz-rp.z)>40){rp.x=n.nx;rp.z=n.nz;}
  }
  if(n.state==='charge'&&n.pst!=='charge'){
    if(isClient())n.ct=CHARGE;
    if(n.tg===NET.my){if(t-toastWarnT>1.2){toast(skillWarn(n),'warn');toastWarnT=t;}sfx.charge();}
  }
  if(n.state!=='charge'&&n.pst==='charge')hideAim(n);
  n.pst=n.state;
  if(isClient()&&n.state==='charge')n.ct=Math.max(0,n.ct-dt);
  var dx=P.x-rp.x,dz=P.z-rp.z,dist=Math.hypot(dx,dz),safe=inSafe(),moving=(n.state==='chase'||n.state==='return');
  var cfg=n.cfg;
  if(n.state==='sleep'&&dist>260&&n.lie>0.95){
    if(!n.hid){n.hid=true;n.ch.root.visible=false;n.tag.sprite.visible=false;n.zz.sprite.visible=false;n.blob.visible=false;}
    return;
  }
  if(n.hid){n.hid=false;n.ch.root.visible=true;n.tag.sprite.visible=true;}
  var T=tgtObj(n.tg)||P,tx=T.x-rp.x,tz=T.z-rp.z,tdist=Math.hypot(tx,tz);
  if(n.state==='chase'&&n.tg===NET.my&&npcCarry()===n.i&&dist<4.2&&P.y<3.2&&P.stun<=0&&!safe)hitPlayer(n,pwr(n),dx/(dist||1),dz/(dist||1));
  if(n.state==='charge'){
    var aon=(Math.floor(n.ct*16)%2===0)&&!SK[n.i%SK.length].na,aang=Math.atan2(tx,tz),alen=Math.min(tdist+8,160);
    n.aim.visible=aon;n.aim.position.set(rp.x,0.14,rp.z);n.aim.rotation.y=aang;n.aim.scale.z=alen;
    for(var ak=0;ak<2;ak++){var ax=n.aimX[ak];ax.visible=aon&&!!SK[n.i%SK.length].fan;ax.position.set(rp.x,0.14,rp.z);ax.rotation.y=aang+(ak?0.2:-0.2);ax.scale.z=alen;}
  }
  if(n.state==='return'||n.state==='sleep')hideAim(n);
  if(n.state==='sleep')n.ball.visible=false;
  /* 눕기/일어나기 */
  n.lie+=clamp((n.state==='sleep'?1:0)-n.lie,-dt*3.2,dt*3.2);
  var lie=n.lie,awake=1-lie;
  var yaw=lie>0.95?0:Math.atan2(camera.position.x-rp.x,camera.position.z-rp.z);
  n.ch.root.rotation.y=yaw;
  n.mesh.rotation.x=-Math.PI/2*lie;
  if(n.state!=='sleep')n.phase+=dt*clamp(n.move*0.7,7,20);
  var bob=moving?Math.abs(Math.sin(n.phase))*0.9:0;
  n.mesh.position.y=0.12+bob*awake;
  n.mesh.rotation.z=(moving?Math.sin(n.phase)*0.14:0)*awake;
  var shake=0,sc=1;
  if(n.state==='charge'){shake=Math.sin(t*70)*0.18;sc=1+(1-n.ct/CHARGE)*0.18;}
  n.mesh.position.x=shake;n.mesh.scale.set(sc,sc,sc);
  var tone=0.72+0.28*awake;n.mat.color.setRGB(tone,tone,tone);
  n.blob.visible=lie<0.5;n.blob.position.set(rp.x,0.07,rp.z);
  /* 눈물 & 울음소리 */
  if(n.state!=='sleep'&&lie<0.5){
    n.tearT-=dt;
    if(n.tearT<=0){
      n.tearT=fxLevel?0.07:0.18;
      var rx=Math.cos(yaw),rz=-Math.sin(yaw),fx=Math.sin(yaw),fz=Math.cos(yaw),ey=cfg.h*0.64,ex=cfg.w*0.13;
      for(var s=-1;s<=1&&dist<110;s+=2){
        emit(rp.x+rx*s*ex+fx*0.3,ey,rp.z+rz*s*ex+fz*0.3, rx*s*rand(2,5)+fx*rand(0,2),rand(3,7),rz*s*rand(2,5)+fz*rand(0,2),'#7fd3ff',0.75,26);
      }
    }
    n.cryT-=dt;
    if(n.cryT<=0){var cr=0.92+((n.i*7)%9)*0.025;n.cryT=cryBuf?cryBuf.duration/cr+0.03:rand(1.3,2.0);cry(clamp(1-dist/90,0,1)*(cryBuf?0.9:0.3),cryBuf?cr:1+rand(-0.08,0.08));}
  }
  /* 드리블 공 */
  if(n.ballHide>0)n.ballHide-=dt;
  var showBall=(n.state==='chase'||n.state==='charge')&&n.ballHide<=0;
  n.ball.visible=showBall;
  if(showBall){
    var fdx=tx/(tdist||1),fdz=tz/(tdist||1);
    n.ball.position.set(rp.x+fdx*5.5,1.3+Math.abs(Math.sin(t*10+n.i))*0.6,rp.z+fdz*5.5);
    n.ball.material.rotation+=dt*10;
  }
  /* 이름표 / Zzz */
  n.tag.sprite.position.set(rp.x,(cfg.h+1.9)*awake+3.8*lie,rp.z-cfg.h*0.5*lie);
  n.zz.sprite.visible=(n.state==='sleep'&&lie>0.9);
  if(n.zz.sprite.visible){
    var ph=(t*0.7+n.i*0.37)%1;
    n.zz.sprite.position.set(rp.x+1.2+ph*0.8,2.6+ph*2.4,rp.z-cfg.h*0.85);
    n.zz.sprite.material.opacity=1-ph*0.8;
  }
}

function updatePedestal(n,dt){
  var p=n.ped;
  if(!p.has&&hostSide()){p.t-=dt;if(p.t<=0){p.has=true;p.pop=0;burst(p.x,3,p.z,ITEM_COLORS[n.i],10,5);}}
  p.item.visible=p.has;p.beam.visible=p.has;
  if(p.has){
    p.pop=Math.min(1,p.pop+dt*2.8);
    var s=1.2*(p.pop<1?p.pop*(2-p.pop):1);
    p.item.scale.set(s,s,s);
    p.item.rotation.y+=dt*1.5;
  }
}

var goalEl=null,goalLast='',tagT=0;
function computeGoal(onPad){
  if(DG&&DG.on)return DG.goal;
  if(P.stun>0)return '😵 정신 차리는 중...';
  if(P.raid)return '🦝 '+P.raidName+'의 큰 손을 들었다! 노란 <b>🏠 내 기지</b> 칸으로 가져가! · 주인에게 닿으면 뺏겨요';
  if(P.carry>=0)return '🏃 기지로 도망쳐! <b>'+Math.max(0,Math.round(P.z-BASE_Z1))+'m</b> 남음 · 조준선은 옆으로 피하거나 점프!';
  if(onPad>=0)return '✨ 패드 위에 서 있으면 1.5초마다 속도가 올라요';
  var any=G.qty.some(function(q){return q>0;});
  if(inSafe()&&!any&&G.money>=treadPrice(0))return isTouch?'🛒 <b>[상점]</b> 버튼에서 <b>러닝머신</b>을 사고, 패드 위에 올라가요':'🛒 오른쪽 상점에서 <b>러닝머신</b>을 사고, 기지의 패드 위에 올라가 보세요';
  var tgt=null;for(var i=0;i<N;i++){if(G.counts[i]===0){tgt=npcs[i];break;}}
  if(!tgt)return '🏆 전부 모았어요! 높은 등급을 반복해서 모으면 수입이 계속 늘어요';
  var d=Math.round(tgt.ped.z-P.z);
  var txt='🎯 다음 목표: <b>'+tgt.cfg.name+'</b> ['+gradeOf(tgt.i).name+'] ';
  txt+=d>8?'· 앞으로 <b>'+d+'m</b>':(d<-8?'· 뒤로 <b>'+(-d)+'m</b>':'· 바로 앞! 받침대에 다가가 훔치기');
  if(G.speed<tgt.cfg.speed*0.5)txt+=' <span style="color:#ff8a80">(⚠️ 아직 너무 빨라요 · 러닝머신으로 속도업!)</span>';
  return txt;
}
function update(dt,t){
  /* ----- 입력 → 이동 ----- */
  var ix=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0);
  var iy=((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0);
  ix+=joy.x;iy+=joy.y;
  var mag=Math.hypot(ix,iy);if(mag>1){ix/=mag;iy/=mag;mag=1;}
  var spd=realSpeed(G.speed)*(DG.on?DG.S.move:gearMul('move')),moving=false;
  P.stun=Math.max(0,P.stun-dt);
  if(P.stun<=0&&mag>0.05){
    var sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);
    var dx=-sy*iy+cy*ix,dz=-cy*iy-sy*ix;
    P.x+=dx*spd*dt;P.z+=dz*spd*dt;
    P.face=lerpAngle(P.face,Math.atan2(dx,dz),Math.min(1,dt*14));
    moving=true;var ph0=Math.floor(P.phase/Math.PI);P.phase+=dt*clamp(spd*0.9,8,26);
    if(Math.floor(P.phase/Math.PI)>ph0&&P.y-P.gy<0.05&&P.stun<=0){gainSpeed(STEP_SPEED);G.x.st.steps++;} /* 한 걸음 = 속도 +1 */
  }
  P.mv=moving;
  clampP();
  /* 점프 */
  P.gy=groundBelow(P.x,P.z,P.y);
  var jEdge=(keys.Space&&!P.spPrev)||wantJump,jv=22*(DG.on?Math.sqrt(DG.S.jump):1);P.spPrev=!!keys.Space;
  if(P.y-P.gy<=0.001){P.airJ=0;if(P.stun<=0&&(keys.Space||wantJump||jumpHeld)){P.vy=jv;P.y+=0.002;sfx.jump();}}
  else if(DG.on&&jEdge&&P.stun<=0&&(P.airJ||0)<DG.S.dj){P.airJ=(P.airJ||0)+1;P.vy=jv;sfx.jump();burst(P.x,P.y,P.z,'#b3e5fc',14,6);} /* 2단 점프 */
  wantJump=false;
  var py0=P.y;P.vy-=60*dt;P.y+=P.vy*dt;
  if(P.vy<=0){var land=floorLanding(P.x,P.z,py0,P.y);if(land!==null){P.y=land;P.vy=0;}}
  if(P.y<0&&!DG.fall){P.y=0;P.vy=0;}
  P.gy=groundBelow(P.x,P.z,P.y);
  /* 점프 패드: 밟으면 위층으로 슝! */
  jpadCd=Math.max(0,jpadCd-dt);
  if(!DG.on&&P.stun<=0&&jpadCd<=0&&P.y-P.gy<0.05&&P.z<BASE_Z1){
    for(var jp=0;jp<JPADS.length;jp++){var q=JPADS[jp];
      if(Math.abs(P.y-q.y)<0.3&&Math.hypot(P.x-q.x,P.z-q.z)<2.6){
        P.vy=JUMP_PAD_V;P.y+=0.01;jpadCd=0.6;sfx.jump();burst(q.x,q.y+1,q.z,'#7fd3ff',24,9);
        toast('⬆️ '+(q.to)+'층으로!','good');break;}
    }
  }
  P.lie+=((P.stun>0?1:0)-P.lie)*Math.min(1,dt*10);

  /* ----- 안전존 ----- */
  var safe=inSafe();
  if(P.carry>=0){
    if(P.raid){if(inMySlot())raidDeposit();else raidCatchCheck();}
    else if(safe)deposit();
  }
  if(safe!==wasSafe){wasSafe=safe;$('shop').classList.toggle('hide',!safe);if(safe){refreshShop();save();}}

  /* ----- 러닝머신 ----- */
  var onPad=-1;
  if(P.y<0.6&&P.stun<=0){
    for(var i=0;i<pads.length;i++){
      if(G.qty[i]>0&&Math.abs(P.x-pads[i].x)<3.7&&Math.abs(P.z-pads[i].z)<3.7){onPad=i;break;}
    }
  }
  if(onPad>=0){
    P.treadAcc+=dt;
    if(P.treadAcc>=1.5){
      P.treadAcc-=1.5;
      var gain=TREADS[onPad].gain*G.qty[onPad]*skinMult();
      gainSpeed(gain);sfx.tick();
      floatText('+'+fmt(gain)+' 속도',VW()/2+rand(-30,30),VH()*0.38,0,'spd');
      burst(P.x,1.5,P.z,'#7fffd4',12,5);
    }
  }else P.treadAcc=0;
  pads.forEach(function(p,i){if(G.qty[i]>0)p.tex.offset.y-=dt*0.8;});
  for(var bs=0;bs<SLOT_N;bs++){var bb=BASES[bs];if(bs!==mySlot&&bb.built&&bb.g.visible)bb.pads.forEach(function(p){if(p.q>0)p.tex.offset.y-=dt*0.8;});}
  basesT+=dt;if(basesT>0.5){basesT=0;refreshBases();}
  extrasTick(dt);
  for(var jq=0;jq<JPADS.length;jq++)JPADS[jq].tex.rotation.z+=dt*1.5;

  /* ----- NPC/발사체 ----- */
  for(var k=0;k<npcs.length;k++){if(hostSide())npcLogic(npcs[k],dt,t);updateNPC(npcs[k],dt,t);updatePedestal(npcs[k],dt);}
  for(var j=projectiles.length-1;j>=0;j--){
    var b=projectiles[j];
    b.mesh.position.x+=b.vx*dt;b.mesh.position.z+=b.vz*dt;b.mesh.material.rotation+=dt*14;b.life-=dt;
    var hx=P.x-b.mesh.position.x,hz=P.z-b.mesh.position.z;
    if(!safe&&P.stun<=0&&Math.hypot(hx,hz)<1.7&&P.y<2.0){hitPlayer(null);}
    if(b.life<=0||Math.abs(b.mesh.position.x)>45){scene.remove(b.mesh);projectiles.splice(j,1);}
  }

  /* ----- 돈 ----- */
  var inc=income();gainMoney(inc*dt);
  saveT+=dt;if(saveT>5){saveT=0;save();}

  /* ----- 플레이어 모델 ----- */
  pChar.root.position.set(P.x,P.y,P.z);pChar.root.rotation.y=P.face;
  pChar.body.rotation.x=-Math.PI/2*P.lie;pChar.body.position.y=0.75*P.lie;
  if(P.stun>0){swing(pChar,0,0);setFace(pChar,'sleep');}
  else{
    setFace(pChar,'happy');
    if(P.y-P.gy>0.05){pChar.legL.rotation.x=-0.5;pChar.legR.rotation.x=0.5;pChar.armL.rotation.x=pChar.armR.rotation.x=-2.4;}
    else swing(pChar,P.phase,moving?0.9:0);
    if(P.carry>=0){pChar.armL.rotation.x=pChar.armR.rotation.x=-Math.PI*0.93;}
  }
  if(P.carry>=0){
    var ht=holdTrophies[P.carry];ht.position.y=6.7+Math.sin(t*6)*0.12+(P.stun>0?-4:0);ht.rotation.y+=dt*2;
    if(P.carry>=8&&P.stun<=0&&Math.random()<dt*14*fxMul)emit(P.x+rand(-1.2,1.2),P.y+rand(7.4,10),P.z+rand(-1.2,1.2),rand(-1,1),rand(1,3),rand(-1,1),gradeOf(P.carry).m,0.7,-1);
  }

  /* ----- 프롬프트 ----- */
  var near=null,nd=6;
  if(P.carry<0&&P.stun<=0){
    for(var q=0;q<npcs.length;q++){
      var np=npcs[q],d=Math.hypot(P.x-np.ped.x,P.z-np.ped.z);
      if(d<nd&&np.ped.has&&np.state==='sleep'){nd=d;near=np;}
    }
  }
  var nearS=(P.carry<0&&P.stun<=0)?findSnatch():null;
  var pr=$('prompt'),nearR=(!near&&!nearS&&P.carry<0&&P.stun<=0)?findRaid():null;
  if(nearS){near=null;pr.style.display='block';pr.textContent=(isTouch?'[훔치기] 버튼':'[E] 키')+' — 🫳 '+(nearS.name||'친구')+' 님이 들고 가는 ['+gradeOf(nearS.vc).name+' 등급] 큰 손 뺏기';}
  else if(near){pr.style.display='block';pr.textContent=(isTouch?'[훔치기] 버튼':'[E] 키')+' — '+near.cfg.name+'의 ['+gradeOf(near.i).name+' 등급] 큰 손 훔치기';}
  else if(nearR){pr.style.display='block';pr.textContent=(isTouch?'[훔치기] 버튼':'[E] 키')+' — 🦝 '+(nearR.o.name||'친구')+'의 ['+gradeOf(nearR.i).name+' 등급] 큰 손 훔치기';}
  else pr.style.display='none';
  $('btnSteal').classList.toggle('ready',!!(near||nearR||nearS));

  /* ----- HUD ----- */
  hudT+=dt;
  if(hudT>0.12){
    hudT=0;
    $('hMoney').textContent=fmt(G.money);$('hInc').textContent=fmt(inc);
    $('hItems').textContent=G.counts.reduce(function(a,b){return a+b;},0);
    $('hCarry').textContent=P.carry>=0?' (+1 운반중!)':'';
    $('hSpeed').textContent=fmt(G.speed);
    if(safe){for(var s=0;s<TREADS.length;s++)shopBtns[s].disabled=G.money<treadPrice(s);refreshSkins();}
    $('hComboRow').style.display=G.streak>0?'block':'none';
    if(isTouch)syncShopBtn();
    $('hCombo').textContent=G.streak;$('hMult').textContent='(훔치기 보너스 ×'+comboMult().toFixed(1)+')';
    if(!goalEl)goalEl=$('goal');
    var gt=computeGoal(onPad);
    if(gt!==goalLast){goalLast=gt;goalEl.innerHTML=gt;}
    goalEl.classList.toggle('run',P.carry>=0&&P.stun<=0);
  }
  tagT+=dt;
  if(tagT>0.5){tagT=0;for(var tn=0;tn<npcs.length;tn++){var st=tagState(npcs[tn]);if(npcs[tn].tagSt!==st)drawTag(npcs[tn],st);}}
  updateSkills(dt);updateSkin(dt,moving);devTick();updateDungeon(dt);updatePending(dt);updateRemotes(dt,t);
  updateTrophyFx(t);
}

var camGy=0;
function updateCamera(dt){
  camGy+=(P.gy-camGy)*Math.min(1,dt*6);
  var tx=P.x,ty=camGy+(P.y-P.gy)*0.5+4.5,tz=P.z,cp=cam.pitch;
  var dp=new THREE.Vector3(
    tx+Math.sin(cam.yaw)*Math.cos(cp)*cam.dist,
    Math.max(1.5,ty+Math.sin(cp)*cam.dist),
    tz+Math.cos(cam.yaw)*Math.cos(cp)*cam.dist);
  camPos.lerp(dp,1-Math.exp(-12*dt));
  camera.position.copy(camPos);if(shk>0.02){camera.position.x+=(Math.random()-.5)*shk;camera.position.y+=(Math.random()-.5)*shk;}camera.lookAt(tx,ty,tz);
  sun.position.set(P.x+40,90,P.z+30);sun.target.position.set(P.x,0,P.z);sun.target.updateMatrixWorld();
  stars.position.copy(camera.position);
}

/* =========================================================
   입력
   ========================================================= */
addEventListener('keydown',function(e){
  if(!started||modalOpen)return;
  if((e.code==='Enter'||e.code==='NumpadEnter')&&!e.repeat&&NET.mode!=='solo'){e.preventDefault();chatOpen();return;}
  if(e.code==='Space'||e.code.indexOf('Arrow')===0)e.preventDefault();
  if(e.code==='KeyE'&&!e.repeat)trySteal();
  if(e.code==='KeyM'&&!e.repeat)setBgmMuted(!bgmMuted);
  keys[e.code]=true;
});
addEventListener('keyup',function(e){keys[e.code]=false;});
(function(){
  var inp=document.getElementById('chatIn');
  inp.addEventListener('keydown',function(e){
    e.stopPropagation();
    if(e.isComposing||e.keyCode===229)return; /* 한글 조합 중에는 Enter 무시 */
    if(e.key==='Enter'){sendChat(inp.value);inp.value='';chatClose();e.preventDefault();}
    else if(e.key==='Escape'){chatClose();}
  });
  inp.addEventListener('keyup',function(e){e.stopPropagation();});
  document.getElementById('chatBtn').addEventListener('click',function(){
    var box=document.getElementById('chatBox');if(box.classList.contains('open'))chatClose();else chatOpen();
  });
})();
addEventListener('blur',function(){keys={};});

var dragId=null,lx=0,ly=0,cv=renderer.domElement;
cv.addEventListener('pointerdown',function(e){
  if(dragId!==null)return;
  dragId=e.pointerId;lx=ptX(e);ly=ptY(e);
  try{cv.setPointerCapture(dragId);}catch(_){}
});
cv.addEventListener('pointermove',function(e){
  if(e.pointerId!==dragId)return;
  cam.yaw-=(ptX(e)-lx)*0.006;
  cam.pitch=clamp(cam.pitch+(ptY(e)-ly)*0.005,0.08,1.3);
  lx=ptX(e);ly=ptY(e);
});
function endDrag(e){if(e.pointerId===dragId)dragId=null;}
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('wheel',function(e){cam.dist=clamp(cam.dist+e.deltaY*0.01,8,32);e.preventDefault();},{passive:false});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});

var jz=$('joyZone'),jb=$('joyBase'),jk=$('joyKnob'),jid=null,jcx=0,jcy=0,JR=55;
jz.addEventListener('pointerdown',function(e){
  if(jid!==null)return;
  jid=e.pointerId;try{jz.setPointerCapture(jid);}catch(_){}
  jcx=ptX(e);jcy=ptY(e);
  jb.style.left=(jcx-65)+'px';jb.style.top=(jcy-65)+'px';jb.style.bottom='auto';
  jk.style.transform='translate(0,0)';e.preventDefault();
});
jz.addEventListener('pointermove',function(e){
  if(e.pointerId!==jid)return;
  var dx=ptX(e)-jcx,dy=ptY(e)-jcy,d=Math.hypot(dx,dy);
  if(d>JR){dx*=JR/d;dy*=JR/d;}
  jk.style.transform='translate('+dx+'px,'+dy+'px)';
  joy.x=dx/JR;joy.y=-dy/JR;
});
function joyEnd(e){
  if(e.pointerId!==jid)return;
  jid=null;joy.x=0;joy.y=0;jk.style.transform='translate(0,0)';
  jb.style.left='';jb.style.top='';jb.style.bottom='';
}
jz.addEventListener('pointerup',joyEnd);jz.addEventListener('pointercancel',joyEnd);

$('btnSteal').addEventListener('pointerdown',function(e){e.preventDefault();trySteal();});
$('btnJump').addEventListener('pointerdown',function(e){e.preventDefault();jumpHeld=true;wantJump=true;});
['pointerup','pointercancel','pointerleave'].forEach(function(ev){$('btnJump').addEventListener(ev,function(){jumpHeld=false;});});

addEventListener('resize',function(){
  applyOrient();
});
addEventListener('pagehide',save);
document.addEventListener('visibilitychange',function(){
  if(document.hidden){save();keys={};joy.x=joy.y=0;if(AC&&AC.suspend&&NET.mode!=='host')AC.suspend();}
  else if(AC&&AC.resume)AC.resume();
});

/* =========================================================
   시작 & 루프
   ========================================================= */
redrawMyBase();refreshBases(true);
refreshShop();

$('muteBtn').addEventListener('click',function(){setBgmMuted(!bgmMuted);});
setBgmMuted(bgmMuted);
$('startBtn').addEventListener('click',function(){
  initAudio();started=true;$('start').style.display='none';
  if(xmasOn)xmasMusic(true);
  $('shop').classList.toggle('hide',!inSafe());
  toast('🏆 가장 가까운 받침대부터 훔쳐보자! (길 따라 앞으로)','good');
});

/* =========================================================
   📱 모바일 화면 정리: 메뉴(☰)로 버튼 모으기 · 상점은 버튼으로 열기 · 세로 화면 시야 넓히기
   ========================================================= */
function syncShopBtn(){
  var av=!$('shop').classList.contains('hide');
  $('shopBtn').style.display=av&&!document.body.classList.contains('shopOpen')?'block':'none';
  if(!av)document.body.classList.remove('shopOpen');
}
$('shopBtn').addEventListener('click',function(){this.blur();document.body.classList.add('shopOpen');document.body.classList.remove('menu');syncShopBtn();});
$('shopClose').addEventListener('click',function(){this.blur();document.body.classList.remove('shopOpen');syncShopBtn();});
$('menuBtn').addEventListener('click',function(){this.blur();document.body.classList.toggle('menu');});
['muteBtn','fxBtn','bkBtn','mpBtn','xmasBtn','storeBtn'].forEach(function(id){$(id).addEventListener('click',function(){if(isTouch)document.body.classList.remove('menu');});});
renderer.domElement.addEventListener('pointerdown',function(){document.body.classList.remove('menu');});
function applyOrient(){
  ROT=isPhone&&innerHeight>innerWidth;
  var bd=document.body,st=bd.style,w,h;
  bd.classList.toggle('rot',ROT);
  if(ROT){st.width=innerHeight+'px';st.height=innerWidth+'px';}else{st.width='';st.height='';}
  w=VW();h=VH();
  var rs=document.documentElement.style;rs.setProperty('--vw',(w/100)+'px');rs.setProperty('--vh',(h/100)+'px');
  var portrait=h>w*1.1;
  bd.classList.toggle('pt',portrait);bd.classList.toggle('ls',!portrait);bd.classList.toggle('short',h<=500);
  renderer.setSize(w,h);
  camera.fov=portrait?78:65;camera.aspect=w/h;camera.updateProjectionMatrix();
  if(isTouch&&portrait&&cam.dist<20)cam.dist=20;
}
var orientT=0;
function queueOrient(){clearTimeout(orientT);orientT=setTimeout(applyOrient,120);}
addEventListener('orientationchange',queueOrient);
if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',queueOrient);
applyOrient();
/* 안드로이드: 버튼을 누르면 전체 화면 + 가로 고정 (아이폰은 지원 안 해서 위의 '화면 돌리기'로 대신해요) */
function tryLandscape(){
  if(!isPhone)return;
  var el=document.documentElement,rf=el.requestFullscreen||el.webkitRequestFullscreen,p=null;
  function lock(){try{var o=screen.orientation;if(o&&o.lock){var q=o.lock('landscape');if(q&&q.catch)q.catch(function(){});}}catch(e){}}
  if(rf&&!(document.fullscreenElement||document.webkitFullscreenElement)){try{p=rf.call(el,{navigationUI:'hide'});}catch(e){p=null;}}
  if(p&&p.then)p.then(function(){lock();queueOrient();},function(){});else lock();
}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('button'))tryLandscape();},true);
var rotHint=false;
$('startBtn').addEventListener('click',function(){
  if(isTouch&&!isPhone&&!rotHint&&innerHeight>innerWidth*1.1){rotHint=true;setTimeout(function(){toast('📱 가로로 돌리면 더 넓게 보여요!','warn');},1200);}
});

function setFx(l,auto){
  fxLevel=l;fxMul=l?1:0.3;
  renderer.setPixelRatio(l?Math.min(window.devicePixelRatio||1,isTouch?1.5:2):1);renderer.setSize(VW(),VH());
  sun.castShadow=!!l;
  fxList.forEach(function(f){if(f.ring)f.ring.visible=!!l;f.stars.forEach(function(x){x.visible=!!l;});if(f.halo)f.halo.visible=!!l;});
  $('fxBtn').textContent=l?'✨ 이펙트: 보통':'✨ 이펙트: 최소';
  if(auto)toast('📉 화면이 버벅여서 이펙트를 줄였어요 (왼쪽 ✨ 버튼으로 되돌릴 수 있어요)','warn');
  else{try{localStorage.setItem('steal-a-roh-fx',l?'1':'0');}catch(e){}}
}
$('fxBtn').addEventListener('click',function(){setFx(fxLevel?0:1,false);});
try{if(localStorage.getItem('steal-a-roh-fx')==='0')setFx(0,false);}catch(e){}
var lowT=0,emaDt=1/60;
var last=performance.now(),clock=0;
/* =========================================================
   🛍️ 상점 · 가방 · 퀘스트 · 이벤트
   - 무기(근접/총) · 아이템(물약) · 장신구(3칸) · 아우라(1개) · 칭호(1개) · 이벤트 코인
   - 저장: G.x (save()에 같이 저장돼요)
   ========================================================= */
var GRADE_C=['#b0bec5','#42a5f5','#ab47bc','#ffa726','#ff1744','#ffd54a'],GRADE_N=['일반','희귀','영웅','전설','신화','한정'];
/* 무기: k=melee(주변 원형 공격) / gun(가까운 적 자동 조준) · dmg=공격력 배율 · cd=쿨타임 배율(낮을수록 빠름) · rng=사거리 */
var WEAPONS=[
  {id:'fist',nm:'맨주먹',ic:'✊',g:0,k:'melee',dmg:1,cd:1,rng:1,price:0,ds:'기본 주먹'},
  {id:'bat',nm:'야구 방망이',ic:'🏏',g:0,k:'melee',dmg:1.5,cd:1.05,rng:1.1,price:1e4,ds:'묵직한 한 방'},
  {id:'pistol',nm:'권총',ic:'🔫',g:0,k:'gun',dmg:1.3,cd:0.8,rng:35,price:1e5,shot:'single',ds:'가까운 적 1명 자동 조준'},
  {id:'sword',nm:'강철 검',ic:'🗡️',g:1,k:'melee',dmg:2.4,cd:0.9,rng:1.25,price:1e6,ds:'빠르고 넓은 베기'},
  {id:'smg',nm:'기관단총',ic:'💨',g:1,k:'gun',dmg:0.9,cd:0.32,rng:30,price:1e7,shot:'single',ds:'엄청 빠른 연사'},
  {id:'shotgun',nm:'샷건',ic:'💥',g:2,k:'gun',dmg:2,cd:1.3,rng:22,price:1e8,shot:'spread',n:6,ds:'가까운 적 6명에게 동시에'},
  {id:'hammer',nm:'거대 망치',ic:'🔨',g:2,k:'melee',dmg:6,cd:1.7,rng:1.6,price:1e9,ds:'느리지만 엄청 아프고 넓음'},
  {id:'sniper',nm:'저격총',ic:'🎯',g:3,k:'gun',dmg:18,cd:2.2,rng:75,price:1e10,shot:'single',ds:'멀리 있는 적 1명에게 초강력 한 발'},
  {id:'rocket',nm:'로켓 런처',ic:'🚀',g:3,k:'gun',dmg:8,cd:1.8,rng:50,price:5e10,shot:'aoe',aoe:9,ds:'맞은 곳 주변 폭발'},
  {id:'katana',nm:'번개 카타나',ic:'⚡',g:3,k:'melee',dmg:7,cd:0.65,rng:1.35,price:1e11,ds:'빠르고 강한 번개 베기'},
  {id:'laser',nm:'레이저 캐논',ic:'🔆',g:4,k:'gun',dmg:6,cd:0.6,rng:65,price:1e12,shot:'line',ds:'일직선 위의 적 전부 관통'},
  {id:'scythe',nm:'사신의 낫',ic:'☠️',g:4,k:'melee',dmg:16,cd:0.85,rng:1.9,price:5e12,ds:'아주 넓은 죽음의 베기'},
  {id:'minigun',nm:'미니건',ic:'🌪️',g:4,k:'gun',dmg:2.2,cd:0.12,rng:40,price:2e13,shot:'single',ds:'초당 20발 이상 쏟아붓기'}
];
/* 아이템: 사면 가방에 쌓이고 '사용'으로 써요 */
var ITEMS=[
  {id:'hp',nm:'체력 포션',ic:'🧪',g:0,price:1e6,ds:'던전에서 체력 50% 회복 (던전에서 Q키)'},
  {id:'rage',nm:'분노 물약',ic:'💪',g:1,price:5e7,ds:'5분 동안 던전 공격력 ×2',buff:'dmg',min:5},
  {id:'goldp',nm:'황금 물약',ic:'💸',g:2,price:1e8,ds:'10분 동안 돈 획득 ×2',buff:'money',min:10},
  {id:'boltp',nm:'번개 물약',ic:'⚡',g:2,price:1e8,ds:'10분 동안 속도 획득 ×2',buff:'speed',min:10},
  {id:'feather',nm:'부활 깃털',ic:'🪶',g:3,price:1e9,ds:'던전에서 쓰러지면 자동으로 1번 부활 (가지고만 있으면 돼요)'},
  {id:'mbox',nm:'수수께끼 상자',ic:'🎁',g:3,price:5e8,ds:'돈·속도·트로피·장신구 중 하나!'}
];
/* 장신구: 최대 3개 장착 */
var ACCS=[
  {id:'clover',nm:'행운 부적',ic:'🍀',g:0,price:1e6,ds:'돈 획득 +10%',money:1.1},
  {id:'windshoe',nm:'바람 신발',ic:'👟',g:0,price:5e6,ds:'이동 속도 +10%',move:1.1},
  {id:'ring',nm:'힘의 반지',ic:'💍',g:1,price:2e7,ds:'던전 공격력 +25%',dmg:1.25},
  {id:'neck',nm:'생명 목걸이',ic:'📿',g:1,price:2e7,ds:'던전 체력 +30%',hp:1.3},
  {id:'bracelet',nm:'시간의 팔찌',ic:'⌚',g:2,price:2e8,ds:'공격 쿨타임 -15%',cd:0.85},
  {id:'earring',nm:'치명 귀걸이',ic:'💎',g:2,price:5e8,ds:'치명타 확률 +15%',crit:0.15},
  {id:'magnet',nm:'자석 벨트',ic:'🧲',g:3,price:2e9,ds:'속도 획득 +20%',speed:1.2},
  {id:'crown',nm:'황금 왕관',ic:'👑',g:3,price:2e10,ds:'돈 획득 +35%',money:1.35},
  {id:'cape',nm:'수호 망토',ic:'🦸',g:3,price:5e10,ds:'던전 받는 피해 -20%',dr:0.2},
  {id:'cosmos',nm:'우주 펜던트',ic:'🌌',g:4,price:1e12,ds:'돈·속도 획득 +50% · 공격력 +30%',money:1.5,speed:1.5,dmg:1.3},
  /* 이벤트 한정 */
  {id:'evclover',nm:'축제 클로버',ic:'☘️',g:5,coin:15,ds:'[한정] 돈·속도 획득 +25%',money:1.25,speed:1.25},
  {id:'starwing',nm:'별빛 날개',ic:'🌟',g:5,coin:25,ds:'[한정] 이동 +20% · 던전 체력 +20%',move:1.2,hp:1.2}
];
/* 아우라: 1개 장착 · 돈/속도 획득 곱절 */
var AURAS=[
  {id:'fire',nm:'불꽃 아우라',ic:'🔥',g:0,price:5e6,col:'#ff7043',speed:1.5,ds:'속도 획득 ×1.5'},
  {id:'gold',nm:'황금 아우라',ic:'💰',g:1,price:3e7,col:'#ffd54a',money:1.5,ds:'돈 획득 ×1.5'},
  {id:'frost',nm:'서리 아우라',ic:'❄️',g:2,price:1e9,col:'#80d8ff',speed:2,ds:'속도 획득 ×2'},
  {id:'dia',nm:'다이아 아우라',ic:'💎',g:2,price:5e9,col:'#b388ff',money:2,ds:'돈 획득 ×2'},
  {id:'rainbow',nm:'무지개 아우라',ic:'🌈',g:3,price:1e11,col:'rainbow',money:2,speed:2,ds:'돈·속도 획득 ×2'},
  {id:'galaxy',nm:'은하 아우라',ic:'🌌',g:4,price:5e12,col:'#7c4dff',money:3,speed:3,ds:'돈·속도 획득 ×3'},
  {id:'god',nm:'신의 아우라',ic:'⚜️',g:4,price:1e14,col:'#ffffff',money:5,speed:5,ds:'돈·속도 획득 ×5'},
  /* 이벤트 한정 */
  {id:'fest',nm:'축제 아우라',ic:'🎉',g:5,coin:20,col:'#ff4081',money:2,speed:2,ds:'[한정] 돈·속도 획득 ×2'},
  {id:'santa',nm:'산타 아우라',ic:'🎅',g:5,coin:30,xmas:1,col:'#ff1744',money:2.5,speed:2.5,ds:'[크리스마스 한정] 돈·속도 획득 ×2.5'}
];
/* 퀘스트 → 칭호 (칭호는 1개 장착, 버프) */
var QUESTS=[
  {id:'thief1',q:'NPC 큰 손 1개 훔쳐서 기지에 넣기',st:'steal',n:1,ti:'🦝 초보 도둑',b:{money:1.05},bd:'돈 +5%'},
  {id:'thief2',q:'NPC 큰 손 50개 훔치기',st:'steal',n:50,ti:'🕵️ 베테랑 도둑',b:{money:1.15},bd:'돈 +15%'},
  {id:'thief3',q:'NPC 큰 손 500개 훔치기',st:'steal',n:500,ti:'👑 도둑왕',b:{money:1.4},bd:'돈 +40%'},
  {id:'walk1',q:'1만 걸음 걷기',st:'steps',n:1e4,ti:'🏃 마라토너',b:{speed:1.2},bd:'속도 획득 +20%'},
  {id:'walk2',q:'10만 걸음 걷기',st:'steps',n:1e5,ti:'⚡ 번개다리',b:{speed:1.5,move:1.1},bd:'속도 획득 +50% · 이동 +10%'},
  {id:'col1',q:'큰 손 18종 모으기',st:'kinds',n:18,ti:'📚 수집가',b:{money:1.2},bd:'돈 +20%'},
  {id:'col2',q:'큰 손 42종 전부 모으기',st:'kinds',n:42,ti:'🏆 완벽주의자',b:{money:1.5,speed:1.25},bd:'돈 +50% · 속도 획득 +25%'},
  {id:'boss1',q:'보스 1마리 잡기',st:'boss',n:1,ti:'⚔️ 보스 사냥꾼',b:{dmg:1.15},bd:'던전 공격력 +15%'},
  {id:'boss2',q:'보스 20마리 잡기',st:'boss',n:20,ti:'💀 보스 학살자',b:{dmg:1.4},bd:'던전 공격력 +40%'},
  {id:'hard1',q:'어려움 던전 클리어',st:'hard',n:1,ti:'🔴 지옥 정복자',b:{dmg:1.25,hp:1.25},bd:'공격력·체력 +25%'},
  {id:'inf1',q:'무한 모드 30스테이지 돌파',st:'inf',n:30,ti:'♾️ 끝없는 자',b:{dmg:1.3,hp:1.3},bd:'공격력·체력 +30%'},
  {id:'raid1',q:'친구 기지에서 트로피 10번 털기',st:'raid',n:10,ti:'🦹 기지 털이범',b:{money:1.25},bd:'돈 +25%'},
  {id:'snatch1',q:'들고 가는 큰 손 10번 뺏기',st:'snatch',n:10,ti:'🫳 날강도',b:{move:1.15},bd:'이동 +15%'},
  {id:'rich1',q:'돈 총 1조 벌기',st:'earned',n:1e12,ti:'💰 억만장자',b:{money:1.3},bd:'돈 +30%'},
  {id:'play1',q:'게임 60분 하기',st:'play',n:3600,ti:'⏰ 개근상',b:{money:1.1,speed:1.1,dmg:1.1},bd:'돈·속도·공격 +10%'},
  {id:'buy1',q:'상점에서 아무거나 10번 사기',st:'buys',n:10,ti:'🛒 쇼핑왕',b:{money:1.1},bd:'돈 +10%'}
];
/* 이벤트 한정 칭호 (코인으로 구매) */
var EV_TITLES=[
  {id:'evmaster',ti:'🎉 이벤트 마스터',coin:40,b:{money:1.15,speed:1.15,dmg:1.15},bd:'[한정] 돈·속도·공격 +15%'},
  {id:'xmastitle',ti:'🎄 크리스마스의 기적',coin:25,xmas:1,b:{money:1.3,speed:1.3},bd:'[크리스마스 한정] 돈·속도 +30%'}
];
function findBy(list,id){for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];return null;}
/* ---------- 저장 데이터 ---------- */
function xDefault(){return {wpn:['fist'],wq:'fist',acc:[],acq:[],aur:[],au:'',it:{},ti:[],tq:'',bf:{},coin:0,st:{steal:0,steps:0,boss:0,hard:0,inf:0,raid:0,snatch:0,earned:0,play:0,buys:0},ev:{day:'',gt:-1}};}
G.x=xDefault();
(function(){try{var d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');if(d.x&&typeof d.x==='object'){var X=xDefault(),v=d.x;
  ['wpn','acc','acq','aur','ti'].forEach(function(k){if(Array.isArray(v[k]))X[k]=v[k].filter(function(a){return typeof a==='string';}).slice(0,200);});
  if(X.wpn.indexOf('fist')<0)X.wpn.unshift('fist');
  ['wq','au','tq'].forEach(function(k){if(typeof v[k]==='string')X[k]=v[k];});
  if(X.wpn.indexOf(X.wq)<0)X.wq='fist';if(X.aur.indexOf(X.au)<0)X.au='';if(X.ti.indexOf(X.tq)<0)X.tq='';
  X.acq=X.acq.filter(function(a){return X.acc.indexOf(a)>=0;}).slice(0,3);
  if(v.it&&typeof v.it==='object')for(var k in v.it)X.it[k]=Math.max(0,v.it[k]|0);
  if(v.bf&&typeof v.bf==='object')for(var k2 in v.bf)if(+v.bf[k2]>Date.now())X.bf[k2]=+v.bf[k2];
  X.coin=Math.max(0,+v.coin||0);
  if(v.st&&typeof v.st==='object')for(var k3 in X.st)X.st[k3]=Math.max(0,+v.st[k3]||0);
  if(v.ev&&typeof v.ev==='object'){X.ev.day=String(v.ev.day||'');X.ev.gt=+v.ev.gt||-1;}
  G.x=X;}}catch(e){}})();
/* ---------- 버프 계산 ---------- */
function curTitle(){var t=G.x.tq;if(!t)return null;return findBy(QUESTS.map(function(q){return {id:q.id,ti:q.ti,b:q.b};}),t)||findBy(EV_TITLES,t);}
function gearMul(key){ /* key: money, speed, dmg, hp, move, cd(곱), crit/dr(합) */
  var add=key==='crit'||key==='dr',v=add?0:1;
  function ap(o){if(o&&o[key]!==undefined){if(add)v+=o[key];else v*=o[key];}}
  G.x.acq.forEach(function(id){ap(findBy(ACCS,id));});
  var t=curTitle();if(t)ap(t.b);
  if(key==='money'||key==='speed'){ap(findBy(AURAS,G.x.au));}
  return v;
}
function goldenTime(){return (new Date().getMinutes()%20)<2;} /* 매 시 0·20·40분부터 2분간 */
function isWeekend(){var d=new Date().getDay();return d===0||d===6;}
function isXmas(){var d=new Date(),m=d.getMonth(),dd=d.getDate();return m===11&&dd>=18;} /* 12/18~12/31 */
function buffOn(k){return (G.x.bf[k]||0)>Date.now();}
function moneyMul(){return gearMul('money')*(goldenTime()?2:1)*(isWeekend()?1.5:1)*(buffOn('money')?2:1);}
function speedMul(){return gearMul('speed')*(goldenTime()?2:1)*(buffOn('speed')?2:1);}
/* 모든 돈·속도 획득은 여기를 거쳐요 */
function gainMoney(v){v=v*moneyMul();G.money+=v;G.x.st.earned+=v;return v;}
function gainSpeed(v){v=v*speedMul();G.speed+=v;return v;}
function gearDungeon(S){
  S.dmg*=gearMul('dmg')*(buffOn('dmg')?2:1);S.hp*=gearMul('hp');S.cd*=gearMul('cd');S.crit+=gearMul('crit');S.dr+=gearMul('dr');S.move*=gearMul('move');
  var w=curWeapon();if(w.k==='melee'){S.dmg*=w.dmg;S.cd*=w.cd;S.range*=w.rng;}
}
function curWeapon(){return findBy(WEAPONS,G.x.wq)||WEAPONS[0];}
/* ---------- 총 쏘기 ---------- */
function gunFire(w){
  var S=DG.S;DG.cd=0.38*S.cd*w.cd;
  var dmg=Math.round(augDmg(true)*w.dmg),tg;
  if(DG.crit)floatText('치명타!',VW()/2,VH()*0.45,0,'hit');
  if(w.shot==='spread')tg=augTargets(w.n||5,w.rng);
  else if(w.shot==='line'){
    var f=augTargets(1,w.rng)[0];tg=[];
    if(f){var dx=f.x-P.x,dz=f.z-P.z,L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
      augTargets(40,w.rng).forEach(function(t){var px=t.x-P.x,pz=t.z-P.z,along=px*dx+pz*dz,perp=Math.abs(px*dz-pz*dx);if(along>0&&perp<3.2)tg.push(t);});
      tracer(P.x,P.z,P.x+dx*w.rng,P.z+dz*w.rng,'#ff80ab',3);}
  }else tg=augTargets(1,w.rng);
  if(!tg.length){floatText('사거리 안에 적이 없어요',VW()/2,VH()*0.5,0,'spd');DG.cd=Math.min(DG.cd,0.15);return;}
  P.face=Math.atan2(tg[0].x-P.x,tg[0].z-P.z);
  tg.forEach(function(t){
    if(w.shot!=='line')tracer(P.x,P.z,t.x,t.z,w.shot==='aoe'?'#ff9100':'#fff59d',w.shot==='single'&&w.dmg>10?2.5:1);
    var r=w.shot==='aoe'?w.aoe:1.2;
    if(w.shot==='aoe'){var tx=t.x,tz=t.z;after(0.18,function(){fxBoom(tx,tz,w.aoe,'#ff6d00',0.7);augHit(tx,tz,dmg,r);});}
    else augHit(t.x,t.z,dmg,r);
    if(!hostSide())floatText(fmt(dmg),t.x,5,t.z,'hit');
  });
  if(S.vamp)augHeal(S.vamp*Math.min(6,tg.length));
  if(AC){noise(0.06,0.18,w.shot==='aoe'?600:3500);tone(w.shot==='aoe'?120:900,0.06,'square',0.06,-300);}
}
function tracer(x1,z1,x2,z2,col,w){
  var n=Math.min(30,Math.ceil(Math.hypot(x2-x1,z2-z1)/2))*fxMul;
  for(var i=0;i<n;i++){var k=i/n;emit(x1+(x2-x1)*k,2.2+rand(-0.2,0.2),z1+(z2-z1)*k,0,0,0,col,0.18+0.1*w,0);}
}
/* ---------- 아우라 보이기 (나 + 친구) ---------- */
function auraEmit(x,y,z,id,dt){
  var a=findBy(AURAS,id);if(!a||!fxMul)return;
  if(Math.random()<dt*26*fxMul){var ang=Math.random()*6.283,r=1.8+Math.random()*0.6,c=a.col==='rainbow'?'hsl('+((Math.random()*360)|0)+',95%,62%)':a.col;
    emit(x+Math.cos(ang)*r,y+rand(0.2,1),z+Math.sin(ang)*r,0,rand(2,5),0,c,rand(0.6,1),-1);}
}
/* ---------- 퀘스트 확인 ---------- */
function questVal(q){if(q.st==='kinds')return G.counts.filter(function(c){return c>0;}).length;return G.x.st[q.st]||0;}
function questTick(){
  QUESTS.forEach(function(q){
    if(G.x.ti.indexOf(q.id)>=0)return;
    if(questVal(q)>=q.n){G.x.ti.push(q.id);if(!G.x.tq)G.x.tq=q.id;
      toast('📜 퀘스트 완료! 칭호 「'+q.ti+'」 획득 — '+q.bd+' (상점 → 퀘스트에서 장착)','good');sfx.deposit();burst(P.x,4,P.z,'#ffd54a',30,9);save();}
  });
}
/* ---------- 이벤트 ---------- */
var evBox=null,evBoxT=120;
function todayKey(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function coinMul(){return (isWeekend()?2:1)*(isXmas()?2:1);}
function addCoin(n,why){n=Math.round(n*coinMul());G.x.coin+=n;toast('🎟️ 이벤트 코인 +'+n+' ('+why+')','good');return n;}
function eventTick(dt){
  /* 매일 첫 접속 */
  if(G.x.ev.day!==todayKey()){G.x.ev.day=todayKey();
    var m=gainMoney(Math.max(1e6,income()*600));G.x.it.mbox=(G.x.it.mbox||0)+1;addCoin(3,'매일 접속');
    lootPopup('🎉 오늘의 접속 보상',['💰 +'+fmt(m),'🎁 수수께끼 상자 1개','🎟️ 이벤트 코인'+(coinMul()>1?' (보너스 ×'+coinMul()+')':'')]);save();}
  /* 황금 시간: 시작할 때 알림 + 코인 1개 */
  var slot=Math.floor(Date.now()/1200000);
  if(goldenTime()&&G.x.ev.gt!==slot){G.x.ev.gt=slot;bossBanner('✨ 황금 시간!','2분 동안 돈·속도 획득 ×2','#ffd54a');addCoin(1,'황금 시간');save();}
  /* 맵에 선물 상자 (2분마다, 경기장에 떨어짐) */
  if(!DG.on){
    if(!evBox){evBoxT-=dt;if(evBoxT<=0){evBoxT=120;
      var z=clamp(P.z+rand(30,90),BASE_Z1+10,Z1-20),x=rand(-24,24);
      var g=new THREE.Group(),bx=new THREE.Mesh(boxG,new THREE.MeshLambertMaterial({color:0xe53935,emissive:0x550000}));bx.scale.set(2.4,2.4,2.4);bx.position.y=1.3;g.add(bx);
      var rb=new THREE.Mesh(boxG,new THREE.MeshBasicMaterial({color:0xffd54a}));rb.scale.set(2.5,0.5,2.5);rb.position.y=2.1;g.add(rb);
      var rb2=new THREE.Mesh(boxG,new THREE.MeshBasicMaterial({color:0xffd54a}));rb2.scale.set(0.5,2.5,2.5);rb2.position.y=1.3;g.add(rb2);
      g.position.set(x,0,z);scene.add(g);evBox=g;toast('🎁 경기장에 선물 상자가 떨어졌어! (앞쪽 '+Math.round(z-P.z)+'m)','good');}}
    else{evBox.rotation.y+=dt*1.5;evBox.position.y=Math.abs(Math.sin(performance.now()/300))*0.6;
      if(Math.random()<dt*10*fxMul)emit(evBox.position.x+rand(-1.5,1.5),rand(1,4),evBox.position.z+rand(-1.5,1.5),0,rand(1,3),0,'#ffd54a',0.8,-1);
      if(Math.hypot(P.x-evBox.position.x,P.z-evBox.position.z)<3.5){
        scene.remove(evBox);evBox=null;var gm2=gainMoney(Math.max(5e5,income()*120));var lines=['💰 +'+fmt(gm2)];
        lines.push('🎟️ 코인 +'+addCoin(1,'선물 상자'));
        if(Math.random()<0.15){var lim=['evclover','starwing'][Math.floor(Math.random()*2)];if(G.x.acc.indexOf(lim)<0){G.x.acc.push(lim);lines.push('🌟 한정 장신구 획득! '+findBy(ACCS,lim).nm);}}
        lootPopup('🎁 선물 상자',lines);sfx.deposit();save();}
    }
  }
}
/* ---------- 아이템 사용 ---------- */
function useItem(id){
  var it=findBy(ITEMS,id);if(!it||!(G.x.it[id]>0))return false;
  if(id==='hp'){if(!DG.on||DG.over){toast('체력 포션은 던전에서만 써요','warn');return false;}DG.hp=Math.min(DG.max,DG.hp+DG.max*0.5);burst(P.x,3,P.z,'#ff5252',24,7);}
  else if(id==='feather'){toast('부활 깃털은 던전에서 쓰러질 때 자동으로 써져요','warn');return false;}
  else if(it.buff){var base=Math.max(Date.now(),G.x.bf[it.buff]||0);G.x.bf[it.buff]=base+it.min*60000;}
  else if(id==='mbox'){var r=Math.random(),msg;
    if(r<0.4)msg='💰 +'+fmt(gainMoney(Math.max(1e7,income()*900)));
    else if(r<0.7)msg='⚡ 속도 +'+fmt(gainSpeed(G.speed*0.08+100));
    else if(r<0.9){var p=Math.floor(Math.random()*N);G.counts[p]++;updateExhibit(p);updateHall();msg='🏆 트로피 ['+gradeOf(p).name+'] '+NPCS[p].name;}
    else{var pool=ACCS.filter(function(a){return !a.coin&&G.x.acc.indexOf(a.id)<0;});if(pool.length){var a=pool[Math.floor(Math.random()*pool.length)];G.x.acc.push(a.id);msg='💍 장신구 '+a.ic+' '+a.nm+'!';}else msg='💰 +'+fmt(gainMoney(Math.max(1e7,income()*900)));}
    lootPopup('🎁 수수께끼 상자',[msg]);}
  G.x.it[id]--;sfx.buy();save();if(storeOpen)storeRender();
  if(id!=='mbox')toast(it.ic+' '+it.nm+' 사용!','good');
  if(DG.on)augApply();
  return true;
}
/* ---------- 상점 창 ---------- */
var STORE_TABS=[['wpn','⚔️ 무기'],['item','🧪 아이템'],['acc','💍 장신구'],['aura','✨ 아우라'],['quest','📜 퀘스트·칭호'],['event','🎉 이벤트']];
var storeEl=document.createElement('div');storeEl.id='storeModal';
storeEl.innerHTML='<div class="stBox"><div class="stHead"><b>🛍️ 상점</b><span id="stMoney"></span><button id="stClose" type="button">✕</button></div><div id="stTabs"></div><div id="stInfo"></div><div id="stList"></div></div>';
document.body.appendChild(storeEl);
var storeOpen=false,storeTab='wpn';
STORE_TABS.forEach(function(t){var b=document.createElement('button');b.type='button';b.textContent=t[1];b.dataset.t=t[0];b.addEventListener('click',function(){storeTab=t[0];storeRender();});$('stTabs').appendChild(b);});
function storeOpenFn(){if(modalOpen&&!storeOpen)return;storeOpen=true;modalOpen=true;keys={};joy.x=joy.y=0;storeEl.style.display='flex';storeRender();}
function storeClose(){storeOpen=false;modalOpen=false;storeEl.style.display='none';}
$('stClose').addEventListener('click',storeClose);
storeEl.addEventListener('click',function(e){if(e.target===storeEl)storeClose();});
function priceTxt(o){return o.coin?'🎟️ '+o.coin:'💰 '+fmt(o.price);}
function canPay(o){return o.coin?G.x.coin>=o.coin:G.money>=o.price;}
function pay(o){if(!canPay(o)){sfx.deny();toast(o.coin?'이벤트 코인이 부족해요':'돈이 부족해요','warn');return false;}if(o.coin)G.x.coin-=o.coin;else G.money-=o.price;G.x.st.buys++;sfx.buy();return true;}
function card(o,tag,btns){
  var gc=GRADE_C[o.g||0];
  return '<div class="stCard" style="border-color:'+gc+'"><div class="stIc">'+o.ic+'</div><div class="stTx"><b>'+o.nm+'</b> <span class="stGr" style="color:'+gc+'">'+GRADE_N[o.g||0]+'</span>'+(tag?' <span class="stTag">'+tag+'</span>':'')+'<small>'+o.ds+'</small></div><div class="stBt">'+btns+'</div></div>';
}
function btn(act,id,label,dis){return '<button type="button" data-a="'+act+'" data-id="'+id+'"'+(dis?' disabled':'')+'>'+label+'</button>';}
function storeRender(){
  if(!storeOpen)return;
  $('stMoney').textContent='💰 '+fmt(G.money)+'  🎟️ '+G.x.coin;
  [].forEach.call($('stTabs').children,function(b){b.classList.toggle('on',b.dataset.t===storeTab);});
  var h='',info='';
  if(storeTab==='wpn'){
    var w=curWeapon();info='들고 있는 무기: '+w.ic+' '+w.nm+' · 던전에서 [E]로 공격 · 총은 가까운 적을 자동 조준해요';
    WEAPONS.forEach(function(o){var own=G.x.wpn.indexOf(o.id)>=0,eq=G.x.wq===o.id;
      var st='공격 ×'+o.dmg+' · 속도 '+(o.cd<1?'빠름':o.cd>1.2?'느림':'보통')+'('+(Math.round(0.38*o.cd*100)/100)+'초) · '+(o.k==='gun'?'사거리 '+o.rng:'범위 ×'+o.rng);
      h+=card({ic:o.ic,nm:o.nm,g:o.g,ds:o.ds+'<br>'+st},o.k==='gun'?'🔫 총':'🗡️ 근접',own?btn('wq',o.id,eq?'✅ 장착 중':'장착',eq):btn('bw',o.id,priceTxt(o),!canPay(o)));});
  }else if(storeTab==='item'){
    var bl=[];['dmg','money','speed'].forEach(function(k){if(buffOn(k))bl.push({dmg:'💪 공격 ×2',money:'💸 돈 ×2',speed:'⚡ 속도 ×2'}[k]+' '+Math.ceil((G.x.bf[k]-Date.now())/60000)+'분');});
    info='사서 가방에 넣고 「사용」 · 체력 포션은 던전에서 Q키'+(bl.length?' · 지금 버프: '+bl.join(', '):'');
    ITEMS.forEach(function(o){var n=G.x.it[o.id]||0;h+=card(o,n?'가방 '+n+'개':'',btn('bi',o.id,priceTxt(o),!canPay(o))+(n&&o.id!=='feather'?btn('use',o.id,'사용'):''));});
  }else if(storeTab==='acc'){
    info='장신구는 최대 3개 장착 ('+G.x.acq.length+'/3) · ☘️🌟 한정 장신구는 🎉이벤트 탭/선물 상자에서';
    ACCS.forEach(function(o){var own=G.x.acc.indexOf(o.id)>=0,eq=G.x.acq.indexOf(o.id)>=0;
      if(o.coin&&!own)return;
      h+=card(o,eq?'장착 중':'',own?btn('aq',o.id,eq?'빼기':'장착',!eq&&G.x.acq.length>=3):btn('ba',o.id,priceTxt(o),!canPay(o)));});
  }else if(storeTab==='aura'){
    info='아우라는 1개 장착 · 지금 돈 ×'+(Math.round(moneyMul()*100)/100)+' · 속도 ×'+(Math.round(speedMul()*100)/100)+' (장신구·칭호·이벤트 포함)';
    AURAS.forEach(function(o){var own=G.x.aur.indexOf(o.id)>=0,eq=G.x.au===o.id;
      if(o.coin&&!own)return;
      h+=card(o,eq?'장착 중':'',own?btn('uq',o.id,eq?'빼기':'장착'):btn('bu',o.id,priceTxt(o),!canPay(o)));});
  }else if(storeTab==='quest'){
    var t=curTitle();info='칭호는 1개 장착 · 친구 화면 이름표에도 보여요 · 지금: '+(t?t.ti:'없음');
    QUESTS.forEach(function(q){var done=G.x.ti.indexOf(q.id)>=0,eq=G.x.tq===q.id,v=Math.min(q.n,questVal(q));
      h+='<div class="stCard q'+(done?' done':'')+'"><div class="stIc">'+(done?'🏅':'📜')+'</div><div class="stTx"><b>'+q.ti+'</b> <span class="stTag">'+q.bd+'</span><small>'+q.q+' — '+fmt(v)+' / '+fmt(q.n)+'</small><div class="stPg"><i style="width:'+(v/q.n*100)+'%"></i></div></div><div class="stBt">'+(done?btn('tq',q.id,eq?'✅ 장착 중':'장착',eq):'')+'</div></div>';});
    EV_TITLES.forEach(function(o){if(G.x.ti.indexOf(o.id)<0)return;var eq=G.x.tq===o.id;
      h+='<div class="stCard q done"><div class="stIc">🎟️</div><div class="stTx"><b>'+o.ti+'</b> <span class="stTag">'+o.bd+'</span><small>이벤트 한정 칭호</small></div><div class="stBt">'+btn('tq',o.id,eq?'✅ 장착 중':'장착',eq)+'</div></div>';});
  }else if(storeTab==='event'){
    var ev=[];
    ev.push((goldenTime()?'🟢':'⚪')+' 황금 시간: 매시 0·20·40분부터 2분 동안 돈·속도 ×2'+(goldenTime()?' (지금 진행 중!)':''));
    ev.push((isWeekend()?'🟢':'⚪')+' 주말 이벤트: 토·일 돈 ×1.5 · 코인 ×2'+(isWeekend()?' (진행 중!)':''));
    ev.push((isXmas()?'🟢':'⚪')+' 크리스마스 이벤트 (12/18~12/31): 코인 ×2 · 산타 아우라 · 크리스마스 칭호'+(isXmas()?' (진행 중!)':''));
    ev.push('🟢 매일 첫 접속: 돈 + 수수께끼 상자 + 코인 3개');
    ev.push('🟢 선물 상자: 2분마다 경기장에 떨어져요 (코인 + 15% 확률로 한정 장신구)');
    ev.push('🟢 보스 처치: 코인 1개 (어려움 2개 · 무한 모드 보스 2개)');
    info='🎟️ 이벤트 코인으로 한정 아이템을 살 수 있어요';
    h+='<div class="stEv">'+ev.join('<br>')+'</div>';
    AURAS.concat(ACCS).forEach(function(o){if(!o.coin)return;var isA=!!o.col,own=isA?G.x.aur.indexOf(o.id)>=0:G.x.acc.indexOf(o.id)>=0,off=o.xmas&&!isXmas();
      h+=card(o,(isA?'✨ 아우라':'💍 장신구')+(off?' · 기간 아님':''),own?'<span class="stOwn">보유 중</span>':btn(isA?'bu':'ba',o.id,priceTxt(o),off||!canPay(o)));});
    EV_TITLES.forEach(function(o){var own=G.x.ti.indexOf(o.id)>=0,off=o.xmas&&!isXmas();
      h+=card({ic:'🏷️',nm:o.ti,g:5,ds:o.bd},'📜 칭호'+(off?' · 기간 아님':''),own?'<span class="stOwn">보유 중</span>':btn('bt',o.id,'🎟️ '+o.coin,off||G.x.coin<o.coin));});
  }
  $('stInfo').textContent=info;$('stList').innerHTML=h;
}
$('stList').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b||b.disabled)return;var a=b.dataset.a,id=b.dataset.id,o;
  if(a==='bw'){o=findBy(WEAPONS,id);if(pay(o)){G.x.wpn.push(id);G.x.wq=id;toast(o.ic+' '+o.nm+' 구매·장착!','good');}}
  else if(a==='wq'){G.x.wq=id;}
  else if(a==='bi'){o=findBy(ITEMS,id);if(pay(o)){G.x.it[id]=(G.x.it[id]||0)+1;}}
  else if(a==='use'){useItem(id);}
  else if(a==='ba'){o=findBy(ACCS,id);if(pay(o)){G.x.acc.push(id);if(G.x.acq.length<3)G.x.acq.push(id);toast(o.ic+' '+o.nm+' 획득!','good');}}
  else if(a==='aq'){var k=G.x.acq.indexOf(id);if(k>=0)G.x.acq.splice(k,1);else if(G.x.acq.length<3)G.x.acq.push(id);}
  else if(a==='bu'){o=findBy(AURAS,id);if(pay(o)){G.x.aur.push(id);G.x.au=id;toast(o.ic+' '+o.nm+' 장착! '+o.ds,'good');}}
  else if(a==='uq'){G.x.au=G.x.au===id?'':id;}
  else if(a==='tq'){G.x.tq=id;}
  else if(a==='bt'){o=findBy(EV_TITLES,id);if(G.x.coin>=o.coin){G.x.coin-=o.coin;G.x.ti.push(id);G.x.tq=id;sfx.buy();toast('🏷️ 칭호 「'+o.ti+'」 획득!','good');}}
  save();if(DG.on)augApply();storeRender();
});
addEventListener('keydown',function(e){
  if(e.target&&e.target.tagName==='INPUT')return;
  if(storeOpen&&(e.key==='Escape'||e.code==='KeyB')){storeClose();e.preventDefault();return;}
  if(!started||modalOpen)return;
  if(e.code==='KeyB'){storeOpenFn();e.preventDefault();}
  else if(e.code==='KeyQ'&&DG.on){if(!useItem('hp'))toast('🧪 체력 포션이 없어요 (상점 → 아이템)','warn');}
});
$('storeBtn').addEventListener('click',function(){if(storeOpen)storeClose();else storeOpenFn();});
var stStyle=document.createElement('style');
stStyle.textContent='#storeModal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:65;padding:10px}'+
 '#storeModal .stBox{width:100%;max-width:720px;max-height:90vh;display:flex;flex-direction:column;background:#0f1a30;border:2px solid #ffd54a;border-radius:16px;color:#fff;overflow:hidden}'+
 '.stHead{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#16264a}.stHead b{font-size:20px}#stMoney{flex:1;text-align:right;color:#ffd54a;font-weight:800}#stClose{border:0;background:#c62828;color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:900}'+
 '#stTabs{display:flex;gap:4px;padding:8px 10px 0;flex-wrap:wrap}#stTabs button{border:0;border-radius:9px 9px 0 0;padding:8px 10px;background:#22345c;color:#cfd8dc;cursor:pointer;font-weight:700;font-size:13px}#stTabs button.on{background:#ffd54a;color:#3e2300}'+
 '#stInfo{padding:8px 14px;font-size:12.5px;color:#9fb3c8;border-top:2px solid #ffd54a}#stList{overflow-y:auto;padding:4px 10px 12px}'+
 '.stCard{display:flex;align-items:center;gap:10px;border:2px solid;border-left-width:6px;border-radius:12px;padding:8px 10px;margin:6px 0;background:rgba(255,255,255,.04)}.stCard.q{border-color:#455a64}.stCard.q.done{border-color:#ffd54a}'+
 '.stIc{font-size:30px;width:42px;text-align:center}.stTx{flex:1;min-width:0}.stTx b{font-size:15px}.stTx small{display:block;color:#cfd8dc;font-size:12px;margin-top:2px;line-height:1.45}.stGr{font-size:11px;font-weight:800}.stTag{font-size:11px;background:rgba(255,255,255,.12);border-radius:6px;padding:1px 6px}'+
 '.stBt{display:flex;flex-direction:column;gap:4px}.stBt button{border:0;border-radius:8px;padding:7px 10px;background:#2e7d32;color:#fff;font-weight:800;cursor:pointer;min-width:96px;font-size:12.5px}.stBt button:disabled{background:#455a64;opacity:.7;cursor:default}.stOwn{color:#81c784;font-weight:800;font-size:12px}'+
 '.stPg{height:6px;background:rgba(255,255,255,.12);border-radius:4px;margin-top:4px;overflow:hidden}.stPg i{display:block;height:100%;background:#ffd54a}.stEv{font-size:13px;line-height:1.7;background:rgba(255,213,74,.08);border:1px solid rgba(255,213,74,.4);border-radius:10px;padding:8px 10px;margin:6px 0}'+
 '#storeBtn{position:fixed;left:10px;top:328px;z-index:12;background:rgba(0,0,0,.5);color:#fff;border:1px solid rgba(255,213,74,.6);border-radius:10px;padding:6px 12px;font-size:13px;cursor:pointer;touch-action:manipulation}'+
 'body.touch #storeBtn{display:none;left:auto;right:calc(8px + var(--sar));top:calc(290px + var(--sat));z-index:25;min-width:150px;padding:10px 14px;font-size:14px;text-align:left;background:rgba(10,20,40,.92)}body.touch.menu #storeBtn{display:block}'+
 '#titleTag{position:fixed;left:50%;top:6px;transform:translateX(-50%);font-size:12px;color:#ffd54a;text-shadow:0 1px 3px #000;z-index:11;pointer-events:none;white-space:nowrap}'+
 'body.touch .stCard{flex-wrap:wrap}body.touch .stBt{flex-direction:row}';
document.head.appendChild(stStyle);
var titleTagEl=document.createElement('div');titleTagEl.id='titleTag';document.body.appendChild(titleTagEl);
/* 매 프레임/초마다 */
var xT=0;
function extrasTick(dt){
  G.x.st.play+=dt;
  if(!DG.on||!DG.over){var au=G.x.au;if(au)auraEmit(P.x,P.y,P.z,au,dt);}
  xT+=dt;if(xT>=1){xT=0;questTick();eventTick(1);if(storeOpen)storeRender();
    var t=curTitle(),bits=[];if(t)bits.push(t.ti);if(goldenTime())bits.push('✨황금 시간 ×2');if(isWeekend())bits.push('🎉주말 ×1.5');
    ['dmg','money','speed'].forEach(function(k){if(buffOn(k))bits.push({dmg:'💪',money:'💸',speed:'⚡'}[k]+Math.ceil((G.x.bf[k]-Date.now())/60000)+'분');});
    titleTagEl.textContent=bits.join('  ·  ');}
  if(evBox&&DG.on){}
}

function loop(now){
  requestAnimationFrame(loop);
  var raw=(now-last)/1000;
  var dt=Math.min(0.05,raw);last=now;
  if(tsT>0){tsT-=dt;dt*=TSCALE;if(tsT<=0)TSCALE=1;}
  clock+=dt;
  if(started&&clock>6&&fxLevel&&!document.hidden){
    emaDt=emaDt*0.95+Math.min(raw,0.25)*0.05;
    if(emaDt>1/30)lowT+=raw;else lowT=Math.max(0,lowT-raw);
    if(lowT>5){lowT=0;setFx(0,true);}
  }
  crowdTime.value=clock;
  if(started){update(dt,clock);netTick(dt);}
  else{
    /* 시작 화면 뒤 배경: 캐릭터 대기 */
    pChar.root.position.set(P.x,0,P.z);pChar.root.rotation.y=P.face;
    cam.yaw=Math.PI+Math.sin(clock*0.2)*0.4;
  }
  updateParticles(dt);
  updateCamera(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(loop);
/* 방장이 다른 탭으로 가도 친구들 월드가 멈추지 않게 (화면은 안 그리고 계산만) */
var bgLast=0;
setInterval(function(){
  if(!document.hidden||!started||NET.mode!=='host'){bgLast=0;return;}
  var now=performance.now(),dt=bgLast?Math.min(0.1,(now-bgLast)/1000):0.05;bgLast=now;
  clock+=dt;update(dt,clock);netTick(1);
},50);

})();
