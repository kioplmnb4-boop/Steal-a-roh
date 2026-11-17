/* =========================================================
   패치노트
   - 업데이트할 때 맨 위에 새 항목을 추가하세요 (v 값을 꼭 바꾸기!)
   - 최근 3개만 남겨두고 오래된 건 지워요
   - 접속했을 때 마지막으로 본 버전과 다르면 자동으로 창이 떠요
   - 오른쪽 아래 버전 표시를 누르면 언제든 다시 볼 수 있어요
   ========================================================= */
window.PATCH_NOTES=[
  {v:'v30',date:'2026-11-17',title:'🔄 롤 챔피언 캐릭터 제거',items:[
    '🔄 캐릭터 14종(가렌~비에고)과 QWER 스킬을 되돌렸어요 — 캐릭터는 브론즈·실버·골드만 남아요',
    '🎮 롤 아이템은 그대로예요! 오히려 6종 추가: 드락사르의 황혼검 · 징수의 총 · 크라켄 학살자 · 불경한/굶주린/거대한 히드라',
    '💥 치명타 개편 유지: 기본 치명타 피해 1.5배 · 무한의 대검은 추가 치명타 피해 +40%',
    '🌀 구인수는 칠 때마다 공격 속도 +15% (4번까지) · ⚡스태틱 · 🏹루난은 원거리 전용',
    '🕹️ 던전 조작도 원래대로: WASD 이동 · E 공격 · Q 포션'
  ]},
  {v:'v27',date:'2026-11-17',title:'🎮 롤 아이템 상점',items:[
    '🎮 상점에 「롤 아이템」 탭 추가 — 무기 7개 · 장신구 7개',
    '⚔️ 무한의 대검 · 몰락한 왕의 검 · 스태틱의 단검 · 루난의 허리케인 · 삼위일체 · 구인수의 격노검 · 피바라기',
    '💍 헤르메스의 발걸음 · 가시 갑옷 · 워모그의 갑옷 · 태양불꽃 망토 · 존야의 모래시계 · 수호천사 · 라바돈의 죽음모자',
    '✨ 아이템마다 흡혈·번개·부활·반격·추가타 같은 고유 효과가 있어요'
  ]},
  {v:'v26',date:'2026-11-17',title:'🦇 피바라기',items:[
    '🦇 흡혈 무기 「피바라기」 — 벤 적 1마리당 최대 체력 2% 회복, 보스는 5%',
    '🩸 체력이 꽉 찬 상태에서 회복한 만큼 붉은 보호막 (최대 체력의 30%까지)'
  ]}
];
(function(){
  var NOTES=window.PATCH_NOTES,CUR=NOTES[0].v,KEY='steal-a-roh-patch-seen';
  window.GAME_VER=CUR;
  var css=document.createElement('style');
  css.textContent='#pnModal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:90;padding:14px}'+
    '#pnModal .pnBox{width:100%;max-width:460px;max-height:86vh;overflow-y:auto;background:#0f1d3a;border:2px solid #ffd54a;border-radius:16px;padding:16px 18px;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.6)}'+
    '#pnModal h3{margin:0 0 4px;font-size:21px}#pnModal .pnSub{color:#9fb3c8;font-size:12.5px;margin-bottom:10px}'+
    '#pnModal .pnV{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.05)}'+
    '#pnModal .pnV.new{background:rgba(255,213,74,.12);border:1px solid rgba(255,213,74,.5)}'+
    '#pnModal .pnV b{color:#ffd54a}#pnModal .pnV small{color:#9fb3c8;margin-left:6px}#pnModal ul{margin:6px 0 0;padding-left:18px;line-height:1.55;font-size:14px}'+
    '#pnModal button{margin-top:14px;width:100%;padding:10px;border:0;border-radius:10px;background:#ffd54a;color:#3e2300;font-size:16px;font-weight:900;cursor:pointer;touch-action:manipulation}'+
    '#pnModal .pnNew{background:#e53935;color:#fff;font-weight:900;font-size:10.5px;padding:1px 6px;border-radius:6px;margin-left:4px}'+
    '#verTag{pointer-events:auto!important;cursor:pointer;z-index:55!important}#verTag:hover{color:#ffd54a}';
  document.head.appendChild(css);
  var m=document.createElement('div');m.id='pnModal';
  var seen='';try{seen=localStorage.getItem(KEY)||'';}catch(e){}
  function esc(t){return String(t).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function render(){
    /* 마지막으로 본 버전 이후의 항목은 '새로움'으로 강조 */
    var html='<div class="pnBox"><h3>📜 패치노트</h3><div class="pnSub">지금 버전: <b>'+CUR+'</b></div>',isNew=true;
    NOTES.forEach(function(n){
      if(n.v===seen)isNew=false;
      html+='<div class="pnV'+(isNew&&seen!==CUR?' new':'')+'"><b>'+esc(n.v)+' · '+esc(n.title)+'</b><small>'+esc(n.date)+(isNew&&seen!==CUR?' <span class="pnNew">NEW</span>':'')+'</small><ul>'+
        n.items.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div>';
    });
    m.innerHTML=html+'<button type="button" id="pnOk">확인!</button></div>';
    document.getElementById('pnOk').addEventListener('click',close);
  }
  function open(){render();m.style.display='flex';}
  function close(){m.style.display='none';seen=CUR;try{localStorage.setItem(KEY,CUR);}catch(e){}}
  window.openPatchNotes=open;
  function init(){
    document.body.appendChild(m);
    m.addEventListener('click',function(e){if(e.target===m)close();});
    var vt=document.getElementById('verTag');
    if(vt){vt.textContent=CUR+' · 📜 패치노트';vt.addEventListener('click',open);}
    if(seen!==CUR)open(); /* 업데이트 후 처음 접속 → 자동으로 보여주기 */
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
