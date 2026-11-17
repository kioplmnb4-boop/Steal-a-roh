/* =========================================================
   패치노트
   - 업데이트할 때 맨 위에 새 항목을 추가하세요 (v 값을 꼭 바꾸기!)
   - 최근 3개만 남겨두고 오래된 건 지워요
   - 접속했을 때 마지막으로 본 버전과 다르면 자동으로 창이 떠요
   - 오른쪽 아래 버전 표시를 누르면 언제든 다시 볼 수 있어요
   ========================================================= */
window.PATCH_NOTES=[
  {v:'v25',date:'2026-11-17',title:'📦 USB로 옮기기',items:[
    '📦 💾 백업 창에 「진행 파일로 저장 / 불러오기」 추가 — 진행 전부를 파일 하나로 USB에 옮겨요',
    '🔗 크롬·엣지에서는 저장할 때 고른 USB 파일에 20초마다 자동 저장',
    '💾 백업 슬롯이 장비·스킬·칭호까지 같이 저장하도록 수정',
    '🖱️ USB 폴더의 index.html을 더블클릭해서 바로 실행 가능'
  ]},
  {v:'v24',date:'2026-11-17',title:'💰 수입 밸런스',items:[
    '🏆 트로피 초당 수입 ×2 (모을수록 확실히 쓸모 있게!)',
    '🕳️ 던전 골드 하향: 몹 처치·스테이지·보스 상자 골드 ×0.4 · 보스 보상은 메달 수에 따라 불어나지 않게',
    '⚡ 던전의 속도 보상·트로피 드롭·증강은 그대로 — 던전은 성장용, 트로피는 돈벌이용'
  ]},
  {v:'v23',date:'2026-11-17',title:'🩸 새 무기 + 잡몹 체력 하향',items:[
    '🩸 피의 계약검 (영웅 · 근접): 공격력 ×1.95 (강철 검보다 +22%) · 대신 던전에서 맞은 뒤 무적 시간 -50%',
    '⚠️ 연속으로 맞기 쉬워지니 피하기에 자신 있을 때 추천!',
    '🩹 잡몹 체력 하향: 쉬움 3→2대 · 보통 6→4대 · 어려움 12→8대 (기본 체력 ×4 → ×2.5)'
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
