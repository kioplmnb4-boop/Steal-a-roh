/* =========================================================
   패치노트
   - 업데이트할 때 맨 위에 새 항목을 추가하세요 (v 값을 꼭 바꾸기!)
   - 최근 3개만 남겨두고 오래된 건 지워요
   - 접속했을 때 마지막으로 본 버전과 다르면 자동으로 창이 떠요
   - 오른쪽 아래 버전 표시를 누르면 언제든 다시 볼 수 있어요
   ========================================================= */
window.PATCH_NOTES=[
  {v:'v21',date:'2026-11-16',title:'🌀 스킬 업데이트',items:[
    '👹 수호자 42명 모두 자기만의 스킬! 새 수호자 24명에게 고유 스킬 추가 (식판 투척 · 도깨비불 · 스페시움 광선 · 매트릭스 탄막 · 차원 균열 · 댄스 플로어 등)',
    '🌀 플레이어 스킬 추가: 상점 → 🌀 스킬 · Z / X 두 칸에 장착 (모바일은 화면 버튼)',
    '🔹 기본 스킬 5종 (돈만): 대시 · 작은 방패 · 응급처치 · 질주 · 충격 주먹',
    '💠 특수 스킬 7종 (해금 조건 + 돈): 순간이동 · 투명화 · 귀환 · 시간 정지 · 메테오 · 각성 · 수호자의 힘'
  ]},
  {v:'v20',date:'2026-11-16',title:'🔄 시즌 초기화 + 밸런스',items:[
    '🔄 시즌 초기화! 모든 진행(돈·속도·트로피·장비·칭호·백업·무한 기록)이 처음부터 시작돼요',
    '📦 들고 가던 큰 손을 [E]로 그 자리에 내려놓기 · 25초 안에 [E]로 다시 줍기 (친구도 주울 수 있어요) · 안 주우면 받침대로',
    '🖱️ 우클릭을 꾹 누른 채 마우스를 움직이면 포인터가 고정·숨겨진 채로 화면만 돌아가요',
    '⚔️ 무기 전체 너프 (공격력 약 -40~60%, 빠른 총은 연사 속도도 하향)',
    '🛡️ 잡몹 내구도 상향: 쉬움 3대 · 보통 6대 · 어려움 12대 (+ 기본 체력 ×4)',
    '🗑️ 상점 아이템 정리 (매일 접속 보상은 체력 포션 2개로 변경)'
  ]},
  {v:'v19',date:'2026-11-16',title:'⚖️ 하드 밸런스 패치',items:[
    '💸 큰 손 수입 -70% · 훔치기·몹·보스·상자·스테이지·이벤트 보상 -75%',
    '🧮 돈·속도 배율이 곱하기 → 더하기로 바뀌고 최대 ×6 (아우라·장신구·칭호·이벤트 전부 포함)',
    '✨ 아우라 하향: 불꽃·황금 +20% … 신의 아우라 ×3 · 황금 시간 +50% · 주말 +25%',
    '🏷️ 상점 가격 ×5 · 러닝머신 가격 ×4, 살 때마다 +45%씩 비싸짐',
    '🏃 뒤쪽 수호자일수록 훨씬 빨라짐 (마지막 수호자 약 4.3배)',
    '👟 걸음 속도 +1은 배율 없이 딱 +1',
    '👹 보스 체력 ×2.5 (쉬움 1,250만 · 보통 7,500만 · 어려움 3.75억) · 무한 모드 보스마다 ×3',
    '🌙 오프라인 수입 25% → 10% (최대 4시간)'
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
