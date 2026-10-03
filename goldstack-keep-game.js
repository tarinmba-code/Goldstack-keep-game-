(function(){var st=document.createElement('style');st.textContent="\n  :root{ --ink:#1F2B22; --gold:#F5B820; --gold-deep:#A8760A; --blue:#3E8FD6; --red:#D7393A; color-scheme: light only; }\n  @media (prefers-color-scheme: dark){\n    :root:not([data-theme=\"light\"]){ --ink:#1F2B22; }\n    html,body{ background:#CFE9F5 !important; color:#1F2B22 !important; color-scheme: light only; }\n  }\n  :root[data-theme=\"dark\"]{ --ink:#1F2B22; }\n  html,body{ margin:0; height:100%; overflow:hidden; background:#CFE9F5; color:#1F2B22; color-scheme: light only;\n    overscroll-behavior:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;\n    font-family:\"Nunito Sans\",\"Segoe UI\",system-ui,sans-serif; }\n  #game{ position:fixed; inset:0; touch-action:none; }\n  #game canvas{ display:block; width:100%; height:100%; }\n  #touch{ position:fixed; inset:0; z-index:5; touch-action:none; }\n  #labels,#nums{ position:fixed; inset:0; pointer-events:none; z-index:6; overflow:hidden; }\n  .pad{ position:absolute; left:0; top:0; display:flex; align-items:center; gap:4px; padding:2px 10px 2px 6px; border-radius:999px;\n    background:rgba(255,255,255,.95); font-family:\"Lilita One\",\"Trebuchet MS\",sans-serif; font-size:17px; color:var(--ink);\n    box-shadow:0 2px 0 rgba(0,0,0,.28); white-space:nowrap; will-change:transform; }\n  .pad.ing{ background:#DDEEFF; }\n  .pad .ic{ font-size:15px; line-height:1; }\n  .pad.off{ opacity:.55; }\n  .num{ position:absolute; left:0; top:0; font-family:\"Lilita One\",\"Trebuchet MS\",sans-serif; font-size:22px; color:#fff; white-space:nowrap;\n    text-shadow:0 2px 0 #3A1E1E, 2px 0 0 #3A1E1E, -2px 0 0 #3A1E1E, 0 -2px 0 #3A1E1E; will-change:transform,opacity; display:none; }\n  .num.hurt{ color:#FFD2D2; } .num.gold{ color:#FFE27A; font-size:18px; } .num.crit{ color:#E9C3FF; font-size:28px; }\n  #hud{ position:fixed; inset:0; pointer-events:none; z-index:10; font-family:\"Lilita One\",\"Trebuchet MS\",sans-serif; }\n  #topbar{ position:absolute; left:0; right:0; top:0; padding:calc(env(safe-area-inset-top) + 10px) 10px 0; display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }\n  .pill{ display:flex; align-items:center; gap:6px; background:rgba(31,28,40,.8); color:#fff; border-radius:999px; padding:3px 11px 3px 5px; font-size:19px; }\n  .pill i{ width:21px; height:21px; border-radius:50%; display:inline-block; background:var(--gold); box-shadow:inset 0 -3px 0 var(--gold-deep); font-style:normal; }\n  .pill.ing i{ border-radius:4px; width:21px; height:13px; background:var(--blue); box-shadow:inset 0 -3px 0 #245C92; }\n  .pill.sq i{ background:none; box-shadow:none; width:auto; height:auto; font-size:15px; }\n  .pill.up{ color:#9BF57E; } .pill.down{ color:#FF9A9A; }\n  .punch{ animation:punch .18s ease-out; }\n  @keyframes punch{ 0%{ transform:scale(1.22) } 100%{ transform:scale(1) } }\n  #res{ display:flex; flex-direction:column; align-items:flex-end; gap:5px; }\n  #wave{ background:rgba(255,255,255,.92); color:var(--ink); border-radius:12px; padding:5px 11px; font-size:15px; line-height:1.15; box-shadow:0 2px 0 rgba(0,0,0,.2); max-width:52vw; }\n  #wave small{ display:block; font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:12px; color:#56655A; }\n  #keepbar{ position:absolute; left:50%; transform:translateX(-50%); top:calc(env(safe-area-inset-top) + 64px); width:min(44vw,210px); text-align:center; color:#fff; font-size:13px; text-shadow:0 2px 0 rgba(0,0,0,.4); }\n  .bar{ height:9px; background:rgba(31,28,40,.72); border-radius:6px; overflow:hidden; margin-top:2px; border:2px solid rgba(255,255,255,.9); }\n  .bar .fill{ height:100%; width:100%; background:linear-gradient(#7BE35A,#43A62A); transform-origin:left; }\n  #bossbar{ position:absolute; left:50%; transform:translateX(-50%); top:calc(env(safe-area-inset-top) + 100px); width:min(78vw,380px); text-align:center; color:#fff; font-size:17px; text-shadow:0 2px 0 #3A1E1E; display:none; }\n  #bossbar .bar{ height:13px; } #bossbar .fill{ background:linear-gradient(#FF6B6B,#C62828); }\n  #toast{ position:absolute; left:50%; top:30%; transform:translate(-50%,-50%); color:#fff; font-size:clamp(20px,5.6vw,30px); text-align:center;\n    text-shadow:0 3px 0 #3A1E1E, 0 0 12px rgba(0,0,0,.25); opacity:0; transition:opacity .25s; white-space:nowrap; }\n  #toast.show{ opacity:1; }\n  #intro{ position:absolute; left:0; right:0; top:38%; text-align:center; color:#fff; pointer-events:none; opacity:0; transform:translateX(-30px); transition:opacity .3s, transform .3s; }\n  #intro.show{ opacity:1; transform:none; }\n  #intro small{ display:inline-block; background:#C62828; padding:2px 12px; border-radius:6px; font-size:15px; letter-spacing:1px; }\n  #intro div{ font-size:clamp(28px,8vw,46px); text-shadow:0 4px 0 #3A1E1E; margin-top:4px; }\n  #joy{ position:fixed; z-index:9; width:120px; height:120px; margin:-60px 0 0 -60px; border-radius:50%; background:rgba(255,255,255,.28); border:2px solid rgba(255,255,255,.55); display:none; pointer-events:none; }\n  #knob{ position:absolute; left:50%; top:50%; width:54px; height:54px; margin:-27px 0 0 -27px; border-radius:50%; background:rgba(255,255,255,.85); box-shadow:0 3px 8px rgba(0,0,0,.2); }\n\n  #cardPick{ position:fixed; inset:0; z-index:26; display:none; align-items:center; justify-content:center; padding:16px; background:rgba(26,20,34,.72); backdrop-filter:blur(3px); }\n  #cardPick.show{ display:flex; flex-direction:column; gap:10px; }\n  #cardPick h3{ margin:0; font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:24px; color:#FFE9A8; text-shadow:0 3px 0 rgba(0,0,0,.45); text-align:center; }\n  #cardPick p{ margin:0 0 4px; font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:12px; color:#EDE4D6; text-align:center; }\n  #cardRow{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; width:100%; max-width:640px; }\n  .battlecard{ display:flex; flex-direction:column; gap:6px; align-items:center; text-align:center; border:3px solid #F5B820; border-radius:18px; padding:14px 8px;\n    background:linear-gradient(180deg,#FFFDF6,#F6E9CE); box-shadow:0 6px 0 rgba(0,0,0,.35); cursor:pointer; font-family:\"Nunito Sans\",sans-serif; }\n  .battlecard:active{ transform:translateY(3px); box-shadow:0 3px 0 rgba(0,0,0,.35); }\n  .battlecard.lockedcard{ opacity:.55; filter:grayscale(.6); }\n  .battlecard b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:15px; color:#2A2433; line-height:1.15; }\n  .battlecard .good{ font-size:11.5px; font-weight:800; color:#2E7D32; line-height:1.25; }\n  .battlecard .bad{ font-size:11.5px; font-weight:800; color:#B3261E; line-height:1.25; }\n  #armory{ position:fixed; left:0; right:0; bottom:0; z-index:15; background:linear-gradient(rgba(255,252,245,0),rgba(255,252,245,.93) 24%);\n    padding:2px 6px calc(env(safe-area-inset-bottom) + 6px); display:none; }\n  .ugrp{ display:grid; grid-template-columns:repeat(6,1fr); gap:4px; margin-bottom:5px; }\n  .ug{ border:0; border-radius:12px; background:rgba(42,36,51,.85); color:#fff; font-size:17px; padding:5px 0 3px; cursor:pointer; line-height:1.1; touch-action:manipulation; }\n  .ug span{ display:block; font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:9px; }\n  .ug.on{ background:#FFE06B; color:#3A2600; box-shadow:0 3px 0 #A8760A; }\n  .ustrip{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; max-height:46vh; overflow-y:auto; overflow-x:hidden; padding-bottom:2px; touch-action:pan-y; -webkit-overflow-scrolling:touch; }\n  .ustrip .card{ padding:7px; font-size:11.5px; }\n  .ustrip .card b{ font-size:12.5px; }\n  #armory header{ display:flex; justify-content:space-between; align-items:center; font-family:\"Lilita One\",sans-serif; font-size:22px; margin-bottom:6px; }\n  #armory header small{ font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:12px; color:#6B6358; display:block; }\n  #armory .x{ font-family:\"Lilita One\",sans-serif; font-size:18px; border:0; background:#2A2433; color:#fff; border-radius:999px; width:36px; height:36px; cursor:pointer; }\n  .branch{ margin:8px 0 2px; font-family:\"Lilita One\",sans-serif; font-size:15px; color:#7A4E12; }\n  .cards{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }\n  .card{ border:2px solid #E2D6C2; background:#fff; border-radius:12px; padding:7px 7px 6px; font-size:12px; line-height:1.25; cursor:pointer; text-align:left; font-family:\"Nunito Sans\",sans-serif; color:#2A2433; }\n  .card b{ display:block; font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:14px; margin-bottom:2px; }\n  .card .cost{ margin-top:5px; font-weight:800; font-size:12px; display:flex; gap:6px; }\n  .card .cost span.g::before{ content:\"\"; display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--gold); margin-right:3px; vertical-align:-1px; }\n  .card .cost span.i::before{ content:\"\"; display:inline-block; width:12px; height:8px; border-radius:2px; background:var(--blue); margin-right:3px; vertical-align:0; }\n  .card.avail{ border-color:#F5B820; box-shadow:0 3px 0 #E0A21A; }\n  .card.poor{ border-color:#E8DCCB; opacity:.75; }\n  .card.owned{ border-color:#5CC23F; background:#F0FBEA; }\n  .card.owned .cost::after{ content:\"Owned\"; color:#3E8A26; }\n  .card.owned .cost span{ display:none; }\n  .card.locked{ opacity:.45; cursor:default; }\n  .card.shake{ animation:shake .3s; }\n  @keyframes shake{ 25%{ transform:translateX(-4px) } 75%{ transform:translateX(4px) } }\n  .el-fire b{ color:#D9531E; } .el-frost b{ color:#1D8FB8; } .el-bolt b{ color:#B08A00; }\n\n  .screen{ background-size:cover !important; background-position:center !important; position:fixed; inset:0; z-index:20; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:18px 12px; box-sizing:border-box;\n    background:linear-gradient(180deg, rgba(247,182,210,.25), rgba(31,28,40,.78)); color:#fff; overflow-y:auto; touch-action:pan-y; }\n  .screen.hide{ display:none; }\n  .screen h1{ font-family:\"Lilita One\",\"Trebuchet MS\",sans-serif; font-weight:400; font-size:clamp(44px,13vw,80px); line-height:.95; margin:0 0 10px; color:#FFD34D; text-shadow:0 5px 0 #8A5A0A, 0 10px 18px rgba(0,0,0,.3); }\n  .screen h2{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:30px; margin:4px 0 10px; text-shadow:0 3px 0 rgba(0,0,0,.35); }\n  .screen p{ font-size:18px; font-weight:800; max-width:30ch; margin:0 0 22px; text-shadow:0 2px 0 rgba(0,0,0,.3); }\n  .screen .stats{ font-family:\"Lilita One\",sans-serif; font-size:19px; margin-bottom:18px; line-height:1.5; }\n  .btn{ font-family:\"Lilita One\",\"Trebuchet MS\",sans-serif; font-size:24px; color:#3A2600; background:linear-gradient(#FFE06B,#F5B820); border:0; border-radius:16px; padding:11px 30px;\n    box-shadow:0 6px 0 #A8760A, 0 10px 20px rgba(0,0,0,.25); cursor:pointer; touch-action:manipulation; margin:6px; }\n  .btn.alt{ background:linear-gradient(#FFFFFF,#E6E0F0); color:#2A2433; box-shadow:0 6px 0 #8C8499; }\n  .btn:active{ transform:translateY(4px); box-shadow:0 2px 0 #A8760A; }\n  .btn:focus-visible,.stage:focus-visible,.perk:focus-visible,.card:focus-visible{ outline:4px solid #fff; outline-offset:3px; }\n  .hint{ margin-top:18px; font-size:15px; font-weight:800; opacity:.95; max-width:34ch; }\n  .mapwrap{ width:100%; max-width:460px; margin:auto 0; }\n  .stagegrid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }\n  @media (min-width:560px){ .stagegrid{ grid-template-columns:repeat(5,minmax(0,1fr)); } }\n  .stage{ position:relative; display:flex; flex-direction:column; align-items:center; gap:2px; text-align:center; border:0; border-radius:14px; padding:6px 4px 4px; cursor:pointer; color:#2A2433;\n    background:#fff; box-shadow:0 3px 0 rgba(0,0,0,.25); font-family:\"Nunito Sans\",sans-serif; overflow:hidden; }\n  .stage .no{ position:absolute; left:4px; top:4px; width:22px; height:22px; border-radius:8px; display:grid; place-items:center; font-family:\"Lilita One\",sans-serif; font-size:13px; color:#fff; }\n  .stage img{ width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid #E2D6C2; flex:none; }\n  .stage b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:11.5px; line-height:1.15; display:block; }\n  .stage .stars{ font-size:11px; color:#F5B820; white-space:nowrap; }\n  .stage.locked{ opacity:.55; cursor:default; }\n  .perks{ background:rgba(255,255,255,.14); border-radius:16px; padding:10px; margin-top:6px; }\n  .perks h3{ font-family:\"Lilita One\",sans-serif; font-weight:400; margin:0 0 6px; font-size:19px; }\n  .perk{ display:flex; flex-direction:column; align-items:center; gap:1px; border:0; border-radius:12px; background:#fff; color:#2A2433; padding:7px 5px; margin:0; cursor:pointer; text-align:center; font-family:\"Nunito Sans\",sans-serif; font-weight:800; }\n  .perk b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:12px; line-height:1.1; }\n  .perk em{ font-style:normal; font-size:9.5px; color:#7A4E12; }\n  .perk small{ display:block; font-size:9.5px; font-weight:700; color:#4A4453; line-height:1.2; margin-top:1px; }\n  .perk small.now{ color:#3E8A26; }\n  .perk>span{ font-size:11px; margin-top:3px; }\n  .perk b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:16px; display:block; }\n  .perk small{ font-weight:800; font-size:12px; color:#6B6358; }\n  .perk span{ font-family:\"Lilita One\",sans-serif; white-space:nowrap; }\n  .perk.max{ opacity:.6; cursor:default; }\n  .bigstars{ font-size:44px; color:#FFD34D; letter-spacing:6px; text-shadow:0 3px 0 #8A5A0A; margin-bottom:8px; }\n  .bigstars .dim{ color:rgba(255,255,255,.25); text-shadow:none; }\n  #zoom{ position:absolute; right:10px; top:44%; display:flex; flex-direction:column; gap:8px; pointer-events:auto; }\n  .zbtn{ width:44px; height:44px; border-radius:50%; border:2px solid rgba(255,255,255,.9); background:rgba(31,28,40,.72); color:#fff; font-family:\"Lilita One\",sans-serif; font-size:24px; line-height:1; cursor:pointer; touch-action:manipulation; }\n  .zbtn:active{ transform:scale(.92); }\n  #callWave{ position:absolute; right:10px; bottom:calc(env(safe-area-inset-bottom) + 18px); pointer-events:auto; font-family:\"Lilita One\",sans-serif; font-size:17px; color:#3A2600;\n    background:linear-gradient(#FFE06B,#F5B820); border:0; border-radius:14px; padding:9px 14px; box-shadow:0 5px 0 #A8760A, 0 8px 16px rgba(0,0,0,.25); cursor:pointer; touch-action:manipulation; display:none; }\n  #callWave small{ display:block; font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:11px; color:#6B4A0A; }\n  #callWave:active{ transform:translateY(3px); box-shadow:0 2px 0 #A8760A; }\n  #pauseBtn{ position:absolute; right:12px; top:calc(env(safe-area-inset-top) + 126px); width:44px; height:44px; border-radius:50%; border:0; padding:0;\n    background:rgba(42,36,51,.72); color:#fff; font-size:17px; pointer-events:auto; cursor:pointer; display:none; touch-action:manipulation; z-index:12; }\n  #pauseBtn:active{ transform:scale(.93); }\n  #pausedTag{ position:absolute; left:50%; transform:translateX(-50%); top:calc(env(safe-area-inset-top) + 104px); display:none; pointer-events:none; z-index:12;\n    font-family:\"Lilita One\",sans-serif; font-size:22px; color:#fff; background:rgba(42,36,51,.72); border-radius:999px; padding:4px 18px; text-shadow:0 2px 0 rgba(0,0,0,.4); }\n  #pausedTag.show{ display:block; }\n  #sky2Btn{ position:absolute; right:106px; bottom:calc(env(safe-area-inset-bottom) + 100px); width:74px; height:74px; border-radius:50%; border:0; padding:3px; pointer-events:auto; cursor:pointer; display:none;\n    background:conic-gradient(var(--c,#9FD8FF) var(--p,0%), rgba(26,22,34,.62) 0); box-shadow:0 5px 0 rgba(0,0,0,.34), 0 0 0 3px rgba(245,184,32,.92), 0 0 18px var(--glow,rgba(0,0,0,0)); color:#fff; font-family:\"Lilita One\",sans-serif; -webkit-tap-highlight-color:transparent; }\n  #sky2Btn.show{ display:block; }\n  #sky2Btn .skyface{ width:100%; height:100%; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0px;\n    background:radial-gradient(circle at 50% 26%, var(--c2,#5A86C8) 0%, #2A2433 74%); box-shadow:inset 0 -5px 0 rgba(0,0,0,.38), inset 0 3px 9px rgba(255,255,255,.2); }\n  #sky2Btn .skyico{ font-size:28px; line-height:1.05; filter:drop-shadow(0 2px 0 rgba(0,0,0,.5)) drop-shadow(0 0 8px var(--c,#9FD8FF)); }\n  #sky2Btn small{ font-size:8.5px; letter-spacing:.7px; color:#FFE9A8; text-shadow:0 1px 0 rgba(0,0,0,.65); }\n  #sky2Btn.ready{ animation:skyPulse 1.7s ease-in-out infinite; }\n  @keyframes skyPulse{ 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.075) } }\n  #sky2Btn:disabled .skyface{ filter:grayscale(.55) brightness(.76); }\n  #ultBtn{ position:absolute; right:12px; bottom:calc(env(safe-area-inset-bottom) + 92px); width:84px; height:84px; border-radius:50%; border:0; padding:0; pointer-events:auto; cursor:pointer;\n    background:conic-gradient(#FFD34D var(--p,0%), rgba(31,28,40,.55) 0); box-shadow:0 5px 0 rgba(0,0,0,.3); display:none; touch-action:manipulation; }\n  #ultBtn img{ width:64px; height:64px; border-radius:50%; object-fit:cover; display:block; margin:10px auto 0; filter:grayscale(.75) brightness(.8); }\n  #ultBtn small{ position:absolute; left:0; right:0; bottom:-2px; font-family:\"Lilita One\",sans-serif; font-size:12px; color:#fff; text-shadow:0 2px 0 rgba(0,0,0,.6); }\n  #ultBtn.ready{ animation:ultpulse 1.2s ease-in-out infinite; }\n  #ultBtn.ready img{ filter:none; }\n  #ultBtn:active{ transform:scale(.94); }\n  @keyframes ultpulse{ 50%{ box-shadow:0 5px 0 rgba(0,0,0,.3), 0 0 0 8px rgba(255,211,77,.35) } }\n  #armBtn{ position:absolute; left:10px; bottom:calc(env(safe-area-inset-bottom) + 18px); pointer-events:auto; font-family:\"Lilita One\",sans-serif; font-size:17px; color:#fff;\n    background:linear-gradient(#5AA8F0,#2F6FC0); border:0; border-radius:14px; padding:11px 14px; box-shadow:0 5px 0 #1D4E8C, 0 8px 16px rgba(0,0,0,.25); cursor:pointer; touch-action:manipulation; display:none; }\n  #armBtn.dim{ filter:grayscale(.6); opacity:.8; }\n  #armBtn:active{ transform:translateY(3px); box-shadow:0 2px 0 #1D4E8C; }\n  #lefttop{ display:flex; gap:6px; align-items:flex-start; }\n  #avatar{ width:44px; height:44px; border-radius:12px; border:2px solid #fff; box-shadow:0 2px 0 rgba(0,0,0,.25); object-fit:cover; }\n  #roster{ display:flex; gap:4px; }\n  #roster span{ position:relative; display:inline-block; }\n  #roster img{ width:28px; height:28px; border-radius:8px; border:2px solid #fff; object-fit:cover; display:block; }\n  #roster b{ position:absolute; right:-4px; bottom:-5px; background:#2A2433; color:#fff; border-radius:8px; font-size:11px; padding:0 4px; font-family:\"Lilita One\",sans-serif; font-weight:400; }\n  #breakCard{ position:absolute; left:50%; top:calc(env(safe-area-inset-top) + 142px); transform:translateX(-50%) translateY(-8px); width:min(86vw,340px); background:rgba(255,252,245,.97); color:#2A2433;\n    border-radius:16px; padding:10px 14px; text-align:center; box-shadow:0 6px 20px rgba(0,0,0,.25); opacity:0; transition:opacity .3s, transform .3s; }\n  #breakCard.show{ opacity:1; transform:translateX(-50%); }\n  #breakCard h4{ margin:0; font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:20px; color:#7A4E12; }\n  #breakCard .coins{ display:flex; justify-content:center; gap:14px; margin:6px 0 4px; font-family:\"Lilita One\",sans-serif; font-size:18px; }\n  #breakCard .coins i{ display:inline-block; width:16px; height:16px; border-radius:50%; background:var(--gold); box-shadow:inset 0 -2px 0 var(--gold-deep); vertical-align:-2px; margin-right:4px; }\n  #breakCard .foes{ font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:12px; color:#6B6358; display:flex; align-items:center; justify-content:center; gap:6px; }\n  #breakCard .foes img{ width:26px; height:26px; border-radius:50%; border:2px solid #C62828; object-fit:cover; }\n  #intro img{ width:118px; height:118px; border-radius:50%; border:4px solid #fff; box-shadow:0 0 0 4px #C62828, 0 10px 24px rgba(0,0,0,.35); object-fit:cover; display:block; margin:0 auto 8px; }\n  #bossbar img{ width:30px; height:30px; border-radius:50%; border:2px solid #fff; vertical-align:middle; margin-right:6px; object-fit:cover; }\n  .stage img{ width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid #E2D6C2; flex:0 0 46px; }\n  .heroart{ width:120px; height:120px; border-radius:50%; border:4px solid #fff; box-shadow:0 8px 20px rgba(0,0,0,.3); object-fit:cover; margin-bottom:10px; }\n  .coinTable{ box-sizing:border-box; background:rgba(255,252,245,.96); color:#2A2433; border-radius:14px; padding:10px 14px; width:100%; max-width:380px; margin:0 auto 12px; font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:14px; text-align:left; }\n  .coinTable div{ display:flex; justify-content:space-between; padding:3px 0; }\n  .coinTable .tot{ border-top:2px dashed #E2D6C2; margin-top:4px; padding-top:6px; font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:19px; color:#7A4E12; }\n  .shopgrid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }\n  @media (min-width:560px){ .shopgrid{ grid-template-columns:repeat(4,minmax(0,1fr)); } }\n  .shopgrid .perk{ margin:0; flex-direction:column; align-items:flex-start; min-width:0; }\n  .shopgrid .perk span{ white-space:normal; }\n  .endwrap{ width:100%; max-width:460px; margin:auto 0; }\n  .homebar{ display:flex; justify-content:space-between; align-items:center; gap:8px; background:rgba(255,252,245,.96); color:#2A2433; border-radius:16px; padding:8px 12px; margin-bottom:6px; box-shadow:0 4px 0 rgba(0,0,0,.25); }\n  .homehero{ display:flex; align-items:center; gap:10px; text-align:left; }\n  .homehero small{ display:block; font-weight:800; font-size:11px; color:#6B6358; }\n  .homehero b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:18px; }\n  .homehero .spr{ height:58px; }\n  .wallet{ display:flex; flex-direction:column; gap:3px; align-items:flex-end; font-family:\"Lilita One\",sans-serif; font-size:18px; }\n  .wallet span{ background:#2A2433; color:#fff; border-radius:999px; padding:2px 12px; }\n  .homemsg{ min-height:0; font-weight:800; font-size:14px; color:#FFE27A; text-shadow:0 2px 0 rgba(0,0,0,.4); margin:2px 0 4px; }\n  #map,#end{ justify-content:flex-start; }\n  .tabs{ display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:8px; position:sticky; top:-18px; z-index:3; padding:8px 0; background:linear-gradient(rgba(60,40,70,.92),rgba(60,40,70,.75)); border-radius:12px; }\n  .tab{ font-family:\"Lilita One\",sans-serif; font-size:15px; border:0; border-radius:12px; padding:9px 4px; background:rgba(255,255,255,.25); color:#fff; cursor:pointer; touch-action:manipulation; }\n  .tab.on{ background:#FFE06B; color:#3A2600; box-shadow:0 3px 0 #A8760A; }\n  .tabpane.hide{ display:none; }\n  .panehint{ font-size:13px; margin:6px 0 0; max-width:none; }\n  .cardlist{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }\n  @media (min-width:560px){ .cardlist{ grid-template-columns:repeat(4,minmax(0,1fr)); } }\n  .hcard{ position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:1px; background:#fff; color:#2A2433; border-radius:14px; padding:6px 4px 5px; text-align:center; box-shadow:0 3px 0 rgba(0,0,0,.22); border:2px solid transparent; }\n  .hcard.eq{ border-color:#5CC23F; }\n  .hcard .spr{ height:62px; max-width:100%; }\n  .hcard b{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:12px; line-height:1.15; }\n  .rtag{ display:inline-block; font-size:8px; font-weight:800; color:#fff; border-radius:5px; padding:0 5px; margin:1px 0 2px; text-transform:uppercase; letter-spacing:.4px; }\n  .rtag.Starter{ background:#8C8499 } .rtag.Rare{ background:#3E8FD6 } .rtag.Epic{ background:#8E4FD6 } .rtag.Legendary{ background:#E0A21A } .rtag.Mythic{ background:linear-gradient(90deg,#D8342C,#8E4FD6) }\n  .rdot{ position:absolute; left:5px; top:5px; width:9px; height:9px; border-radius:50%; }\n  .rdot.Starter{ background:#8C8499 } .rdot.Rare{ background:#3E8FD6 } .rdot.Epic{ background:#8E4FD6 } .rdot.Legendary{ background:#E0A21A } .rdot.Mythic{ background:linear-gradient(90deg,#D8342C,#8E4FD6) }\n  .hcard .rar{ display:inline-block; font-size:10px; font-weight:800; color:#fff; border-radius:6px; padding:1px 6px; margin-left:4px; vertical-align:2px; text-transform:uppercase; letter-spacing:.5px; }\n  .rar.Starter{ background:#8C8499; } .rar.Rare{ background:#3E8FD6; } .rar.Epic{ background:#8E4FD6; } .rar.Legendary{ background:#E0A21A; } .rar.Mythic{ background:linear-gradient(90deg,#D8342C,#8E4FD6); }\n  .hcard small{ display:block; font-size:9.5px; font-weight:700; color:#4A4453; line-height:1.2; }\n  .hcard .atk{ color:#2A2433; margin:1px 0 2px; }\n  .hcard .pas{ color:#3E8A26; }\n  .hcard .nums{ color:#8A7F72; font-size:9px; margin-top:1px; }\n  .hcard .pas{ color:#3E8A26; font-weight:800; }\n  .stat{ display:grid; grid-template-columns:34px 1fr; align-items:center; gap:4px; font-size:10px; font-weight:800; color:#6B6358; margin-top:2px; }\n  .stat i{ display:block; height:6px; background:#EEE7DA; border-radius:4px; overflow:hidden; }\n  .stat i::after{ content:\"\"; display:block; height:100%; width:var(--v); background:linear-gradient(90deg,#F5B820,#E0701A); }\n  .hbtn{ width:100%; font-family:\"Lilita One\",sans-serif; font-size:11.5px; border:0; border-radius:10px; padding:5px 3px; cursor:pointer; touch-action:manipulation; margin-top:3px; line-height:1.15; }\n  .hbtn.buy{ background:linear-gradient(#FFE06B,#F5B820); color:#3A2600; box-shadow:0 4px 0 #A8760A; }\n  .hbtn.buy.poor{ filter:grayscale(.5); opacity:.75; }\n  .hbtn.equip{ background:linear-gradient(#7BE35A,#43A62A); color:#fff; box-shadow:0 4px 0 #2E7A1C; }\n  .hbtn.eqd,.hbtn.own{ background:#EEE7DA; color:#6B6358; cursor:default; }\n  .hbtn.lock{ background:#D9D3E0; color:#6B6358; cursor:default; font-size:12px; }\n  .hbtn:active:not([disabled]){ transform:translateY(3px); box-shadow:none; }\n  .spr{ background-size:300% 100%; background-repeat:no-repeat; background-position:0 0; animation:sprwalk 1.05s steps(3) infinite; }\n  @keyframes sprwalk{ to{ background-position:150% 0; } }\n  #auth{ position:fixed; inset:0; z-index:26; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center; gap:10px;\n    background:linear-gradient(180deg, rgba(255,240,248,.10) 0%, rgba(31,28,40,.62) 55%, rgba(31,28,40,.88) 100%); background-size:cover; background-position:center; color:#fff; }\n  #auth.hide{ display:none; }\n  #auth h2{ font-family:\"Lilita One\",sans-serif; font-weight:400; font-size:30px; margin:0; text-shadow:0 3px 0 rgba(0,0,0,.4); }\n  #auth p{ font-size:14px; font-weight:800; max-width:32ch; margin:0 0 4px; }\n  #auth input{ width:min(88vw,320px); font-size:16px; font-family:\"Nunito Sans\",sans-serif; font-weight:800; padding:12px 14px; border-radius:12px; border:0; box-shadow:0 3px 0 rgba(0,0,0,.25); }\n  #authMsg{ min-height:20px; font-weight:800; font-size:13px; color:#FFE27A; max-width:34ch; }\n  .authrow{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }\n  #acctBtn{ font-family:\"Lilita One\",sans-serif; font-size:13px; border:0; border-radius:10px; padding:6px 10px; background:#2A2433; color:#fff; cursor:pointer; }\n  .cloud{ font-size:11px; font-weight:800; color:#6B6358; }\n  #streamTag{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom) + 10px); z-index:30; display:none; pointer-events:none;\n    font-family:\"Nunito Sans\",sans-serif; font-weight:800; font-size:12px; color:#fff; background:rgba(42,36,51,.8); border-radius:999px; padding:5px 14px; }\n  #grade{ position:fixed; inset:0; pointer-events:none; z-index:6; mix-blend-mode:soft-light; opacity:0; transition:opacity .6s, background .6s; }\n  #vig{ position:fixed; inset:0; pointer-events:none; z-index:7; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,.34) 100%); opacity:0; transition:opacity .6s; }\n  #err{ position:fixed; inset:0; display:none; align-items:center; justify-content:center; padding:24px; text-align:center; z-index:50; background:#CFE9F5; color:#1F2B22; font-weight:800; }\n";document.head.appendChild(st);var w=document.createElement('div');w.innerHTML="\n<div id=\"game\"></div>\n<div id=\"touch\"></div>\n<div id=\"labels\"></div>\n<div id=\"nums\"></div>\n<div id=\"joy\"><div id=\"knob\"></div></div>\n<div id=\"hud\">\n  <div id=\"topbar\">\n    <div id=\"lefttop\"><img id=\"avatar\" alt=\"Hero\"><div><div id=\"wave\"><span id=\"waveTitle\">Stage 1</span><small id=\"waveNext\">Get ready</small></div><div id=\"roster\" style=\"margin-top:5px\"></div></div></div>\n    <div id=\"res\">\n      <div class=\"pill\" id=\"coinPill\"><i></i><span id=\"coinTxt\">0</span></div>\n      <div class=\"pill ing\" id=\"ingPill\" style=\"display:none\"><i></i><span id=\"ingTxt\">0</span></div>\n      <div class=\"pill sq\" id=\"sqPill\"><i>\u2694\ufe0f</i><span id=\"sqTxt\">0/10</span></div>\n    </div>\n  </div>\n  <div id=\"keepbar\">Castle<div class=\"bar\"><div class=\"fill\" id=\"keepFill\"></div></div></div>\n  <div id=\"bossbar\"><img id=\"bossImg\" alt=\"\"><span id=\"bossName\">Boss</span><div class=\"bar\"><div class=\"fill\" id=\"bossFill\"></div></div></div>\n  <div id=\"toast\"></div>\n  <div id=\"breakCard\"></div>\n  <div id=\"intro\"><img id=\"introImg\" alt=\"\"><small>STAGE BOSS</small><div id=\"introName\"></div></div>\n  <div id=\"zoom\"><button class=\"zbtn\" id=\"audioBtn\" aria-label=\"Cycle music and sound\" style=\"font-size:18px\">\ud83c\udfb5</button><button class=\"zbtn\" id=\"zIn\" aria-label=\"Zoom in\">+</button><button class=\"zbtn\" id=\"zOut\" aria-label=\"Zoom out\">\u2212</button></div>\n  <button id=\"armBtn\" aria-label=\"Open armory upgrades\">\ud83d\udee1\ufe0f Upgrades</button>\n  <button id=\"pauseBtn\" aria-label=\"Pause the game\">\u23f8</button>\n  <div id=\"pausedTag\">Paused</div>\n  <button id=\"ultBtn\" aria-label=\"Use hero special attack\"><img alt=\"\"><small>READY</small></button>\n  <button id=\"sky2Btn\" aria-label=\"Use second special attack from the sky\"><span class=\"skyface\"><span class=\"skyico\">\u2604</span><small>SKY</small></span></button>\n  <button id=\"callWave\" aria-label=\"Call the next wave early\">Call wave<small></small></button>\n</div>\n<div id=\"armory\" role=\"dialog\" aria-label=\"Armory upgrades\">\n  <header style=\"display:flex;justify-content:space-between;align-items:center;font-size:15px;padding:0 4px\"><div>Upgrades<small style=\"font-size:10px\">Game paused \u00b7 tap a group, then an upgrade</small></div><button class=\"x\" id=\"armClose\" style=\"width:30px;height:30px;font-size:15px\" aria-label=\"Close upgrades\">\u2715</button></header>\n  <div id=\"armBody\"></div>\n</div>\n\n<div id=\"auth\" class=\"hide\">\n  <h2>Goldstack Keep</h2>\n  <p id=\"authIntro\">Log in to keep your heroes, coins and stage progress on any device.</p>\n  <input id=\"authEmail\" type=\"email\" autocomplete=\"email\" placeholder=\"Email\" aria-label=\"Email\">\n  <input id=\"authPass\" type=\"password\" autocomplete=\"current-password\" placeholder=\"Password (6+ characters)\" aria-label=\"Password\">\n  <div id=\"authMsg\"></div>\n  <div class=\"authrow\"><button class=\"btn\" id=\"loginBtn\">Log in</button><button class=\"btn alt\" id=\"signupBtn\">Create account</button></div>\n  <button class=\"btn alt\" id=\"guestBtn\" style=\"font-size:18px\">Play as guest</button>\n</div>\n<div id=\"cardPick\"><h3>Choose a battle card</h3><p>One is yours for the rest of this run</p><div id=\"cardRow\"></div></div>\n<div id=\"streamTag\"></div><div id=\"grade\"></div><div id=\"vig\"></div>\n<div class=\"screen\" id=\"title\">\n  <img class=\"heroart\" id=\"titleHero\" alt=\"Hero portrait\">\n  <h1>Goldstack<br>Keep</h1>\n  <p>Carry the gold. Raise the wall. Defend five lands from the oni horde.</p>\n  <button class=\"btn\" id=\"startBtn\">Begin</button>\n  <div class=\"hint\">Drag to move. Tap your hero portrait (bottom right) to unleash a special attack. Pinch or use the + and \u2212 buttons to zoom. Stand on a pad to build, stand in the Armory to upgrade weapons, and tap Call wave to fight sooner for bonus coins.</div>\n</div>\n<div class=\"screen hide\" id=\"map\">\n  <div class=\"mapwrap\">\n    <div class=\"homebar\">\n      <div class=\"homehero\"><div class=\"spr\" id=\"homeHeroSpr\"></div><div><small>Your hero</small><b id=\"homeHeroName\">Ronin Archer</b></div></div>\n      <div><div class=\"wallet\"><span title=\"Treasury coins\">\ud83e\ude99 <b id=\"walCoins\">0</b></span><span title=\"Spirit Jade\">\ud83d\udca0 <b id=\"walJade\">0</b></span></div><div class=\"cloud\" id=\"cloudTxt\" style=\"text-align:right;margin-top:4px\"></div><div style=\"text-align:right;margin-top:3px\"><button id=\"acctBtn\">Sign in</button></div></div>\n    </div>\n    <div id=\"homeMsg\" class=\"homemsg\"></div>\n    <div class=\"tabs\" role=\"tablist\">\n      <button class=\"tab on\" data-tab=\"stages\" role=\"tab\">Stages</button><button class=\"tab\" data-tab=\"heroes\" role=\"tab\">Heroes</button><button class=\"tab\" data-tab=\"recruits\" role=\"tab\">Recruits</button><button class=\"tab\" data-tab=\"camp\" role=\"tab\">War Camp</button>\n    </div>\n    <div class=\"tabpane\" id=\"tab-stages\"><div id=\"stageList\"></div><p class=\"panehint\">Win stages to earn \ud83e\ude99 coins and \ud83d\udca0 Spirit Jade.</p></div>\n    <div class=\"tabpane hide\" id=\"tab-heroes\"><div id=\"heroList\" class=\"cardlist\"></div></div>\n    <div class=\"tabpane hide\" id=\"tab-recruits\"><div id=\"unitList\" class=\"cardlist\"></div></div>\n    <div class=\"tabpane hide\" id=\"tab-camp\"><div class=\"perks\"><h3>Permanent upgrades: <span id=\"honorTxt\">0</span> coins</h3><div id=\"perkList\" class=\"shopgrid\"></div></div></div>\n  </div>\n</div>\n<div class=\"screen hide\" id=\"end\">\n  <div class=\"endwrap\">\n  <h1 id=\"endTitle\">Victory</h1>\n  <div class=\"bigstars\" id=\"endStars\"></div>\n  <div class=\"stats\" id=\"endStats\"></div>\n  <div class=\"coinTable\" id=\"endCoins\"></div>\n  <div><button class=\"btn\" id=\"nextBtn\">Next stage</button><button class=\"btn alt\" id=\"retryBtn\">Retry</button><button class=\"btn alt\" id=\"mapBtn\">Home</button></div>\n  <div class=\"perks\"><h3>War Camp upgrades: <span id=\"endTreas\">0</span> treasury coins</h3><div id=\"endShop\" class=\"shopgrid\"></div></div>\n  </div>\n</div>\n<div id=\"err\">The game couldn't load its 3D engine. Check your connection and reopen the page.</div>\n\n";var l=document.getElementById('boot');if(l)l.remove();while(w.firstChild)document.body.appendChild(w.firstChild);})();
(function(){
'use strict';
if(!window.THREE){ document.getElementById('err').style.display='flex'; return; }
const T = THREE;
const SPR=(window.GKA&&GKA.SPR)||{};
const SPR_AR=(window.GKA&&GKA.SPR_AR)||{};
const ANIM=(window.GKA&&GKA.ANIM)||{};
const ANIM_META=(window.GKA&&GKA.ANIM_META)||{};
const ART=(window.GKA&&GKA.ART)||{};

/* ================================================================ data */
const KEEP = {x:0, z:-1};
const SQUAD_SPEED = 2; // hero and squad movement multiplier
const CFG = { heroSpeed:5.6, heroHp:260, heroRange:7.5, heroDmg:18, heroCd:0.5,
  towerRange:9.5, towerDmg:18.72, towerCd:0.95, tower2Dmg:28.6, tower2Cd:0.62,
  keepHp:1100, fenceHp:420, coinStep:0.11, ingotStep:0.18, stackCap:360, pickupR:2.7, arrowSpeed:30, cpBase:10, cpBanner:8 };

const CLS = {
  archer:  {name:'Archer',  cp:1, hp:34,  speed:6.2, range:7,   dmg:13, cd:0.85, train:3.5, order:1},
  samurai: {name:'Samurai', cp:2, hp:120, speed:6.6, range:1.2, dmg:17, cd:0.75, train:5,   order:3},
  onmyoji: {name:'Onmyoji', cp:2, hp:30,  speed:5.6, range:8,   dmg:15, cd:1.7,  train:6,   order:0, aoe:1.7},
  ninja:   {name:'Ninja',   cp:2, hp:48,  speed:8.5, range:1.0, dmg:24, cd:1.3,  train:6,   order:2, crit:0.3},
  oniw:    {name:'Oni Warrior', cp:3, hp:280, speed:6.0, range:1.5, dmg:34, cd:1.15, train:7, order:4},
  yari:    {name:'Yari Spearman', cp:2, hp:150, speed:6.2, range:2.4, dmg:22, cd:0.9,  train:4.5, order:3},
  teppo:   {name:'Teppo Gunner',  cp:2, hp:46,  speed:5.6, range:9.5, dmg:38, cd:2.1,  train:6, order:1},
  sohei:   {name:'Sohei Monk',    cp:3, hp:320, speed:5.8, range:2.0, dmg:28, cd:1.0,  train:7, order:4},
  miko:    {name:'Miko Priestess',cp:2, hp:40,  speed:5.8, range:7.5, dmg:10, cd:2.0,  train:6, order:0, heal:14},
  tanuki:  {name:'Tanuki Bomber', cp:2, hp:60,  speed:6.0, range:8,   dmg:26, cd:2.2,  train:6, order:1, aoe:2.6},
  sumo:    {name:'Sumo Wrestler', cp:3, hp:420, speed:5.2, range:1.8, dmg:30, cd:1.1,  train:8, order:5, knock:3.2},
  kabuki:  {name:'Kabuki Dancer', cp:2, hp:70,  speed:6.2, range:7,   dmg:20, cd:1.8,  train:6, order:0, aoe:3.2, rally:0.15},
  falcon:  {name:'Falconer',      cp:2, hp:50,  speed:6.4, range:11,  dmg:30, cd:1.5,  train:6, order:1},
  kusari:  {name:'Kusarigama',    cp:2, hp:120, speed:6.6, range:3.2, dmg:26, cd:0.85, train:5, order:3, pull:true},
  komainu: {name:'Komainu',       cp:2, hp:200, speed:7.4, range:1.6, dmg:32, cd:0.8,  train:6, order:4}
};
const EN = {
  bandit:{hp:40,  speed:2.3, dmg:6,  cd:1.0, rad:0.45, loot:[2,3], aggro:3.4},
  oni:   {hp:150, speed:1.7, dmg:15, cd:1.2, rad:0.8,  loot:[5,7], aggro:3.6},
  espear:  {hp:70,  speed:2.0, dmg:9,  cd:1.3, rad:0.7,  loot:[3,4], aggro:3.9, range:1.7},
  earcher: {hp:52,  speed:2.1, dmg:9,  cd:1.8, rad:0.75, loot:[3,5], aggro:7.6, range:7.0, proj:'arrow'},
  eshaman: {hp:95,  speed:1.8, dmg:16, cd:2.6, rad:0.85,  loot:[4,6], aggro:7.2, range:6.5, proj:'fire', aoe:1.7},
  eshield: {hp:900, speed:1.3, dmg:28, cd:1.5, rad:1.25, loot:[6,9], aggro:3.4, armor:0.45}
};
const BOSSES = {
  brute:   {name:'Aooni Brute',            hp:900,  speed:1.45, rad:1.3, h:4.0, slamR:3.0, patterns:['slam'],                                summon:null},
  akaoni:  {name:'Akaoni the Iron Club',   hp:1700, speed:1.5,  rad:1.5, h:5.2, slamR:3.4, patterns:['slam','slam','summon'],                summon:['bandit',3]},
  tengu:   {name:'Karasu Tengu',           hp:2400, speed:2.0,  rad:1.2, h:4.8, slamR:3.0, patterns:['dash','dash','summon'],                summon:['bandit',4]},
  kitsune: {name:'Kyubi the Nine-Tailed',  hp:3200, speed:1.7,  rad:1.2, h:5.0, slamR:3.0, patterns:['volley','blink','volley','summon'],    summon:['bandit',4]},
  yuki:    {name:'Yuki General Hyoga',     hp:4400, speed:1.4,  rad:1.4, h:5.2, slamR:3.4, patterns:['line','slam','line','summon'],        summon:['oni',2]},
  shogun:  {name:'Oni Shogun Rasetsu',     hp:6800, speed:1.3,  rad:1.8, h:6.3, slamR:4.2, patterns:['slam','donut','summon','line','volley'], summon:['oni',3]},
  kappa:   {name:'Kappa King',             hp:9000,  speed:1.5,  rad:1.5, h:5.4, slamR:3.6, patterns:['volley','line','summon','volley','slam'], summon:['bandit',5]},
  gasha:   {name:'Gashadokuro',            hp:12500, speed:1.2,  rad:2.0, h:7.2, slamR:4.6, patterns:['slam','line','summon','donut','slam'], summon:['oni',3]},
  raijin:  {name:'Raijin the Thunder God', hp:17000, speed:1.4,  rad:1.8, h:6.6, slamR:4.2, patterns:['volley','donut','dash','line','summon','slam','volley'], summon:['oni',4]},
  nue:     {name:'Nue the Storm Chimera',   hp:20000, speed:1.8, rad:1.6, h:5.2, slamR:3.6, patterns:['dash','volley','slam','summon','line'], summon:['oni',3]},
  ryujin:  {name:'Ryujin, Dragon of Tides', hp:24000, speed:1.6, rad:1.7, h:6.0, slamR:4.0, patterns:['line','donut','volley','summon','line'], summon:['bandit',6]},
  tsuchi:  {name:'Tsuchigumo',              hp:28000, speed:1.9, rad:1.7, h:5.0, slamR:3.8, patterns:['volley','dash','summon','slam','volley'], summon:['bandit',7]},
  nurari:  {name:'Nurarihyon, Yokai Lord',  hp:33000, speed:1.5, rad:1.3, h:5.0, slamR:3.6, patterns:['blink','volley','summon','donut','line'], summon:['oni',4]},
  orochi:  {name:'Yamata no Orochi',        hp:38000, speed:1.4, rad:2.0, h:6.4, slamR:4.4, patterns:['line','volley','slam','donut','summon','line'], summon:['oni',4]},
  namazu:  {name:'Namazu the Quakefish',    hp:44000, speed:1.5, rad:1.9, h:5.6, slamR:4.6, patterns:['slam','donut','slam','summon','volley'], summon:['oni',5]},
  mao:     {name:'Mao, the Demon Emperor',  hp:54000, speed:1.6, rad:1.9, h:6.6, slamR:4.4, patterns:['dash','slam','donut','volley','line','summon','slam','blink'], summon:['oni',5]},
  umibozu:   {name:'Umibozu, the Sea Spectre', hp:62000, speed:1.5, rad:1.8, h:6.2, slamR:4.6, patterns:['donut','line','slam','summon','volley'], summon:['oni',5]},
  kamaitachi:{name:'Kamaitachi, Wind Blades',  hp:70000, speed:2.4, rad:1.4, h:4.8, slamR:3.6, patterns:['dash','dash','volley','summon','line'], summon:['bandit',8]},
  daidara:   {name:'Daidarabotchi',            hp:80000, speed:1.2, rad:2.2, h:7.4, slamR:5.2, patterns:['slam','slam','donut','summon','line'], summon:['oni',6]},
  hannya:    {name:'Hannya, the Masked Queen', hp:92000, speed:1.7, rad:1.4, h:5.6, slamR:4.0, patterns:['blink','volley','line','summon','donut','volley'], summon:['oni',6]},
  mikaboshi: {name:'Amatsu Mikaboshi',         hp:110000,speed:1.7, rad:1.8, h:6.8, slamR:4.8, patterns:['volley','dash','donut','line','summon','slam','blink','volley'], summon:['oni',6]},
  ushioni: {name:'Ushi-oni, the Ox Demon',  hp:130000, speed:2.0, rad:1.9, h:6.0, slamR:4.4, patterns:['dash','slam','volley','summon','line','dash'], summon:['oni',6]},
  shuten:  {name:'Shuten-doji, the Oni King',hp:150000,speed:1.6, rad:2.0, h:6.6, slamR:5.0, patterns:['slam','donut','summon','line','slam','volley'], summon:['oni',7]},
  kirin:   {name:'Kirin of the Storm Peak', hp:172000, speed:2.2, rad:1.8, h:5.8, slamR:4.2, patterns:['dash','volley','line','donut','summon','volley'], summon:['bandit',9]},
  enma:    {name:'Enma-O, Judge of the Dead',hp:200000,speed:1.6, rad:1.7, h:6.4, slamR:4.6, patterns:['donut','volley','blink','line','summon','slam','volley'], summon:['oni',7]},
  susanoo: {name:'Susanoo, the Storm God',  hp:240000, speed:1.9, rad:1.9, h:6.8, slamR:5.0, patterns:['line','dash','donut','volley','slam','summon','blink','line'], summon:['oni',8]},
  jorogumo: {name:'Jorogumo, the Silk Courtesan', hp:280000, speed:2.1, rad:1.8, h:5.8, slamR:4.2, patterns:['volley','dash','summon','line','volley','slam'], summon:['bandit',10]},
  karura:   {name:'Karura, the Fire Garuda',      hp:320000, speed:2.3, rad:1.7, h:6.0, slamR:4.4, patterns:['dash','donut','volley','summon','line','dash'], summon:['oni',7]},
  kuzuryu:  {name:'Kuzuryu, the Nine-Headed',     hp:370000, speed:1.7, rad:2.1, h:6.4, slamR:4.8, patterns:['line','volley','donut','summon','line','slam'], summon:['oni',8]},
  izanami:  {name:'Izanami, Queen of Yomi',       hp:430000, speed:1.8, rad:1.6, h:6.2, slamR:4.6, patterns:['blink','volley','donut','summon','line','volley','slam'], summon:['oni',9]},
  tsukuyomi:{name:'Tsukuyomi, the Moon God',      hp:520000, speed:2.0, rad:1.8, h:6.6, slamR:5.0, patterns:['line','dash','donut','volley','blink','summon','slam','line'], summon:['oni',9]},
  raiju:    {name:'Raiju, the Thunder Beast', hp:300000, speed:2.6, rad:1.5, h:5.4, slamR:4.0, patterns:['dash','volley','dash','summon','line'], summon:['oni',7]},
  baku:     {name:'Baku, the Dream Eater',    hp:340000, speed:1.6, rad:1.9, h:5.2, slamR:4.4, patterns:['donut','slam','summon','volley','line'], summon:['oni',8]},
  onryo:    {name:'Onryo, the Vengeful Ghost',hp:380000, speed:2.0, rad:1.5, h:5.6, slamR:4.2, patterns:['blink','line','volley','summon','dash','donut'], summon:['bandit',10]},
  shachi:   {name:'Shachihoko, the Guardian', hp:420000, speed:1.9, rad:1.8, h:5.4, slamR:4.4, patterns:['line','donut','volley','summon','slam'], summon:['oni',8]},
  amaterasu:{name:'Amaterasu, the Sun Goddess',hp:560000,speed:1.9, rad:1.7, h:5.8, slamR:4.8, patterns:['volley','line','donut','blink','summon','slam','volley','line'], summon:['oni',10]},
  fujin:     {name:'Fujin, the Wind God',        hp:600000, speed:2.4, rad:1.8, h:5.8, slamR:4.6, patterns:['dash','line','volley','donut','summon','dash'], summon:['oni',10]},
  yukionna:  {name:'Yuki-onna, the Snow Woman',  hp:640000, speed:2.0, rad:1.6, h:5.8, slamR:4.4, patterns:['blink','volley','donut','line','summon','volley'], summon:['bandit',12]},
  benkei:    {name:'Benkei, the Warrior Monk',   hp:700000, speed:1.7, rad:1.9, h:6.0, slamR:5.0, patterns:['slam','line','dash','slam','summon','donut'], summon:['oni',10]},
  kagutsuchi:{name:'Kagutsuchi, the Fire God',   hp:760000, speed:2.2, rad:1.7, h:5.8, slamR:4.8, patterns:['donut','dash','volley','slam','summon','line'], summon:['oni',11]},
  izanagi:   {name:'Izanagi, the Creator God',   hp:900000, speed:1.9, rad:1.7, h:6.2, slamR:5.2, patterns:['line','volley','blink','donut','summon','slam','line','volley'], summon:['oni',12]},
  takemika:{name:'Takemikazuchi, the Thunder Sovereign', hp:1000000, speed:1.90, rad:1.9, h:12.4, slamR:8.4, super:true, patterns:['line','dash','volley','summon','donut','slam'], summon:['oni',14]},
  hachiman:{name:'Hachiman, the War God', hp:1060000, speed:1.80, rad:2.0, h:12.6, slamR:8.6, super:true, patterns:['slam','line','summon','dash','volley','donut'], summon:['oni',15]},
  bishamon:{name:'Bishamonten, the Guardian God', hp:1120000, speed:1.70, rad:2.0, h:12.6, slamR:8.8, super:true, patterns:['slam','donut','line','summon','volley','slam'], summon:['oni',15]},
  inari:{name:'Inari Daimyojin, the Fox God', hp:1180000, speed:2.10, rad:1.9, h:12.2, slamR:8.2, super:true, patterns:['blink','volley','summon','donut','line','blink'], summon:['oni',16]},
  saruta:{name:'Sarutahiko, the Crossroads Colossus', hp:1240000, speed:1.60, rad:2.2, h:13.0, slamR:9.2, super:true, patterns:['slam','dash','slam','summon','donut','line'], summon:['oni',16]},
  minaka:{name:'Ame-no-Minakanushi, Lord of Heaven', hp:1320000, speed:1.80, rad:2.0, h:12.8, slamR:8.8, super:true, patterns:['volley','line','blink','donut','summon','volley'], summon:['oni',17]},
  kunitoko:{name:'Kuninotokotachi, the World Pillar', hp:1400000, speed:1.50, rad:2.3, h:13.4, slamR:9.6, super:true, patterns:['slam','slam','donut','summon','dash','line'], summon:['oni',17]},
  yatono:{name:'Yato-no-Kami, the Serpent God', hp:1480000, speed:2.00, rad:2.1, h:12.8, slamR:8.8, super:true, patterns:['dash','volley','line','summon','donut','dash'], summon:['oni',18]},
  marishi:{name:'Marishiten, Goddess of Light and War', hp:1580000, speed:1.90, rad:2.0, h:12.8, slamR:9.0, super:true, patterns:['volley','line','donut','summon','slam','volley'], summon:['oni',18]},
  mioya:{name:'Ame-no-Mioya, the Sky Father', hp:1800000, speed:1.80, rad:2.2, h:13.6, slamR:9.8, super:true, patterns:['line','volley','blink','donut','summon','slam','line','dash'], summon:['oni',20]},
};
const STAGES = [
  {name:'Sakura Village', blurb:'Bandits raid the blossom valley', theme:'sakura',  lanes:[-38,36],            enemies:['bandit'],       mini:false, boss:'akaoni',  waves:12, hp:1.0},
  {name:'Bamboo Pass',    blurb:'A crow demon hunts the pass',     theme:'bamboo',  lanes:[-62,0,58],          enemies:['bandit'],       mini:true,  boss:'tengu',   waves:12, hp:1.25},
  {name:'Autumn Shrine',  blurb:'Foxfire burns among the maples',  theme:'autumn',  lanes:[-75,-10,60],        enemies:['bandit','oni'], mini:true,  boss:'kitsune', waves:12, hp:1.5},
  {name:'Frostpeak Fort', blurb:'The winter general marches',      theme:'snow',    lanes:[-88,-35,15,68],     enemies:['bandit','oni'], mini:true,  boss:'yuki',    waves:12, hp:1.8},
  {name:'Oni Citadel',    blurb:'Face the shogun of demons',       theme:'volcano', lanes:[-95,-48,0,48,95],   enemies:['bandit','oni'], mini:true,  boss:'shogun',  waves:12, hp:2.2},
  {name:'Kappa Marsh',    blurb:'River imps rise from the lotus swamp', theme:'swamp', lanes:[-80,-28,28,80],        enemies:['bandit','oni'], mini:true,  boss:'kappa',   waves:12, hp:2.6},
  {name:'Bone Temple',    blurb:'A giant skeleton haunts the old shrine', theme:'grave', lanes:[-95,-50,-5,40,90],    enemies:['bandit','oni'], mini:true,  boss:'gasha',   waves:12, hp:3.0},
  {name:'Raijin Sky Shrine', blurb:'Face the thunder god above the clouds', theme:'storm', lanes:[-100,-60,-20,20,60,100], enemies:['bandit','oni'], mini:true, boss:'raijin', waves:12, hp:3.5},
  {name:'Nue Mistwood',    blurb:'A chimera stalks the fog-bound forest', theme:'mist',   lanes:[-90,-40,10,60],          enemies:['bandit','oni'], mini:true, boss:'nue',    waves:12, hp:4.0},
  {name:'Ryujin Bay',      blurb:'The dragon god rises from the tide',    theme:'coast',  lanes:[-95,-45,5,55,100],       enemies:['bandit','oni'], mini:true, boss:'ryujin', waves:12, hp:4.5},
  {name:'Spider Hollow',   blurb:'Silk chokes the crystal caves',         theme:'cave',   lanes:[-85,-30,25,80],          enemies:['bandit','oni'], mini:true, boss:'tsuchi', waves:12, hp:5.0},
  {name:'Yokai Manor',     blurb:'The yokai lord holds court',            theme:'grave',  lanes:[-100,-55,-10,35,85],     enemies:['bandit','oni'], mini:true, boss:'nurari', waves:12, hp:5.6},
  {name:'Orochi Gorge',    blurb:'Eight heads guard the ravine',          theme:'volcano',lanes:[-95,-50,0,50,95],        enemies:['bandit','oni'], mini:true, boss:'orochi', waves:12, hp:6.2},
  {name:'Namazu Delta',    blurb:'The quake-fish thrashes the marsh',     theme:'swamp',  lanes:[-100,-60,-20,20,60,100], enemies:['bandit','oni'], mini:true, boss:'namazu', waves:12, hp:7.0},
  {name:'Eclipse Throne',  blurb:'The Demon Emperor waits beneath a broken moon', theme:'eclipse', lanes:[-100,-65,-30,5,40,75,105], enemies:['bandit','oni'], mini:true, boss:'mao', waves:12, hp:8.0},
  {name:'Drowned Coast',   blurb:'A faceless spectre walks out of the sea', theme:'coast', lanes:[-95,-50,-5,45,95],        enemies:['bandit','oni'], mini:true, boss:'umibozu',    waves:12, hp:9.0},
  {name:'Sickle Wind Pass',blurb:'Blades ride the wind through the fog',    theme:'mist',  lanes:[-100,-60,-20,20,60,100],  enemies:['bandit','oni'], mini:true, boss:'kamaitachi', waves:12, hp:10.0},
  {name:'Giant Steps',     blurb:'A mountain walks toward your castle',     theme:'storm', lanes:[-90,-45,0,45,90],         enemies:['bandit','oni'], mini:true, boss:'daidara',    waves:12, hp:11.0},
  {name:'Hannya Palace',   blurb:'A masked queen burns with jealousy',      theme:'grave', lanes:[-100,-65,-30,5,40,75,105],enemies:['bandit','oni'], mini:true, boss:'hannya',     waves:12, hp:12.5},
  {name:'Starfall Void',   blurb:'The dark star god ends all things',       theme:'eclipse',lanes:[-105,-70,-35,0,35,70,105],enemies:['bandit','oni'], mini:true, boss:'mikaboshi',  waves:12, hp:14.0},
  {name:'Oxdemon Caverns', blurb:'Chains rattle in the deep dark',        theme:'cave',   lanes:[-95,-50,-5,45,95],         enemies:['bandit','oni'], mini:true, boss:'ushioni', waves:12, hp:16.0},
  {name:'Oni King Mountain',blurb:'Shuten-doji feasts above the clouds',   theme:'volcano',lanes:[-100,-60,-20,20,60,100],   enemies:['bandit','oni'], mini:true, boss:'shuten',  waves:12, hp:18.0},
  {name:'Kirin Heights',   blurb:'A divine beast guards the storm peak',   theme:'storm',  lanes:[-90,-50,-10,30,70,105],    enemies:['bandit','oni'], mini:true, boss:'kirin',   waves:12, hp:20.0},
  {name:'Hell Gate',       blurb:'The judge of the dead opens his court',  theme:'grave',  lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'enma',    waves:12, hp:23.0},
  {name:'Storm God Summit',blurb:'Susanoo himself bars the last road',     theme:'eclipse',lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'susanoo', waves:12, hp:26.0},
  {name:'Silk Garden',     blurb:'A spider courtesan spins her trap',  theme:'forest', lanes:[-95,-50,-5,45,95],         enemies:['bandit','oni'], mini:true, boss:'jorogumo',  waves:12, hp:30.0},
  {name:'Ember Sky Temple',blurb:'A fire garuda circles the ruins',    theme:'ember',  lanes:[-100,-60,-20,20,60,100],   enemies:['bandit','oni'], mini:true, boss:'karura',    waves:12, hp:34.0},
  {name:'Nine Dragon Falls',blurb:'Nine heads rise from the cataract', theme:'coast',  lanes:[-90,-50,-10,30,70,105],    enemies:['bandit','oni'], mini:true, boss:'kuzuryu',   waves:12, hp:38.0},
  {name:'Yomi Underworld', blurb:'The queen of the dead calls you in', theme:'temple', lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'izanami',   waves:12, hp:43.0},
  {name:'Moonlit Throne',  blurb:'The moon god waits at the end',      theme:'moon',   lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'tsukuyomi', waves:12, hp:50.0},
  {name:'Twin Thunder Ridge', blurb:'Two storm beasts hunt as a pair',   theme:'storm',  lanes:[-95,-50,-5,45,95],         enemies:['bandit','oni'], mini:true, boss:'raiju',     boss2:'kirin',     waves:12, hp:56.0},
  {name:'Dream Hollow',       blurb:'The dream eater walks with the dead',theme:'mist',   lanes:[-100,-60,-20,20,60,100],   enemies:['bandit','oni'], mini:true, boss:'baku',      boss2:'izanami',   waves:12, hp:62.0},
  {name:'Grudge Castle',      blurb:'A ghost and a demon queen hold the keep', theme:'grave', lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'onryo', boss2:'hannya', waves:12, hp:70.0},
  {name:'Golden Moat',        blurb:'Guardian and dragon defend the water',theme:'coast', lanes:[-100,-60,-20,20,60,100],   enemies:['bandit','oni'], mini:true, boss:'shachi',    boss2:'kuzuryu',   waves:12, hp:78.0},
  {name:'Sun and Moon',       blurb:'The sun goddess and the moon god, together', theme:'temple', lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'amaterasu', boss2:'tsukuyomi', waves:12, hp:90.0},
  {name:'Gale Summit',        blurb:'Wind and thunder gods strike together',  theme:'storm',  lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'fujin',      boss2:'raijin',    waves:12, hp:100.0},
  {name:'Whiteout Pass',      blurb:'The snow woman walks with the frost general', theme:'snow', lanes:[-100,-60,-20,20,60,100], enemies:['bandit','oni'], mini:true, boss:'yukionna',   boss2:'yuki',      waves:12, hp:110.0},
  {name:'Gojo Bridge',        blurb:'The warrior monk and the oni king bar the way', theme:'temple', lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'benkei', boss2:'shuten',    waves:12, hp:120.0},
  {name:'Burning Heavens',    blurb:'The fire god rides with the garuda',      theme:'ember',  lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'kagutsuchi', boss2:'karura',    waves:12, hp:130.0},
  {name:'Heavenly Bridge',    blurb:'The creator god and the queen of the dead, reunited', theme:'moon', lanes:[-105,-70,-35,0,35,70,105], enemies:['bandit','oni'], mini:true, boss:'izanagi', boss2:'izanami', waves:12, hp:150.0},
  {name:'Thunder Throne', blurb:'The Thunder Sovereign descends', theme:'storm', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'takemika', waves:13, hp:160},
  {name:'Banner Fields', blurb:'The War God answers the horn', theme:'autumn', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'hachiman', waves:13, hp:170},
  {name:'Pagoda of Jade', blurb:'The Guardian God bars the gate', theme:'temple', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'bishamon', waves:13, hp:180},
  {name:'Thousand Torii', blurb:'The Fox God walks the red road', theme:'sakura', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'inari', waves:13, hp:190},
  {name:'Crossroads of Stone', blurb:'The Colossus blocks every path', theme:'grave', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'saruta', waves:13, hp:200},
  {name:'Primordial Vault', blurb:'The Lord of Heaven opens his eyes', theme:'moon', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'minaka', waves:13, hp:215},
  {name:'World Pillar', blurb:'The Earth itself stands against you', theme:'cave', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'kunitoko', waves:13, hp:230},
  {name:'Serpent Shrine', blurb:'Eight heads, one hunger', theme:'swamp', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'yatono', waves:13, hp:245},
  {name:'Sunlight Keep', blurb:'The Goddess of Light and War', theme:'ember', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'marishi', waves:13, hp:260},
  {name:'Throne of Heaven', blurb:'The Sky Father, and the end of all roads', theme:'moon', lanes:[-108,-72,-36,0,36,72,108], enemies:['bandit','oni'], mini:true, boss:'mioya', waves:13, hp:280},
];
const THEMES = {
  sakura: {sky:0xCFE9F5, ground:0x78C35A, path:0xD8B784, court:0xCBAA72, hemiG:0x4E8A30, cliff:0x777C86, cap:0x6FB548, tree:'sakura',  amb:0xF7B6D2, stageCol:'#E86FA0'},
  bamboo: {sky:0xC9E6DA, ground:0x5E9F46, path:0xC4A874, court:0xBC9E6A, hemiG:0x3F7A2A, cliff:0x6B7470, cap:0x5E9F46, tree:'bamboo',  amb:0xA8D86E, stageCol:'#4E9A3A'},
  autumn: {sky:0xF3DDBB, ground:0xA9B04C, path:0xD0AA72, court:0xC49C66, hemiG:0x7A6A2A, cliff:0x857A70, cap:0xB9A044, tree:'maple',   amb:0xE8742B, stageCol:'#D9651E'},
  snow:   {sky:0xDDEBF5, ground:0xE9F1F6, path:0xBFCFDA, court:0xC9D6DF, hemiG:0x9FB3C2, cliff:0x8795A6, cap:0xF4F8FB, tree:'snowpine',amb:0xFFFFFF, stageCol:'#3E8FD6'},
  volcano:{sky:0xEDBB9E, ground:0x5C4B45, path:0x7E655A, court:0x6E5850, hemiG:0x4A2E25, cliff:0x3F3634, cap:0x6E3326, tree:'dead',    amb:0xFF8A2A, stageCol:'#A8322A'},
  swamp:  {sky:0xCFE3D8, ground:0x6E7A48, path:0x8C7A56, court:0x7E6E4E, hemiG:0x3F5A30, cliff:0x5F6B5A, cap:0x5E7A3A, tree:'willow',  amb:0xE8FF8A, stageCol:'#3E8A6E'},
  grave:  {sky:0xD9D0E6, ground:0x6E6878, path:0x8E8496, court:0x7A7282, hemiG:0x3E3450, cliff:0x4E4858, cap:0x5A4E6E, tree:'spooky',  amb:0xC58CFF, stageCol:'#6E4E9A'},
  storm:  {sky:0xC9D3E6, ground:0xB8C2D2, path:0xD8DDE6, court:0xC8CFDA, hemiG:0x6A7890, cliff:0x6E7890, cap:0xDDE6F2, tree:'stormpine',amb:0xDDEBFF, stageCol:'#2F4C8F'},
  mist:   {sky:0xC6D8CA, ground:0x53663F, path:0x7E7350, court:0x6E6748, hemiG:0x2E4428, cliff:0x5A6356, cap:0x46603A, tree:'cedar',     amb:0xD6E8C8, stageCol:'#3F6B3A'},
  coast:  {sky:0xDCEEF5, ground:0xE4D6A8, path:0xD8C48C, court:0xCDBA84, hemiG:0x9AA37A, cliff:0x8C93A0, cap:0xE0D2A4, tree:'coastpine', amb:0xBFF0FF, stageCol:'#2F8FA8'},
  cave:   {sky:0xBFB7CE, ground:0x5B5766, path:0x7A7286, court:0x6A6478, hemiG:0x2E2A3C, cliff:0x4A4556, cap:0x6A5E86, tree:'crystal',   amb:0xC58CFF, stageCol:'#6A4E8C'},
  eclipse:{sky:0xB08C9E, ground:0x3A3340, path:0x584C58, court:0x4A4250, hemiG:0x241E2E, cliff:0x2E2836, cap:0x5A2E3E, tree:'ashtree',   amb:0xFF6B6B, stageCol:'#8C2A3E'},
  forest: {sky:0xCFE2CE, ground:0x4E6B42, path:0x8A7A56, court:0x76684C, hemiG:0x2C4428, cliff:0x5E6858, cap:0x486A3C, tree:'cedar',   amb:0xD8F0B8, stageCol:'#2F6B3A'},
  ember:  {sky:0xF0C6A8, ground:0x6E4A3E, path:0x8E6A52, court:0x7A5A46, hemiG:0x5A2E22, cliff:0x4A3A34, cap:0x7A3A28, tree:'ashtree', amb:0xFF9A4A, stageCol:'#C25A2A'},
  temple: {sky:0xE6E0D2, ground:0x9A9484, path:0xB2A894, court:0xA69C88, hemiG:0x6A6454, cliff:0x8A8478, cap:0x9E9684, tree:'cedar',   amb:0xF6E8C8, stageCol:'#8A7A4E'},
  moon:   {sky:0xCFD6EA, ground:0x6E7690, path:0x8E96AE, court:0x7E86A0, hemiG:0x3E4660, cliff:0x5E6680, cap:0x8E96B8, tree:'crystal', amb:0xDCE6FF, stageCol:'#4E5A8C'}
};
const GRP=[['squad','Squad','⚔️'],['hero','Hero','🎌'],['tower','Towers','🗼'],['fence','Fences','🪵'],['castle','Castle','🏯'],['res','Resources','🪙']];
const UPG = [
  {grp:'hero', id:'h_guard', rep:true, max:12, name:'Hero Armour', desc:'+12% hero health', g:35, gs:20, i:0},
  {grp:'hero', id:'h_ult',   rep:true, max:10, name:'War Spirit', desc:'Special recharges 6% faster', g:45, gs:25, i:0},
  {grp:'tower',id:'t_range', rep:true, max:10, name:'Watch Posts', desc:'+8% tower range', g:40, gs:22, i:0},
  {grp:'tower',id:'t_cannon',rep:true, max:12, name:'Powder Kegs', desc:'+12% cannon damage and blast', g:45, gs:25, i:0},
  {grp:'fence',id:'f_hp',    rep:true, max:12, name:'Oak Palisade', desc:'+18% fence health, repairs fences', g:35, gs:20, i:0},
  {grp:'castle',id:'c_hp',   rep:true, max:12, name:'Castle Walls', desc:'+12% castle health, heals castle', g:40, gs:22, i:0},
  {grp:'res', id:'r_loot',   rep:true, max:12, name:'Spoils of War', desc:'+15% gold from defeated foes', g:40, gs:22, i:0},
  {grp:'squad', id:'m_arrow', br:'Mastery', rep:true, max:15, name:'Arrow Mastery', desc:'+8% damage for all arrows', g:40, gs:20, i:0},
  {grp:'squad', id:'m_vital', br:'Mastery', rep:true, max:15, name:'Squad Vitality', desc:'+10% health for your squad', g:40, gs:20, i:0},
  {grp:'hero', id:'m_hero',  br:'Mastery', rep:true, max:15, name:'Hero Might', desc:'+10% hero damage, +20 hero health', g:40, gs:25, i:0},
  {grp:'tower', id:'m_tower', br:'Mastery', rep:true, max:15, name:'Tower Drills', desc:'+10% tower fire rate', g:45, gs:25, i:0},
  {grp:'fence', id:'m_wall',  br:'Mastery', rep:true, max:15, name:'Stone Footings', desc:'+20% fence health, repairs fences', g:35, gs:20, i:0},
  {grp:'res', id:'m_rich',  br:'Mastery', rep:true, max:10, name:'Rich Veins', desc:'+25% mine gold and forge ingot output', g:50, gs:30, i:0},
  {grp:'castle', id:'m_repair',br:'Mastery', rep:true, max:999, name:'Castle Repair', desc:'Restore 25% castle health', g:30, gs:10, i:0},
  {grp:'squad', id:'steel1', br:'Steel',  name:'Tamahagane Tips',  desc:'+20% arrow damage',                  g:15, i:0},
  {grp:'squad', id:'steel2', br:'Steel',  req:'steel1', name:'Masterwork Heads', desc:'+20% arrow damage',     g:30, i:0},
  {grp:'squad', id:'steel3', br:'Steel',  req:'steel2', name:'Demon Piercer',    desc:'+30% damage, +25% vs bosses', g:20, i:4},
  {grp:'squad', id:'vol1',   br:'Volley', name:'Twin Nock',        desc:'Archers loose a 2nd arrow at another foe', g:20, i:0},
  {grp:'hero', id:'vol2',   br:'Volley', req:'vol1', att:['arrow','wind'], name:'Storm Bow',  desc:'Hero fires a 3-arrow spread',   g:35, i:0},
  {grp:'hero', id:'h_sweep', br:'Hero', att:['melee'],  name:'Whirlwind Edge', desc:'Sweeps hit a wider arc and strike twice', g:45, i:0},
  {grp:'hero', id:'h_edge',  br:'Hero', att:['blade'],  name:"Assassin's Edge", desc:'+15% critical chance and +60% critical damage', g:45, i:0},
  {grp:'hero', id:'h_orb',   br:'Hero', att:['orb','fox'], name:'Greater Talisman', desc:'+45% blast radius on hero orbs', g:45, i:0},
  {grp:'hero', id:'h_frost', br:'Hero', att:['ice'],    name:'Deep Freeze', desc:'Ice slash slows far harder and lasts twice as long', g:45, i:0},
  {grp:'hero', id:'h_burn',  br:'Hero', att:['flame'],  name:'Everburn', desc:'+70% burn damage from hero flames', g:45, i:0},
  {grp:'hero', id:'h_fork',  br:'Hero', att:['bolt'],   name:'Forked Lightning', desc:'Hero lightning chains through 3 more foes', g:45, i:0},
  {grp:'tower', id:'vol3',   br:'Volley', req:'vol1', name:'Rain of Arrows', desc:'Towers fire an extra arrow',g:20, i:5},
  {grp:'squad', id:'fire1',  br:'Fire',   el:'fire',  name:'Fire Arrows',   desc:'Burns foes over 3s',          g:25, i:0},
  {grp:'squad', id:'fire2',  br:'Fire',   req:'fire1', name:'Ember Burst',  desc:'Burning foes explode on death',g:30, i:3},
  {grp:'squad', id:'fire3',  br:'Fire',   req:'fire2', name:'Inferno',      desc:'Burn damage doubled',         g:30, i:6},
  {grp:'squad', id:'frost1', br:'Frost',  el:'frost', name:'Frost Arrows',  desc:'Slows foes by 35%',           g:25, i:0},
  {grp:'squad', id:'frost2', br:'Frost',  req:'frost1', name:'Glacial Bite',desc:'8% chance to freeze solid',   g:30, i:3},
  {grp:'squad', id:'frost3', br:'Frost',  req:'frost2', name:'Absolute Zero',desc:'55% slow, 15% freeze',       g:30, i:6},
  {grp:'squad', id:'bolt1',  br:'Thunder',el:'bolt',  name:'Thunder Arrows',desc:'Arrows chain to 1 more foe',  g:25, i:0},
  {grp:'squad', id:'bolt2',  br:'Thunder',req:'bolt1', name:'Raijin Chain', desc:'Chain to 2 more foes',        g:30, i:3},
  {grp:'squad', id:'bolt3',  br:'Thunder',req:'bolt2', name:'Heaven Splitter',desc:'Chain 3, stuns bosses',     g:30, i:6},
  {grp:'squad', id:'blade1', br:'Blades', name:'Honed Katana',     desc:'+25% melee damage',                  g:20, i:0},
  {grp:'squad', id:'blade2', br:'Blades', req:'blade1', name:'Crescent Cleave', desc:'Samurai hit 2 extra foes', g:30, i:2},
  {grp:'squad', id:'blade3', br:'Blades', req:'blade2', name:'Shadow Strike',   desc:'Ninja crits deal x3.5',   g:20, i:5},
  {grp:'squad', id:'spirit1',br:'Spirit', name:'Paper Wards',      desc:'Onmyoji blasts 35% larger',          g:25, i:0},
  {grp:'squad', id:'spirit2',br:'Spirit', req:'spirit1', name:'Healing Charms', desc:'Blasts heal nearby squad',g:25, i:3},
  {grp:'fence', id:'spirit3',br:'Spirit', req:'spirit2', name:'Blessed Barrier',desc:'Fences regenerate 8 HP/s', g:30, i:5}
];
const PERKS = [
  {id:'vet',     name:'Standing Army',   desc:'+1 extra archer waiting at the start', base:60, at:l=>l?`${l} archer${l>1?'s':''} at the start`:'no extra archers'},
  {id:'cap',     name:'Command Tent',    desc:'+2 squad command points',              base:80, at:l=>`${10+2*l} command points`},
  {id:'towerdmg',name:'Tower Fletchers', desc:'+8% watchtower arrow damage',          base:70, at:l=>`towers +${8*l}% damage`},
  {id:'cannon',  name:'Siege Engineers', desc:'+10% cannon tower damage',             base:80, at:l=>`cannons +${10*l}% damage`},
  {id:'arrows',  name:'Fletcher Guild',  desc:'+8% squad and tower arrow damage',     base:70, at:l=>`arrows +${8*l}% damage`},
  {id:'hero',    name:'Hero Training',   desc:'+12% hero damage',                     base:70, at:l=>`hero +${12*l}% damage`},
  {id:'ult',     name:'Focused Spirit',  desc:'Special attack recharges 5% faster',   base:90, at:l=>`special every ${Math.round(26*Math.max(0.35,1-0.05*l))}s`},
  {id:'squadhp', name:'Battle Hardened', desc:'+8% health for every squad unit',      base:70, at:l=>`squad +${8*l}% health`},
  {id:'bless',   name:'Blessed Castle',  desc:'+10% castle health',                   base:60, at:l=>`castle +${10*l}% health`},
  {id:'fence',   name:'Iron Walls',      desc:'+12% fence health',                    base:55, at:l=>`fences +${12*l}% health`},
  {id:'build',   name:'Master Builders', desc:'Buildings cost 4% less',               base:75, at:l=>`buildings ${4*l}% cheaper`},
  {id:'train',   name:'Rapid Training',  desc:'Units train 7% faster',                base:65, at:l=>`training ${7*l}% faster`},
  {id:'chest',   name:'War Chest',       desc:'+10 starting gold',                    base:45, at:l=>`start with ${6+10*l} gold`},
  {id:'magnet',  name:'Gold Magnet',     desc:'+15% coin pickup range',               base:50, at:l=>`pickup range +${15*l}%`}
];
const PERK_MAX=10;
const perkCost=(p,lv)=>Math.round(p.base*Math.pow(1.42,lv)/5)*5;
const PK=id=>(SAVE.perks&&SAVE.perks[id])||0;
const HEROES = {
  ronin:  {name:'Ronin Archer',     sprite:'hero',    rarity:'Starter',   price:0,    jade:0,  hp:260, speed:5.6, h:2.15, attack:'arrow', dmg:18, cd:0.5,  range:7.5, desc:'Rapid arrows. The Storm Bow upgrade adds a 3-arrow spread.', passive:'Balanced all-rounder'},
  samurai:{name:'Samurai Captain',  sprite:'samurai', rarity:'Rare',      price:250,  jade:0,  hp:430, speed:5.4, h:2.2,  attack:'melee', dmg:44, cd:0.6,  range:2.3, desc:'Sweeping katana hits every foe in front of him.', passive:'Squad +15% health'},
  onmyoji:{name:'Onmyoji Sage',     sprite:'onmyoji', rarity:'Rare',      price:400,  jade:0,  hp:240, speed:5.4, h:2.15, attack:'orb',   dmg:32, cd:0.95, range:8.5, desc:'Talisman blasts that damage and slow whole groups.', passive:'Fences repair 6 HP/s'},
  ninja:  {name:'Shadow Ninja',     sprite:'ninja',   rarity:'Epic',      price:550,  jade:0,  hp:290, speed:7.0, h:1.95, attack:'blade', dmg:34, cd:0.3,  range:2.4, desc:'Lightning-fast strikes with 35% critical hits.', passive:'Moves 25% faster'},
  tengu:  {name:'Tengu Lord',       sprite:'tengu',   rarity:'Epic',      price:700,  jade:8,  req:1, hp:340, speed:6.2, h:2.7, attack:'wind', dmg:21, cd:0.55, range:8.5, desc:'Hurls 3 wind feathers at different foes.', passive:'Call-wave bonus +50%'},
  kitsune:{name:'Kyubi Fox Spirit', sprite:'kitsune', rarity:'Legendary', price:900,  jade:12, req:2, hp:310, speed:5.8, h:2.7, attack:'fox',  dmg:34, cd:0.8,  range:8.5, desc:'Foxfire bursts that set groups of foes ablaze.', passive:'+25% gold from defeated foes'},
  yuki:   {name:'Frost General',    sprite:'yuki',    rarity:'Legendary', price:1100, jade:18, req:3, hp:490, speed:5.3, h:2.8, attack:'ice',  dmg:42, cd:0.85, range:3.0, desc:'Ice slash that hits every nearby foe and slows them.', passive:'Towers +20% damage'},
  shogun: {name:'Oni Shogun',       sprite:'shogun',  rarity:'Mythic',    price:1600, jade:30, req:4, hp:640, speed:5.2, h:3.1, attack:'flame',dmg:58, cd:0.9,  range:3.2, desc:'Flaming greatsword that burns everything around him.', passive:'Hero and squad +15% damage'},
  kappa:  {name:'Kappa King',       sprite:'kappa',   rarity:'Legendary', price:1300, jade:22, req:5, hp:540, speed:5.6, h:2.8, attack:'orb',  dmg:42, cd:0.8,  range:8.5, desc:'Water bombs that crash on groups and slow them.', passive:'Squad heals 3 HP/s'},
  gasha:  {name:'Gashadokuro',      sprite:'gasha',   rarity:'Mythic',    price:1900, jade:36, req:6, hp:780, speed:5.0, h:3.4, attack:'melee',dmg:74, cd:1.0,  range:3.4, desc:'Giant bone sweeps that crush every foe in front.', passive:'Castle +30% health'},
  raijin: {name:'Raijin',           sprite:'raijin',  rarity:'Mythic',    price:2400, jade:45, req:7, hp:620, speed:6.0, h:3.2, attack:'bolt', dmg:38, cd:0.6,  range:9,   desc:'Lightning that chains through 5 foes.', passive:'Every arrow chains to 1 extra foe'},
  nue:    {name:'Nue',        sprite:'nue',    rarity:'Legendary', price:1500, jade:25, req:8,  hp:560, speed:6.4, h:2.9, attack:'blade', dmg:52, cd:0.42, range:2.6, desc:'Savage claw strikes with a lashing snake tail.', passive:'Hero moves 15% faster'},
  ryujin: {name:'Ryujin',     sprite:'ryujin', rarity:'Mythic',    price:2000, jade:34, req:9,  hp:600, speed:5.8, h:3.2, attack:'orb',   dmg:54, cd:0.75, range:9,   desc:'Tidal bursts that soak and slow whole groups.', passive:'Squad heals 5 HP/s'},
  tsuchi: {name:'Tsuchigumo', sprite:'tsuchi', rarity:'Mythic',    price:2300, jade:40, req:10, hp:640, speed:6.0, h:2.9, attack:'ice',   dmg:56, cd:0.8,  range:3.2, desc:'Web burst that snares every foe around you.', passive:'Foes near you are slowed'},
  nurari: {name:'Nurarihyon', sprite:'nurari', rarity:'Mythic',    price:2600, jade:46, req:11, hp:520, speed:6.2, h:2.9, attack:'fox',   dmg:58, cd:0.7,  range:9,   desc:'Spirit flames that burn through crowds.', passive:'+35% gold from defeated foes'},
  orochi: {name:'Orochi',     sprite:'orochi', rarity:'Mythic',    price:3000, jade:55, req:12, hp:820, speed:5.4, h:3.4, attack:'flame', dmg:78, cd:0.85, range:3.6, desc:'Eight heads strike everything around you.', passive:'Castle +40% health'},
  namazu: {name:'Namazu',     sprite:'namazu', rarity:'Mythic',    price:3400, jade:62, req:13, hp:900, speed:5.2, h:3.2, attack:'melee', dmg:86, cd:0.8,  range:3.6, desc:'Body slams that shake the ground.', passive:'Squad +25% health'},
  mao:    {name:'Mao',        sprite:'mao',    rarity:'Mythic',    price:4200, jade:80, req:14, hp:950, speed:6.2, h:3.5, attack:'bolt',  dmg:70, cd:0.5,  range:9.5, desc:'Void lightning that chains through 5 foes.', passive:'Hero and squad +25% damage'},
  akaoni: {name:'Akaoni',     sprite:'akaoni',  rarity:'Epic',   price:800,  jade:10, req:0,  hp:520, speed:5.4, h:3.0, attack:'melee',dmg:60, cd:0.85, range:3.2, desc:'Iron club sweeps that flatten everything in front.', passive:'Squad +10% damage'},
  brute:  {name:'Aooni',      sprite:'brute',   rarity:'Rare',   price:500,  jade:4,  req:1,  hp:460, speed:5.6, h:2.7, attack:'melee',dmg:48, cd:0.8,  range:2.9, desc:'Heavy club smashes with a wide reach.', passive:'Castle +15% health'},
  umibozu:{name:'Umibozu',    sprite:'umibozu', rarity:'Mythic', price:2800, jade:50, req:15, hp:880, speed:5.6, h:3.3, attack:'orb',  dmg:66, cd:0.75, range:9.5, desc:'Crashing waves that drown whole roads.', passive:'Squad heals 6 HP/s'},
  kamaitachi:{name:'Kamaitachi', sprite:'kamaitachi', rarity:'Mythic', price:3100, jade:56, req:16, hp:700, speed:7.4, h:2.9, attack:'blade',dmg:62, cd:0.28, range:2.8, desc:'Blurring sickle strikes with huge critical hits.', passive:'Hero moves 25% faster'},
  daidara:{name:'Daidarabotchi', sprite:'daidara', rarity:'Mythic', price:3600, jade:64, req:17, hp:1200, speed:4.9, h:3.9, attack:'melee',dmg:110, cd:1.0, range:4.2, desc:'Mountain-sized swings that crush crowds.', passive:'Castle +50% health'},
  hannya: {name:'Hannya',     sprite:'hannya',  rarity:'Mythic', price:4000, jade:72, req:18, hp:820, speed:6.2, h:3.2, attack:'fox',  dmg:78, cd:0.65, range:9.5, desc:'Jealous blue flames that burn everything.', passive:'+40% gold from defeated foes'},
  mikaboshi:{name:'Amatsu Mikaboshi', sprite:'mikaboshi', rarity:'Mythic', price:5000, jade:90, req:19, hp:1100, speed:6.4, h:3.6, attack:'bolt', dmg:95, cd:0.5, range:10, desc:'Starfall lightning that chains through the horde.', passive:'Hero and squad +30% damage'},
  ushioni:{name:'Ushi-oni',   sprite:'ushioni', rarity:'Mythic', price:5600, jade:100, req:20, hp:1250, speed:6.6, h:3.4, attack:'melee',dmg:120, cd:0.7, range:3.6, desc:'Chained horns that gore everything in front.', passive:'Hero and squad +15% damage'},
  shuten: {name:'Shuten-doji',sprite:'shuten',  rarity:'Mythic', price:6400, jade:115, req:21, hp:1400, speed:5.8, h:3.7, attack:'flame',dmg:140, cd:0.85, range:4.0, desc:'Iron club and demon fire that burn crowds away.', passive:'Squad +30% health'},
  kirin:  {name:'Kirin',      sprite:'kirin',   rarity:'Mythic', price:7200, jade:130, req:22, hp:1150, speed:7.2, h:3.4, attack:'bolt', dmg:130, cd:0.45, range:10.5, desc:'Antler lightning that leaps across the horde.', passive:'Towers +35% damage'},
  enma:   {name:'Enma-O',     sprite:'enma',    rarity:'Mythic', price:8200, jade:150, req:23, hp:1500, speed:6.0, h:3.6, attack:'fox',  dmg:150, cd:0.6, range:10, desc:'Hellfire judgement that burns whole roads.', passive:'Castle +60% health'},
  susanoo:{name:'Susanoo',    sprite:'susanoo', rarity:'Mythic', price:9500, jade:180, req:24, hp:1700, speed:7.0, h:3.8, attack:'bolt', dmg:175, cd:0.42, range:11, desc:'The storm god himself: chained thunder without end.', passive:'Hero and squad +40% damage'},
  jorogumo:{name:'Jorogumo', sprite:'jorogumo', rarity:'Mythic', price:11000, jade:200, req:25, hp:1450, speed:7.0, h:3.5, attack:'ice',  dmg:165, cd:0.55, range:4.0, desc:'Silk nets that snare and shred everything nearby.', passive:'Foes near you are slowed'},
  karura:  {name:'Karura',   sprite:'karura',   rarity:'Mythic', price:12500, jade:230, req:26, hp:1400, speed:7.6, h:3.5, attack:'flame',dmg:185, cd:0.6,  range:4.2, desc:'Wings of fire that burn everything around you.', passive:'Squad +35% damage'},
  kuzuryu: {name:'Kuzuryu',  sprite:'kuzuryu',  rarity:'Mythic', price:14000, jade:260, req:27, hp:1800, speed:6.6, h:3.8, attack:'orb',  dmg:200, cd:0.6,  range:11, desc:'Nine torrents that crash across the field.', passive:'Squad heals 10 HP/s'},
  izanami: {name:'Izanami',  sprite:'izanami',  rarity:'Mythic', price:16000, jade:300, req:28, hp:1650, speed:6.8, h:3.7, attack:'fox',  dmg:215, cd:0.55, range:11, desc:'Ghost fire of the underworld that never stops burning.', passive:'+60% gold from defeated foes'},
  tsukuyomi:{name:'Tsukuyomi',sprite:'tsukuyomi',rarity:'Mythic',price:20000, jade:360, req:29, hp:2100, speed:7.4, h:4.0, attack:'bolt', dmg:240, cd:0.4,  range:12, desc:'Moonlight blades that cut through everything.', passive:'Hero and squad +55% damage'},
  raiju:   {name:'Raiju',      sprite:'raiju',     rarity:'Mythic', price:22000, jade:400, req:30, hp:1700, speed:8.0, h:3.4, attack:'bolt', dmg:230, cd:0.35, range:11, desc:'A lightning wolf that never stops moving.', passive:'Hero moves 30% faster'},
  baku:    {name:'Baku',       sprite:'baku',      rarity:'Mythic', price:24000, jade:440, req:31, hp:2300, speed:6.2, h:3.6, attack:'orb',  dmg:245, cd:0.6,  range:11, desc:'Devours dreams and hurls them back as nightmares.', passive:'Squad heals 14 HP/s'},
  onryo:   {name:'Onryo',      sprite:'onryo',     rarity:'Mythic', price:26000, jade:480, req:32, hp:1900, speed:7.4, h:3.5, attack:'blade',dmg:210, cd:0.3,  range:3.0, desc:'A ghost blade that strikes faster than sight.', passive:'Hero and squad +45% damage'},
  shachi:  {name:'Shachihoko', sprite:'shachi',    rarity:'Mythic', price:28000, jade:520, req:33, hp:2600, speed:6.6, h:3.6, attack:'flame',dmg:260, cd:0.6,  range:4.4, desc:'Castle guardian whose torrents sweep the field.', passive:'Castle +80% health'},
  amaterasu:{name:'Amaterasu', sprite:'amaterasu', rarity:'Mythic', price:34000, jade:600, req:34, hp:2600, speed:7.6, h:3.9, attack:'bolt', dmg:300, cd:0.38, range:12, desc:'Sunlight arrows that erase whole waves.', passive:'Hero and squad +70% damage'},
  fujin:     {name:'Fujin',      sprite:'fujin',      rarity:'Mythic', price:38000, jade:660, req:35, hp:2400, speed:8.2, h:3.6, attack:'wind',  dmg:250, cd:0.4,  range:11, desc:'Unleashes storms of razor wind at three foes at once.', passive:'Hero moves 35% faster'},
  yukionna:  {name:'Yuki-onna',  sprite:'yukionna',   rarity:'Mythic', price:42000, jade:720, req:36, hp:2300, speed:7.4, h:3.6, attack:'ice',   dmg:280, cd:0.5,  range:4.6, desc:'A blizzard that freezes everything around her.', passive:'Foes near you are slowed'},
  benkei:    {name:'Benkei',     sprite:'benkei',     rarity:'Mythic', price:46000, jade:780, req:37, hp:3400, speed:6.6, h:3.8, attack:'melee', dmg:330, cd:0.55, range:3.4, desc:'A naginata sweep that cuts through whole ranks.', passive:'Squad +45% health'},
  kagutsuchi:{name:'Kagutsuchi', sprite:'kagutsuchi', rarity:'Mythic', price:50000, jade:840, req:38, hp:2800, speed:7.8, h:3.6, attack:'flame', dmg:320, cd:0.5,  range:4.8, desc:'Fists of fire that burn every foe nearby.', passive:'Hero and squad +60% damage'},
  izanagi:   {name:'Izanagi',    sprite:'izanagi',    rarity:'Mythic', price:60000, jade:1000,req:39, hp:3200, speed:7.6, h:4.0, attack:'bolt',  dmg:360, cd:0.36, range:12.5, desc:'Heavenly spear light that chains across the field.', passive:'Hero and squad +80% damage'}
};
const RECRUITS = {
  archer: {name:'Archer',        sprite:'archer',  price:0,   jade:0, starter:true, desc:'Steady ranged damage. Trained at the Archery Range.'},
  samurai:{name:'Samurai',       sprite:'samurai', price:0,   jade:0, starter:true, desc:'Tough melee guard. Trained at the Dojo.'},
  onmyoji:{name:'Onmyoji Mage',  sprite:'onmyoji', price:200, jade:0, desc:'Area talisman blasts that slow enemies. Unlocks the Shrine in every stage.'},
  ninja:  {name:'Ninja Assassin',sprite:'ninja',   price:300, jade:0, desc:'Dashes to bosses and big foes for critical strikes. Unlocks the Hideout.'},
  oniw:   {name:'Oni Warrior',   sprite:'oni',     price:600, jade:5, req:1, desc:'Huge health and crushing club smashes. Unlocks the Oni Pit.'},
  yari:   {name:'Yari Spearman',  sprite:'yari',   price:250, jade:0,  desc:'Long spear reach, cheap and sturdy. Unlocks the Spear Yard.'},
  teppo:  {name:'Teppo Gunner',   sprite:'teppo',  price:450, jade:0,  req:2, desc:'Slow matchlock shots that hit very hard at long range. Unlocks the Gunnery.'},
  sohei:  {name:'Sohei Monk',     sprite:'sohei',  price:700, jade:6,  req:4, desc:'Heavily armoured naginata monk who holds the line. Unlocks the Temple Hall.'},
  miko:   {name:'Miko Priestess', sprite:'miko',   price:850, jade:10, req:6, desc:'Heals your squad and the castle instead of attacking. Unlocks the Kagura Shrine.'},
  tanuki: {name:'Tanuki Bomber',  sprite:'tanuki', price:1000,jade:14, req:8, desc:'Lobs bombs that blast whole groups. Unlocks the Tanuki Den.'},
  sumo:   {name:'Sumo Wrestler', sprite:'sumo',    price:1200, jade:16, req:10, desc:'A wall of muscle who knocks foes back with every thrust. Unlocks the Sumo Stable.'},
  kabuki: {name:'Kabuki Dancer', sprite:'kabuki',  price:1400, jade:20, req:12, desc:'Fan sweeps that hit wide groups and rally the squad. Unlocks the Kabuki Stage.'},
  falcon: {name:'Falconer',      sprite:'falcon',  price:1600, jade:24, req:14, desc:'Longest range in the army, strikes from far behind the wall. Unlocks the Falconry.'},
  kusari: {name:'Kusarigama',    sprite:'kusari',  price:1800, jade:28, req:16, desc:'Chain sickle that drags enemies out of the pack. Unlocks the Chain Yard.'},
  komainu:{name:'Komainu',       sprite:'komainu', price:2000, jade:32, req:18, desc:'A shrine lion-dog that chases down stragglers. Unlocks the Guardian Shrine.'}
};
const UNIT_SPR={archer:'archer',samurai:'samurai',onmyoji:'onmyoji',ninja:'ninja',oniw:'oni',yari:'yari',teppo:'teppo',sohei:'sohei',miko:'miko',tanuki:'tanuki',sumo:'sumo',kabuki:'kabuki',falcon:'falcon',kusari:'kusari',komainu:'komainu'};
const MELEE_CLS=['samurai','oniw','yari','sohei','sumo','kusari','komainu'];
const ICONS = {sumopit:'🤼', kabukipit:'🎭', falconpit:'🦅', kusaripit:'⛓️', komainupit:'🦁', yaripit:'🔱', teppopit:'💥', soheipit:'🔔', mikopit:'🎐', tanukipit:'🧨', ctower:'💣', onipit:'👹', range:'🏹', dojo:'⚔️', shrine:'⛩️', ninja:'🥷', banner:'🎌', mine:'⛏️', forge:'🔥', armory:'🛡️', tower:'🗼', fence:'🪵', tup:'⬆️', lvl2:'⭐'};

/* ================================================================ helpers */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const irand=(a,b)=>Math.floor(rand(a,b+1));
const $=id=>document.getElementById(id);
function lerpAngle(a,b,t){ let d=(b-a)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2; return a+d*t; }
const easeOutBack=t=>{ const c1=1.9,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };
function rng(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function segIntersect(ax,az,bx,bz,cx,cz,dx,dz){
  const d1x=bx-ax,d1z=bz-az,d2x=dx-cx,d2z=dz-cz, den=d1x*d2z-d1z*d2x; if(Math.abs(den)<1e-6) return false;
  const u=((cx-ax)*d2z-(cz-az)*d2x)/den, v=((cx-ax)*d1z-(cz-az)*d1x)/den; return u>=0&&u<=1&&v>=0&&v<=1;
}
function pointSegDist(px,pz,ax,az,bx,bz){ const vx=bx-ax,vz=bz-az,l=vx*vx+vz*vz; let t=l?((px-ax)*vx+(pz-az)*vz)/l:0; t=clamp(t,0,1); return Math.hypot(px-(ax+vx*t),pz-(az+vz*t)); }
const polar=(a,r)=>[KEEP.x+Math.sin(a)*r, KEEP.z-Math.cos(a)*r];
const angOf=(x,z)=>Math.atan2(x-KEEP.x, -(z-KEEP.z));
const colCache=new Map(); function C(hex){ let c=colCache.get(hex); if(!c){ c=new T.Color(hex); colCache.set(hex,c); } return c; }

/* ================================================================ save */
const SAVE_KEY='goldstack-keep-save-v2';
let SAVE={unlocked:1, stars:new Array(50).fill(0), honor:0, perks:{chest:0,vet:0,bless:0}};
try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s&&s.stars) SAVE=Object.assign(SAVE,s); }catch(e){}
while(SAVE.stars.length<50) SAVE.stars.push(0);
  SAVE.tier=SAVE.tier||[]; while(SAVE.tier.length<50) SAVE.tier.push(0);
SAVE=Object.assign({heroes:['ronin'],hero:'ronin',units:[],jade:0,giftShop:false},SAVE); if(!SAVE.heroes.includes('ronin')) SAVE.heroes.push('ronin');
SAVE.perks=Object.assign({chest:0,vet:0,bless:0,hero:0,arrows:0,magnet:0,cap:0,towerdmg:0,cannon:0,ult:0,squadhp:0,fence:0,build:0,train:0},SAVE.perks||{});
function persist(){ SAVE.ts=Date.now(); try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); }catch(e){} Cloud.queue(); }

/* ---------------- accounts and cloud saves (Supabase) ---------------- */
const Cloud=(()=>{
  const CFG=window.GK_SUPABASE||null; let sb=null, user=null, t=null, saving=false, status='local';
  const setStatus=(s,txt)=>{ status=s; const el=document.getElementById('cloudTxt'); if(el) el.textContent=txt; const b=document.getElementById('acctBtn'); if(b) b.textContent=user?'Log out':'Sign in'; };
  function progress(v){ return (v&&v.stars?v.stars.reduce((a,b)=>a+b,0):0)*100+(v&&v.unlocked||0)*50+(v&&v.honor||0)+(v&&v.jade||0)*10+((v&&v.heroes||[]).length)*200; }
  async function pull(){
    const {data,error}=await sb.from('saves').select('data,updated_at').eq('user_id',user.id).maybeSingle();
    if(error){ setStatus('error','Cloud save unavailable'); return; }
    if(data&&data.data){ const cloud=data.data;
      if(progress(cloud)>=progress(SAVE)||(cloud.ts||0)>(SAVE.ts||0)){ SAVE=Object.assign(SAVE,cloud); try{ localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE)); }catch(e){} }
    }
    setStatus('ok','Saved to '+(user.email||'your account'));
    if(typeof renderHome==='function'&&!document.getElementById('map').classList.contains('hide')) renderHome();
    await push();
  }
  async function push(){
    if(!sb||!user||saving) return; saving=true;
    const {error}=await sb.from('saves').upsert({user_id:user.id,data:SAVE,updated_at:new Date().toISOString()});
    saving=false; setStatus(error?'error':'ok', error?'Cloud save failed, kept on this device':'Saved to '+(user.email||'your account'));
  }
  return {
    get user(){ return user; }, get enabled(){ return !!sb; },
    async init(){
      if(!CFG||!window.supabase){ setStatus('local','Progress saved on this device'); return false; }
      sb=window.supabase.createClient(CFG.url,CFG.key);
      const {data}=await sb.auth.getSession();
      if(data&&data.session){ user=data.session.user; await pull(); return true; }
      setStatus('local','Progress saved on this device'); return false;
    },
    async signIn(email,pass,create){
      if(!sb) return {error:{message:'Accounts are not set up on this build'}};
      const r=create?await sb.auth.signUp({email,password:pass}):await sb.auth.signInWithPassword({email,password:pass});
      if(r.error) return r;
      if(r.data&&r.data.session){ user=r.data.session.user; await pull(); }
      return r;
    },
    async signOut(){ if(sb) await sb.auth.signOut(); user=null; setStatus('local','Progress saved on this device'); },
    queue(){ if(!sb||!user) return; clearTimeout(t); t=setTimeout(push,2500); }
  };
})();
function authMsg(t){ const el=document.getElementById('authMsg'); if(el) el.textContent=t; }
function showAuth(show){ document.getElementById('auth').classList.toggle('hide',!show); }
document.getElementById('guestBtn').addEventListener('click',()=>{ try{ localStorage.setItem('gk-guest','1'); }catch(e){} showAuth(false); });
async function doAuth(create){
  const email=document.getElementById('authEmail').value.trim(), pass=document.getElementById('authPass').value;
  if(!email||pass.length<6){ authMsg('Enter an email and a password of at least 6 characters.'); return; }
  authMsg(create?'Creating your account…':'Logging in…');
  const r=await Cloud.signIn(email,pass,create);
  if(r.error){ authMsg(r.error.message); return; }
  if(!(r.data&&r.data.session)){ authMsg('Account created. Check your email to confirm it, then log in.'); return; }
  authMsg('Welcome back!'); showAuth(false); if(typeof renderHome==='function') renderHome();
}
document.getElementById('loginBtn').addEventListener('click',()=>doAuth(false));
document.getElementById('signupBtn').addEventListener('click',()=>doAuth(true));
document.getElementById('authPass').addEventListener('keydown',e=>{ if(e.key==='Enter') doAuth(false); });

/* ================================================================ renderer */
const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&innerWidth<900);
const renderer=new T.WebGLRenderer({antialias:!isMobile, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, isMobile?1.75:2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
const scene=new T.Scene();
scene.background=new T.Color(0xCFE9F5); scene.fog=new T.Fog(0xCFE9F5,70,150);
const camera=new T.PerspectiveCamera(35,1,1,400);
const PITCH=55*Math.PI/180, YAW=22*Math.PI/180;
const OFF=new T.Vector3(Math.cos(PITCH)*Math.sin(YAW), Math.sin(PITCH), Math.cos(PITCH)*Math.cos(YAW));
const RIGHT={x:Math.cos(YAW), z:-Math.sin(YAW)}, DOWN={x:Math.sin(YAW), z:Math.cos(YAW)};
let camDist=40, cw=1, ch=1;
const hemi=new T.HemisphereLight(0xDCEFFF,0x4E8A30,0.62); scene.add(hemi);
const sun=new T.DirectionalLight(0xFFEBD0,0.7); sun.castShadow=true;
sun.shadow.mapSize.set(isMobile?1024:2048, isMobile?1024:2048);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90}); sun.shadow.bias=-0.0009;
scene.add(sun, sun.target);
function resize(){ cw=innerWidth; ch=innerHeight; renderer.setSize(cw,ch); camera.aspect=cw/ch;
  const tanH=Math.tan(camera.fov*Math.PI/360); camDist=clamp(Math.max(12.5/(2*tanH*camera.aspect), 17/(2*tanH)),22,60); camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();

/* ================================================================ toon materials, faces, geometry */
const gradTex=(()=>{ const t=new T.DataTexture(new Uint8Array([95,95,95,255, 175,175,175,255, 255,255,255,255]),3,1,T.RGBAFormat); t.minFilter=t.magFilter=T.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t; })();
const toon=(c,extra)=>new T.MeshToonMaterial(Object.assign({color:c, gradientMap:gradTex},extra||{}));
const OLMAT=new T.MeshBasicMaterial({color:0x1A1422, side:T.BackSide});
function makeFace(o){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=128; const x=cv.getContext('2d');
  const E=(cx,cy,rx,ry)=>{ x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.fill(); };
  for(const s of [-1,1]){
    const cx=128+s*54;
    if(o.blush){ x.fillStyle='rgba(255,120,150,.45)'; E(cx+s*6,112,20,8); }
    x.fillStyle='#fff'; E(cx,70,26,o.angry?25:34);
    x.fillStyle=o.iris; E(cx,74,18,o.angry?20:27);
    x.fillStyle='#16121c'; E(cx,78,o.slit?5:10,o.slit?22:14);
    x.fillStyle='#fff'; E(cx-s*8,58,7,9); E(cx+s*7,93,3.5,3.5);
    x.strokeStyle='#16121c'; x.lineCap='round'; x.lineWidth=9; x.beginPath();
    if(o.angry){ x.moveTo(cx+s*32,26); x.lineTo(cx-s*24,48); }
    else { x.arc(cx,72,30,Math.PI*1.12,Math.PI*1.88); }
    x.stroke();
  }
  if(o.fangs){ x.fillStyle='#fff'; x.beginPath(); x.moveTo(104,118); x.lineTo(112,128); x.lineTo(120,118); x.moveTo(136,118); x.lineTo(144,128); x.lineTo(152,118); x.fill(); }
  const t=new T.CanvasTexture(cv); t.anisotropy=4; return t;
}
const FACES={
  hero:  makeFace({iris:'#E0A21A', blush:true}),
  ally:  makeFace({iris:'#6B3F1F', blush:true}),
  enemy: makeFace({iris:'#C62828', angry:true}),
  oni:   makeFace({iris:'#F5C542', angry:true, fangs:true}),
  fox:   makeFace({iris:'#F5B820', slit:true, blush:true}),
  ice:   makeFace({iris:'#3FC4F0', angry:true})
};
const faceMat=k=>new T.MeshBasicMaterial({map:FACES[k], transparent:true, alphaTest:0.4, depthWrite:false});
function mergeGeos(parts){
  const pos=[], nor=[];
  for(const p of parts){
    const g=p.geo.index?p.geo.toNonIndexed():p.geo.clone();
    const m=new T.Matrix4().compose(new T.Vector3(...(p.pos||[0,0,0])), new T.Quaternion().setFromEuler(new T.Euler(...(p.rot||[0,0,0]))), new T.Vector3(...(p.scl||[1,1,1])));
    g.applyMatrix4(m);
    const pa=g.attributes.position.array, na=g.attributes.normal.array;
    for(let i=0;i<pa.length;i++){ pos.push(pa[i]); nor.push(na[i]); }
  }
  const out=new T.BufferGeometry(); out.setAttribute('position',new T.Float32BufferAttribute(pos,3)); out.setAttribute('normal',new T.Float32BufferAttribute(nor,3)); return out;
}
const GEO={};
GEO.body=new T.CylinderGeometry(0.22,0.3,0.56,10); GEO.body.translate(0,0.28,0);
GEO.head=new T.SphereGeometry(0.34,14,10);
GEO.face=new T.PlaneGeometry(0.5,0.25);
GEO.hair=(()=>{ const p=[{geo:new T.SphereGeometry(0.365,12,8,0,Math.PI*2,0,Math.PI*0.4), pos:[0,0.03,0]},{geo:new T.SphereGeometry(0.37,12,8,Math.PI*1.1,Math.PI*0.8,0,Math.PI*0.72), pos:[0,0,-0.02]}];
  for(let i=0;i<9;i++){ const a=(i/9)*Math.PI*2+0.3, sx=Math.sin(a), sz=Math.cos(a); if(sz>0.55) continue; p.push({geo:new T.ConeGeometry(0.11,0.38,5), pos:[sx*0.25,0.2,sz*0.25-0.04], rot:[sz*1.0,0,-sx*1.0]}); }
  p.push({geo:new T.ConeGeometry(0.12,0.42,5), pos:[0,0.36,-0.06], rot:[-0.35,0,0]});
  for(const bx of [-0.17,0,0.17]) p.push({geo:new T.ConeGeometry(0.08,0.22,5), pos:[bx,0.26,0.27], rot:[Math.PI-0.7,0,bx*1.5]});
  return mergeGeos(p); })();
GEO.headband=mergeGeos([{geo:new T.TorusGeometry(0.35,0.04,6,20), rot:[Math.PI/2,0,0]},{geo:new T.BoxGeometry(0.06,0.26,0.03), pos:[0.06,-0.1,-0.37], rot:[0.4,0,0.3]},{geo:new T.BoxGeometry(0.06,0.26,0.03), pos:[-0.06,-0.12,-0.37], rot:[0.4,0,-0.3]}]);
GEO.bow=mergeGeos([{geo:new T.TorusGeometry(0.44,0.035,5,16,Math.PI), rot:[0,0,-Math.PI/2]},{geo:new T.BoxGeometry(0.012,0.88,0.012)}]);
GEO.kabuto=mergeGeos([{geo:new T.SphereGeometry(0.4,12,8,0,Math.PI*2,0,Math.PI/2)},{geo:new T.CylinderGeometry(0.5,0.56,0.07,14), pos:[0,0.02,-0.04]},{geo:new T.BoxGeometry(0.7,0.2,0.06), pos:[0,-0.12,-0.3], rot:[0.5,0,0]}]);
GEO.maedate=mergeGeos([{geo:new T.TorusGeometry(0.24,0.04,5,14,Math.PI), rot:[0,0,Math.PI]}]);
GEO.blade=mergeGeos([{geo:new T.BoxGeometry(0.045,0.07,0.9), pos:[0,0,0.45]},{geo:new T.BoxGeometry(0.16,0.16,0.04), pos:[0,0,0]},{geo:new T.BoxGeometry(0.05,0.05,0.22), pos:[0,0,-0.12]}]);
GEO.eboshi=(()=>{ const g=new T.CylinderGeometry(0.16,0.3,0.6,10); g.translate(0,0.3,0); g.rotateX(-0.35); return g; })();
GEO.gohei=mergeGeos([{geo:new T.CylinderGeometry(0.02,0.02,1.0,6)},{geo:new T.BoxGeometry(0.16,0.1,0.02), pos:[0.1,0.42,0], rot:[0,0,0.5]},{geo:new T.BoxGeometry(0.16,0.1,0.02), pos:[0.1,0.3,0], rot:[0,0,-0.5]},{geo:new T.BoxGeometry(0.16,0.1,0.02), pos:[0.1,0.18,0], rot:[0,0,0.5]}]);
GEO.hood=new T.SphereGeometry(0.39,12,8,Math.PI/2+0.95,Math.PI*2-1.9,0,Math.PI*0.72);
GEO.scarf=mergeGeos([{geo:new T.TorusGeometry(0.24,0.08,6,14), rot:[Math.PI/2,0,0]},{geo:new T.BoxGeometry(0.12,0.05,0.5), pos:[0.1,-0.02,-0.4], rot:[-0.3,0.2,0]}]);
GEO.jingasa=(()=>{ const g=new T.ConeGeometry(0.52,0.26,14); return g; })();
GEO.horns=mergeGeos([{geo:new T.ConeGeometry(0.08,0.34,6), pos:[0.18,0,0], rot:[0,0,-0.4]},{geo:new T.ConeGeometry(0.08,0.34,6), pos:[-0.18,0,0], rot:[0,0,0.4]}]);
GEO.club=(()=>{ const g=new T.CylinderGeometry(0.16,0.07,1.0,8); g.translate(0,0.5,0); g.rotateX(0.9); return g; })();
GEO.badge=new T.OctahedronGeometry(0.11);
const SHARED=new Set(Object.values(GEO));

/* ================================================================ instancing */
const _m4=new T.Matrix4(), _q=new T.Quaternion(), _p=new T.Vector3(), _s=new T.Vector3(), _e=new T.Euler(), _c=new T.Color(), _Y=new T.Vector3(0,1,0), _v=new T.Vector3();
const WHITE=new T.Color(1,1,1), BLACK=new T.Color(0,0,0);
function makeBatch(geo,cap,{mat=null,shadow=true,order=0,receive=false}={}){
  const m=new T.InstancedMesh(geo, mat||toon(0xffffff), cap);
  m.instanceMatrix.setUsage(T.DynamicDrawUsage);
  for(let i=0;i<cap;i++) m.setColorAt(i,WHITE);
  m.instanceColor.setUsage(T.DynamicDrawUsage);
  m.frustumCulled=false; m.castShadow=shadow; m.receiveShadow=receive; m.count=0; m.renderOrder=order; scene.add(m);
  return {m,n:0,cap};
}
function bBegin(b){ b.n=0; }
function bYaw(b,x,y,z,yaw,sx,sy,sz,col){ if(b.n>=b.cap) return; _p.set(x,y,z); _q.setFromAxisAngle(_Y,yaw); _s.set(sx,sy,sz); _m4.compose(_p,_q,_s); b.m.setMatrixAt(b.n,_m4); b.m.setColorAt(b.n,col); b.n++; }
function bEuler(b,x,y,z,rx,ry,rz,s,col){ if(b.n>=b.cap) return; _p.set(x,y,z); _e.set(rx,ry,rz); _q.setFromEuler(_e); _s.set(s,s,s); _m4.compose(_p,_q,_s); b.m.setMatrixAt(b.n,_m4); b.m.setColorAt(b.n,col); b.n++; }
function bQuat(b,x,y,z,q,sx,sy,sz,col){ if(b.n>=b.cap) return; _p.set(x,y,z); _s.set(sx,sy,sz); _m4.compose(_p,q,_s); b.m.setMatrixAt(b.n,_m4); b.m.setColorAt(b.n,col); b.n++; }
function bEnd(b){ b.m.count=b.n; b.m.instanceMatrix.needsUpdate=true; b.m.instanceColor.needsUpdate=true; }

const CH=340;
const B={
  body:makeBatch(GEO.body,CH), bodyOL:makeBatch(GEO.body,CH,{mat:OLMAT,shadow:false}),
  head:makeBatch(GEO.head,CH), headOL:makeBatch(GEO.head,CH,{mat:OLMAT,shadow:false}),
  faceAlly:makeBatch(GEO.face,130,{mat:faceMat('ally'),shadow:false,order:2}),
  faceEnemy:makeBatch(GEO.face,220,{mat:faceMat('enemy'),shadow:false,order:2}),
  faceOni:makeBatch(GEO.face,80,{mat:faceMat('oni'),shadow:false,order:2}),
  hair:makeBatch(GEO.hair,220), headband:makeBatch(GEO.headband,130,{shadow:false}), bow:makeBatch(GEO.bow,130,{shadow:false}),
  kabuto:makeBatch(GEO.kabuto,40), maedate:makeBatch(GEO.maedate,40,{shadow:false}), blade:makeBatch(GEO.blade,260,{shadow:false}),
  eboshi:makeBatch(GEO.eboshi,40), gohei:makeBatch(GEO.gohei,40,{shadow:false}), hood:makeBatch(GEO.hood,40), scarf:makeBatch(GEO.scarf,40,{shadow:false}),
  jingasa:makeBatch(GEO.jingasa,220), horns:makeBatch(GEO.horns,80,{shadow:false}), club:makeBatch(GEO.club,80), badge:makeBatch(GEO.badge,90,{mat:new T.MeshBasicMaterial({color:0xffffff}),shadow:false}),
  coin:makeBatch(new T.CylinderGeometry(0.3,0.3,0.1,12),900,{mat:new T.MeshLambertMaterial({color:0xffffff,emissive:0x3a2600})}),
  ingot:makeBatch(new T.BoxGeometry(0.56,0.16,0.3),220,{mat:new T.MeshLambertMaterial({color:0xffffff,emissive:0x0a1a33})}),
  arrow:makeBatch(new T.BoxGeometry(0.06,0.06,0.8),360,{mat:new T.MeshBasicMaterial({color:0xffffff}),shadow:false}),
  talis:makeBatch(new T.BoxGeometry(0.22,0.3,0.03),60,{mat:new T.MeshBasicMaterial({color:0xffffff}),shadow:false}),
  part:makeBatch(new T.BoxGeometry(0.16,0.16,0.16),900,{mat:new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95}),shadow:false}),
  plank:makeBatch(new T.BoxGeometry(0.4,1.5,0.16),700,{receive:true}),
  hpBg:makeBatch(new T.PlaneGeometry(1,0.16),200,{mat:new T.MeshBasicMaterial({color:0xffffff,depthTest:false,transparent:true}),shadow:false,order:10}),
  hpFg:makeBatch(new T.PlaneGeometry(1,0.16),200,{mat:new T.MeshBasicMaterial({color:0xffffff,depthTest:false,transparent:true}),shadow:false,order:11}),
  chev:makeBatch((()=>{ const s=new T.Shape(); s.moveTo(-0.38,-0.2); s.lineTo(0,0.22); s.lineTo(0.38,-0.2); s.lineTo(0.2,-0.2); s.lineTo(0,0.02); s.lineTo(-0.2,-0.2); s.closePath(); const g=new T.ShapeGeometry(s); g.rotateX(-Math.PI/2); return g; })(),48,
    {mat:new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,depthWrite:false}),shadow:false,order:5})
};

/* ================================================================ sprites (Higgsfield art) */
const TEX={}; const texLoader=new T.TextureLoader();
let _blank=null;
function texBlank(){ if(!_blank){ const c=document.createElement('canvas'); c.width=c.height=2; _blank=new T.CanvasTexture(c); } return _blank; }
function tex(k,rep){ if(!SPR[k]&&!ANIM[k]) return texBlank(); const key=k+(rep?':'+rep:''); if(TEX[key]) return TEX[key]; const t=texLoader.load(SPR[k]||ANIM[k]); t.anisotropy=renderer.capabilities.getMaxAnisotropy?Math.min(8,renderer.capabilities.getMaxAnisotropy()):4;
  if(rep){ t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep,rep); } return (TEX[key]=t); }
const SPR_H={takemika:12.4,hachiman:12.6,bishamon:12.6,inari:12.2,saruta:13.0,minaka:12.8,kunitoko:13.4,yatono:12.8,marishi:12.8,mioya:13.6,espear:2.3,earcher:3.3,eshaman:3.6,eshield:4.2,fujin:5.8,yukionna:5.8,benkei:6.0,kagutsuchi:5.8,izanagi:6.2,sumo:1.75,kabuki:1.7,falcon:1.65,kusari:1.65,komainu:1.45,raiju:5.4,baku:5.2,onryo:5.6,shachi:5.4,amaterasu:5.8,jorogumo:5.6,karura:5.8,kuzuryu:6.2,izanami:6.0,tsukuyomi:6.4,ushioni:5.8,shuten:6.4,kirin:5.6,enma:6.2,susanoo:6.6,umibozu:6.0,kamaitachi:4.6,daidara:7.2,hannya:5.4,mikaboshi:6.6,yari:1.65,teppo:1.6,sohei:1.7,miko:1.6,tanuki:1.55,nue:5.0,ryujin:5.8,tsuchi:4.8,nurari:4.8,orochi:6.2,namazu:5.4,mao:6.4,kappa:5.1,gasha:6.9,raijin:6.2,hero:2.15,archer:1.6,samurai:1.7,onmyoji:1.65,ninja:1.35,bandit:1.6,oni:2.35,brute:3.7,akaoni:4.9,tengu:4.5,kitsune:4.4,yuki:4.9,shogun:6.0};
const sprGeo=new T.PlaneGeometry(1,1); sprGeo.translate(0,0.5,0);
const sprMat=k=>new T.MeshBasicMaterial({map:tex(k),alphaTest:0.5,side:T.DoubleSide});
const FRAMES=k=>((ANIM_META[k]&&ANIM_META[k].n)||3);
function animMat(k){ const m=new T.MeshBasicMaterial({map:tex(k),alphaTest:0.5,side:T.DoubleSide}), n=FRAMES(k);
  m.onBeforeCompile=sh=>{ sh.vertexShader='attribute float aFrame;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n  vUv.x=(vUv.x+aFrame)/'+n.toFixed(1)+';'); };
  /* one compiled shader per frame count: without this, three.js reuses the first one it built for every character */
  m.customProgramCacheKey=()=>'animframes'+n;
  return m; }
const SB={}; [['hero',2],['archer',140],['samurai',40],['onmyoji',40],['ninja',40],['bandit',240],['oni',90],['espear',80],['earcher',80],['eshaman',60],['eshield',50],['brute',4],['akaoni',2],['tengu',2],['kitsune',2],['yuki',2],['shogun',2],['kappa',2],['gasha',2],['raijin',2],['nue',2],['ryujin',2],['tsuchi',2],['nurari',2],['orochi',2],['namazu',2],['mao',2],['umibozu',2],['kamaitachi',2],['daidara',2],['hannya',2],['mikaboshi',2],['ushioni',2],['shuten',2],['kirin',2],['enma',2],['susanoo',2],['jorogumo',2],['karura',2],['kuzuryu',2],['izanami',2],['tsukuyomi',2],['raiju',2],['baku',2],['onryo',2],['shachi',2],['amaterasu',2],['fujin',2],['yukionna',2],['benkei',2],['kagutsuchi',2],['izanagi',2],['takemika',2],['hachiman',2],['bishamon',2],['inari',2],['saruta',2],['minaka',2],['kunitoko',2],['yatono',2],['marishi',2],['mioya',2],['sumo',40],['kabuki',40],['falcon',50],['kusari',50],['komainu',50],['yari',60],['teppo',60],['sohei',40],['miko',40],['tanuki',40]].forEach(([k,c])=>{
  const g=sprGeo.clone(), fa=new T.InstancedBufferAttribute(new Float32Array(c),1); fa.setUsage(T.DynamicDrawUsage); g.setAttribute('aFrame',fa);
  SB[k]=makeBatch(g,c,{mat:animMat(k),shadow:false,order:1}); SB[k].fa=fa; });
const BLD={b_cannon:4.2,b_yari:3.2,b_teppo:3.2,b_sohei:3.6,b_tanuki:3.2,b_tower:4.6,b_range:3.2,b_dojo:3.4,b_shrine:3.6,b_ninja:3.2,b_onipit:3.4,b_banner:4.0,b_mine:3.4,b_forge:3.4,b_armory:3.3};
function buildingSprite(kind,x,z){
  const H=BLD[kind]||3.2, W=H*(SPR_AR[kind]||1), g=new T.Group(); g.position.set(x,0,z);
  const m=new T.Mesh(sprGeo,new T.MeshBasicMaterial({map:tex(kind),alphaTest:0.5,side:T.DoubleSide}));
  m.scale.set(W,H,1); m.quaternion.copy(camBill); m.renderOrder=1; g.add(m);
  const sh=new T.Mesh(blobGeo0,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.24,depthWrite:false}));
  sh.position.y=0.04; sh.scale.set(W*0.62,1,W*0.32); g.add(sh);
  return g;
}
const blobGeo=new T.CircleGeometry(0.5,18); blobGeo.rotateX(-Math.PI/2);
const blobGeo0=blobGeo;
const BLOB=makeBatch(blobGeo,700,{mat:new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.26,depthWrite:false}),shadow:false,order:0});
const camBill=(()=>{ const o=new T.Object3D(); o.position.copy(OFF); o.lookAt(0,0,0); return o.quaternion.clone(); })();
const _sc=new T.Color();
function drawSprite(k,ent,x,y,z,rot,flash,moving,seed,frozen,atk,extraScale,burn,forceFrame){
  const fd=Math.sin(rot)*RIGHT.x+Math.cos(rot)*RIGHT.z; if(Math.abs(fd)>0.25) ent.face=fd>0?1:-1; const face=ent.face||1;
  const M=ANIM_META[k], base=SPR_H[k]*(extraScale||1), H=base*M.hs, W=H*M.ar;
  const NF=FRAMES(k), WALK=(M.cycle||(NF>=6?[1,2,3,2]:NF>=5?[1,2,1,0]:[1,0])), ATKF=(M.atkF!=null?M.atkF:(NF>=6?4:2)), HITF=(M.hitF!=null?M.hitF:(NF>=6?5:-1));
  let frame=0;
  if(forceFrame!=null) frame=forceFrame;
  else if(HITF>=0&&flash>0.55) frame=HITF;
  else if((atk||0)>0.3) frame=ATKF;
  else if(moving){ const rate=(base>3?4.6:8.2)*(NF>=6?1.35:1); frame=WALK[Math.floor(TIME*rate+seed*3)%WALK.length]; }
  if(!(frame>=0&&frame<NF)) frame=0; frame=frame|0;  /* never hand the GPU a missing or out-of-range frame */
  const b0=SB[k]; if(b0.n<b0.cap) b0.fa.array[b0.n]=frame;
  const spd=(base>3?7.2:13);
  const bob=moving?Math.abs(Math.sin(TIME*spd+seed))*0.1*Math.min(1,base/2):Math.sin(TIME*2.2+seed)*0.012*base;
  const a01=clamp((atk||0),0,1), wind=a01>0.65?(a01-0.65)/0.35:0, strike=a01<=0.65?a01/0.65:0;
  const sq=(atk||0)>0.3 ? (1.1+wind*0.06-strike*0.12)
         : flash>0.4 ? 0.93
         : moving?1+Math.sin(TIME*spd*2+seed)*0.035:1+Math.sin(TIME*2.6+seed)*0.025;
  const lunge=(strike?strike*0.45:0)-(wind?wind*0.18:0), lx=x+Math.sin(rot)*lunge, lz=z+Math.cos(rot)*lunge;
  _sc.setRGB(1,1,1); if(frozen) _sc.setRGB(0.62,0.9,1); if(burn) _sc.setRGB(1,0.82,0.7); if(flash>0) _sc.lerp(C(0xFF6B6B),clamp(flash,0,1)*0.75);
  bQuat(SB[k],lx,y+bob,lz,camBill,W*face*(2-sq),H*sq,1,_sc);
  bYaw(BLOB,x,y+0.04,z,0,W*0.62,1,W*0.36,WHITE);
  return H;
}

/* character looks: [batch, ox, oy, oz, sx, sy, sz, color | 'rank'] ; head centre sits at y 0.82 */
const LOOKS={
  archer: {S:1.0,  body:0x2F5DB8, skin:0xF6D2B0, face:'faceAlly', parts:[['hair',0,0.84,-0.02,1,1,1,0x3A2418],['headband',0,0.88,0,1,1,1,'rank'],['bow',0.34,0.5,0.1,1,1,1,0x4A2418]]},
  samurai:{S:1.12, body:0x2D7F8A, skin:0xF6D2B0, face:'faceAlly', parts:[['kabuto',0,0.9,0,1,1,1,0x24324A],['maedate',0,1.2,0.26,1,1,1,0xF5C542],['blade',0.33,0.45,0.18,1,1,1,0xE6ECF2]]},
  onmyoji:{S:1.0,  body:0xF3F1EA, skin:0xF6D2B0, face:'faceAlly', parts:[['hair',0,0.82,-0.02,1,1,1,0x1C1C22],['eboshi',0,1.1,-0.05,1,1,1,0x1E1E24],['gohei',0.34,0.55,0.12,1,1,1,0xFFFFFF],['scarf',0,0.55,0,0.9,0.7,0.9,0x8E4FD6]]},
  ninja:  {S:0.95, body:0x2A2433, skin:0xF6D2B0, face:'faceAlly', parts:[['hood',0,0.82,-0.02,1,1,1,0x2A2433],['scarf',0,0.56,0,1,1,1,0xB04FD6],['blade',0.3,0.42,0.16,0.8,0.8,0.8,0xD9DEE6]]},
  bandit: {S:1.0,  body:0xC7372F, skin:0xF2C29A, face:'faceEnemy', parts:[['hair',0,0.84,-0.02,1,1,1,0x3A2418],['jingasa',0,1.12,0,1,1,1,0xC0392B],['blade',0.34,0.45,0.2,0.9,0.9,0.9,0xD5D9DE]]},
  oni:    {S:1.5,  body:0xE0A11B, skin:0x7C6BD6, face:'faceOni',   parts:[['hair',0,0.84,-0.02,1.05,1,1.05,0xF2F2F2],['horns',0,1.12,0.05,1,1,1,0xF5E6B8],['club',0.4,0.5,0.1,1,1,1,0x6B4A36]]}
};
const HEADP=new Set(['hair','headband','kabuto','maedate','eboshi','hood','jingasa','horns']);
const CAMROT=Math.atan2(Math.sin(22*Math.PI/180),Math.cos(22*Math.PI/180));
const RANKCOL=[C(0xE03A3A),C(0xD9DEE6),C(0xF5C542)];
const tmpCol=new T.Color();
function tint(hex,flash,frozen){ tmpCol.copy(C(hex)); if(frozen) tmpCol.lerp(C(0x9FE8FF),0.65); if(flash>0) tmpCol.lerp(WHITE,clamp(flash,0,1)); return tmpCol; }
let TIME=0;
function drawChar(type,x,y,z,rot,flash,moving,seed,rank,frozen,atk){
  const L=LOOKS[type], S=L.S, s=Math.sin(rot), c=Math.cos(rot);
  const bob=moving?Math.abs(Math.sin(TIME*14+seed))*0.12:0;
  const lunge=(atk||0)*0.25; const bx=x+s*lunge, bz=z+c*lunge;
  const P=(b,ox,oy,oz,sx,sy,sz,col)=>{ bYaw(b, bx+(ox*c+oz*s)*S, y+bob+oy*S, bz+(-ox*s+oz*c)*S, rot, sx*S,sy*S,sz*S, col); };
  const HS=1.22, HC=0.9;
  P(B.body,0,0,0,1,1,1,tint(L.body,flash,frozen)); P(B.bodyOL,0,-0.015,0,1.06,1.04,1.06,BLACK);
  P(B.head,0,HC,0,HS,HS,HS,tint(L.skin,flash,frozen)); P(B.headOL,0,HC,0,HS*1.05,HS*1.05,HS*1.05,BLACK);
  P(B[L.face],0,HC-0.04*HS,0.35*HS,HS,HS,HS,WHITE);
  for(const p of L.parts){ const col=p[7]==='rank'?RANKCOL[rank||0]:(frozen?tint(p[7],0,true):C(p[7]));
    if(HEADP.has(p[0])) P(B[p[0]],p[1]*HS,HC+(p[2]-0.82)*HS,p[3]*HS,p[4]*HS,p[5]*HS,p[6]*HS,col); else P(B[p[0]],p[1],p[2],p[3],p[4],p[5],p[6],col); }
  if(rank>0) P(B.badge,0,1.85+Math.sin(TIME*3+seed)*0.05,0,1,1,1,RANKCOL[rank]);
}

/* ================================================================ static & per-stage environment */
const env=new T.Group(); scene.add(env);
const dyn=new T.Group(); scene.add(dyn);
function disposeGroup(g){ g.traverse(o=>{ if(o.geometry&&!o.userData.keepGeo&&!SHARED.has(o.geometry)) o.geometry.dispose(); if(o.material&&o.material!==OLMAT){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } }); while(g.children.length) g.remove(g.children[0]); }
function mk(geo,mat,x=0,y=0,z=0,shadow=true){ const m=new T.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=shadow; m.receiveShadow=true; return m; }
const phong=c=>new T.MeshPhongMaterial({color:c,flatShading:true,shininess:0});
function OL(mesh,s=1.06){ const o=new T.Mesh(mesh.geometry,OLMAT); o.scale.setScalar(s); o.castShadow=false; o.userData.keepGeo=true; mesh.add(o); return mesh; }
function part(g,geo,col,pos,rot,scl,ol=1.06,matOverride){
  const m=new T.Mesh(geo, matOverride||toon(col)); m.position.set(...pos); if(rot) m.rotation.set(...rot); if(scl) m.scale.set(...scl);
  m.castShadow=true; if(ol) OL(m,ol); g.add(m); return m;
}

let LAYOUT=null;
function buildEnvironment(si){
  disposeGroup(env);
  const st=STAGES[si], th=THEMES[st.theme], MATCH=(Math.random()*1e6)|0, R=rng(900+si*31+MATCH);
  const MOODS=[
    {n:'Midday',     grad:null, op:0.45, sun:1.0,  hemi:1.0,  tint:0xFFFFFF},
    {n:'Golden hour',grad:'linear-gradient(180deg,#FFC27A,#FFE6B8)', op:0.62, sun:1.08, hemi:0.9, tint:0xFFE8C8},
    {n:'Dusk',       grad:'linear-gradient(180deg,#B89CE8,#FFB08A)', op:0.6,  sun:0.82, hemi:0.85, tint:0xE8D8F0},
    {n:'Dawn',       grad:'linear-gradient(180deg,#FFD0E4,#CFE6FF)', op:0.55, sun:0.92, hemi:0.95, tint:0xF6EEF6},
    {n:'Overcast',   grad:'linear-gradient(180deg,#BFCAD6,#E4EAF0)', op:0.5,  sun:0.7,  hemi:1.08, tint:0xE6ECF0},
    {n:'Spring bloom',grad:'linear-gradient(180deg,#FFE0F0,#E8FFE0)', op:0.5, sun:1.0, hemi:1.0, tint:0xFFF4FA}];
  const MOOD=MOODS[(Math.random()*MOODS.length)|0]; window.__mood=MOOD;
  scene.background.setHex(th.sky); scene.fog.color.setHex(th.sky); hemi.groundColor.setHex(th.hemiG);
  hemi.intensity = (st.theme==='snow'?0.5:(st.theme==='cave'||st.theme==='eclipse')?0.72:0.62)*MOOD.hemi; sun.intensity = (st.theme==='volcano'?0.62:0.7)*MOOD.sun;
  const gg=new T.PlaneGeometry(240,240,48,48); gg.rotateX(-Math.PI/2);
  const cols=[], base=new T.Color(th.ground);
  for(let i=0;i<gg.attributes.position.count;i++){ const v=0.9+R()*0.12; cols.push(v,v,v); }
  gg.setAttribute('color',new T.Float32BufferAttribute(cols,3));
  const POOLS={sakura:[['land_lush',0xFFFFFF],['land_forest',0xF0FFE8],['land_stone',0xFFE8F0]],
    bamboo:[['land_forest',0xD8F0C8],['land_lush',0xE0F4D0]], autumn:[['land_dry',0xF4E2BE],['land_forest',0xF0D0A0],['land_lush',0xF6D8A8]],
    snow:[['land_snow',0xFFFFFF],['land_stone',0xE8F0FF]], volcano:[['land_lava',0xFFFFFF],['land_stone',0x9A8078]],
    swamp:[['land_lush',0xD2E2AE],['land_forest',0xC8DCA8]], grave:[['land_stone',0xD8CEE2],['land_dry',0xC8BCD4]],
    storm:[['land_snow',0xE2EAF6],['land_stone',0xD0DCEC]], mist:[['land_forest',0xCFE6C8],['land_lush',0xD8ECD4]],
    coast:[['land_dry',0xFFF6DE],['land_lush',0xE8F6E0]], cave:[['land_stone',0xBDB6CC],['land_lava',0x8E88A0]],
    eclipse:[['land_lava',0xBFA8B8],['land_stone',0xB8A0C0]], forest:[['land_forest',0xFFFFFF],['land_lush',0xE8F6E0]],
    ember:[['land_lava',0xFFD8B8],['land_dry',0xE8B090]], temple:[['land_stone',0xFFFFFF],['land_dry',0xFFF0DC]],
    moon:[['land_stone',0xD2DCF6],['land_snow',0xD8E0F8]]};
  const pool=POOLS[st.theme]||[['land_lush',0xFFFFFF]], pick=pool[(Math.random()*pool.length)|0];
  const jit=new T.Color(pick[1]).multiply(new T.Color(MOOD.tint)).offsetHSL((Math.random()-0.5)*0.03,(Math.random()-0.5)*0.08,(Math.random()-0.5)*0.04);
  const LANDMAP=[pick[0],jit.getHex()], LROT=((Math.random()*4)|0)*Math.PI/2;
  const ground=new T.Mesh(gg,new T.MeshLambertMaterial({vertexColors:true,color:LANDMAP[1],map:tex(LANDMAP[0],14)})); ground.rotation.y=LROT; ground.receiveShadow=true; env.add(ground);
  { // a second, larger pass of the same painting breaks up any sense of repetition
    const big=new T.Mesh(new T.PlaneGeometry(240,240),new T.MeshLambertMaterial({map:tex(LANDMAP[0],3.5),color:LANDMAP[1],transparent:true,opacity:0.45,depthWrite:false}));
    big.rotation.x=-Math.PI/2; big.rotation.z=LROT+Math.PI/4; big.position.y=0.008; env.add(big);
    const detail=new T.Mesh(new T.PlaneGeometry(170,170),new T.MeshLambertMaterial({map:tex({forest:'g_mist',ember:'g_volcano',temple:'g_grave',moon:'g_snow'}[st.theme]||('g_'+st.theme),26),transparent:true,opacity:0.28,depthWrite:false}));
    detail.rotation.x=-Math.PI/2; detail.position.y=0.014; env.add(detail); }
  const pathTint={forest:0xD8CBA8,ember:0xC49878,temple:0xEFE4CC,moon:0xD6DEF2,sakura:0xFFFFFF,bamboo:0xE8DCC4,autumn:0xF4E0C0,snow:0xD9E6F2,volcano:0x9A7F72,swamp:0xB8A67E,grave:0xB0A6BA,storm:0xF0F2F8,mist:0xC6BE9A,coast:0xFFF4D8,cave:0xB6AEC4,eclipse:0x8C8092}[st.theme];
  const pathMat=new T.MeshLambertMaterial({color:pathTint,map:tex('g_path',1)});
  LAYOUT.lanes.forEach(pts=>{
    const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],0,p[1])));
    const N=90,w=1.25,pos=[],idx=[];
    for(let i=0;i<=N;i++){ const p=curve.getPoint(i/N), t=curve.getTangent(i/N), nx=-t.z, nz=t.x, ww=w*(1+0.12*Math.sin(i*0.7));
      pos.push(p.x+nx*ww,0.03,p.z+nz*ww, p.x-nx*ww,0.03,p.z-nz*ww); if(i<N){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); const uvs=[]; for(let q=0;q<pos.length;q+=3) uvs.push(pos[q]/3.2,pos[q+2]/3.2); g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2)); g.setIndex(idx); g.computeVertexNormals();
    if(g.attributes.normal.array[1]<0){ idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
    const m=new T.Mesh(g,pathMat); m.receiveShadow=true; env.add(m);
  });
  const court=new T.Mesh(new T.CircleGeometry(6.6,40),new T.MeshLambertMaterial({color:pathTint,map:tex('g_path',5)})); court.rotation.x=-Math.PI/2; court.position.set(0,0.025,1.5); court.receiveShadow=true; env.add(court);

  const nearLane=(x,z,d)=>{ for(const pts of LAYOUT.lanes) for(let i=0;i<pts.length-1;i++) if(pointSegDist(x,z,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1])<d) return true; return false; };
  const nearPad=(x,z,d)=>LAYOUT.pads.some(p=>Math.hypot(p.x-x,p.z-z)<d);
  const nearFence=(x,z,d)=>Object.values(LAYOUT.fences).some(f=>{ for(let i=0;i<f.length-1;i++) if(pointSegDist(x,z,f[i][0],f[i][1],f[i+1][0],f[i+1][1])<d) return true; return false; });
  const ok=(x,z,laneD=3.4)=>Math.hypot(x-KEEP.x,z-KEEP.z)>12&&!nearLane(x,z,laneD)&&!nearPad(x,z,5.6)&&!nearFence(x,z,2.8);

  // ground detail
  { const tuftCol=new T.Color(th.ground).offsetHSL(0,0.05,-0.08), flowerCols={forest:[0xFFFFFF,0xE8C86A],ember:[0xFF8A2A,0x6E3A2A],temple:[0xF6E8C8,0xE2B8C8],moon:[0xDCE6FF,0xFFFFFF],sakura:[0xF7B6D2,0xFFFFFF],bamboo:[0xFFF3A8,0xFFFFFF],autumn:[0xE8742B,0xF0B429],snow:[0xBFE3F5,0xFFFFFF],mist:[0xE8F5C8,0xFFFFFF],coast:[0xFFFFFF,0xBFF0FF],cave:[0xC58CFF,0x9FD8FF],eclipse:[0xFF6B6B,0x8C4A6E],volcano:[0xFF8A2A,0x3A2E2B],swamp:[0xF6A5C8,0xFFFFFF],grave:[0xC58CFF,0x8E84A6],storm:[0xFFF27A,0xFFFFFF]}[st.theme];
    const tufts=[], flowers=[], pebs=[]; let gd=0;
    while(tufts.length<180&&gd++<6000){ const x=-30+R()*64, z=-42+R()*66; if(Math.hypot(x-KEEP.x,z-KEEP.z)>8.5&&!nearLane(x,z,2.2)&&!nearPad(x,z,1.8)) tufts.push([x,z,0.6+R()*0.7,R()*6]); }
    gd=0; while(flowers.length<40&&gd++<3000){ const x=-28+R()*60, z=-40+R()*62; if(Math.hypot(x-KEEP.x,z-KEEP.z)>9&&!nearLane(x,z,2.4)&&!nearPad(x,z,2)) flowers.push([x,z,R()]); }
    LAYOUT.lanes.forEach(pts=>{ for(let i=0;i<pts.length-1;i++) for(let k=0;k<14;k++){ const t=R(), x=lerp(pts[i][0],pts[i+1][0],t), z=lerp(pts[i][1],pts[i+1][1],t), dx=pts[i+1][0]-pts[i][0], dz=pts[i+1][1]-pts[i][1], l=Math.hypot(dx,dz)||1, side=(R()<0.5?-1:1)*(1.8+R()*0.5);
      if(Math.hypot(x-KEEP.x,z-KEEP.z)>6) pebs.push([x-dz/l*side,z+dx/l*side,0.5+R()*0.6,R()*6]); } });
    const tg=new T.ConeGeometry(0.12,0.5,4); tg.translate(0,0.25,0);
    const tm=new T.InstancedMesh(mergeGeos([{geo:tg,pos:[0,0,0]},{geo:tg,pos:[0.12,0,0.05],rot:[0,0,-0.35]},{geo:tg,pos:[-0.1,0,-0.04],rot:[0,0,0.35]}]),toon(tuftCol.getHex()),tufts.length);
    tufts.forEach((t,i)=>{ _p.set(t[0],0,t[1]); _q.setFromAxisAngle(_Y,t[3]); _s.set(t[2],t[2],t[2]); _m4.compose(_p,_q,_s); tm.setMatrixAt(i,_m4); }); env.add(tm);
    const fm=new T.InstancedMesh(new T.IcosahedronGeometry(0.16,0),new T.MeshLambertMaterial({color:0xffffff}),flowers.length);
    flowers.forEach((f,i)=>{ _p.set(f[0],0.14,f[1]); _q.identity(); _s.set(1,0.7,1); _m4.compose(_p,_q,_s); fm.setMatrixAt(i,_m4); fm.setColorAt(i,C(flowerCols[f[2]<0.6?0:1])); }); env.add(fm);
    const pm=new T.InstancedMesh(new T.DodecahedronGeometry(0.22,0),phong(st.theme==='snow'?0x9AA7B4:st.theme==='volcano'?0x3A302D:0xA9A39A),pebs.length);
    pebs.forEach((p,i)=>{ _p.set(p[0],0.06,p[1]); _q.setFromAxisAngle(_Y,p[3]); _s.set(p[2],p[2]*0.55,p[2]); _m4.compose(_p,_q,_s); pm.setMatrixAt(i,_m4); }); pm.receiveShadow=true; env.add(pm); }
  { const sets={forest:['p_bush','p_rock','p_fountain','p_lantern'],ember:['p_rock','p_sign','p_cart','p_rock'],temple:['p_lantern','p_torii','p_fountain','p_sign'],moon:['p_rock','p_torii','p_lantern','p_rock'],sakura:['p_bush','p_lantern','p_torii','p_cart'],bamboo:['p_bush','p_fountain','p_lantern','p_sign'],autumn:['p_torii','p_lantern','p_rock','p_pampas'],
      snow:['p_rock','p_lantern','p_sign','p_pampas'],volcano:['p_rock','p_sign','p_cart','p_rock'],swamp:['p_fountain','p_pampas','p_bush','p_rock'],
      grave:['p_lantern','p_torii','p_rock','p_sign'],storm:['p_rock','p_torii','p_pampas','p_lantern'],mist:['p_torii','p_bush','p_rock','p_fountain'],
      coast:['p_rock','p_pampas','p_sign','p_cart'],cave:['p_rock','p_lantern','p_rock','p_sign'],eclipse:['p_rock','p_torii','p_sign','p_rock']}[st.theme]||['p_rock','p_bush','p_lantern','p_sign'];
    const H0={p_rock:1.9,p_bush:1.7,p_lantern:2.2,p_torii:3.6,p_fountain:1.8,p_sign:2.1,p_pampas:1.9,p_cart:1.8};
    const spots2=[]; let g2=0;
    while(spots2.length<26&&g2++<2500){ const a=R()*Math.PI*2, r=9+R()*22, x=KEEP.x+Math.sin(a)*r, z=KEEP.z-Math.cos(a)*r;
      if(!nearLane(x,z,2.8)&&!nearPad(x,z,5.6)&&!nearFence(x,z,2.6)&&Math.hypot(x-KEEP.x,z-KEEP.z)>11) spots2.push({x,z,k:sets[Math.floor(R()*sets.length)],s:0.85+R()*0.4,f:R()<0.5?-1:1}); }
    const byKind={}; spots2.forEach(o=>{ (byKind[o.k]=byKind[o.k]||[]).push(o); });
    for(const kind in byKind){ const list=byKind[kind], H=H0[kind]||2;
      const pm=new T.InstancedMesh(sprGeo,new T.MeshBasicMaterial({map:tex(kind),alphaTest:0.5,side:T.DoubleSide}),list.length);
      const sm=new T.InstancedMesh(blobGeo0,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.2,depthWrite:false}),list.length);
      list.forEach((o,i)=>{ const hh=H*o.s, ww=hh*(SPR_AR[kind]||1);
        _p.set(o.x,0,o.z); _s.set(ww*o.f,hh,1); _m4.compose(_p,camBill,_s); pm.setMatrixAt(i,_m4);
        _p.set(o.x,0.03,o.z); _q.identity(); _s.set(ww*0.55,1,ww*0.3); _m4.compose(_p,_q,_s); sm.setMatrixAt(i,_m4); });
      env.add(pm,sm); } }
  // painted cliffs
  { const ck={snow:'c_snow',storm:'c_snow',moon:'c_snow',volcano:'c_lava',eclipse:'c_lava',ember:'c_lava',cave:'c_lava'}[st.theme]||'c_rock';
    const tint={sakura:0xFFFFFF,bamboo:0xE8F2DC,autumn:0xF6E6C8,snow:0xFFFFFF,volcano:0xFFFFFF,swamp:0xE2ECD2,grave:0xD8D0E4,storm:0xE6EEF8,
      mist:0xDCE8D8,coast:0xF6ECD8,cave:0xCFC6DC,eclipse:0xD8C4CC,forest:0xDCE8D0,ember:0xF0C0A0,temple:0xF2ECDC,moon:0xE0E8FA}[st.theme]||0xFFFFFF;
    const cl=[]; for(let i=0;i<30;i++){ const a=(i/30)*Math.PI*2+R()*0.22, r=26+R()*14, x=KEEP.x+Math.sin(a)*r, z=KEEP.z-Math.cos(a)*r;
      if(nearLane(x,z,6)||nearPad(x,z,11)||Math.hypot(x-KEEP.x,z-KEEP.z)<24||(z>KEEP.z-6&&Math.hypot(x-KEEP.x,z-KEEP.z)<48)) continue; cl.push({x,z,s:0.85+R()*0.75,f:R()<0.5?-1:1}); }
    const H=9.5;
    const cm=new T.InstancedMesh(sprGeo,new T.MeshBasicMaterial({map:tex(ck),alphaTest:0.5,side:T.DoubleSide,color:tint}),cl.length);
    const csh=new T.InstancedMesh(blobGeo0,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.22,depthWrite:false}),cl.length);
    cl.forEach((c,i)=>{ const hh=H*c.s, ww=hh*(SPR_AR[ck]||1);
      _p.set(c.x,0,c.z); _s.set(ww*c.f,hh,1); _m4.compose(_p,camBill,_s); cm.setMatrixAt(i,_m4);
      _p.set(c.x,0.04,c.z); _q.identity(); _s.set(ww*0.6,1,ww*0.3); _m4.compose(_p,_q,_s); csh.setMatrixAt(i,_m4); });
    env.add(cm,csh); }

  // trees by theme
  const spots=[]; let guard=0;
  while(spots.length<90&&guard++<4000){ const x=-36+R()*76, z=-50+R()*84; if(ok(x,z)) spots.push({x,z,s:0.8+R()*0.5,r:R()*6}); }
  const inst=(geo,mat,list,fn)=>{ const m=new T.InstancedMesh(geo,mat,list.length); list.forEach((t,i)=>{ fn(t); _m4.compose(_p,_q,_s); m.setMatrixAt(i,_m4); }); m.castShadow=true; env.add(m); return m; };
  const trunk=(col,h=0.9)=>inst(new T.CylinderGeometry(0.18,0.24,h,6),toon(col),spots,t=>{ _p.set(t.x,h/2*t.s,t.z); _q.setFromAxisAngle(_Y,t.r); _s.set(t.s,t.s,t.s); });
  { const tk={cedar:'t_cedar',ashtree:'t_ashtree',crystal:'t_crystal',sakura:'t_sakura',bamboo:'t_bamboo',maple:'t_maple',snowpine:'t_snowpine',dead:'t_dead',willow:'t_willow',spooky:'t_spooky',stormpine:'t_storm',cedar:'t_cedar',coastpine:'t_coastpine',crystal:'t_crystal',ashtree:'t_ashtree'}[th.tree], th0={t_cedar:5.4,t_coastpine:4.4,t_crystal:3.4,t_ashtree:4.6,t_willow:5.0,t_spooky:4.6,t_storm:5.0,t_sakura:4.2,t_bamboo:5.6,t_maple:4.4,t_snowpine:5.0,t_dead:4.2}[tk];
    const tm=new T.InstancedMesh(sprGeo,sprMat(tk),spots.length), bm=new T.InstancedMesh(blobGeo,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.22,depthWrite:false}),spots.length);
    spots.forEach((t,i)=>{ const H=th0*t.s, W=H*(SPR_AR[tk]||1), fl=R()<0.5?-1:1; _p.set(t.x,0,t.z); _s.set(W*fl,H,1); _m4.compose(_p,camBill,_s); tm.setMatrixAt(i,_m4);
      _p.set(t.x,0.03,t.z); _q.identity(); _s.set(W*0.7,1,W*0.45); _m4.compose(_p,_q,_s); bm.setMatrixAt(i,_m4); });
    env.add(tm,bm);
    if(th.tree==='dead'){ const lava=[]; let gl=0; while(lava.length<9&&gl++<600){ const x=-30+R()*60, z=-44+R()*70; if(ok(x,z,4.5)) lava.push({x,z,s:1+R()*1.8}); }
      const lm=new T.InstancedMesh(new T.CircleGeometry(1,10),new T.MeshBasicMaterial({color:0xFF6A1A}),lava.length);
      lava.forEach((l,i)=>{ _p.set(l.x,0.04,l.z); _q.setFromEuler(_e.set(-Math.PI/2,0,0)); _s.set(l.s,l.s,1); _m4.compose(_p,_q,_s); lm.setMatrixAt(i,_m4); }); env.add(lm); } }
  // torii gates on lanes (shrine theme) and stone lanterns
  if(st.theme==='autumn'||st.theme==='sakura'){
    LAYOUT.lanes.forEach(pts=>{ const p=pts[1], q=pts[2], a=Math.atan2(q[0]-p[0],q[1]-p[1]); const g=new T.Group(); g.position.set(lerp(p[0],q[0],0.5),0,lerp(p[1],q[1],0.5)); g.rotation.y=a;
      const red=toon(0xD8342C), blk=toon(0x22202A);
      g.add(mk(new T.CylinderGeometry(0.18,0.2,3.2,8),red,-1.9,1.6,0), mk(new T.CylinderGeometry(0.18,0.2,3.2,8),red,1.9,1.6,0));
      g.add(mk(new T.BoxGeometry(5.2,0.3,0.4),blk,0,3.3,0), mk(new T.BoxGeometry(4.4,0.22,0.3),red,0,2.7,0)); env.add(g); });
  }
  for(const [lx,lz] of [[-7.5,-4],[7.5,-4],[-7,7],[7,7.5]]){ if(nearLane(lx,lz,1.8)||nearPad(lx,lz,2.4)) continue; const g=new T.Group(); g.position.set(lx,0,lz); const stone=toon(st.theme==='volcano'?0x5A5250:0xB9B3A6);
    g.add(mk(new T.CylinderGeometry(0.25,0.35,0.6,6),stone,0,0.3,0), mk(new T.BoxGeometry(0.55,0.4,0.55),toon(0xFFE9A8,{emissive:0x5a3a00}),0,0.8,0), mk(new T.ConeGeometry(0.55,0.35,4),stone,0,1.18,0)); env.add(g); }

  // castle keep
  const keep=new T.Group(); keep.position.set(KEEP.x,0,KEEP.z);
  { const H=7.6, W=H*(SPR_AR.b_castle||1);
    const cm=new T.Mesh(sprGeo,new T.MeshBasicMaterial({map:tex('b_castle'),alphaTest:0.5,side:T.DoubleSide}));
    cm.scale.set(W,H,1); cm.quaternion.copy(camBill); cm.renderOrder=1; keep.add(cm);
    const cs=new T.Mesh(blobGeo0,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.26,depthWrite:false}));
    cs.position.y=0.05; cs.scale.set(W*0.62,1,W*0.3); keep.add(cs);
    env.add(keep); env.userData.keep=keep; return; }
  const stoneB=part(keep,new T.CylinderGeometry(2.3,2.8,1.2,4),0x8E8A84,[0,0.6,0],[0,Math.PI/4,0],null,0);
  part(keep,new T.BoxGeometry(3.2,1.3,3.2),0xF4F1EA,[0,1.85,0],null,null,1.03);
  const r1=part(keep,new T.ConeGeometry(3.1,1.0,4),0x2F5D62,[0,3.0,0],[0,Math.PI/4,0],null,1.03);
  part(keep,new T.BoxGeometry(2.0,1.0,2.0),0xF4F1EA,[0,3.9,0],null,null,1.04);
  part(keep,new T.ConeGeometry(2.0,1.2,4),0x2F5D62,[0,5.0,0],[0,Math.PI/4,0],null,1.04);
  part(keep,new T.ConeGeometry(0.15,0.5,6),0xF5C542,[0,5.8,0],null,null,0);
  part(keep,new T.BoxGeometry(0.8,1.0,0.08),0x3F2A1C,[0,1.7,1.62],null,null,0);
  const pole=part(keep,new T.CylinderGeometry(0.05,0.05,3.2,6),0x3F2A1C,[2.0,1.6,1.6],null,null,0);
  const flag=part(keep,new T.BoxGeometry(0.06,1.6,0.7),0xD8342C,[2.0,2.3,1.95],null,null,0);
  keep.userData.flag=flag; env.add(keep); env.userData.keep=keep;
}

/* ================================================================ layout generator */
function genLayout(si){
  const st=STAGES[si], R=rng(77+si*13);
  const lanes=st.lanes.map(a0=>{ const a=a0*Math.PI/180, pts=[];
    [52,38,26,16,8,2.8].forEach((r,i)=>{ const wig=(i===0||i===5)?0:(i%2?1:-1)*(0.05+R()*0.09); pts.push(polar(a+wig,r)); }); return pts; });
  const fences={}, pads=[];
  const bd=Math.max(0.5,1-0.04*PK('build')), costScale=(1+0.15*si)*(si>=8?0.7:1)*bd, ingScale=(si>=8?0.7:1)*bd;
  const BC=(window.G&&G.mods&&G.mods.buildCost)||1;
  const P=(id,kind,cost,x,z,extra={})=>{ const p=Object.assign({id,kind,cost:extra.cur==='ingot'?Math.max(1,Math.round(cost*ingScale*BC)):Math.max(1,Math.round(cost*costScale*BC)),cur:'gold',x,z,req:[]},extra); pads.push(p); return p; };
  const laneCross=(pts,r)=>{ for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1], da=Math.hypot(a[0]-KEEP.x,a[1]-KEEP.z), db=Math.hypot(b[0]-KEEP.x,b[1]-KEEP.z);
    if(da>=r&&db<r){ const t=(da-r)/(da-db); return [lerp(a[0],b[0],t),lerp(a[1],b[1],t)]; } } return pts[pts.length-2]; };
  const nearLane=(x,z,d)=>{ for(const pts of lanes) for(let i=0;i<pts.length-1;i++) if(pointSegDist(x,z,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1])<d) return true; return false; };
  const nearFence=(x,z,d)=>Object.values(fences).some(f=>{ for(let i=0;i<f.length-1;i++) if(pointSegDist(x,z,f[i][0],f[i][1],f[i+1][0],f[i+1][1])<d) return true; return false; });
  const okPad=(x,z,padD=3.3,laneD=2.0)=>Math.hypot(x-KEEP.x,z-KEEP.z)>=4.8 && Math.hypot(x-KEEP.x,z-KEEP.z)<=22 && Math.hypot(x,z-6)>1.8 &&
    !pads.some(p=>Math.hypot(p.x-x,p.z-z)<padD) && !nearLane(x,z,laneD) && !nearFence(x,z,1.6);
  const crossA=lanes.map(pts=>{ const c=laneCross(pts,12.5); return angOf(c[0],c[1]); });
  lanes.forEach((pts,i)=>{ const ca=crossA[i], f=[]; for(let k=-2;k<=2;k++) f.push(polar(ca+k*0.17,12.5+(k%2?0.3:0))); fences[i]=f; });
  // lane order for towers: outer lanes first
  const order=[]; let lo=0, hi=lanes.length-1; while(lo<=hi){ order.push(lo); if(hi!==lo) order.push(hi); lo++; hi--; }
  P('range1','range',0,0,0);
  const baseSlots=[[-4.5,4.5],[4.5,5],[-9.5,3],[9.5,3.5],[-6,10],[6,10.5],[0,13.5],[-12,9],[12,9.5],[-3,18],[4,18.5],[-14,2],[14,2.5],[-9,15.5],[9,16],[0,21],[-16,12],[16,13]];
  const place=(p)=>{ for(const s of baseSlots){ if(okPad(s[0],s[1])){ p.x=s[0]; p.z=s[1]; return true; } }
    for(let k=0;k<400;k++){ const x=rand(-16,16), z=rand(2,20); if(okPad(x,z)){ p.x=x; p.z=z; return true; } } return false; };
  pads.pop(); const range1=P('range1','range',0,0,0); place(range1);
  const towers=[];
  order.forEach((li,k)=>{
    const ca=crossA[li]; let spot=null;
    for(const [da,r] of [[0.5,9.5],[-0.5,9.5],[0.68,10.4],[-0.68,10.4],[0.5,11.6],[-0.5,11.6],[0.9,9.2],[-0.9,9.2],[0.34,12.4],[-0.34,12.4]]){ const [x,z]=polar(ca+da,r); if(okPad(x,z,5.2,2.2)){ spot=[x,z,ca+da,da>0?1:-1]; break; } }
    if(!spot){ const [x,z]=polar(ca+0.5,9.5); spot=[x,z,ca+0.5,1]; }
    const req = k<2?['range1']:['tower_'+order[k-2]];
    const t=P('tower_'+li,'tower',12,spot[0],spot[1],{req, lane:li, ang:spot[2]}); towers.push(t);
    let cspot=null;
    for(const [da,r] of [[-spot[3]*0.55,10.8],[spot[3]*0.95,9.0],[-spot[3]*0.95,9.0],[spot[3]*0.55,12.0],[-spot[3]*0.55,12.0]]){ const [x2,z2]=polar(ca+da,r); if(okPad(x2,z2,5.0,2.2)){ cspot=[x2,z2]; break; } }
    if(cspot){ const c=P('ctower_'+li,'ctower',13,cspot[0],cspot[1],{req:['tower_'+li], lane:li}); towers.push(c); }
  });
  lanes.forEach((pts,i)=>{ const [x,z]=polar(crossA[i],9.6); P('fence_'+i,'fence',17,x,z,{req:['tower_'+i], fence:i}); });
  const basePad=(id,kind,cost,req,extra={})=>{ const p=P(id,kind,cost,0,0,Object.assign({req},extra)); if(!place(p)) pads.splice(pads.indexOf(p),1); return p; };
  basePad('dojo','dojo',11,['range1']);
  basePad('mine','mine',25,['dojo']);
  basePad('banner1','banner',30,['dojo']);
  basePad('armory','armory',30,['mine']);
  basePad('forge','forge',45,['mine']);
  if(SAVE.units.includes('onmyoji')) basePad('shrine','shrine',25,['banner1']);
  if(SAVE.units.includes('ninja')) basePad('ninja','ninja',28,['armory']);
  if(SAVE.units.includes('oniw')) basePad('onipit','onipit',32,['banner1']);
  if(SAVE.units.includes('yari')) basePad('yaripit','yaripit',14,['range1']);
  if(SAVE.units.includes('teppo')) basePad('teppopit','teppopit',25,['dojo']);
  if(SAVE.units.includes('sohei')) basePad('soheipit','soheipit',32,['banner1']);
  if(SAVE.units.includes('miko')) basePad('mikopit','mikopit',28,['mine']);
  if(SAVE.units.includes('tanuki')) basePad('tanukipit','tanukipit',35,['armory']);
  if(SAVE.units.includes('sumo')) basePad('sumopit','sumopit',39,['dojo']);
  if(SAVE.units.includes('kabuki')) basePad('kabukipit','kabukipit',32,['banner1']);
  if(SAVE.units.includes('falcon')) basePad('falconpit','falconpit',35,['range1']);
  if(SAVE.units.includes('kusari')) basePad('kusaripit','kusaripit',35,['armory']);
  if(SAVE.units.includes('komainu')) basePad('komainupit','komainupit',39,['mine']);
  if(si>=2) basePad('banner2','banner',60,['forge']);
  // level-2 and tower upgrade pads near their parent
  const near=(parent,id,kind,cost,req,extra)=>{ if(!parent||pads.indexOf(parent)<0) return;
    for(const [dx,dz] of [[0,2.7],[2.7,0.8],[-2.7,0.8],[0,-2.7],[2.4,2.4],[-2.4,2.4]]){ const x=parent.x+dx, z=parent.z+dz; if(okPad(x,z,2.6,1.6)){ P(id,kind,cost,x,z,Object.assign({req,cur:'ingot'},extra)); return; } } };
  towers.forEach(t=>near(t,'tup_'+t.id,'tup',5,[t.id,'forge'],{target:t.id}));
  [['range1','range2'],['dojo','dojo2'],['shrine','shrine2'],['ninja','ninja2'],['onipit','onipit2'],['yaripit','yaripit2'],['teppopit','teppopit2'],['soheipit','soheipit2'],['mikopit','mikopit2'],['tanukipit','tanukipit2'],['sumopit','sumopit2'],['kabukipit','kabukipit2'],['falconpit','falconpit2'],['kusaripit','kusaripit2'],['komainupit','komainupit2']].forEach(([a,b])=>{ const par=pads.find(p=>p.id===a); near(par,b,'lvl2',6,[a,'forge'],{target:a}); });
  return {lanes, fences, pads};
}

function genWaves(si){
  const st=STAGES[si], R=rng(4242+si*7), W=[]; let t=8; const nL=st.lanes.length;
  for(let w=0;w<st.waves;w++){
    const prog=w/(st.waves-1), g=[];
    const count=Math.min(nL, 1+Math.floor(prog*nL+R()*0.9));
    const idx=[...Array(nL).keys()].sort(()=>R()-0.5).slice(0,count);
    idx.forEach(li=>{
      const n=Math.max(2,Math.round((3+w*1.35)*(0.85+R()*0.3)/Math.sqrt(count)*1.15*(1+0.025*si)));
      g.push(['bandit',li,n,Math.max(0.4,1.4-prog*0.9)]);
      if(st.enemies.includes('oni')&&w>=2&&R()<0.3+prog*0.45) g.push(['oni',li,1+Math.floor(w/5),2.0]);
      if(si>=3&&w>=1&&R()<0.3+prog*0.3) g.push(['espear',li,1+Math.floor(w/4),1.3]);
      if(si>=6&&w>=2&&R()<0.28+prog*0.32) g.push(['earcher',li,1+Math.floor(w/5),1.7]);
      if(si>=11&&w>=3&&R()<0.22+prog*0.3) g.push(['eshaman',li,1+Math.floor(w/6),2.3]);
      if(si>=16&&w>=3&&R()<0.22+prog*0.28) g.push(['eshield',li,1+Math.floor(w/6),2.5]);
    });
    if(st.mini&&(w===Math.floor(st.waves*0.45)||(si>=4&&w===Math.floor(st.waves*0.72)))) g.push(['boss:brute',idx[0],1,0]);
    if(w===st.waves-1){ g.push(['boss:'+st.boss,Math.floor(nL/2),1,0]); if(st.boss2) g.push(['boss:'+st.boss2,(Math.floor(nL/2)+Math.ceil(nL/2))%nL,1,3]); }
    W.push({t:Math.round(t),g}); t+=20+w*1.5;
  }
  return W;
}

/* ================================================================ hero model */
const hero=(function(){
  const g=new T.Group();
  part(g,new T.CylinderGeometry(0.26,0.42,0.44,12),0x2B3D8F,[0,0.22,0]);
  const haori=part(g,new T.CylinderGeometry(0.22,0.3,0.36,12),0xF4F1EA,[0,0.6,0]);
  part(g,new T.BoxGeometry(0.44,0.06,0.44),0xD8342C,[0,0.44,0],null,null,0);
  part(g,new T.BoxGeometry(0.08,0.36,0.03),0x2B3D8F,[0.06,0.6,0.27],[0,0,0.35],null,0);
  part(g,new T.BoxGeometry(0.08,0.36,0.03),0x2B3D8F,[-0.06,0.6,0.27],[0,0,-0.35],null,0);
  part(g,new T.CylinderGeometry(0.1,0.1,0.55,8),0x6B3F1F,[-0.1,0.72,-0.3],[0.3,0,0.4]);
  const head=part(g,GEO.head,0xF6D2B0,[0,1.02,0],null,null,1.07);
  part(g,GEO.hair,0x2A3A7A,[0,1.04,-0.02],null,null,1.05);
  part(g,GEO.headband,0xE03A3A,[0,1.09,0],null,null,0);
  const face=new T.Mesh(GEO.face,faceMat('hero')); face.position.set(0,0.98,0.35); face.renderOrder=2; g.add(face);
  const bow=part(g,GEO.bow,0x3A1F1A,[0.38,0.66,0.12],null,null,0);
  const bow2=part(g,GEO.bow,0xFFE45C,[0.46,0.66,0.12],null,[1.15,1.15,1.15],0); bow2.visible=false;
  g.scale.setScalar(1.3); scene.add(g);
  const ring=new T.Mesh(new T.RingGeometry(0.93,1,56),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));
  ring.rotation.x=-Math.PI/2; ring.renderOrder=2; scene.add(ring);
  return {g,ring,bow,bow2,haori,mats:[]};
})();
hero.g.traverse(o=>{ if(o.material&&o.material.isMeshToonMaterial) hero.mats.push(o.material); });

/* ================================================================ boss models */
function bossMats(g){ const mats=[]; g.traverse(o=>{ if(o.material&&o.material.isMeshToonMaterial) mats.push(o.material); }); return mats; }
function faceMesh(g,key,pos,scale){ const f=new T.Mesh(GEO.face,faceMat(key)); f.position.set(...pos); f.scale.setScalar(scale); f.renderOrder=2; g.add(f); return f; }
function buildOniBoss(skin,loin,hairCol,clubCol,scale){
  const g=new T.Group(), arm=new T.Group();
  part(g,new T.CylinderGeometry(0.3,0.34,0.8,8),skin,[-0.5,0.4,0]); part(g,new T.CylinderGeometry(0.3,0.34,0.8,8),skin,[0.5,0.4,0]);
  part(g,new T.CylinderGeometry(0.95,1.0,0.5,12),loin,[0,0.95,0]);
  for(let k=0;k<3;k++) part(g,new T.CylinderGeometry(1.01,1.01,0.07,12),0x22202A,[0,0.8+k*0.15,0],null,null,0);
  const body=part(g,new T.SphereGeometry(1,14,12),skin,[0,1.7,0],null,[1.2,1.05,1.0]);
  part(g,new T.SphereGeometry(0.62,14,10),skin,[0,2.95,0.1]);
  part(g,GEO.hair,hairCol,[0,3.05,0.05],null,[1.9,1.9,1.9],1.04);
  part(g,GEO.horns,0xF5E6B8,[0,3.45,0.15],null,[1.8,1.8,1.8],0);
  faceMesh(g,'oni',[0,2.9,0.72],1.75);
  arm.position.set(1.05,2.25,0);
  part(arm,new T.CylinderGeometry(0.27,0.32,1.1,8),skin,[0,-0.45,0.1]);
  const club=part(arm,new T.CylinderGeometry(0.34,0.14,2.2,10),clubCol,[0,-1.0,1.2],[Math.PI/2,0,0]);
  for(let k=0;k<5;k++) part(arm,new T.ConeGeometry(0.09,0.2,5),0xC9C9D2,[Math.cos(k*1.3)*0.3,-1.0+Math.sin(k*1.3)*0.3,1.8],[Math.PI/2,0,0],null,0);
  g.add(arm); part(g,new T.CylinderGeometry(0.27,0.32,1.1,8),skin,[-1.05,1.75,0.1],[0,0,-0.3]);
  g.scale.setScalar(scale); dyn.add(g);
  return {g,arm};
}
function buildTengu(){
  const g=new T.Group(), arm=new T.Group();
  part(g,new T.CylinderGeometry(0.35,0.95,1.5,12),0x4B2E83,[0,0.75,0]);
  part(g,new T.CylinderGeometry(0.4,0.42,0.8,12),0x2A2433,[0,1.85,0]);
  part(g,new T.BoxGeometry(0.95,0.14,0.95),0xF5C542,[0,1.5,0],null,null,0);
  part(g,new T.SphereGeometry(0.55,14,10),0x2A2433,[0,2.75,0]);
  part(g,new T.ConeGeometry(0.2,0.8,8),0xF2A33A,[0,2.6,0.75],[Math.PI/2,0,0]);
  part(g,new T.BoxGeometry(0.34,0.28,0.34),0x111111,[0,3.35,0.1],null,null,1.08);
  faceMesh(g,'enemy',[0,2.85,0.52],1.5);
  for(const sx of [-0.22,0.22]) part(g,new T.BoxGeometry(0.2,1.3,0.06),0xF5C542,[sx,1.75,0.4],[0.12,0,0],null,0);
  const wings=[];
  for(const s of [-1,1]){ const w=new T.Group(); w.position.set(s*0.4,2.2,-0.35);
    for(let k=0;k<4;k++) part(w,new T.BoxGeometry(1.8-k*0.3,0.34,0.08),k%2?0x1E1B26:0x2D2838,[s*(0.9-k*0.05),0.4-k*0.3,0],[0,0,s*(0.35-k*0.15)],null,1.05);
    g.add(w); wings.push(w); }
  arm.position.set(0.55,2.1,0);
  part(arm,new T.CylinderGeometry(0.05,0.05,2.6,6),0x8B5A2B,[0,-0.6,0.6],[Math.PI/2.3,0,0],null,0);
  part(arm,new T.TorusGeometry(0.22,0.04,6,14),0xC9C9D2,[0,-0.1,1.8],null,null,0);
  g.add(arm); g.scale.setScalar(1.15); dyn.add(g);
  return {g,arm,wings};
}
function buildKitsune(){
  const g=new T.Group(), arm=new T.Group(), tails=[];
  part(g,new T.ConeGeometry(0.95,1.8,14),0xF7F3EC,[0,0.9,0]);
  part(g,new T.CylinderGeometry(0.42,0.5,0.25,14),0xD8342C,[0,1.55,0],null,null,0);
  part(g,new T.CylinderGeometry(0.32,0.42,0.6,12),0xF7F3EC,[0,1.9,0]);
  part(g,new T.SphereGeometry(0.52,14,10),0xF9DCC4,[0,2.62,0]);
  part(g,new T.BoxGeometry(0.9,1.3,0.3),0xF5F5F5,[0,2.2,-0.35],null,null,1.04);
  part(g,GEO.hair,0xF5F5F5,[0,2.7,0],null,[1.5,1.5,1.5],1.04);
  for(const s of [-1,1]){ part(g,new T.ConeGeometry(0.2,0.55,5),0xF5F5F5,[s*0.33,3.25,0],[0,0,-s*0.35]); part(g,new T.ConeGeometry(0.1,0.3,5),0xF6A5B8,[s*0.33,3.2,0.08],[0,0,-s*0.35],null,0); }
  faceMesh(g,'fox',[0,2.55,0.5],1.45);
  for(let k=0;k<9;k++){ const t=new T.Group(); t.position.set(0,1.2,-0.55); const a=(k-4)*0.28; t.rotation.set(-0.7,0,a);
    part(t,new T.SphereGeometry(0.28,10,8),0xFAFAFA,[0,0.95,0],null,[1,3.2,1]); part(t,new T.SphereGeometry(0.2,8,6),0xF28A2E,[0,1.85,0],null,null,0); g.add(t); tails.push(t); }
  const orbs=[]; for(let k=0;k<3;k++){ const o=mk(new T.SphereGeometry(0.2,10,8),new T.MeshBasicMaterial({color:0x6FE3FF}),0,2,0,false); g.add(o); orbs.push(o); }
  g.add(arm); g.scale.setScalar(1.15); dyn.add(g);
  return {g,arm,tails,orbs};
}
function buildYuki(){
  const g=new T.Group(), arm=new T.Group();
  part(g,new T.CylinderGeometry(0.34,0.38,0.9,8),0x2F4C7A,[-0.45,0.45,0]); part(g,new T.CylinderGeometry(0.34,0.38,0.9,8),0x2F4C7A,[0.45,0.45,0]);
  part(g,new T.CylinderGeometry(0.85,1.0,0.7,10),0xA9D8F0,[0,1.2,0]);
  part(g,new T.CylinderGeometry(0.75,0.85,1.0,10),0xE9F6FF,[0,2.0,0]);
  part(g,new T.BoxGeometry(2.2,0.2,1.0),0x6FB6DE,[0,2.5,0],null,null,1.05);
  for(const s of [-1,1]) for(let k=0;k<3;k++) part(g,new T.ConeGeometry(0.12,0.6,6),0xBFF0FF,[s*(0.8+k*0.15),2.85,k*0.2-0.2],[0,0,-s*0.3],null,0);
  part(g,new T.BoxGeometry(1.6,1.9,0.08),0x1D3557,[0,1.7,-0.7],[0.15,0,0],null,1.03);
  part(g,new T.SphereGeometry(0.55,14,10),0xF3E3E3,[0,3.1,0.05]);
  part(g,GEO.kabuto,0xDCEBF5,[0,3.25,0],null,[1.6,1.6,1.6],1.05);
  part(g,GEO.maedate,0x6FE3FF,[0,3.9,0.45],null,[2.2,2.2,2.2],0);
  faceMesh(g,'ice',[0,3.02,0.54],1.55);
  arm.position.set(1.0,2.5,0);
  part(arm,new T.CylinderGeometry(0.05,0.05,3.6,6),0x3F2A1C,[0,-0.7,0.9],[Math.PI/2.4,0,0],null,0);
  part(arm,new T.BoxGeometry(0.1,0.3,1.0),0xBFF0FF,[0,-0.05,2.6],[Math.PI/2.4-Math.PI/2,0,0],null,1.08);
  g.add(arm); g.scale.setScalar(1.12); dyn.add(g);
  return {g,arm};
}
function buildShogun(){
  const o=buildOniBoss(0x5B3F8F,0x22202A,0xF28A2E,0x22202A,1.3);
  const g=o.g;
  part(g,new T.CylinderGeometry(1.25,1.25,0.9,12),0x22202A,[0,1.85,0],null,null,1.03);
  part(g,new T.BoxGeometry(2.8,0.25,1.2),0xF5C542,[0,2.45,0],null,null,1.04);
  part(g,GEO.kabuto,0xF5C542,[0,3.35,0],null,[1.7,1.7,1.7],1.04);
  part(g,GEO.maedate,0xFF6A1A,[0,4.0,0.5],null,[2.4,2.4,2.4],0);
  for(let k=0;k<7;k++){ const a=(k/7)*Math.PI*2; part(g,new T.ConeGeometry(0.16,0.7,5),0xFF7A2A,[Math.sin(a)*0.55,3.55,Math.cos(a)*0.55-0.25],[Math.cos(a)*0.6,0,-Math.sin(a)*0.6],null,0); }
  return o;
}

/* ================================================================ audio: adaptive music + sound FX (all synthesised, no files) */
let AC=null, master=null, sfxBus=null, musBus=null, revIn=null, noiseBuf=null; const lastSfx={};
let AUDIO_MODE=(SAVE.audio==null?2:SAVE.audio); if([0,1,2].indexOf(AUDIO_MODE)<0) AUDIO_MODE=2; // 2 = music+sfx, 1 = sfx only, 0 = muted
try{ if(navigator.audioSession&&navigator.audioSession.type!=='playback') navigator.audioSession.type='playback'; }catch(e){}
function audioInit(){
  if(AC){ if(AC.state!=='running'&&AC.resume) AC.resume().catch(()=>{}); return; }
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    const comp=AC.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=0.004; comp.release.value=0.18; comp.connect(AC.destination);
    master=AC.createGain(); master.connect(comp);
    sfxBus=AC.createGain(); sfxBus.gain.value=0.55; sfxBus.connect(master);
    musBus=AC.createGain(); musBus.gain.value=0.30; musBus.connect(master);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*1,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const conv=AC.createConvolver(), len=AC.sampleRate*2.2, ir=AC.createBuffer(2,len,AC.sampleRate);
    for(let c=0;c<2;c++){ const ch=ir.getChannelData(c); for(let i=0;i<len;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/len,3); }
    conv.buffer=ir; revIn=AC.createGain(); revIn.gain.value=0.35; revIn.connect(conv); conv.connect(master);
    applyAudioMode();
  }catch(e){ AC=null; }
}
/* ---------------- bridge to the new Goldstack score engine (audio.js) ----------------
   When the page loads audio.js, it owns the music and the core effects; the old built-in
   score goes silent and the game drives the new engine's stage, phase and intensity. */
function GS(){ return null; }
function silenceOldScore(){ const a=window.gsAudio; if(!a) return; try{ if(a.stopMusic) a.stopMusic(); if(a.setMuted) a.setMuted(true); a.playMusic=function(){}; a.sfx=function(){}; a.unlock=function(){}; }catch(e){} }
silenceOldScore(); setTimeout(silenceOldScore,500); setTimeout(silenceOldScore,3000);
const GS_SFX={click:'uiTap',coin:'coin',deposit:'stack',ingot:'coin',build:'build',buy:'upgrade',bow:'shootArrow',magic:'shootMagic',zap:'shootMagic',
  hit:'hit',die:'enemyDeath',hurt:'gateHit',warn:'waveIncoming',horn:'waveIncoming',boss:'bossRoar',waveclear:'stageClear'};
const GS_STINGER={wave:'waveIncoming',boss:'bossRoar',win:'stageClear',lose:'gameOver'};
let gsState={stage:0,phase:'',inten:-1,started:false};
function gsApplyMode(){ const a=GS(); if(!a) return;
  try{ if(a.setMuted) a.setMuted(AUDIO_MODE===0); if(a.setMusicVolume) a.setMusicVolume(AUDIO_MODE>=2?0.8:0); if(a.setSfxVolume) a.setSfxVolume(AUDIO_MODE>=1?0.9:0); }catch(e){} }
function gsDrive(G){ const a=GS(); if(!a) return;
  try{
    if(!gsState.started&&AC){ if(a.unlock) a.unlock(); if(a.playMusic) a.playMusic(); gsState.started=true; gsApplyMode(); }
    let phase='menu', inten=0.15, stage=1;
    if(G&&G.state==='play'){
      stage=(G.si%5)+1;
      const n=G.enemies.length, boss=!!G.boss, prog=G.waves?G.waveIdx/Math.max(1,G.waves.length):0;
      if(boss){ phase='boss'; inten=0.8+0.2*(1-G.boss.hp/Math.max(1,G.boss.max)); }
      else if(n>0){ phase='combat'; inten=0.35+Math.min(0.45,n/40)+prog*0.2; }
      else { phase='build'; inten=0.2+prog*0.25; }
      if(G.keepHp<G.keepMax*0.3) inten=Math.max(inten,0.9);
      if(G.paused||G.armOpen) inten=Math.min(inten,0.25);
    } else if(G&&G.state==='win'){ phase='victory'; inten=0.5; }
    else if(G&&G.state==='lose'){ phase='defeat'; inten=0.2; }
    if(stage!==gsState.stage){ gsState.stage=stage; a.setStage(stage); }
    if(phase!==gsState.phase){ gsState.phase=phase; a.setPhase(phase); }
    const iv=Math.round(Math.min(1,inten)*20)/20; if(iv!==gsState.inten&&a.setIntensity){ gsState.inten=iv; a.setIntensity(iv); }
  }catch(e){} }
function applyAudioMode(){ SND.applyMode(); if(!AC) return; const t=AC.currentTime; sfxBus.gain.setTargetAtTime(AUDIO_MODE>=1?0.55:0,t,0.05); musBus.gain.setTargetAtTime(AUDIO_MODE>=2?0.30:0,t,0.3); }
function cycleAudio(){ AUDIO_MODE=(AUDIO_MODE+2)%3; SAVE.audio=AUDIO_MODE; persist(); applyAudioMode(); const el=document.getElementById('audioBtn'); if(el) el.textContent=['🔇','🔔','🎵'][AUDIO_MODE]; toast(['Sound off','Music off, effects on','Music and effects on'][AUDIO_MODE],1.2); }

/* ---- instruments (time-scheduled) ---- */
function aenv(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
function osc(type,f,t,dur,dest){ const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); o.connect(dest); o.start(t); o.stop(t+dur+0.05); return o; }
function nz(t,dur,dest,type,freq,q){ const s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=type; f.frequency.value=freq; if(q) f.Q.value=q; s.connect(f); f.connect(dest); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); return f; }
function pluck(f,t,vol,dur,bus,rev){ // koto / shamisen
  const g=AC.createGain(), lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(Math.min(9000,f*7),t); lp.frequency.exponentialRampToValueAtTime(Math.max(300,f*1.5),t+dur);
  g.connect(lp); lp.connect(bus); if(rev) { const s=AC.createGain(); s.gain.value=rev; lp.connect(s); s.connect(revIn); }
  aenv(g,t,0.004,vol,dur); const o1=osc('triangle',f,t,dur,g); o1.frequency.exponentialRampToValueAtTime(f*0.997,t+dur);
  const g2=AC.createGain(); g2.gain.value=0.35; g2.connect(g); osc('sawtooth',f*2.001,t,dur*0.5,g2);
}
function taiko(t,vol,bus,big){
  const g=AC.createGain(); g.connect(bus); aenv(g,t,0.003,vol,big?0.9:0.38);
  const o=osc('sine',big?95:140,t,big?1:0.45,g); o.frequency.exponentialRampToValueAtTime(big?38:55,t+(big?0.5:0.22));
  const gn=AC.createGain(); gn.connect(bus); aenv(gn,t,0.002,vol*0.5,0.08); nz(t,0.1,gn,'bandpass',big?300:600,1);
  if(big){ const s=AC.createGain(); s.gain.value=0.4; g.connect(s); s.connect(revIn); }
}
function shime(t,vol,bus){ const g=AC.createGain(); g.connect(bus); aenv(g,t,0.001,vol,0.07); nz(t,0.09,g,'bandpass',2200,3); const g2=AC.createGain(); g2.connect(bus); aenv(g2,t,0.001,vol*0.4,0.04); osc('sine',900,t,0.06,g2); }
function woodblock(t,vol,bus){ const g=AC.createGain(); g.connect(bus); aenv(g,t,0.001,vol,0.05); osc('sine',1500,t,0.07,g); }
function bass(f,t,dur,vol,bus){ const g=AC.createGain(), lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420; lp.Q.value=4; g.connect(lp); lp.connect(bus); aenv(g,t,0.01,vol,dur); osc('square',f,t,dur,g); osc('sine',f/2,t,dur,g); }
function pad(f,t,dur,vol,bus){ const g=AC.createGain(); g.connect(bus); const s=AC.createGain(); s.gain.value=0.6; g.connect(s); s.connect(revIn);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+dur*0.35); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  [0.996,1.004].forEach(m=>osc('sine',f*m,t,dur,g)); }
function flute(f,t,dur,vol,bus){ const g=AC.createGain(), lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2600; g.connect(lp); lp.connect(bus); const s=AC.createGain(); s.gain.value=0.35; lp.connect(s); s.connect(revIn);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.06); g.gain.setValueAtTime(vol,t+dur*0.7); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  const o=osc('triangle',f,t,dur,g), lfo=AC.createOscillator(), lg=AC.createGain(); lfo.frequency.value=5.5; lg.gain.value=f*0.012; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t+dur+0.05);
  const bg=AC.createGain(); bg.connect(g); aenv(bg,t,0.02,0.3,dur); nz(t,dur,bg,'bandpass',f*2,2); }
function gong(t,vol,bus){ const g=AC.createGain(); g.connect(bus); const s=AC.createGain(); s.gain.value=0.8; g.connect(s); s.connect(revIn); aenv(g,t,0.01,vol,2.6); [180,283,409,561,747].forEach((f,i)=>{ const gg=AC.createGain(); gg.gain.value=1/(i+1); gg.connect(g); osc('sine',f,t,2.8,gg); }); }

/* ---- scales ---- */
const YO=[0,2,5,7,9], IN=[0,1,5,7,8];
const ROOTS=[160,151,142.5,134.5,127,119.8,113.1,106.7,100.7,95.1,98.0,92.5,87.31,82.41,77.78,110.0,98.0,92.5,87.31,82.41,123.47,110.0,98.0,87.31,82.41,146.83,164.81,130.81,138.59,123.47,155.56,116.54,110.0,174.61,196.0,103.83,98.0,92.5,87.31,82.41,146.83,130.81,110.0,98.0,87.31,164.81,123.47,103.83,92.5,82.41];
function nf(root,scale,deg,oct){ const n=Math.floor(deg/5), i=((deg%5)+5)%5; return root*Math.pow(2,(scale[i]+12*(n+(oct||0)))/12); }

/* ---- adaptive music engine ---- */
const SOUNDS={"click": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAE5ABVVVVVVVVVVVVVVVVVVVVVVVVVf39/f39/f39/f39/f39/f39/f3+qqqqqqqqqqqqqqqqqqqqqqqqqqtXV1dXV1dXV1dXV1dXV1dXV1dXV//////////////////////////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJAOFAAAAAAAABOTh0UcMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAegK2TUYQAByqGslx6wAABAADZO2IAgAIYeAAAEEI9nkwAAEBjD+JwcDCwffLg/BMH8uCAY6wfB+D4Pv//ygPh/ygY/85y4P//+UBAAdgEAALUJZzVEqyCdbYalvwwTxXXpCABH0sLnNMx1FJMQI6jHjoAegmk7t+jzkCeG4fipQ+aps75odpqOlJHMDyWy2TTosejUqJ5sZqH4uur//3xVQeSJz/ji////3WUpPqTphy4qn8sWHLDp0NL//5VSFZlAAxaS4k5QlhP/+1LEBYCLaHdBHPMAAWePpi2EmCh4ymogx0p1QvFydL1WvACNkjHOOWSSZhwUSpv/5NCZU1Ekki/OOaRIkQEFHNXqBoO3NMrDcVh3DpUmrBV4299Hcp6FqDuzThpr2qYepu7/e4KJpIkCK6aRlh4Usya/D4gD4pnXpMoWRBupKYFkexL58fPOkRvLEJ0bv/AlijekkGFWyUFXkyLJUkLCVLllTpd4sCqSGlEqeU+0ySUxjh4BmuVdVeK9Cj2v9FVQyAgxbKslrRuYni87PJ2igP/7UsQIgAsc5RqqmG3BZ60eWeSMCUWAVHPRJYKAQCEoz6dFtnK5qrRZ2/OSYK00jGPn2/VdgzfeGv/0qTMal/s0anDwwp5AiSuw0WeIjx4NFXHSPOq+VgrlXV8rPAgAZuDr6ALQDhGyecKgSxqXGKQCDGq6hVKMK4VJQokTKf61bWaHV1LY1DOJh/GClnPyYzbIvCoawqTL99aJYybNsrD4oDDWaw/1Um/zL/7SDUmn9Af/X74rmT8YgLowDMBKPKQHAQas9KKhDJOOpvJ6JJFk//tSxA0DyUBe2A/lIIG1kVrCvsAAbUCtEHbRhTELBR5fJQg5aJnyjrAwQBkFxi2rBVLFeqlRVH/W7+/Ko+3ro1ZFTyoBP4eGtTFgCGQxmALgMH6B5jAoAQ8wS0C9MCbAgTAGQDgwDIAAAgA0CgBESAB2HwC80HPoygG4Vj2JIFHSYLhFKQQMpi3CXmhLcO0ReudpEithmphy/mrrGztqKX3XaoR46f3P/9H//2/7f///8mpABAQwxwAAAAAbDIyYIIiwDW6/cPqrTH/TSxrz4/7/+1LEDwANgLUjObaAANyFU5uGMABcYlhLdNaYbAWkQL3QiZhdhrGzzybm6AckegwQnxH+yC3Tl0xNTJRt+yHzrmJgiDf3JhUAgkHTvuT1gsWaEgl/6LweJBIDAUkw9///2hIAgChHVXZm6wEKNQFdgEBUBA0JT3/8OrOxKdETxMHVhpX///w0oOrETxL//101A0VDSgVOiJ4LVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "buy": "data:audio/mpeg;base64,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", "rank": "data:audio/mpeg;base64,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o5HTNWWpdlUVXU612X1f//r////poOaEDEIAFyoHQzgcoqL4h5Pk4S5qz///////t+///q+uxdapAFq+//tSxFEDSm2jGEiWscEttGME8NE6S7dDcGPGZo9jwE0eiMQx+Va/6RZMVS0ZjCP2j//9j8VJP/kTu3/sd6ulr+gUTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEX4PGAAkTQwxAAAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "open": "data:audio/mpeg;base64,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", "close": "data:audio/mpeg;base64,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", "coin": "data:audio/mpeg;base64,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+9DlVSVWdoiDAAAA8P/7UsQEgIokxz38NIABOpmlIDSOcRidER9rDlCgJNCnqf2qmsaRFkRM/GdQoRSSkset/KUrTIRCKg0RItmqhjvvI3///1pSlXU75JVs7mktFpEs0CqTx3N94WAhV4kFaAIZiQwq/xiunSoDWPEJF5UFmzyZbMJioGclxTN6rJweCwLkqEHwiRGj5XJfpocalL7sWYrTTJbk1pKmxAsrZCCLB0hzYVGlYfXPf+kBJyNwAAIGRgtQggnV1dbn5VDFCHZUqjKj7EwxspFrCPCwGIBC//tSxBKACJDRK6EEZEEvmmPkYI+AjwVvVrE6pvYg9jf0kNPghVM1JmNg4JM3dCHU///V4cAACgAAZSo+kCpi/5h9tv7MWqUaN5DyD6UUaRGnhKrRh7ZCWetG1aUDlMg8FeA2HRgJk2pS1wwdFIaqM18uhBlzFiN3+r/rS0v1//0qCc6PpFSRhe6qXZn+3tQg23UNRxLIgvOoWmGpNscIRVaID1VpKYC0pFBY9b6W4M09cFfamGMSEgqNJDQOkopt8sTkHufq/R6z9Y0NVho0RjL/+1LEKAIJQL8aJJhpwSyaI1STDPh1zS/M8TcvtZ7ZPMZCRK46Hs89nJtDUUpOLAFUs8dmPum4UMMhObPDbWdIiZ+lQTVJhDYYKYZu3zPUm7hX93f0149nIYpVIg2IR8uG2JL3f5WV0RYV1ChHZOjb64ulGFkAcv/0uCOBSNjgozmeZY+gJztLnv1KUi/zkjm+opoQGkGSRZLLH6HxX6fJP9pD+V/0gttKLGo4ceIXtUW6OqOBVIESYDBQa6gjDal1UOZCsjlNulGgpQNGjQNElv/7UsQ7AglkzRgEmGuBBI+jpGKM6OfEpUOqTPB0skrNfxKxD/+//6bP6msVEAGapARYYkWJqsao1JQTky6sCDwVGAUWNBXCoCJAySfX6AkBSP6yISHlRG6EgSJPi5Yk+LGmVpFgL/CpkJdDPj3ckFQElUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxFKDyLA4/kGYYkAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "deposit": "data:audio/mpeg;base64,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", "ingot": "data:audio/mpeg;base64,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", "build": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAANAAALbAAkJCQkJCQkNjY2NjY2NjZJSUlJSUlJSVtbW1tbW1ttbW1tbW1tbX9/f39/f39/kpKSkpKSkqSkpKSkpKSktra2tra2trbJycnJycnJ29vb29vb29vt7e3t7e3t7f////////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJALTAAAAAAAAC2xPv2Q4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAocYUT1kwABgRtt9zKgAgAgAAJwGeOnkADjciOaQ4GjQIAwCKCD6Y6g6p1jsTa+78PgAAAAAAAgQjt/+0QQJk07uzyaZAgQBAEAQB8Hwff8EHZcH//wfD/Kfy4P8EAQOAC7SyQRi0figYDgYAAAu9r5jCPc7kUAjpIMUJSQyx3iXUoFMQ9Y8CiAyh2AqIIG474DQxBtGpyt8jBuCaBSBCU0eqb8fEI9HqHf/nohEaPR7//j4fD5ZykIq/9QNHYBESoWAAMH4LIDNqX/+1LEBINLkIMaXfaAAWwN4QH+MGhqsytYNXMImB3TBOALcwFgBZJgDEFABRgAoAM+uQqASmAEAAI8AELvdF9GJBYnCtAli0e5KD1N6Sa2MlmiRo539XRVRSWg7e5qZftX1e+nwmU/+PMRbKqjP6W68wm4SzMOABGD84LNjCw0OLzNweMciMGkExMAAaCy5SiTbNJoGZDYTk7whFsBpyEoNj9360etggrI2vn5+bWnPmWuYs5CQ5+Giwd1gt8t3ior/8GqMpih0z+hSEwxKEMxMP/7UsQGg8ggMQAP7yIA2oQfwf3gSG2BFj6WE05COd06hAVmDR0FHgL4yxpz9QzKJ2pTY8unA4DYKrIjn1qUWe085P2///o//+g0j6wDPm6lDzJeRTUwJEH+Oc/zZZwyRdMVNBSI8YHNedftfGlFz46BvX9dif////////////9tOpm7YzRThyY6I0meMSmD3zdOEDPJOTJMxjEgdxULAwKAMKwYDql2chjV+oIIQhE3qJ6CF08jbOp2YyIKimc3Ce/////U7//////0Hg0Zzpld//tSxCiDyWR08A/0Q0GPIV2CvlAAvxIZFmaoGLgBfRhHwGkYIGCZmBpgV5gUIB6YAsAIGADAAxgBoAqDgAtT9NKq83Njw8PYUAp0DRUaEsXUWO9GGHYeKlUjCI250NIJOmhkcUlQVUWiD6P////////oDjiKoC0wTQHhP5QpojEKABg3VrMzMJHCkjAhQHZ7TA+wEWKmBwATspwtTlPV8tnFKC9yOdoHuYPKFBpMj5kXl5ogeLsOqqs04+6QXuJcw6pHuLPjR4y4qvW+q8+htV//+1LELwAOMQLwGfQAAW8W3cO+UAD/////////I/1/Jf/91f/////+w8G6FdP7JL/jPERm4xuUUsMMNBhjAkwG8wQwEbMC+AOzAHQFYwC4AJMAHAIAEAZWufe/7h8PDooPqQ5yvHjzWOziAyxHMSysLnkY3I6Peq7Fetm8UqGt////3fqqPxAZ0TyBrhM2i0e7MDhC1DQmbMvwgyMnTAZkAopDBeLDkmAT5bzlN+WW5upUMSMJFgUKDpRRBdSIMPETMLloPi7nEREcZlnEREVLGv/7UsQmA8xlNuoP8KOBjibdQfMJuDxeVpjpVhrDUo8pm//////////493/0HzfHfxwBEZkcE+LMGF/AxpgzIIUYFsBBmA3gIhgIQBKNAAwgAAS8TBdTVqwo1lYUJ3lnUctRnQkjrQOQ74chNRR72Gmy4SpteiaEKhECrqN0EDDUIxz/////9CN8jf//8B//RT46FQY1xj9aMOiHLDB4wf07rmNrizOFAy85MeJjEgYHB7FJFTWLWU1Kq2UvFXuNHiRiiYcGPD5lOQUjih+IGYgo//tSxCCDzH0K6g/so4GDoV1B8xXwLuJnIdiiAecpzLlQBial5kD5aKHxz/////+B/xYd/4if/9B9RChQY8Ezrmk4AN5hWYB0RBCAKBMhYCoBwDGYAsABAAAAUzgixR0kj3Tkik9PqO0WbzEk0LJEyu3tEWI3b3diYeSBS5cwrnpVJEzq9VP56Dw6HHbV/////UQ/C2/P//+hP8kRLjGEhwUxwIK5MDuAoDhUc0IeMpDzGAgwkHLTrsbnLZvVHNUszRdqWsq9YbjgkFHEcmeRUob/+1LEHAPM5SboD+zjwYKoXQHzFXgLCJMRUc4tNYypdyuYWZyo1GxYvygsHRIG7iYWnlO46/E1scL/////b//9Yf//9B/2hcEZQQTQGNZAwAVAhxEAjFQAbC4AYgjS0k0jeTAoHHnSRMUdtlIjoCYWphpLL9InDSzbRpA5FM9MvvUUErOBiUFGFzMhynEorjRcPPE7syjwk////////6wJ//Gm/6EAChOsgCLDOQypkxAgC/BwDMgY6kXbBnMwDtISkXI5is7DXYM6S6vkl3VmQ//7UsQWA4n1Qu5PmEvBHQeeSf4MIEOyEbr5bb8ZJ2wpyOhWYbqn1cRhX4R//9P/////qg3/9RH/QeZwrgbuYDwGing26Y6GxhMIgYCJhs4Z27cIzGHQPXIEXDYd2II02LhIebMKaXWmLEWgwEioLH0GpdT5GW/q//+tH87/rd/WPk6F5TB+wqg8TJoxGDUBAUXhX09ktjsVmw0MLF6EynhLQeuLw+tmYuTLz4vjtyjqFdhj1dDdbRxaboaPhSjOcd/mYq29H//////+gkTx0BKs//tSxCiDiXCm6g/1AQE+qF2J8Yoww3sM0MBXAJh4ASXS0OSv1hHMof5Ke1ZRfxzm5pTchIhq6ZKx+tGOrdSKPHdCq1SMRZxnJ1UGDPzpgDqPsor//T/////6//8M3/RVAA8zh2gdUwo4EnA/ocM5kojMWiNQOGeODkDKLClYLZINF3bQgySPvUWiHUFi12UEyErZlIEJUty2U7opJX//p/////9f/+D/63f1hKo69IELMG3Ajh85YaP4xmnlUcmLUJeD5tyo6yWsqvTlMQUGPMf/+1LEOIOJZUDyT+RAwTOXnc38oCA0fSw+8U6WMNhyttxS65ePziBQSI3nKNofAqb4/9X//1/yw//W7+sAABKk68oCQMH2AGzGMIFEoe7GnfoCb5BM4CTYI2gY0rtlyFZEl+/G52vcLLTiJekIxJEvzSu+Fuc77D9tNZss7Xhfn9l/q/1/6/9f/ccZsFqmGRCQxhnQOEYJYB+GAoARZgUYC+YCCAbgUAUEgCgUAAE1W3o6SkxlFoUEYByMoMRB6VgOE85ekHMK4isiOZ7WhZD6pP/7UsRKg8msvO5v4MDBPRSeAr4wABCznnaOQKzaKIkFgtFg0GgsDgTAIAKJTxskXoW5RR/0HxYAMQEjDiH/AIaHB5QIGBh3+aSojrVM9v/4wGHWATzLnIVf/+GILUAYjyIyrDM9Vz///mwC8U13ZLvshUFZ4uV/P///4HUHkUsedwFhqBhz/sqeb////7FJY+ku22ky50YS6LivF//////vP8/5+HJTcl1aNTcqtyn/5UAjFDjwAI0bwhQhxLnNWzKY0nFiQ5mjf2sTMzahQEeC//tSxFoAExT9P7m8ABESBuGLnjAAsShsShqDXEQcER75U6VysFZY9wa/xLO/g11Hix6JeVOlXfLHi35U7xLVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "bow": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAE5ABVVVVVVVVVVVVVVVVVVVVVVVVVf39/f39/f39/f39/f39/f39/f3+qqqqqqqqqqqqqqqqqqqqqqqqqqtXV1dXV1dXV1dXV1dXV1dXV1dXV//////////////////////////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJAMbAAAAAAAABOSmKMzvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAixAW6UEQABrh/zNxiQAnEgACC5KY5DGMYxjHV6EIQjdTnO853//0O/8hPoQ5znOc7zn0IQjHOc5zn7//+QhCEapwAQCDv8ufWD74Y8o6CAY9H6wfttkckct0lkkkcklbbAXCuSDzJKURlKNq5xYeuK65M8rRABL1Yq8XFVDWxsrm0Cz3a/vSThdU+Pdb72D/72n172trpP3IeptJx3pp5DY+E8+xdUTuT/qNantePa+qsmGh0WBZ6xtSfnxdR+EnkBcDBAIQAELzr/+1LEBQALxP9l3PaAAV0dLPzzithih5Nw4oxOmSEZ50vVa9N0NwTQumB4KIrRRnRpNUVooBbS6k7mRm3Kj/SNzVHMSUS6kvOFJJ92rRMSMvUZH1dBLpG5qrV9T9aP0a7TJ/nd1TVFXJXni9jBOTuhMZ7B2Ry+Bz4P5CIzeh3SR9woW3gsJ1M7UXIgWN4ngoxB6zrA3p8lpwJaOUfx3439G8VC7x1ugz9/R/KIbp0Z7FsKtI1Ar9/ljbQkPY3dnlWKWgCwYFAQgA9eHlyhlc1VZf/7UsQIAAxFQU/sNLEBe5ondZaO4L29ag7XFHWgW9bW0VlbxWLb6gbjR7qEGNuYgTE8o3mZh3GopdRMP+EH7ivhIf9+op41m4SFugDBp2dhV9FlR0EnatStzOv9DK3+WZ0SxlFUfg0qHxBAwAApAHtyrwxKwImpXDDW4BtDKCZ78P/GFznOYhaySTwIKrNQntZylb7HO/uJGSNItlBzEOFs2CiHk+gFSV2Fihzpv41G3mXytLk0gtzJLsmJh8AnlT2eyrkf6wCEgBAEAAfL8qrp//tSxAWAC7jFK01lrwFtlGQhrLXgBZcNIpbPZQ6Fma4J6lfYRKQ9QrGJGuM4oV0KCIGs/dGB4d1vJuJwMvbcfulgp2ct4ScB+KT1HQUIydR8JMf5iMrxNvWdbqHEUUqjESlJ8nIV44QEESABs3blO6Bl3iDkXs2IGBLxWuXxCH0ND1NUSnLmJKIeCh2Ly2XQ0XgTjncqrYjnYeavGM44xa/+rYGpj+mF5KbVkiCSnugk3H5n6K/Hq+R+z////////73X1Tbc3FSntAzir+AXUrb/+1LEBoAMGMU1R7BpyS8LYoBkmhA9r+AkGC9JCDwMi0ZM1EIppqn68On46a2IvekOXikZwOH4oyeYEdzQUZHNT80eKTymjyAAcMJFhAYoQEBsIDglFkBZEYWkLTo5UciSdJUjgp6VqlTVEhJRMMFAoGglLbJxdoki2DQpEQyRnhUVQHyUiGS4wkbC0aLDwVAQSSEjQVAQqZCRoKGgqRBYiMJAUUArHbX9LXt0i6ceSft///6lTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "slash": "data:audio/mpeg;base64,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FMlwfCxE9aLuO/5k5To99PT7qNtDVTSNSuj/gUyqAYHi6fHpbQnD5tdRAUk4yVJuk4yhL01slrpLZG/oXRu7Oct2/u9m2etY70yYRKFCZRJhfme9t3izVK6KbMZi98yn7d/Q7WIhQgVbF4PCWzq1ElajQ3ikQhUqTLeqThmUHKhCTFGZsizjZAxgOCY0//tSxIWACsStEAeZI8EUEGNkkJkgNEJhgoUAjDSXKZSaF5Vt/f9v/+cWxDmt9H1y2MAqRWoAgdBAdw6GTnUUJBk9FqUE0LCc4GUE2BaSVlqrFihUKXUYxU6PAMPMF0LbNAqQUVMsAuKG23P77/oauvrojJvTQd67UezEWkXBlawVBKZRagaEmalxgwoSgqAjx4JP8SyoztPYNEq5UY/BpH2u9R6dW6rYWHA0VO5Wo8oOlXfxEV87O/PAtUxBTUUzLjEwMFVVVVVVVVVVVVVVVVX/+1LElYOJEJcSJgzJQRcOYgGGDCBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsSsAwkIZxAmJGcA9YUgyGMMkFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", "crit": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAXAAATlgAVFRUVHx8fHyoqKioqNTU1NT8/Pz9KSkpKSlVVVVVfX19fampqamp1dXV1f39/f4qKioqKlZWVlZ+fn5+qqqqqqrW1tbW/v7+/ysrKysrV1dXV39/f3+rq6urq9fX19f////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJANEAAAAAAAAE5aA9Js5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAaUASD0EYAB7p6oNzDAAgIAAmJNAgCAIBgocUCAYB8HwfB81ygPn5cCO4Hf+gHwfygIBj4P/icHwfyhz//+D74Pg4CEibcbcckkVrcbabYSAKOb8BHnmHnorxGGIHa5Kr01PQVUoXgqtDEzFkb6yjBQmUg9G0CWVsjgqcYSUJ5edPmkCyC4lPF9mZnP/WltrxqxKgWXu8V3J2bdzOWludGdr/M/f6bv52zrfWrM0nrxRBwB/KOoJoFRZgDs///6lQjEJDJI1EIxAIj/+1LEBQALHLeJuJSAEX4a7/uegAIEAgEPygkkizEZ6Mt4wyh+dC8VNZnRgOGiwoW7fmSBQufldT//s+yTiS/Vfz9QY8JMTTfKeXaf/+/seSCSYO0P8u8TiIy/f+DkhR//KBgvKIimaoQqg14pZlwSZE6R7KJxcTY9HA5mdWmUnFccIQ0XMooWtAHInFWYqjmJ0kdOq8TRtbf/Wqo/86rDM31/93rX18XDw95Q47F3BpJY8puqjPUNKxcCyDZ3YeEXV1UKhiRDRFIkQW8+zDwXlv/7UsQGgAwIs3PHpKzRbxNs/MMN0KNJFl7LYpSfFcpl0H8bQAuPISQenSEmUHQUVbaoWzrjDFKVmZ6QQdUvvyoLW6KOuR5tT4icDQallucZf8CjAqJku1PREzWCIq9x9bmuT56+7K/kcs1cWdSAAABO+MgnAVFYOiWCoUhrhtc9HI5ZJpTk1NeBMsDB67hRLkhvGhd0WBGPpXzO2imHy16CHgGNCWlSnvaBhojGOJqIy1hFM3Ut/nREn1zB7CkBGWruf+m7VoZ3UBAASd3gKrog//tSxAaAC6ibZeYYTwF9E6w88w3oJhwBmJAvYdJzJ8IZNeT/YJ/9Zq8Tz+PVUNkjp7M7reEQ72/lYg52IhhauOBQGNLg5FHCiUUsQEnmpFobHQo8zYBFB1/sUdeOYxuKmlDA42WrXe1mGMQGild5ISgGKfAyhLpwcSGtqM2dRYUVGYs7iX6VPVPv1nhTTka1ze43cQTm6jZ3FulgJi7RSAgfMNAcsVEoGxK3uvpY0RRLUtgGS22ulJVweDtbRCIA6ZGI3rqqeParhCASKdvtSRH/+1LEBgALOV1j54xRgYSrrDz2COjNg4g64KJJpFSq+yraicH2Lq9rpk+2i+VdWOvrWDmSKUta+X08lh3NzJhk86y3qype2mpV6K1v02Okqmt20tIndvv/6UZ37FUWPO966qpyHuLx1EBEKyb5chgMB6CNuxLAEM2SaZvCWic29Vj/wPWiAvYS4siMZ7Hd2PBmO1/UlBTpy0qjeMdciMzbo1hAWbO9kQ6UQiX+un+RGI29/6+2qqfZRw6BzZMWUdjp+ZdVCoV1WVQAAAW3PYkJYP/7UsQGgAwFY2XkDNfJZivtvYMJKFJJFRlxyfb/M/T/OmixuAPoHsz4VlmvE7Ougs2D8Nz1MkpsJ9WbzLyNZGWea9/8kUWB/58y1P/kSkKJPsP7OkX/lHct3OspINRelDF3GWiLeI/+1eVMV0qZJACbn9uuW4xgYpm98XlQKwOFlLJrejH59PuwiTs5pdg7aH+2u/pQiuvOrqRWWmlX6fy0/7+Un08OdCeiEd1yTvtnRujKzPI12OKQAAahcMKTWU9avadoqpQlQJvtXIaSBYBJ//tSxAeACuSza8wwY4FBCa24ww1gCB8sLyc6RVUW6eFp3Yz2daGDhgYk2UwR4Q/IjI6xksb/mblFMvz+h0+UUecgNR/XRYKuxcJ+IputQlOrI+7NAVjGkBhQoAVVZss0VkoAAE/So8D8SiUNJfPfJjGhEEjCOIzjbsd2HKqJmgNIfzbhAiaU0iICILT6AyVApApPLoiUPicdc4ubaU45npHoCvEEqtemMAI8WRGVemVmd2MJVVrHgWECwlLQmJ5fE9Oz5RQWuDLTutv9vWmDVQ3/+1LEEYAKRL11xhhu0UCTbfzBidgxMl+ZU+zXXn8qOZ3z36IttK+vkXdwTSDHPwHoWxzF6elCgnZ8s1aXoYsEHL0u9Gf0PN7DEiCAS5NWxcZAkkH4ZGyY+RVKBHfVhHQUhZIDRGBAgbLVaKbufmR9TTs+ilMq/SKagEmPILGKQra2acUZ+rqZydRh1WxcHDKH93E6FZ/Htop0AQAY+CrWHymso29LzQXZb1XSKnitIIRHZvrIOPKfaLYOlNWnoTZlFyfWfspjgjszrza1GQhCJ//7UsQeAAow823HmE7BSKyv/JCO8Kf0xSIl7DzgQc1RQ1bBykROk60P+TDv79i5YVWCUZP8HNIpI2zZpOJ9/WVXg37/j//dv97o2QDJKyYgEfkDXejfyoyf/Il5bnf6IP/H+r//LSZGQL093rnuctcJmSACAMgUKNLxzviq7/3ainQHVUb2WM0aRgsLtySRaxi7QAq69qmhzAlc1WlHZ7+5g7ChNp1r386BTkfo8ijrEXU4lK3CMgAjMkUzKvodtct3flUhs6LAMNNNuRJJQES7//tSxCoACjTJf8SEToFME2+48ZZiwqIYqAAP6oPOxQPyfIVDiKtTyM+sxYMJVr7eo4msqCas4kXR1TC6shnTJCTzjkhYef3u1QEJgkihgfOEaSK3WFRqlYop7cUjFc1/3apIm9F9qpipeEQpVGqgnAIVUHpGNyYIiAsKsrz95XMSDIBVcohkZ3DF/fpWzqLeL/PKu96uhKgOmVvtv26kOZKETtSTJQTbRIoBustc1rBv0f/vpfWmIZYhHUxAABICEPY+Ycp04xXVJlFjR5UpOcT/+1LENYAKGPWJxgyvkU0Ur/jDFhKkskxrxtpmRJ+4/jUU5ZWRcpt37jSgKRmPutQVsggUSmHSw+XKqFkpioQQ5v/YDRgVGsC4h8Jo/+q6iKt6YymRoj4L4oFjCLfo5CEe/Kc7h4KEWFUOc0u7KVkrUBwUYRF9GliJEAg8sQPC4CSi4/G51lRI5KDRyxgJHDb3iJC39fWPs//q0908b1sFamHmGlUJURWmX0EaSsKFI+KSt484HtieXoFcUYHK/pkQNf/9CVi3N1Nn4DvMvOVA7v/7UsRBgApIX43HsKxRPZLxOPYMov0IMD54PLXUHUaColilrGLR/r7bvi3s6MWfrhF9aEqZdolXQxUAFDJoTlK4ax0H42dXiXAPxy5oPTqQZ3n/fVGjNV76t1pkVviIPKqqUJeuF6VEMx5VcpRIRcNI1PWNlu0dPVN6pUkCryzz3lSLHLinepZlQEABWtgkxYNj5FBIJqcYahC2LUyraz5dWI4nl+DqwUgcbaaaJAgjoDYUepRYWQxgqckbBMgGQpGgKCu36n1uywo8ahaFP8S///tSxE6AChCtf8YYbRFFi2749gkiyNvxS5N6iLqJMxVEb9VKsxZCUg1GMs3Ndn41rpDD7gV6vNyOyiILf8WRSuY3IyOuu8loKKP7QLApK6eeB94bTd6hjf0WKDgqQsO1GB0ACj7OpK/XoCZepiUMkSCU3D1onhumJGWsvWLKfVzuk+gqaRMJTGQMEu9CihyXq1CU/+hxUUJmjBgYMS4yrFlCZQ4LHFXWCMyQ35YW31PZ0dCXv1UyTBVyOhUIl4mKMyQAr5rHIylZG161jq5hjMb/+1LEW4AJ+J13x5RvkUYRbrwHlDLBwVgA1wMYMQwp2X5QYU27WXaqoncrss7q6brt27d6VVwxEuLHiY4HRzHhY7a+pzBLFzAVd4oXZEV6109S2iHiJlVFAklJyFlNSIg5cv0lwUIktL/OWaIicLRynKDT48U8vnZ2IVSb2diA4VFMj5t73Yyuubq4ISkAuL86xe4U92sxZ6PgYco902oHmQiZNSKQJTk0mJgXYHKS2tzRKt3f+6SQc/tlbe169b8AwQo1/aFXm+9lb5lKjpVkSv/7UsRogApIy2vAPEGRMZktfJMJktrVy0216qr2Zv2oUm5TH/s2qkytI4wVQwYz+Xff+lw3QDudSIABLupuIwSneaHD9V1IlDXZI9QbKWVa7mhk0smTQ1MQtUbK/G3hiYMkJXIuFSr1wSynWVIYCSQzZ/SbqiXbL/l/uiqINo91Xd66ebi80HcUwAE6JbPJKr63wk7/3FSTar7py7nU2b6kUBRhWLljWcFzTEgvP6AFSAUCmGQe1I7FVP1jEdtUZBjI4znd/WzG4lDWv26r/0UB//tSxHcACgkjaeaYS9E9JSs8cYsYKrXySu04lwigZAIAADoWdzhmfpFn+FO4C3Vg6GpxYv/VCxMGjT9lLjCvbYS07dythHpIUFhjSCM0dTviBmH1R2q1jTDpS5TMk9+NdUZFPR2KIhNKfbauJneQmGgSAADMGcx1mTl1JG66hVQQiN/l5OSl1P97rEL2sOTHHxpJTFsUgu+T5F1o0FFSE4igkJQ/usmiguGk3hNBdbJq4ru//4v85TpFQmy8ERGkytNbOVDQTDcE2lAAAw5zI6H/+1LEhQAKYSdT5YxagUcaKTwkmoh9Igz+YYOJObBPfeI+dy6r4T5dneVpn+sXjptdbO0Vi/C9hgOA4hwVRpKcAkHQAv4c4VGen3RPXZh4jQ3l7sB68uT7b5e5c0pIcMgmz6ts65nxLQUw2LQAiAYTGB4aP51xNBaPZlqjZjHW2V6cSoT4Aq8ytdoj1UqPYPjKKyCmWRuA3CN5eP0Lwm6SDiM5jdWX/eXVRCOkCyXkoKy4aXSGlBXBD/4Sn/e579NIv7gFAsBI5FPdyNz/E/gwI//7UsSQgAtY90XjmRGBc5pm8CeyiH6ncdPH6rvErXN9QCBCbF1L6ysMVkfNji/XDWvpTLM872AwsJWMIEinCwTpdDTshHObKFr1v5m4/tKUgJWVYZe8YXJ0sPGNxZqRngwDQXBI6fEqLfyKAABgABZ0OKdZ+/j/9iRWTOFA1mblyzNb3xfWi7HEqBTjw5Wk0snSxOwcNqNZ5mAxKy5aZA0C0tieGCaAatLiMp73Z9TktpDUGzmbXGiS+/dk5OPfRCxqX76okAeGgIejlJnq8M29//tSxJKAi1jzMWCxL8GPmmTgYD0QVAGZYfTwHMtW3pzxPEktANMvmq1asRnzVnlkGxWPmIUIc8QBPEExfqjiQTLMn5mcKUL33p+/C5nVz3eeGiKm3q//f9N3WM/7P00AwcLFgbHjybmOpH83HuRctXh1mEnuMcnhjAGgRA/ZobiVAIM1KV5TVZZxdqRyB4nPQLn+fcnp6ca1iMcedhzctNHwcUxB7R9P66P2o6v2f6lYQFLwRNkzCUGfYnCXvnih8y8GQYAHGq1OGGg4Io8nSt3/+1LEkQKLNNEjBD2USVgaJGSQsOhs7zrta2hFZjg51LEbgWDEWFgMPeXaYFbv9H6+1tuip1X//cp61QABahhJEbOQcEHC2NVmr0uVFUrZYipZ+KufvAZJB67JRcuYqrnu/ZDbzElFpU+57l+WsAupzDP/Jfa/Yj9H//b7RxF7mXzpbhSZydnsq28ek3mTX2YSkzET3l/0qMHRWaUuO5K+2Xirt7tqbs7VLRQJK3OP/fP+4wkunOn6gmSuAaELd//in8l6MlyUYn+pAQ9AISiQqP/7UsSXAgoYxxwkGZhRGhJkJJGg+LHZd/b2SzNBlrK1lEw5AI2ozEsXrUgChWLqVX5JomHQaObZmKEomcPYdCYLPAqgaHnoV8i2VI/9ct2/1dyv/UjzQAcBAAaiCYTwAFkE1bI5MrKCBiR745uoV4p1i00tmoWFdYo3+3/F+LCuoX//FhUV/W3WKNxVvWpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tSxKkCCCizI0KsdIE2F2KA8yS4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1LEv4IJDJEQJ40NANwEnfTDDBCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==", "hit": "data:audio/mpeg;base64,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pChEo3jahOwaBP1EIXUysYAQUZDFCBzmyt76cZs2FmNMwtn0R9utGdquxp06Wp00zIktObReGohnRnqd//tSxEMDiTBHCi2wZMEyo6DJoIl41qlUxnpa1opPQ+mtAXVctKoEAAmFBZkmaBqR/blKnEu+Y5h44Ueika0Pi389IAhzZ6cKEhK65MgcCnAo0HbkB48kVCLF9FJtkU1oUeF30tH6GWe5dCrpC0m4gDzMYgFfiKvtmBKcS+rQIpJqCouEpwEFNr5MR1OHHMh3Ph09TsLcyP6SvFOwJQkxIXTAMhCeUN1iC9bwfU4XPNjQvQoYWqGGD72XVw76ffCdgPryVgcIKQg0chwYKI5+tZT/+1LEVYGJBG0CrbxigTMUIEWzDJiT2lWvJktpqOxbAuG6jSfXfLN7VMRkZPjX9XOet3cfGN4skVd6uPbf/2bdRJbAlyh63vm247Gz77/grmIAJRUBw6Hi0F6YpcWIWUu2tWGQkSBoqmDQcOj1hJhkGVspa8qAZ0NGEIEQdUhSiWSjZ3bI8J6wMwKJIXdCrFDq0gGOcsE1gfTgCzDlDIjE1k3S/quX1TpbV2mtT8EvzIYm5NFKgEkJAI0iE0kdEnmGopJbmInZRXlE0UVJRKZRzf/7UsRpAwo8pvwNbMBJBAOgDZeYCG390Q3OWwNR5qIOEeQAf/Ln+d0Jv/+SIBCgHARUYhF4qHAMKQgLgYAF91Kl+o4Ipp6LZWM01obeS/1hkPhbMNvA0WR+HwRwkIYnHqk+ZOkq5l5xqNk6PS0WC2TCkSykXzo/YK6S0zC6tstH5GeNpmziVD/8JAHiKIwk///iE6onkjLxsKBQoChgMHBosBIwrfaewx44IicSvW6T6CVzEdgKKyeKRSV3M2+FmQTQLMPOmiQwnGrIFtRAHQLZ//tSxH2CCsCc5i5owcGdHFzZxh34FcZ/2TVTlmRZhbTX6ALixA///4MQSKy92EtT+FHGBAIQJkyZ6di3u7u7u7iET93dERERIR5IiIgh3ufkTu7u7u/9ru7gAhEQtwsQQICIiI5+iIiO7h65/u7gYGBgYtEL3d3EIAAAB+AAAAAef+AGHh4eP/oeHhgAZ/gAAAAAn+AAAH0AFHMSE4kwEKW1SJUFYizkAJNqpCKQqCIIgiKhUKkTUt8VkSJEiRIkSKK8ZgwEBAICAqql9VVVVVX/+1LEfIIKPOLqDZhVAbciX+WTDC2Y/VVVmZmZj+MzMzBlVS+Myqqqqqv1VVVVmb/+MzMzM3/szMqqq/+qqqqqt/1VUMBCmZm/ZmYCAgIMoL8IKBQUFBXf0FBVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsR6g8/RfO5MpGfIAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", "die": "data:audio/mpeg;base64,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owII4EMUTgRnQR4QYpnBDPj6W7Ovtrp7Fq+zm3b57va/1YY0mGHJ4wUma1ohG6gy5GwEiVKOFIlDDWJvi5D49qSL3PnGhVCSSk3pMDAwtJ1dBg0QDWTflBR6OKuHuFg8yvMMQng0SI2CZwUSTpSG1hEUjkgLA4HeyJBqJR1Ejx6IlND+fYLSUj/+3yhT7xs8/Pzj65P+2RKUJdThw3T/Y8jeVrvl+Ry9vPyL3KFT+8C/63ZThZA7lnaeI6mSO1f5IKFr1O46lRRMLd0Egf/7UsS5ggnURRAOJGIBDIIimbSYAH9HcctGkWoha3W0hUK4fytetCI/Q91K89UJGYJBoDwZ7qlZYRe1be7guUsLM5Wwr0W1Dt7SxOJBq/6ZVGF0Y/lv9jmNEEoP81t+Wt/S/sEzQ3uTdzbTS2fLlTB045UNL5Lt0WEzo5NCA6hKTslU6leEqZdbLztxyTLMu3OxqD4jEQtsq+9ED9a7a+IUt+iTMwTEZ38vN6VjkyNrFQaEQZRLQX0m5gxyuOld4jr7vY9H/d/1r3stgXfpy0CF//tSxM6ABwQPFy0lAAEvAuIBtIRQplqHAxwygKoKMpw8awweDPOjijucKQITxy3Cu20qzu921pzMs2gmgo94L+1TSU6uRIsxN/i0SVzF+0q9y/2Ga/vHd/m5TfL9zr/w7/n97m5sfl6wTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqAAFgaJBtC1xrDlRp/naf1/YdAIBIkZl5kiRIkSJGqqt/eaJJHEiSVUpf7MGVVVS/6XX/+1LE6oNLZTsMDjxgSW4N4YmkjFlVVb/6VZmZmY/+N7Mqqq///1S//LvGZtmP/Zm2DLiCsgv////isQo4KG+6E0N+KbKaKxNit0xBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTtAAwNGQoNmGLJVgQiWaYMEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxNUDzN0i/kwYa4gAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "hurt": "data:audio/mpeg;base64,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P2CFhRECenMrBjhOYCIF4WRNlhyAHvsknGScNGrR+EOUwOdn3e65bEt8u9Rhs47xvb71Q/0vt+WyHYlBm/V+7///+v//9x+ogiyY8qArHhSgAgpuqR2YcdiiCR0JDcJRVaZAL0j3S/fTJ9FbpuVr3n/8u++uZV+a35uf7f/7UsSGA4k4ovBv9EFBFxRdgf0YEP5JSbw37v///6///3U/UIVJMTECUjWzMcgHEq3LRe6NS4aETCDcCKl9CfMzUi/7dpp5WRYZGgv1CD0etYXIII/Hr/JFZICVh/d////X//+4/goK9MC5B9TucNM1Fh54BiLsQizyCHsouxcPVExe64uP45UkkdInngm3HHqUUPeqVL/HLm6nDfkUFl4Co4tRE8jR////t//+hT9zgRQwBAFQMAXAAV9N6p9l8LEYdDURgSQScTjIawyKyV6u//tSxJwDyMSk7A/swQEKE52B/RgY9BZ/0J5OLgloCQMS8Y4OLJ3jGfRJH6AQYmUYLGl9H///+3//6DrbA4kw84VwMRCCRjBhgUowGwC3MDVAezAXQFMwAUAgDgDARAAhEAAqby+reu1MaYenmf60mnmYl509bsYtmjZPT90dPlfb5R068N+swSWTNVg/pSSLBaLRYNBaLBIEwSACkT42MgQtyij/mJBhCgyBAxx//AI0OHk0Ay6r/NJUR16me3/8YDBrAJ5lzkcv//DEFqAUB7H/+1LEtYPIWJjsD+UAwSMVXYH8oBgZWHM9Vz///oKQC68pYehNAwUPC3LEP///4HU3kUsedwF3UDDn/ZU83////zkOSz4pNz7SZc6MJdFxXq//////3n+f8/DkpuS6tGpuVW5T9HvKgEYoceEWbysAMAYRo1sR0JTrRkuPKPCIOrBUeGpU6JQ1BrljwiPfKnSuVgrLHuDX+JZ38GvPFj0S8qdKu+WPFvyp3iVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTNg8kAouwPpGdBTxIeAr5gAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxN2AEzD9Q7msABD+A2KLmDAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "slam": "data:audio/mpeg;base64,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//Y0Wbom6B8wZBE3RN0lJLrRWySkl1////+o3MEP/wmAgBBYrAkAYKlRySSae3ORJMXbLlx4GnnREWBoOiUNgqGlA154RA1BVYKu+IoNPKnSv+Wfzv4ig1u/qPFn/1hqDSg7+VVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxPaDygik5g/swQG1FJzCvsAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LE9YAYadkpubmAAQ0EXEuYMABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "cannon": "data:audio/mpeg;base64,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", "zap": "data:audio/mpeg;base64,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", "magic": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAAFtQBISEhISEhISEhISEhISEhIbW1tbW1tbW1tbW1tbW1tbW2SkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb2/////////////////////8AAAAATGF2YzYwLjMxAAAAAAAAAAAAAAAAJAOqAAAAAAAABbUAk4rRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAfkQ170V4ABu5Vq5zOwABIBNuS2gABA4QmpyNV+28U1DT5zlvHrEMFwLgoIlOD75/lPf0eH+BHcP9HvD8Tg4CDlBgHz8uBAxoB9+Ud39FYAAAACAEAEGB1TmkbUnoP6WxWlz/9AMWW//9I0wwfrqqZOybIRGcH4OBTK5wSjnOMPQwCAQ6gFdJnTOr3/+X/8AuS5Mqh7//////41VpaWtTf///////xqrS0tampv4lCQNCU7/qBoShIGiv/3Hj6ZkMihwmB1VYspg+P/+1LEBoPLVFEQHc8AAYAToUHfyghYxGUyr2lMue5sgWCoOADMCsAAwbQADAhBoMC0KExvC0TOukHP1pkk3ZpaTYbBfMb8VMxQBKzEKDjMI4BUYBOMDcDYwJQHBGAekk3F1eDZ5Pi5Lq3K8plutZ2e45MhYgnEgmEIKmGQNmCQcmAUAJBgL4I2YMYDWGJwpJxpFYGgYNKCHGDJgMACAzxYBRAW0CUkuDewBzFUyW//////84d//bmf6lnv7aP+2wXaoRIEVqzRNF1Lb9CvKJXEE//7UsQHA8sgnwgLeK0Ba6DgwW8VoJwIAAYBYBpgLAUGBiDqYWQiBlt1BGu8osYMANRhFg0GC+AKPAmEQCyhLU3kh+ViC//////4wHU/9r//54RmLk7LkKsSj+uDUo0h7wU0URE66LL3W6l8cqtLGn9ZUhiAQEDAuB/Mftcw1/kazA3EgMQcHowEgFS0ypWtP7TY+X/////3cu4M779O/01vzq3ppV7X58XWW0MK91R5bJN9Iohy1rQ125UCJADAAta88ymoa6l+61WWyJ8mrpQi//tSxAsASxVvCQt0TQGTsuBBbxXYQNGGQkmYrQmhcPGShqGJ4jGCQHl3l2u1Gabft//v5P1/q7g0DiyXv9P/6/676/+5KyX/ZqVmTp/7f/VYIgrC9PzkmAeIZBaVTtU6DPZ/1Im4CmZfAwBQEzBmRdNuQEwwgwfDBiAjTIdGGozTY6///l8Zo7VV2Q+9C3AAjlZGQjt0d7zcxUZEvK7rTdW72qETGd20bRGu8+XJdLa3Wtv7cYoxr//xysk1AKABAAWz+Ymk3WykdS10k2uyh23/+1LECgALCXUHC3BOwW2hIaa5UAByI9gAEGFRaamZp/Lajx+MNgkaBDQ4RP2M8P+1evd/p9fSyNQgIa/trT9He381/1/2qUfP+u+/03963tbtTbQxxH/nJAAGABUoQ/2FjB4pAQvUHfZ1IxV7/ea1++9nC4bkeQYPkAw8cgOhiwBoWBaUOEixdSs6ls63dCmnfXpvq7bu//c+19a1KtS39bKpfTa2g3/9j/7PZiSPjuxMr/96IBISCYAEgcAIAAAAAAG26K8ugLfvPXSGcH/huP/7UsQOAA2cjSm5qQAAAAA0g4AABLstlH+LIIAMaJRwQUiojjEu9YuQcwnBQJkZizfcwNCfNxyiDF8mhzv003pl6oyBXgSCCgVOiXwxLyIsHSx7w/uKVCVYK/+f4SiKWip3+j//K0xBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", "fire": "data:audio/mpeg;base64,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", "ice": "data:audio/mpeg;base64,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", "dash": "data:audio/mpeg;base64,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", "wave": "data:audio/mpeg;base64,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", "boss": "data:audio/mpeg;base64,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5SmHPpS3Fgcdho4RMLCBHfscsxh3eGFC4JEFAq8PkANNxiS0yWYKKFxqlsE6an6jaDH63dbNvv6WLf5OTEEAL4ACWdYkHAJmr8ceqDhWbxJsanozD4ULNxkuwkE/DLzITKwm8XVDMSTpBrAyISZOsRuHy2CF9QWjE6QzhWpWrkqEvRHzKZgkaCpECipFLRUiAmllCwFLKePWhCyJX/L/+1LE8QILeHsczeSpAaYT4oXNmLJq///3qRsQ25bLuDAZllWCggQdA8oWFSJmL9YtrFG/xemrrFG6/9TP4qLf1Cv/1in+L/1ilUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTsA0r8iRZN5EdBh44ihb0JkFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxOwDDNxvFs3lhUC2AyAMYYxMVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=", "win": "data:audio/mpeg;base64,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", "lose": "data:audio/mpeg;base64,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jKKoe2iWlyEkEdp/QQum/tWT31KLqEFYs0aRRQMUkEtCo+R/BfEfGe/iXq3t1b39/X29POC1oGdW924r4q/N0Gs/fmHZEwQBAAqgAGsZ4yJ1RGWFxSeZcZaw6cMKRdqI1FpGdCQvC5GzEEJfS+lFGx9jwFXNvlWtZtAfDWtCoh3KK+cBE/Bd3ltJG/Kt//tSxFAACxFNU6w8q5FpIGf1p6oY7dW/7enp/xex2oo6lqmSO/9WShAwEAA6AiYBZ0+6lDBwGqRPUg7xc494hcbyxZHUprCe7jBr3IM/3FMMN3BUjhXcK5AOcpcZbmr7PGiV+gp4vAsbOAWexwtGaiyyLZ+reW//yH/+wx8XjXqS7N8t/1qANAAIAp9ULPBnc8SnrT5TVIMRSplM1HU7ASbGLv3TOwaHTei9rE1mEB9hbT6uT0tHKSaoWS9lcr8zJbmAXVDRBsnrsJivSHc9px//+1LEVIALtQU3rWFLgXSfJZ2XthitvPa7e/clvR/5gf51t3///6IEQBgAKgBgAVtVYaFGoc4IgCr3dCgc9QFTzZ3cYOZUFG8PmAKjlmfM1228/mwsDcuxnphDQaPVqSLitcnEW50sbMg9PnAsnqSHEl2EP/Kt0Fr6N1Ty3/+Pa9AkDBQCQZcngorE4qrFJL2KiYwCNuUzDSepNEg6/jRhRg/djO4g1a+9NDAgpq7oMqr7WEgU0WkZS+xB1FYwjaIoWXElRU0ehrzH1+o91fNdav/7UsRVAAs87yutNPhBVRnkWae2iDfd5LfJVRCAAAIr9iJp8m/ArmWmJAEgB5sojIY2sgEh9u3TyYcP4cz1QkoLNRyYAAUYkf8nx9susB9Fq91DMvKkX2B2nsnBO0qSQgTo1DDP1ffqb3/1nPf/mORrdJ//6yAft23fcMZQcFrXemMjLzbpiks5IzKCpMWmVmHUHzluVug69iMTgoEMP3SGbLY6A8UX7vmehc9WFAb4+Fj7MEJtoi6fu/K7vIrb6sBACR5IBMlEIAmxqCM5RSAS//tSxFsDS0DtGm29soEikmOJhh6KKVM2dL1ktNaL6g4rGlNnelzhMSnY8uZpwKYlQKl/ziVVrVVUS3vQCHT9EhJWayRqIwKHuRiX+Mev+VdVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEZ4PJxIsMDGDFwAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==", "waveclear": "data:audio/mpeg;base64,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KnGcLOUpvOjEr8rqRX06PmvpZR4YjU0uW1yy0VTQGipFiWuSLaijFJfSl9g2Ljq//67IMI0l0kkkAgJw//tSxAUACoTjY7z2gBFBGCq09JaCh3KkhT5HMJUwnLrtK1Q1lcdEcKLKGoLIxUMYIYcw4iEXjYvJE7WTSxdE9+sxbSN+k36k+aPrf+h026P9Tc2lfddZ00/ut+bq/TVEMEKC4CAAADibWIFyDpmAzAD4fDK+lPVZ53vI/+FNv4Jk2NT5FhpDzJpDJq7agrUB/0GtxnEf8W4t7/z8a1vVW+e5Kmv87b077+2zb33fTXVBBhkKA14ZIBBj0yehZ4flAL5yRp3nq4+GunL/r826q4b/+1LEEIAKbL9N55i0AUUgqD2FnUhjhGLM8ADjErJQtuC7gIXrUaK8C8Qf9R3DvR/7cRrfydtHW6FY3oq/OyNPK1Pv5OTlveJAgOEAAYkAEAc7ZcIMVPxRuaCXjqxcFZ0avhR6iEMpHQyLHN0cRXqJiK0E69cqRZUGXzv83irjx397Pfkv5XlWTP/25GW9tsj01O+yRo989OooQVxGZElIoa9homJqOYBhaHVUISa81/n/ofr9IjNhYOwOlTPfutMNjv9ed2oBP+o2pOF/oPwfEv/7UsQcAApw7UOniLiRRyCmNPKKkNPipWIFD2RH/ozqIiqqoz0SNfvhFxGyiPDIuNDDFMRuBCAQGu3k8COwI7KMNmZVc2oL2//2eF/s7Ue9elkQ8aU3hLiQbWBW/UbgPBP9VDbgBnMjfzcN0b+C6jcv7RnSGeBH4qEEPs6a93JU1frqQSA+EEA/uMBC0qO9TrdnXoC+31DyMLmopFZqTgln/OIaBqqCUd/LaCUmS/qR5JOW/kecWqjf3flqzv9uRlvOztnKyoeu+mV9899NAACB//tSxCcACW0FJyw06UFAJSOg9pWoIB7yGyGA98ABed7wdwzt/WJauofgzHZPHz9ZNIzzMnPgD/QqVAvGt/FtQi3L/GPoKm3/qLUn43/O+Je383MPr6UXWdQkBWp/OqRV1uLVAQAChYXiiLqJijYTeN1CpZlMop19AJLWBgrKNI5//+ajmmkck4GSf/+WrZYlUFeVcVOqPcjEVf535WIn/ng1/WGp3rd+JfKoM4FhkFA2LExEUWWUWzlFlFllXDl9sqGTWSxWUEDBAgYIWFhYVIn/+1LENwEI7H0WZ4jMQPmMF1STDKifWKtqFhcVFRUVFiRrxYWFcVFBZuK/rFVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="};
const Music=(()=>{
  let running=false, timer=null, nextT=0, step=0, bar=0, bpm=88, targetBpm=88, level=0, pendingLevel=0, root=ROOTS[0], motif=[], heartT=0, chk=0;
  const PROG=[0,2,3,1], PROG_BOSS=[0,1,3,2];
  function newMotif(){ motif=[]; let d=5+Math.floor(Math.random()*3); const rest=level>=2?0.25:0.45; for(let i=0;i<8;i++){ d+=Math.floor(Math.random()*5)-2; d=clamp(d,2,11); motif.push(Math.random()<rest&&i%2?null:d); } }
  function sched(s,t){
    return;
    const boss=level>=3, sc=boss?IN:YO, prog=boss?PROG_BOSS:PROG, chord=prog[Math.floor(bar/1)%4], spb=60/bpm/4, B=musBus;
    // --- percussion
    if(level===0){ if(s===0) shime(t,0.05,B); }
    if(level>=1){ if(s===4||s===12) shime(t,0.09,B); if(s===0) taiko(t,0.22,B,false); }
    if(level>=2){ if(s%2===0) shime(t,s%4===0?0.08:0.045,B); if(s===0||s===10) taiko(t,0.34,B,false); if(s===6||s===14) woodblock(t,0.05,B); }
    if(level>=3){ if([0,3,6,8,11,14].includes(s)) taiko(t,0.38,B,false); if(s===0&&bar%2===0) taiko(t,0.5,B,true); if(s===4||s===12) woodblock(t,0.09,B); }
    if(level>=4){ shime(t,s%4===0?0.1:0.05,B); if(s===15) taiko(t,0.3,B,false); }
    // --- bass
    const bf=nf(root/2,sc,chord,0);
    if(level>=1){ const pat=level>=3?[0,2,4,6,8,10,12,14]:level>=2?[0,3,6,8,11,14]:[0,8]; if(pat.includes(s)) bass(s%8===0?bf:bf*(level>=3&&s%4===2?2:1),t,spb*(level>=2?1.6:6),level>=3?0.16:0.12,B); }
    // --- pad (calm) / koto arpeggio
    if(level<=1&&s===0) { pad(nf(root,sc,chord,0),t,spb*16,0.05,B); pad(nf(root,sc,chord+2,0),t,spb*16,0.035,B); }
    if(level>=1){ const arp=[0,2,4,2,5,4,2,4]; const every=level>=2?1:2; if(s%every===0&&(level>=2||s%4!==2)){ const k=arp[(s/every)%8]; pluck(nf(root,sc,chord+k,1),t,level>=3?0.06:0.05,spb*3,B,0.15); } }
    // --- lead melody: koto (calm/battle) or shakuhachi flute (boss)
    if(s%2===0){ const n=motif[(s/2)%8]; const call=(bar%2===1)&&s>=12; if(n!=null){ const deg=call?n+(s===14?2:-1):n;
      if(boss) { if(s%4===0) flute(nf(root,sc,deg,1),t,spb*3.6,0.08,B); }
      else pluck(nf(root,sc,deg,1),t,level===0?0.07:0.09,spb*(level===0?5:2.5),B,0.35); } }
  }
  function tick(){
    if(!AC) return; const now=AC.currentTime; if(nextT<now-0.25) nextT=now+0.05;
    while(nextT<now+0.12){ sched(step,nextT); nextT+=60/bpm/4; step=(step+1)%16;
      if(step===0){ bar++; if(pendingLevel!==level){ level=pendingLevel; newMotif(); } else if(bar%2===0) newMotif(); bpm+=(targetBpm-bpm)*0.6; } }
  }
  return {
    dbg(){ return {running,level,bpm:Math.round(bpm),targetBpm:Math.round(targetBpm),bar}; },
    start(){ if(!AC||running) return; running=true; nextT=AC.currentTime+0.1; newMotif(); timer=setInterval(tick,25); },
    setStage(si){ root=ROOTS[si%ROOTS.length]; bar=0; step=0; newMotif(); },
    update(G,dt){
      chk-=dt; if(chk>0) return; chk=0.5;
      { let tier='heroic';
        if(G&&G.state==='play'){
          const lastWaves=G.waves&&G.waveIdx>=G.waves.length-2, danger=G.keepHp<G.keepMax*0.35, bossOn=G.enemies.some(e=>e.cls==='boss'&&e.kind!=='brute');
          if(bossOn||danger||(lastWaves&&G.enemies.length>0)) tier='boss';
          else if(G.enemies.length>0) tier='battle'; }
        SND.playMusic(tier); }
      if(!G||G.state!=='play'){ pendingLevel=0; targetBpm=84; return; }
      const n=G.enemies.length, boss=!!G.boss; let lv=n===0?0:n<8?1:2; if(G.waveIdx>=G.waves.length-3&&n>0) lv=Math.max(lv,2);
      if(boss) lv=3; if((boss&&G.boss.hp<G.boss.max*0.4)||G.keepHp<G.keepMax*0.3) lv=Math.max(lv,boss?4:2);
      pendingLevel=lv; targetBpm=Math.min(152,86+G.waveIdx*2.8+lv*9+G.si*2);
      if(G.keepHp<G.keepMax*0.3&&G.keepHp>0){ heartT-=0.5; if(heartT<=0){ heartT=0.9; sfx('heart'); } }
    },
    stinger(kind){ if(AUDIO_MODE<1) return; { const m={wave:'wave',boss:'boss',win:'win',lose:'lose',clear:'waveclear'}[kind]; if(m) SND.play(m,0.9); return; } { const a=GS(), m=GS_STINGER[kind]; if(a&&m){ try{ a.sfx(m); }catch(e){} return; } } if(!AC) return; const t=AC.currentTime+0.03, B=sfxBus, r=root;
      if(kind==='wave'){ for(let i=0;i<7;i++) taiko(t+i*(0.16-i*0.012),0.25+i*0.04,B,i===6); pluck(nf(r,YO,7,1),t+0.9,0.12,1.2,B,0.5); }
      else if(kind==='clear'){ for(let i=0;i<8;i++) pluck(nf(r,YO,5+i,1),t+i*0.055,0.12,0.8,B,0.4); gong(t+0.45,0.08,B); }
      else if(kind==='boss'){ taiko(t,0.7,B,true); taiko(t+0.45,0.7,B,true); taiko(t+0.9,0.8,B,true); gong(t+0.9,0.2,B); pluck(nf(r/2,IN,1,1),t+0.9,0.15,2,B,0.6); }
      else if(kind==='win'){ [5,7,9,10,12].forEach((d,i)=>pluck(nf(r,YO,d,1),t+i*0.14,0.14,1.1,B,0.5)); gong(t+0.7,0.2,B); taiko(t+0.7,0.5,B,true); }
      else if(kind==='lose'){ [9,7,6,5,2].forEach((d,i)=>pluck(nf(r,IN,d,0),t+i*0.32,0.13,1.6,B,0.6)); gong(t+1.5,0.18,B); }
    }
  };
})();

/* ---- sound effects ---- */
const GAP={coin:0.028,bow:0.05,hit:0.045,build:0.2,slam:0.2,die:0.04,deposit:0.03,hurt:0.15,ingot:0.05,warn:0.5,slash:0.06,magic:0.1,zap:0.08,fire:0.1,ice:0.1,buy:0.15,rank:0.2,dash:0.2,boss:1,horn:0.8,waveclear:1,crit:0.08,click:0.05,heart:0.4};
let coinStreak=0, coinLast=0;
/* ================================================================ recorded sound
   All audio is real recordings (Kenney CC0 effects, OpenGameArt CC0 music), decoded once and played back at
   their natural speed. Nothing is synthesized, so pitch is always correct. */
const SND=(()=>{
  const MUSIC={heroic:'./mus_heroic.mp3',
               battle:'./mus_battle.mp3',
               boss:'./mus_boss.mp3'};
  const buf={}; let master=null, sfxG=null, musG=null, decoding=false, ready=false;
  const cur={name:null,src:null,g:null};
  function b64(u){ const s=atob(u.split(',')[1]); const a=new Uint8Array(s.length); for(let i=0;i<s.length;i++) a[i]=s.charCodeAt(i); return a.buffer; }
  function init(){ if(!AC||decoding) return; decoding=true;
    master=AC.createGain(); master.gain.value=1; master.connect(AC.destination);
    sfxG=AC.createGain(); sfxG.gain.value=0.8; sfxG.connect(master);
    musG=AC.createGain(); musG.gain.value=0.55; musG.connect(master);
    applyMode();
    const keys=Object.keys(SOUNDS); let left=keys.length;
    keys.forEach(k=>{ try{ AC.decodeAudioData(b64(SOUNDS[k]),b=>{ buf[k]=b; if(--left===0){ ready=true; if(want) playMusic(want,true); } },()=>{ --left; }); }catch(e){ --left; } });
    /* stream the orchestral score: the heroic theme first, then battle and boss */
    ['heroic','battle','boss'].forEach((k,i)=>setTimeout(()=>{ fetch(MUSIC[k]).then(r=>r.arrayBuffer()).then(ab=>new Promise((res,rej)=>AC.decodeAudioData(ab,res,rej)))
      .then(b=>{ buf['mus_'+k]=b; if(want===k) playMusic(k,true); }).catch(()=>{}); }, i*1500)); }
  function applyMode(){ if(!master) return; sfxG.gain.value=AUDIO_MODE>=1?0.8:0; musG.gain.value=AUDIO_MODE>=2?0.55:0; }
  const last={}, GAPS={hit:0.06,coin:0.05,deposit:0.05,bow:0.07,slash:0.06,die:0.05,zap:0.08,magic:0.08,ingot:0.06,click:0.04};
  function play(name,vol){ if(!AC||AUDIO_MODE<1) return; if(!master) init(); const b=buf[name]; if(!b) return;
    const now=AC.currentTime; if(last[name]&&now-last[name]<(GAPS[name]||0.03)) return; last[name]=now;
    const src=AC.createBufferSource(); src.buffer=b; src.playbackRate.value=1;
    const g=AC.createGain(); g.gain.value=vol==null?1:vol; src.connect(g); g.connect(sfxG); src.start(); }
  let want=null;
  function playMusic(name,force){ want=name; if(!AC) return; if(!master) init();
    if(cur.name===name&&!force) return; if(!buf['mus_'+name]) return;
    const t=AC.currentTime;
    if(cur.src){ const og=cur.g, os=cur.src; og.gain.cancelScheduledValues(t); og.gain.setValueAtTime(og.gain.value,t); og.gain.linearRampToValueAtTime(0,t+0.9); try{ os.stop(t+1.0); }catch(e){} }
    const b=buf['mus_'+name]; if(!b){ cur.name=null; cur.src=null; return; }
    const src=AC.createBufferSource(); src.buffer=b; src.loop=true; src.playbackRate.value=1;
    const g=AC.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+0.9); src.connect(g); g.connect(musG); src.start(t);
    cur.name=name; cur.src=src; cur.g=g; }
  return {init,play,playMusic,applyMode,dbg:()=>({ready,decoded:Object.keys(buf).length,music:cur.name,rate:AC&&AC.sampleRate})};
})();
window.SND=SND;
function sfx(name,p=1){
  { const M={deposit:'deposit',coin:'coin',ingot:'ingot',build:'build',buy:'buy',rank:'rank',click:'click',bow:'bow',slash:'slash',crit:'crit',hit:'hit',die:'die',hurt:'hurt',
      slam:'slam',zap:'zap',magic:'magic',fire:'fire',ice:'ice',dash:'dash',warn:'wave',horn:'wave',boss:'boss',waveclear:'waveclear',win:'win',lose:'lose'}[name];
    if(M) SND.play(M, name==='hit'?0.55:name==='coin'||name==='deposit'?0.6:1); return; }
  if(AUDIO_MODE<1) return;
  { const a=GS(), m=GS_SFX[name]; if(a&&m){ const now=performance.now()/1000; if(lastSfx['gs_'+name]&&now-lastSfx['gs_'+name]<(GAP[name]||0.05)) return; lastSfx['gs_'+name]=now;
      try{ const o={}; if(name==='deposit'||name==='coin') o.step=Math.min(12,Math.floor((G&&G.stack||0)/8)); if(name==='deposit'||name==='coin'||name==='ingot') o.pitch=0; a.sfx(m,o); }catch(e){} return; } }
  if(!AC||AC.state!=='running') return; const now=AC.currentTime; if(lastSfx[name]&&now-lastSfx[name]<(GAP[name]||0.05)) return; lastSfx[name]=now;
  const t=now+0.005, B=sfxBus, g=AC.createGain(); g.connect(B);
  switch(name){
    case 'coin': { if(now-coinLast<0.45) coinStreak=Math.min(coinStreak+1,14); else coinStreak=0; coinLast=now;
      const f=nf(880,YO,coinStreak,0); aenv(g,t,0.002,0.13,0.18); osc('sine',f,t,0.2,g); const g2=AC.createGain(); g2.connect(B); aenv(g2,t,0.002,0.05,0.09); osc('square',f*2,t,0.1,g2); break; }
    case 'deposit': { const f=440*p*1.2; aenv(g,t,0.002,0.08,0.06); osc('triangle',f,t,0.08,g).frequency.exponentialRampToValueAtTime(f*1.5,t+0.05); break; }
    case 'ingot': aenv(g,t,0.002,0.09,0.25); osc('sine',1320*p,t,0.3,g); osc('sine',1980*p,t,0.2,g); break;
    case 'bow': { aenv(g,t,0.002,0.07,0.12); nz(t,0.14,g,'bandpass',2600,1.5).frequency.exponentialRampToValueAtTime(700,t+0.12); const g2=AC.createGain(); g2.connect(B); aenv(g2,t,0.001,0.05,0.07); osc('triangle',320,t,0.08,g2).frequency.exponentialRampToValueAtTime(150,t+0.07); break; }
    case 'hit': aenv(g,t,0.001,0.08,0.06); nz(t,0.07,g,'lowpass',1400); osc('sine',180,t,0.06,g).frequency.exponentialRampToValueAtTime(90,t+0.05); break;
    case 'slash': aenv(g,t,0.001,0.14,0.12); nz(t,0.14,g,'highpass',2800).frequency.exponentialRampToValueAtTime(6000,t+0.1); break;
    case 'crit': aenv(g,t,0.001,0.12,0.3); osc('sine',1760,t,0.32,g); osc('sine',2637,t,0.25,g); taiko(t,0.25,B,false); break;
    case 'magic': aenv(g,t,0.01,0.08,0.35); osc('sine',660,t,0.4,g).frequency.exponentialRampToValueAtTime(1320,t+0.3); osc('triangle',990,t,0.3,g).frequency.exponentialRampToValueAtTime(1980,t+0.25); break;
    case 'zap': aenv(g,t,0.001,0.1,0.12); nz(t,0.12,g,'bandpass',3500,2); osc('sawtooth',1600,t,0.1,g).frequency.exponentialRampToValueAtTime(220,t+0.1); break;
    case 'fire': aenv(g,t,0.02,0.14,0.35); nz(t,0.4,g,'lowpass',900).frequency.exponentialRampToValueAtTime(200,t+0.35); break;
    case 'ice': aenv(g,t,0.001,0.08,0.25); [2093,2637,3136].forEach((f,i)=>osc('sine',f,t+i*0.03,0.2,g)); break;
    case 'die': aenv(g,t,0.001,0.12,0.14); nz(t,0.15,g,'bandpass',1200,1); osc('square',520,t,0.12,g).frequency.exponentialRampToValueAtTime(130,t+0.12); break;
    case 'hurt': aenv(g,t,0.001,0.12,0.2); osc('sawtooth',300,t,0.2,g).frequency.exponentialRampToValueAtTime(110,t+0.18); taiko(t,0.2,B,false); break;
    case 'slam': taiko(t,0.9,B,true); aenv(g,t,0.005,0.3,0.6); nz(t,0.6,g,'lowpass',260); break;
    case 'dash': aenv(g,t,0.05,0.2,0.45); nz(t,0.5,g,'bandpass',500,0.8).frequency.exponentialRampToValueAtTime(2200,t+0.4); break;
    case 'warn': aenv(g,t,0.02,0.09,0.5); osc('sawtooth',220,t,0.55,g).frequency.linearRampToValueAtTime(440,t+0.5); break;
    case 'build': [0,2,4,5].forEach((d,i)=>pluck(nf(523.25,YO,d,0),t+i*0.07,0.14,0.6,B,0.3)); taiko(t+0.28,0.35,B,false); break;
    case 'buy': [4,7].forEach((d,i)=>pluck(nf(523.25,YO,d,0),t+i*0.08,0.14,0.5,B,0.3)); aenv(g,t,0.002,0.06,0.2); osc('sine',2093,t+0.16,0.2,g); break;
    case 'rank': [0,2,4,5,7].forEach((d,i)=>pluck(nf(659.25,YO,d,0),t+i*0.05,0.1,0.5,B,0.4)); break;
    case 'horn': { const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(300,t); lp.frequency.exponentialRampToValueAtTime(1800,t+0.5); g.disconnect(); g.connect(lp); lp.connect(B);
      aenv(g,t,0.08,0.22,1.1); osc('sawtooth',110,t,1.2,g).frequency.linearRampToValueAtTime(147,t+0.4); osc('sawtooth',165,t,1.2,g).frequency.linearRampToValueAtTime(220,t+0.4); taiko(t+0.1,0.5,B,true); break; }
    case 'waveclear': Music.stinger('clear'); break;
    case 'boss': Music.stinger('boss'); break;
    case 'click': aenv(g,t,0.001,0.05,0.04); osc('triangle',1200,t,0.05,g); break;
    case 'heart': taiko(t,0.3,B,false); taiko(t+0.18,0.2,B,false); break;
  }
}
document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('button')) sfx('click'); },true);
function wakeAudio(){ silenceOldScore(); audioInit(); if(AC) SND.init(); { const a=GS(); if(a){ try{ if(a.unlock) a.unlock(); if(a.ctx&&a.ctx.state!=='running'&&a.ctx.resume) a.ctx.resume(); }catch(e){} } } if(AC&&AC.state!=='running'&&AC.resume) AC.resume().catch(()=>{}); if(AC) Music.start(); }
['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,wakeAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) wakeAudio(); });

/* ================================================================ input */
const inp={x:0,y:0,active:false,id:null,ox:0,oy:0,keys:{}};
const joy=$('joy'), knob=$('knob'), touch=$('touch');
const ptrs=new Map(); let pinch=null;
const pdist=()=>{ const [a,b]=[...ptrs.values()]; return Math.hypot(a.x-b.x,a.y-b.y); };
touch.addEventListener('pointerdown',e=>{ audioInit(); Music.start(); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size>=2){ inp.active=false; inp.id=null; inp.x=inp.y=0; joy.style.display='none'; if(!pinch) pinch={d:Math.max(20,pdist()),z:userZoom}; return; }
  if(inp.active||pinch) return; inp.active=true; inp.id=e.pointerId; inp.ox=e.clientX; inp.oy=e.clientY;
  joy.style.left=e.clientX+'px'; joy.style.top=e.clientY+'px'; joy.style.display='block'; knob.style.transform='translate(0,0)'; try{ touch.setPointerCapture(e.pointerId); }catch(_){} });
touch.addEventListener('pointermove',e=>{ if(ptrs.has(e.pointerId)) ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size>=2){ setZoom(pinch.z*pinch.d/Math.max(20,pdist())); return; }
  if(!inp.active||e.pointerId!==inp.id) return; const dx=e.clientX-inp.ox, dy=e.clientY-inp.oy, len=Math.hypot(dx,dy), R=56;
  const m=Math.min(len,R)/R, mag=m<0.1?0:Math.pow((m-0.1)/0.9,1.4); inp.x=len?dx/len*mag:0; inp.y=len?dy/len*mag:0; const k=Math.min(len,R)/(len||1); knob.style.transform=`translate(${dx*k}px,${dy*k}px)`; });
const endTouch=e=>{ ptrs.delete(e.pointerId); if(pinch&&ptrs.size<2&&ptrs.size===0) pinch=null; if(e.pointerId!==inp.id) return; inp.active=false; inp.id=null; inp.x=inp.y=0; joy.style.display='none'; };
touch.addEventListener('pointerup',endTouch); touch.addEventListener('pointercancel',endTouch);
addEventListener('keydown',e=>{ inp.keys[e.key.toLowerCase()]=true; audioInit(); });
addEventListener('keyup',e=>{ inp.keys[e.key.toLowerCase()]=false; });
addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&AC&&AC.state==='suspended') AC.resume(); });
function readInput(){ if(inp.active) return {x:inp.x,y:inp.y}; const k=inp.keys;
  let x=(k['d']||k['arrowright']?1:0)-(k['a']||k['arrowleft']?1:0), y=(k['s']||k['arrowdown']?1:0)-(k['w']||k['arrowup']?1:0); const l=Math.hypot(x,y); return l?{x:x/l,y:y/l}:{x:0,y:0}; }

/* ================================================================ DOM pools */
const numPool=[]; for(let i=0;i<48;i++){ const el=document.createElement('div'); el.className='num'; $('nums').appendChild(el); numPool.push({el,active:false,x:0,y:0,z:0,t:0}); }
function popText(x,y,z,txt,cls){ const n=numPool.find(p=>!p.active); if(!n) return; n.active=true; n.x=x+rand(-0.3,0.3); n.y=y; n.z=z; n.t=0; n.el.textContent=txt; n.el.className='num'+(cls?' '+cls:''); n.el.style.display='block'; }
let toastTimer=0, introTimer=0;
function toast(msg,dur=1.8){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); toastTimer=dur; }
function bossIntro(name,kind){ if(G) G.camPunch=-0.22; 
 $('introImg').src=ART[kind]||ART.oni; $('bossImg').src=ART[kind]||ART.oni; $('introName').textContent=name; $('intro').classList.add('show'); introTimer=2.6; sfx('boss'); }

/* ================================================================ game state */
let G=null;
function startStage(si){

  disposeGroup(dyn); $('labels').innerHTML='';
  numPool.forEach(n=>{ n.active=false; n.el.style.display='none'; });
  const HD=Object.assign({id:SAVE.hero},HEROES[SAVE.hero]||HEROES.ronin);
  LAYOUT=genLayout(si);
  buildEnvironment(si); fxInit(); for(const k in FX) FX[k].items.length=0;
  const st=STAGES[si];
  G={ si, st, state:'play', time:0, clock:0, waves:genWaves(si), waveIdx:0, spawners:[], kills:0, built:0,
    hero:{x:0,z:6,vx:0,vz:0,rot:Math.PI,hp:HD.hp,max:HD.hp,cd:0,alive:true,respawn:0,target:null,rt:0,flash:0,ax:0,moving:false,isHero:true},
    units:[], enemies:[], eshots:[], arrows:[], orbs:[], coins:[], parts:[], tgs:[], towerArchers:[], barracks:[], towers:{}, fences:{}, pads:[], builtIds:new Set(), up:new Set(),
    mine:null, forge:null, armory:null, heroDef:HD, ultCd:Math.min(8,ultMax()*0.3), ultFx:0, lvls:{}, armRemote:false, stack:6+PK('chest')*10, bonusTotal:0, diff:0, diffMul:1, sky2Cd:0, skyFall:null, bossScale:0, bossBounty:0, breaks:{}, breakT:0, ingots:0, keepMax:Math.round((HD.id==='shachi'?1.8:HD.id==='gasha'?1.3:HD.id==='orochi'?1.4:HD.id==='daidara'?1.5:HD.id==='enma'?1.6:HD.id==='brute'?1.15:1)*CFG.keepHp*(1+0.15*si)*(1+0.10*PK('bless'))), lean:{x:0,v:0}, wob:{x:0,v:0}, tweens:[],
    cards:[], mods:{}, cardOpen:false, cardPick:null, cardWaves:{}, shake:0, hitStop:0, focus:new T.Vector3(0,0,6), lastStack:-1, lastIng:-1, pillT:0, cpCap:CFG.cpBase+2*PK('cap'), gear:{archer:0,samurai:0,onmyoji:0,ninja:0,oniw:0,yari:0,teppo:0,sohei:0,miko:0,tanuki:0,sumo:0,kabuki:0,falcon:0,kusari:0,komainu:0},
    pending:[], boss:null, armOpen:false, armDismissed:false, ambT:0, zoom:1 };
  G.keepHp=G.keepMax;
  for(const k in LAYOUT.fences){
    const pts=LAYOUT.fences[k], planks=[], segs=[];
    for(let i=0;i<pts.length-1;i++){ const [ax,az]=pts[i],[bx,bz]=pts[i+1]; segs.push([ax,az,bx,bz]);
      const len=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.floor(len/0.42)), rot=Math.atan2(-(bz-az),bx-ax);
      for(let j=0;j<n;j++){ const t=(j+0.5)/n; planks.push({x:lerp(ax,bx,t),z:lerp(az,bz,t),rot,h:0,delay:0,tall:rand(0.9,1.1)}); } }
    G.fences[k]={key:k,segs,planks,built:false,hp:0,max:Math.round(CFG.fenceHp*(1+0.2*si)*(1+0.12*PK('fence'))),shake:0,mid:pts[2]};
  }
  for(const d of LAYOUT.pads){
    const g=new T.Group(); g.position.set(d.x,0,d.z); const ing=d.cur==='ingot';
    g.add(mk(new T.BoxGeometry(2.8,0.12,2.8),new T.MeshLambertMaterial({color:ing?0x1F4C78:0x2F6A22}),0,0.06,0,false));
    g.add(mk(new T.BoxGeometry(2.45,0.14,2.45),new T.MeshLambertMaterial({color:ing?0x62AEEF:0x6FDB4F}),0,0.1,0,false));
    const fill=mk(new T.BoxGeometry(2.45,0.15,2.45),new T.MeshLambertMaterial({color:0xF4FFE8,transparent:true,opacity:.75}),0,0.11,0,false); fill.scale.set(0.001,1,0.001); g.add(fill);
    g.visible=false; dyn.add(g);
    const el=document.createElement('div'); el.className='pad'+(ing?' ing':''); el.innerHTML=`<span class="ic">${ICONS[d.kind]}</span><b></b>`; el.style.display='none'; $('labels').appendChild(el);
    G.pads.push(Object.assign({},d,{paid:0,carry:0,standT:0,active:false,done:false,doneT:-1,g,fill,el,numEl:el.querySelector('b'),shown:-1}));
  }
  refreshPads();
  for(let i=0;i<14;i++){ const a=rand(0,Math.PI*2), r=rand(3,7); G.coins.push({kind:'gold',st:0,x:Math.cos(a)*r,y:0.15,z:-2+Math.sin(a)*r*0.8,vx:0,vy:0,vz:0,t:1,bounces:2,spin:rand(0,6)}); }
  for(let i=0;i<PK('vet');i++) spawnUnit('archer',rand(-1,1),5);
  hero.g.visible=true; hero.bow2.visible=false; hero.bow.material.color.setHex(0x3A1F1A);
  { const GRADE={sakura:'linear-gradient(180deg,#FFD9E8,#FFF3D0)',bamboo:'linear-gradient(180deg,#D8F5C0,#EAFFE0)',autumn:'linear-gradient(180deg,#FFD9A8,#FFE9C8)',
      snow:'linear-gradient(180deg,#CFE6FF,#EAF4FF)',volcano:'linear-gradient(180deg,#FFB08A,#FFD8B0)',swamp:'linear-gradient(180deg,#CFE8B0,#E8F5D0)',
      grave:'linear-gradient(180deg,#C9BFE0,#E4DCF0)',storm:'linear-gradient(180deg,#BFD4F0,#DCE8FA)',mist:'linear-gradient(180deg,#CFE6D0,#E6F2E4)',
      coast:'linear-gradient(180deg,#BFE8F5,#FFF4D8)',cave:'linear-gradient(180deg,#B8AEDC,#D8D0EA)',eclipse:'linear-gradient(180deg,#E0A0B8,#C8A0C0)',
      forest:'linear-gradient(180deg,#BCE8B0,#DCF2CC)',ember:'linear-gradient(180deg,#FFA878,#FFD0A8)',temple:'linear-gradient(180deg,#F0E6D0,#FAF4E4)',
      moon:'linear-gradient(180deg,#B8C8F0,#DCE4FA)'}[st.theme]||'linear-gradient(180deg,#FFE8D0,#FFF6E4)';
    const MD=window.__mood||{}; $('grade').style.background=MD.grad||GRADE; $('grade').style.opacity=String(MD.op||0.5); $('vig').style.opacity='1'; }
  $('avatar').src=ART[HD.sprite]||ART.hero;
  $('ingPill').style.display='none'; $('bossbar').style.display='none'; $('breakCard').classList.remove('show'); closeArmory(); G.rosterKey=null; G.cbKey=null;
  showScreen(null);
  updateHud(true);
  { const d=DIFFS[window.__pendDiff||0]||DIFFS[0]; G.diff=d.id; G.diffMul=d.mul; G.diffReward=d.reward; window.__pendDiff=0;
    if(d.id) setTimeout(()=>toast(d.name+' difficulty: enemies x'+d.mul+', rewards x'+d.reward,2.6),1200); }
  toast(`Stage ${si+1}: ${st.name}${window.__mood&&window.__mood.n!=='Midday'?' · '+window.__mood.n:''}`,2.4); wakeAudio(); if(AUDIO_MODE===0) setTimeout(()=>toast('Sound is off: tap 🎵 to turn it on',2.6),2600); if(AC){ Music.setStage(si); Music.start(); }
}
function refreshPads(){ for(const p of G.pads){ if(p.active||p.done) continue; if(p.req.every(r=>G.builtIds.has(r))) activatePad(p); } }
function activatePad(p){ p.active=true; p.done=false; p.paid=0; p.g.visible=true; p.g.scale.setScalar(0.01); G.tweens.push({obj:p.g,t:0,dur:0.35,delay:0.15,to:1}); }
const U=id=>G.up.has(id);
const cpUsed=()=>G.units.reduce((s,u)=>s+CLS[u.cls].cp,0);

/* ================================================================ spawning */
function spawnUnit(cls,x,z){
  const D=CLS[cls], hpMul=MOD('squadHp')*((cls==='samurai'||cls==='oniw')?1+0.4*(G.gear[cls]||0):1)*(1+0.1*LV('m_vital'))*(1+0.08*PK('squadhp'))*(PASS('samurai')?1.15:1)*(PASS('namazu')?1.25:1)*(PASS('shuten')?1.3:1)*(PASS('benkei')?1.45:1);
  G.units.push({cls,x,z,rot:Math.PI,hp:D.hp*hpMul,max:D.hp*hpMul,cd:rand(0,D.cd),alive:true,target:null,rt:rand(0,0.3),flash:0,moving:false,seed:rand(0,10),xp:0,rank:0,st:'idle',slot:G.units.length});
}
const MUTS=[
  {id:'shield', name:'Warded',   col:0x7FC8FF, from:4,  w:3},
  {id:'swift',  name:'Swift',    col:0xFFE27A, from:6,  w:3},
  {id:'rage',   name:'Enraged',  col:0xFF6A4A, from:7,  w:3},
  {id:'split',  name:'Splitting',col:0xC8FF7A, from:10, w:2},
  {id:'healer', name:'Chanting', col:0x8CFFB4, from:13, w:2}];
function rollMutation(e){
  if(!e||e.cls==='boss'||e.noMut) return;
  const chance=Math.min(0.35,0.04+0.008*G.si);
  if(Math.random()>chance) return;
  const pool=MUTS.filter(m=>G.si>=m.from); if(!pool.length) return;
  let tot=pool.reduce((a,m)=>a+m.w,0), r=Math.random()*tot, pick=pool[0];
  for(const m of pool){ r-=m.w; if(r<=0){ pick=m; break; } }
  e.mut=pick.id; e.mutCol=pick.col; e.max=Math.round(e.max*(1.6+0.02*G.si)); e.hp=e.max;
  if(pick.id==='shield') e.ward=e.max*0.6;
  if(pick.id==='swift') e.speed*=1.45;
  if(pick.id==='rage') e.rage=true;
  if(pick.id==='split') e.split=2;
  if(pick.id==='healer') e.healer=true;
  popText(e.x,2.2,e.z,pick.name,'crit');
}
function splitEnemy(e){
  if(!e.split) return; const n=e.split; e.split=0;
  for(let i=0;i<n;i++){ const c=spawnEnemy(e.cls,e.lane);
    if(c){ c.noMut=true; c.x=e.x+rand(-1.2,1.2); c.z=e.z+rand(-1.2,1.2); c.wp=e.wp;
      c.max=Math.round(e.max*0.4); c.hp=c.max; c.speed=e.speed*1.15; c.dmg=e.dmg*0.6; } }
  spawnParticles(e.x,1,e.z,14,0xC8FF7A,5,0.5,1.3,0);
}
function spawnEnemy(type,laneIdx,near){
  const lane=LAYOUT.lanes[laneIdx]; let [x,z]=lane[0]; let wp=1;
  if(near){ x=near.x+rand(-2,2); z=near.z+rand(-2,2); wp=near.wp||1; }
  const hs=STAGES[0].hp*(1+Math.max(0,G.clock)/300);  /* normal enemies no longer scale with stage number */
  const e={lane:laneIdx,wp,x:x+rand(-1.2,1.2),z:z+rand(-1.2,1.2),rot:0,cd:rand(0.2,1),rt:0,target:null,flash:0,dead:false,moving:true,seed:rand(0,10),atk:0,
    slowT:0,slowF:0,freezeT:0,burnT:0,burnDps:0,stunT:0,burnFx:0};
  if(type.startsWith('boss:')){
    const kind=type.slice(5), D=BOSSES[kind];
    { const base=BOSSES[G.st.boss].hp+(G.st.boss2?BOSSES[G.st.boss2].hp:0);
      if(!G.bossScale) G.bossScale=Math.min(1,((BOSSES[G.st.boss].super?9000:2600)*Math.pow(G.si+1,1.25))/base); }
    Object.assign(e,{cls:'boss',kind,hp:(kind==='brute'?D.hp*(1+0.35*G.si):D.hp*G.bossScale)*(G.diffMul||1),speed:D.speed,rad:D.rad,st:'move',atkT:1.5,pi:0,timer:0,dmg:30*(1+0.25*G.si)*(G.diffMul||1)});
    e.max=e.hp;
    const m={g:new T.Group()};
    Object.assign(e,m); e.mats=bossMats(e.g);
    if(kind==='brute'){ sfx('warn'); toast('An aooni brute approaches!'); }
    else { G.boss=e; bossIntro(D.name,kind); $('bossName').textContent=D.name; $('bossbar').style.display='block'; }
  } else {
    const D=EN[type], dm=G.diffMul||1;
    const grow=1+0.16*G.si, hurt=1+0.08*G.si;
    Object.assign(e,{cls:type,hp:(D.hp*hs*grow+120*Math.floor(G.si/10))*dm,speed:D.speed*rand(0.9,1.1),rad:D.rad,dmg:D.dmg*hurt*dm}); e.max=e.hp;
  }
  if(e.cls!=='boss') rollMutation(e);
  G.enemies.push(e); return e;
}
function spawnParticles(x,y,z,n,color,spd=4,life=0.5,size=1,grav=-9){ if(QL<1){ n=Math.max(1,Math.round(n*QL)); if(QL<0.5&&Math.random()>0.6) return; }
  for(let i=0;i<n;i++){ if(G.parts.length>=880) G.parts.shift(); const a=rand(0,Math.PI*2), s=rand(0.4,1)*spd;
    G.parts.push({x,y,z,vx:Math.cos(a)*s,vy:rand(0.5,1.4)*spd*0.8,vz:Math.sin(a)*s,life,max:life,size:size*rand(0.7,1.3),col:color,grav,rx:rand(0,3),ry:rand(0,3)}); }
}
function spawnLoot(x,z,n,kind='gold'){ for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), s=rand(1.5,3.2); G.coins.push({kind,st:0,x,y:0.9,z,vx:Math.cos(a)*s,vy:rand(4.5,6.5),vz:Math.sin(a)*s,t:0,bounces:0,spin:rand(0,6)}); } }
function stackTop(kind){ const h=G.hero; if(kind==='ingot') return {x:h.x+RIGHT.x*0.62,y:1.55+G.ingots*CFG.ingotStep,z:h.z+RIGHT.z*0.62}; return {x:h.x,y:G.heroDef.h+0.2+Math.min(G.stack,CFG.stackCap)*CFG.coinStep,z:h.z}; }
function payFx(n,tx,tz,kind){ for(let i=0;i<Math.min(n,18);i++){ const top=stackTop(kind); G.coins.push({kind,st:2,x:top.x,y:top.y,z:top.z,sx:top.x,sy:top.y+i*0.05,sz:top.z,tx:tx+rand(-0.5,0.5),tz:tz+rand(-0.5,0.5),t:-i*0.03,dur:0.32,spin:0}); } }

/* ================================================================ combat */
function nearestEnemy(x,z,range,exclude){ let best=null, bd=range*range; for(const e of G.enemies){ if(e.dead||e===exclude) continue; const dx=e.x-x, dz=e.z-z, d=dx*dx+dz*dz-e.rad*e.rad*0.5; if(d<bd){ bd=d; best=e; } } return best; }
function nearestPlayer(x,z,range){ let best=null, bd=range*range; const h=G.hero;
  if(h.alive){ const d=(h.x-x)**2+(h.z-z)**2; if(d<bd){ bd=d; best=h; } }
  for(const u of G.units){ if(!u.alive) continue; const d=((u.x-x)**2+(u.z-z)**2)*(u.cls==='samurai'?0.7:1); if(d<bd){ bd=d; best=u; } } return best; }
const ELCOL={fire:0xFF7A2A, frost:0x7FE3FF, bolt:0xFFE45C};
function arrowEl(){ return U('fire1')?'fire':U('frost1')?'frost':U('bolt1')?'bolt':null; }
const LV=id=>(G&&G.lvls&&G.lvls[id])||0;
function arrowMul(){ return (PASS('shogun')?1.15:1)*(PASS('mao')?1.25:1)*(PASS('mikaboshi')?1.3:1)*(PASS('akaoni')?1.1:1)*(PASS('susanoo')?1.4:1)*(PASS('ushioni')?1.15:1)*(PASS('tsukuyomi')?1.55:1)*(PASS('karura')?1.35:1)*(PASS('amaterasu')?1.7:1)*(PASS('onryo')?1.45:1)*(PASS('kagutsuchi')?1.6:1)*(PASS('izanagi')?1.8:1)*(PASS('mikaboshi')?1.3:1)*(PASS('akaoni')?1.1:1)*(PASS('susanoo')?1.4:1)*(PASS('ushioni')?1.15:1)*(PASS('tsukuyomi')?1.55:1)*(PASS('karura')?1.35:1)*(PASS('amaterasu')?1.7:1)*(PASS('onryo')?1.45:1)*(PASS('kagutsuchi')?1.6:1)*(PASS('izanagi')?1.8:1)*(1+(U('steel1')?0.2:0)+(U('steel2')?0.2:0)+(U('steel3')?0.3:0))*(1+0.08*PK('arrows'))*(1+0.08*LV('m_arrow')); }
function fireArrow(sx,sy,sz,target,dmg,src){ const d=Math.hypot(target.x-sx,target.z-sz);
  G.arrows.push({sx,sy,sz,t:0,dur:Math.max(0.07,d/CFG.arrowSpeed),target,dmg:dmg*arrowMul(),src,el:arrowEl()}); sfx('bow'); }
function hitEnemy(e,dmg,src,el,depth=0,isArrow=false){
  if(e.dead) return;
  if(isArrow&&e.cls==='boss'&&U('steel3')) dmg*=1.25;
  { const ED=EN[e.cls]; if(ED&&ED.armor) dmg*=(1-ED.armor); }
  if(e.ward>0){ const soak=Math.min(e.ward,dmg*0.6); e.ward-=soak; dmg-=soak;
    if(e.ward<=0){ e.ward=0; spawnParticles(e.x,1.3,e.z,10,0x7FC8FF,5,0.4,1.3,0); popText(e.x,2.3,e.z,'WARD BROKEN','crit'); }
    else spawnParticles(e.x,1.3,e.z,2,0x7FC8FF,2,0.25,1,0); }
  e.hp-=dmg; e.flash=1;
  if(e.cls==='boss'||Math.random()<0.3) popText(e.x,(e.cls==='boss'?BOSSES[e.kind].h:1.9),e.z,'-'+Math.round(dmg));
  if(e.cls==='boss') dmg*=MOD('bossDmg'); else dmg*=MOD('normDmg');
  if(depth===0&&src&&src.isHero){ spawnParticles(e.x,e.cls==='boss'?2:1.1,e.z,9,el?ELCOL[el]:0xFFE9A8,5,0.32,1.7,0); fx('fx_glow',e.x,1.3,e.z,1.8,0.18,el?ELCOL[el]:0xFFE9A8,{grow:1.4}); }
  if(depth===0) spawnParticles(e.x,e.cls==='boss'?2:0.9,e.z,3,el?ELCOL[el]:0xBFEFFF,3.5,0.28,0.8,-4);
  sfx('hit');
  if(el==='fire'){ e.burnT=3; e.burnDps=4*(U('fire3')?2:1)*(1+0.35*G.si); e.burnSrc=src; }
  else if(el==='frost'){ const f=U('frost3')?0.55:0.35; e.slowT=1.6; e.slowF=e.cls==='boss'?f*0.5:f;
    const ch=U('frost3')?0.15:U('frost2')?0.08:0; if(e.cls!=='boss'&&Math.random()<ch){ e.freezeT=1.2; sfx('ice'); spawnParticles(e.x,1,e.z,6,0xDFF8FF,3,0.5,1,-6); } }
  else if(el==='bolt'&&depth===0){ const n=U('bolt3')?3:U('bolt2')?2:1; const hit=[e]; let from=e;
    for(let i=0;i<n;i++){ let best=null,bd=20; for(const o of G.enemies){ if(o.dead||hit.includes(o)) continue; const d=(o.x-from.x)**2+(o.z-from.z)**2; if(d<bd){bd=d;best=o;} }
      if(!best) break; for(let k=0;k<6;k++){ const t=k/5; spawnParticles(lerp(from.x,best.x,t),1.1+rand(-0.2,0.2),lerp(from.z,best.z,t),1,0xFFF27A,0.8,0.18,0.9,0); }
      hit.push(best); hitEnemy(best,dmg*0.6,src,null,1); from=best; }
    if(U('bolt3')&&e.cls==='boss') e.stunT=0.35; sfx('zap'); }
  if(isArrow&&depth===0&&PASS('raijin')&&el!=='bolt'){ let best=null,bd=16; for(const o of G.enemies){ if(o.dead||o===e) continue; const d=(o.x-e.x)**2+(o.z-e.z)**2; if(d<bd){bd=d;best=o;} } if(best){ spawnParticles(lerp(e.x,best.x,0.5),1.2,lerp(e.z,best.z,0.5),2,0xFFF27A,1,0.2,0.9,0); hitEnemy(best,dmg*0.5,src,null,1); } }
  if(e.hp<=0){ killEnemy(e,src); if(G&&G.ultCd>0) G.ultCd=Math.max(0,G.ultCd-0.35); if(G&&G.sky2Cd>0) G.sky2Cd=Math.max(0,G.sky2Cd-0.3); }
}
function killEnemy(e,src){
  if(e.split) splitEnemy(e);
  if(e.dead) return; e.dead=true; G.kills++;
  if(src&&src.xp!==undefined&&src.alive){ src.xp+=e.cls==='boss'?5:e.cls==='oni'?2:1; const nr=src.xp>=8?2:src.xp>=3?1:0;
    if(nr>src.rank){ src.rank=nr; const add=CLS[src.cls].hp*0.2; src.max+=add; src.hp=src.max; popText(src.x,1.9,src.z,nr===2?'GOLD RANK':'RANK UP','gold'); spawnParticles(src.x,1,src.z,14,0xFFE27A,4,0.6,1,-6); sfx('rank'); } }
  if(e.burnT>0&&U('fire2')){ spawnParticles(e.x,0.8,e.z,18,0xFF7A2A,6,0.5,1.3,-6); sfx('fire');
    for(const o of G.enemies){ if(o.dead||o===e) continue; if(Math.hypot(o.x-e.x,o.z-e.z)<1.9) hitEnemy(o,20*(1+0.3*G.si),null,null,1); } }
  if(e.cls==='boss'){
    const big=e.kind!=='brute';
    spawnLoot(e.x,e.z,big?irand(45,60):irand(28,36)); spawnLoot(e.x,e.z,big?4:2,'ingot');
    spawnParticles(e.x,1.5,e.z,50,0xFFFFFF,7,0.9,1.6,-10); spawnParticles(e.x,1.5,e.z,24,0xFF7A2A,6,0.8,1.4,-10);
    G.shake=0.7; G.hitStop=0.12; sfx('slam'); toast(big?`${BOSSES[e.kind].name} defeated!`:'Brute defeated');
    dyn.remove(e.g); G.tgs=G.tgs.filter(t=>t.owner!==e);
    if(G.boss===e){ G.boss=null; $('bossbar').style.display='none'; G.bossBounty=50*(G.si+1); }
  } else { { let n=irand(...EN[e.cls].loot); n=Math.round(n*MOD('kill')); if(LV('r_loot')) n=Math.round(n*(1+0.15*LV('r_loot'))); if(PASS('kitsune')) n=Math.floor(n*1.25+Math.random()); if(PASS('hannya')) n=Math.floor(n*1.4+Math.random()); if(PASS('izanami')) n=Math.floor(n*1.6+Math.random()); if(MOD('ingot')>1) n=Math.floor(n*MOD('ingot')+Math.random()); if(PASS('nurari')) n=Math.floor(n*1.35+Math.random()); spawnLoot(e.x,e.z,n); if(e.cls==='oni'&&G.si>=2&&Math.random()<0.25+0.03*G.si) spawnLoot(e.x,e.z,1,'ingot'); } spawnParticles(e.x,0.8,e.z,10,0xF2F2F2,4,0.45,1,-8); spawnParticles(e.x,0.8,e.z,5,e.cls==='oni'?0x7C6BD6:0xD7393A,3.5,0.4,1,-8); }
  sfx('die');
}
function damagePlayer(t,dmg){
  if(!t.alive) return; t.hp-=dmg; t.flash=1;
  if(t.isHero){ popText(t.x,2.4,t.z,'-'+Math.round(dmg),'hurt'); G.shake=Math.max(G.shake,0.12); sfx('hurt'); }
  if(t.hp<=0){ t.alive=false; spawnParticles(t.x,0.8,t.z,12,0x2E3A57,4,0.5,1,-8);
    if(t.isHero){ t.respawn=3.5; const lost=Math.floor(G.stack/2); G.stack-=lost; spawnLoot(t.x,t.z,Math.min(lost,60)); toast('Hero down. Back in 3'); closeArmory(); } }
}
function fenceBlocking(x0,z0,x1,z1){ for(const k in G.fences){ const f=G.fences[k]; if(!f.built||f.hp<=0) continue; for(const s of f.segs) if(segIntersect(x0,z0,x1,z1,s[0],s[1],s[2],s[3])) return f; } return null; }
function damageFence(f,dmg){
  if(!f.built) return; f.hp-=dmg; f.shake=0.25;
  if(f.hp<=0){ f.built=false; f.hp=0; f.planks.forEach(p=>spawnParticles(p.x,0.8,p.z,1,0x94643F,4,0.6,1.2,-10));
    const pad=G.pads.find(p=>p.kind==='fence'&&String(p.fence)===String(f.key));
    if(pad){ pad.cost=Math.max(5,Math.ceil(pad.cost/2)); pad.done=false; pad.active=false; G.builtIds.delete(pad.id); activatePad(pad); }
    toast('A fence broke'); sfx('slam'); }
}

/* ================================================================ telegraphs */
const TG_POOL=[]; for(let i=0;i<18;i++){
  const mat=()=>new T.MeshBasicMaterial({color:0xFF3B30,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide});
  const disc=new T.Mesh(new T.CircleGeometry(1,40),mat()); disc.rotation.x=-Math.PI/2;
  const ring=new T.Mesh(new T.RingGeometry(0.9,1,40),mat()); ring.rotation.x=-Math.PI/2; ring.material.opacity=.7;
  const donut=new T.Mesh(new T.RingGeometry(0.43,1,48),mat()); donut.rotation.x=-Math.PI/2;
  const rg=new T.PlaneGeometry(1,1); rg.rotateX(-Math.PI/2); rg.translate(0,0,0.5);
  const rect=new T.Mesh(rg,mat()); const rectE=new T.Mesh(rg,mat()); rectE.material.opacity=.18;
  [disc,ring,donut,rect,rectE].forEach(m=>{ m.visible=false; m.renderOrder=3; scene.add(m); });
  TG_POOL.push({disc,ring,donut,rect,rectE});
}
function addTg(o){ G.tgs.push(Object.assign({t:0},o)); }
function inTg(tg,px,pz,pad=0){
  if(tg.shape==='circle') return Math.hypot(px-tg.x,pz-tg.z)<=tg.r+pad;
  if(tg.shape==='donut'){ const d=Math.hypot(px-tg.x,pz-tg.z); return d<=tg.r+pad&&d>=tg.r*0.43-pad; }
  const dx=px-tg.x, dz=pz-tg.z, u=dx*tg.dx+dz*tg.dz, v=Math.abs(-dx*tg.dz+dz*tg.dx); return u>=-pad&&u<=tg.len+pad&&v<=tg.w/2+pad;
}
function resolveTg(tg){
  const h=G.hero;
  if(h.alive&&inTg(tg,h.x,h.z)) damagePlayer(h,tg.dmg);
  for(const u of G.units) if(u.alive&&inTg(tg,u.x,u.z)){ damagePlayer(u,tg.dmg); if(tg.shape==='circle'){ const d=Math.hypot(u.x-tg.x,u.z-tg.z)||1; u.x+=(u.x-tg.x)/d*1.4; u.z+=(u.z-tg.z)/d*1.4; } }
  for(const k in G.fences){ const f=G.fences[k]; if(!f.built) continue; if(f.planks.some(p=>inTg(tg,p.x,p.z,0.2))) damageFence(f,tg.fenceDmg||90); }
  if(inTg(tg,KEEP.x,KEEP.z,2)) G.keepHp-=tg.keepDmg||45;
  const col=tg.col||0xE2C28C;
  if(tg.owner&&tg.owner.cls==='boss'){ for(const k in G.fences){ const f=G.fences[k]; if(f.built&&f.planks.some(pl=>inTg(tg,pl.x,pl.z,1.2))) damageFence(f,(tg.fenceDmg||90)*0.6); } }
  if(tg.shape==='circle'){ spawnParticles(tg.x,0.2,tg.z,22,col,7,0.6,1.4,-12); spawnParticles(tg.x,0.2,tg.z,8,0xFFFFFF,5,0.4,1.1,-10); }
  else if(tg.shape==='donut'){ for(let k=0;k<28;k++){ const a=k/28*Math.PI*2, r=tg.r*0.72; spawnParticles(tg.x+Math.sin(a)*r,0.3,tg.z+Math.cos(a)*r,1,col,3,0.7,1.6,2); } }
  else { for(let s=0;s<tg.len;s+=0.8) spawnParticles(tg.x+tg.dx*s,0.3,tg.z+tg.dz*s,2,col,3,0.6,1.3,tg.col===0xBFF0FF?-4:1); }
  G.shake=Math.max(G.shake,tg.shake||0.35); sfx(tg.sound||'slam');
  if(tg.onDone) tg.onDone();
}

/* ================================================================ structures */
function buildStructure(p){
  G.built++; sfx('build'); spawnParticles(p.x,0.5,p.z,26,0xFFE27A,6,0.6,1.1,-8);
  G.builtIds.add(p.id);
  let obj=null; const hut=(wall,roof,roofH=1.3)=>buildingSprite('b_range',p.x,p.z); const OLDHUT=(wall,roof,roofH=1.3)=>{ const o=new T.Group(); o.position.set(p.x,0,p.z);
    part(o,new T.BoxGeometry(2.6,1.4,2.2),wall,[0,0.7,0],null,null,0);
    const r=part(o,new T.ConeGeometry(2.2,roofH,4),roof,[0,1.4+roofH/2,0],[0,Math.PI/4,0],[1,1,0.9],0);
    part(o,new T.BoxGeometry(0.6,0.9,0.06),0x3F2A1C,[0,0.45,1.11],null,null,0); return o; };
  const addBarracks=(cls,cap)=>{ G.barracks.push({cls,cap,x:p.x,z:p.z,t:0.2,id:p.id});
    const room=Math.floor((G.cpCap-cpUsed())/CLS[cls].cp); for(let i=0;i<Math.min(cap,room);i++) G.pending.push({cls,x:p.x,z:p.z+1.5,t:i*0.18}); };
  switch(p.kind){
    case 'range': obj=buildingSprite('b_range',p.x,p.z); addBarracks('archer',4); toast('Archery range: archers recruited'); break;
    case 'dojo': obj=buildingSprite('b_dojo',p.x,p.z); addBarracks('samurai',2); toast('Dojo: samurai join your squad'); break;
    case 'shrine': obj=buildingSprite('b_shrine',p.x,p.z); addBarracks('onmyoji',2); toast('Shrine: onmyoji mages join'); break;
    case 'onipit': obj=buildingSprite('b_onipit',p.x,p.z); addBarracks('oniw',2); toast('Oni Pit: oni warriors join'); break;
    case 'yaripit': obj=buildingSprite('b_yari',p.x,p.z); addBarracks('yari',3); toast('Spear Yard: spearmen join'); break;
    case 'teppopit': obj=buildingSprite('b_teppo',p.x,p.z); addBarracks('teppo',2); toast('Gunnery: teppo gunners join'); break;
    case 'soheipit': obj=buildingSprite('b_sohei',p.x,p.z); addBarracks('sohei',2); toast('Temple Hall: warrior monks join'); break;
    case 'mikopit': obj=buildingSprite('b_shrine',p.x,p.z); addBarracks('miko',2); toast('Kagura Shrine: priestesses join'); break;
    case 'tanukipit': obj=buildingSprite('b_tanuki',p.x,p.z); addBarracks('tanuki',2); toast('Tanuki Den: bombers join'); break;
    case 'sumopit': obj=buildingSprite('b_dojo',p.x,p.z); addBarracks('sumo',2); toast('Sumo Stable: wrestlers join'); break;
    case 'kabukipit': obj=buildingSprite('b_shrine',p.x,p.z); addBarracks('kabuki',2); toast('Kabuki Stage: dancers join'); break;
    case 'falconpit': obj=buildingSprite('b_teppo',p.x,p.z); addBarracks('falcon',2); toast('Falconry: falconers join'); break;
    case 'kusaripit': obj=buildingSprite('b_yari',p.x,p.z); addBarracks('kusari',3); toast('Chain Yard: chain fighters join'); break;
    case 'komainupit': obj=buildingSprite('b_sohei',p.x,p.z); addBarracks('komainu',2); toast('Guardian Shrine: komainu join'); break;
    case 'ninja': obj=buildingSprite('b_ninja',p.x,p.z); addBarracks('ninja',2); toast('Hideout: ninja join'); break;
    case 'banner': obj=buildingSprite('b_banner',p.x,p.z); G.cpCap+=CFG.cpBanner; toast(`Command raised: squad cap ${G.cpCap}`); break;
    case 'ctower': { obj=buildingSprite('b_cannon',p.x,p.z);
      const cw={x:p.x,z:p.z,tier:1,obj,archers:[],cannon:true};
      const a={x:p.x+DOWN.x*0.4,z:p.z+0.4+DOWN.z*0.4,y:2.2,rot:Math.PI,cd:rand(0,1),target:null,rt:rand(0,0.3),tower:cw,seed:rand(0,9),hidden:true};
      cw.archers.push(a); G.towerArchers.push(a); G.towers[p.id]=cw; toast('Cannon tower built'); break; }
    case 'tower': { obj=buildingSprite('b_tower',p.x,p.z);
      const tw={x:p.x,z:p.z,tier:1,obj,archers:[]};
      for(const [ox,oz] of [[-0.75,0.55],[0.75,0.55],[0,0.95]]){ const a={x:p.x+ox+DOWN.x*0.5,z:p.z+oz+DOWN.z*0.5,y:2.45,rot:Math.PI,cd:rand(0,1),target:null,rt:rand(0,0.3),tower:tw,seed:rand(0,9)}; tw.archers.push(a); G.towerArchers.push(a); }
      G.towers[p.id]=tw; toast('Watchtower built'); break; }
    case 'fence': { const f=G.fences[p.fence]; f.built=true; f.hp=f.max; f.planks.forEach((pl,i)=>{ pl.h=0; pl.delay=i*0.025; }); toast('Palisade raised'); break; }
    case 'mine': obj=buildingSprite('b_mine',p.x,p.z); G.mine={x:p.x,z:p.z+1.8,t:1}; toast('Gold mine opened'); break;
    case 'forge': obj=buildingSprite('b_forge',p.x,p.z); G.forge={x:p.x,z:p.z,t:1,pile:0,give:0}; $('ingPill').style.display='flex'; toast('Forge lit: ingots unlock upgrades'); break;
    case 'armory': obj=buildingSprite('b_armory',p.x,p.z); G.armory={x:p.x,z:p.z+1.9}; toast('Armory open: stand in front to upgrade'); break;
    case 'tup': { const tw=G.towers[p.target]; if(tw){ tw.tier++;
      if(tw.tier===2){ const a={x:tw.x+DOWN.x*0.5,z:tw.z+0.25+DOWN.z*0.5,y:2.45,rot:Math.PI,cd:0,target:null,rt:0,tower:tw,seed:rand(0,9)}; tw.archers.push(a); G.towerArchers.push(a); }
      const bn=new T.Mesh(new T.PlaneGeometry(0.45,0.16),new T.MeshBasicMaterial({color:tw.tier>=4?0xF5C542:0x3E8FD6,side:T.DoubleSide}));
      bn.quaternion.copy(camBill); bn.position.set(DOWN.x*0.9,3.6+0.2*tw.tier,DOWN.z*0.9); bn.renderOrder=2; tw.obj.add(bn);
      tw.obj.scale.setScalar(0.85); G.tweens.push({obj:tw.obj,t:0,dur:0.35,delay:0,to:1}); toast(`Tower level ${tw.tier}`); }
      break; }
    case 'lvl2': { const b=G.barracks.find(bb=>bb.id===p.target); if(b){ b.cap+=2+(b.cls==='archer'?2:0); G.gear[b.cls]=(G.gear[b.cls]||0)+1; }
      toast(`${CLS[b?b.cls:'archer'].name} gear level ${b?G.gear[b.cls]+1:2}`); break; }
  }
  if(obj){ obj.scale.setScalar(0.01); dyn.add(obj); G.tweens.push({obj,t:0,dur:0.4,delay:0,to:1}); }
  refreshPads();
}

/* ================================================================ armory UI */
function upgCost(u){ return {g:u.g+(u.gs||0)*LV(u.id), i:u.i}; }
let armGrp='squad';
function upgState(u){
  if(u.rep){ if(LV(u.id)>=u.max) return 'owned'; if(u.id==='m_repair'&&G.keepHp>=G.keepMax) return 'poor'; const c=upgCost(u); return (G.stack>=c.g&&G.ingots>=c.i)?'avail':'poor'; }
  if(G.up.has(u.id)) return 'owned';
  if(u.req&&!G.up.has(u.req)) return 'locked';
  if(u.el&&['fire1','frost1','bolt1'].some(id=>G.up.has(id))) return 'locked';
  return (G.stack>=u.g&&G.ingots>=u.i)?'avail':'poor';
}
function renderArmory(){
  const HA=(G&&G.heroDef)?G.heroDef.attack:'arrow';
  const list=UPG.filter(u=>(u.grp||'squad')===armGrp&&(!u.att||u.att.indexOf(HA)>=0));
  let html='<div class="ugrp">'+GRP.map(g=>`<button class="ug${g[0]===armGrp?' on':''}" data-g="${g[0]}">${g[2]}<span>${g[1]}</span></button>`).join('')+'</div><div class="ustrip">';
  for(const u of list){ const c=upgCost(u), elCls=u.br==='Fire'?'el-fire':u.br==='Frost'?'el-frost':u.br==='Thunder'?'el-bolt':'';
    const lv=u.rep&&u.id!=='m_repair'?` <small>Lv ${LV(u.id)}</small>`:'';
    html+=`<button class="card ${elCls}" data-id="${u.id}"><b>${u.name}${lv}</b>${u.desc}<div class="cost">${c.g?`<span class="g">${c.g}</span>`:''}${c.i?`<span class="i">${c.i}</span>`:''}</div></button>`; }
  html+='</div>';
  $('armBody').innerHTML=html; refreshArmoryStates();
}
function refreshArmoryStates(){ $('armBody').querySelectorAll('.card').forEach(el=>{ const u=UPG.find(x=>x.id===el.dataset.id), s=upgState(u); el.classList.remove('owned','locked','avail','poor'); el.classList.add(s); }); }
function openArmory(remote){ if(remote&&G) G.armRemote=true; if(G.armOpen) return; G.armOpen=true; renderArmory(); $('armory').style.display='block'; $('pausedTag').classList.remove('show'); toast('Game paused while you choose upgrades',1.4); }
function closeArmory(){ if(G){ G.armOpen=false; G.armRemote=false; G.armDismissed=true; } $('armory').style.display='none'; }
$('armClose').addEventListener('click',()=>{ const near=G.armory&&Math.hypot(G.hero.x-G.armory.x,G.hero.z-G.armory.z)<2.4; closeArmory(); if(near) G.armDismissed=true; });
$('armBtn').addEventListener('click',()=>{ audioInit(); if(!G||G.state!=='play') return; if(!G.armory){ toast('Build the Armory first'); return; } if(G.armOpen) closeArmory(); else { G.armDismissed=false; openArmory(true); } });
$('armBody').addEventListener('click',e=>{
  const gb=e.target.closest('.ug'); if(gb){ armGrp=gb.dataset.g; renderArmory(); return; }
  const el=e.target.closest('.card'); if(!el||!G) return; const u=UPG.find(x=>x.id===el.dataset.id), s=upgState(u);
  if(s!=='avail'){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
  const c=upgCost(u); G.stack-=c.g; G.ingots-=c.i;
  if(u.rep){ const L=(G.lvls[u.id]||0)+1; G.lvls[u.id]=L;
    if(u.id==='h_guard'){ const add=G.hero.max*0.12; G.hero.max+=add; G.hero.hp+=add; }
    if(u.id==='c_hp'){ const add=G.keepMax*0.12; G.keepMax+=add; G.keepHp=Math.min(G.keepMax,G.keepHp+add); }
    if(u.id==='f_hp') for(const k in G.fences){ const f=G.fences[k]; f.max=Math.round(f.max*1.18); if(f.built) f.hp=f.max; }
    if(u.id==='m_vital') for(const un of G.units){ const r=(1+0.1*L)/(1+0.1*(L-1)); un.max*=r; un.hp=Math.min(un.max,un.hp*r+un.max*0.1); }
    if(u.id==='m_hero'){ G.hero.max+=20; G.hero.hp=Math.min(G.hero.max,G.hero.hp+20); }
    if(u.id==='m_wall') for(const k in G.fences){ const f=G.fences[k]; f.max=Math.round(f.max*1.2); if(f.built) f.hp=f.max; }
    if(u.id==='m_repair'){ G.keepHp=Math.min(G.keepMax,G.keepHp+G.keepMax*0.25); spawnParticles(KEEP.x,3,KEEP.z,24,0x9BF57E,5,0.7,1.1,-4); }
  } else G.up.add(u.id);
  const fx=G.armRemote?{x:G.hero.x,z:G.hero.z+1.2}:{x:G.armory.x,z:G.armory.z-1.9};
  if(c.g) payFx(Math.min(c.g,18),fx.x,fx.z,'gold'); if(c.i) payFx(c.i,fx.x,fx.z,'ingot');
  sfx('buy'); spawnParticles(fx.x,1.5,fx.z,20,0xFFE27A,5,0.6,1.1,-6); toast(u.rep&&u.id!=='m_repair'?`${u.name} Lv ${G.lvls[u.id]}`:u.name);
  if(u.id==='vol2'){ hero.bow2.visible=true; }
  const el2=arrowEl(); hero.bow.material.color.setHex(el2?ELCOL[el2]:0x3A1F1A); if(el2) hero.bow2.material.color.setHex(ELCOL[el2]);
  renderArmory();
});

/* ================================================================ painted VFX layer */
const FXK=['fx_fire','fx_slash','fx_bolt','fx_splash','fx_seal','fx_ice','fx_glow','fx_dust'];
const FX={}, fxGeo=new T.PlaneGeometry(1,1), _fxq=new T.Quaternion(), _fxax=new T.Vector3(0,0,1), _fxax2=new T.Vector3(1,0,0), _fxax3=new T.Vector3(0,1,0), _fxcol=new T.Color();
function fxInit(){ for(const k of FXK){ if(FX[k]||!SPR[k]) continue;
  const m=new T.InstancedMesh(fxGeo,new T.MeshBasicMaterial({map:tex(k),transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),40);
  m.frustumCulled=false; m.renderOrder=8; scene.add(m); FX[k]={mesh:m,items:[]}; } }
function fx(kind,x,y,z,size,life,col,opt){ const F=FX[kind]; if(!F) return; if(QL<0.45&&F.items.length>8) return; opt=opt||{};
  if(F.items.length>=40) F.items.shift();
  F.items.push({x,y,z,s0:size,t:0,life,col:col||0xFFFFFF,rot:opt.rot!==undefined?opt.rot:rand(0,6.3),spin:opt.spin||0,grow:opt.grow!==undefined?opt.grow:1.6,flat:!!opt.flat,vy:opt.vy||0}); }
function fxUpdate(dt){
  for(const k in FX){ const F=FX[k], ms=F.mesh; let n=0;
    for(let i=F.items.length-1;i>=0;i--){ const o=F.items[i]; o.t+=dt; if(o.t>=o.life){ F.items.splice(i,1); continue; }
      const u=o.t/o.life, sc=o.s0*(1+o.grow*u), a=Math.sin((1-u)*Math.PI*0.5);
      o.rot+=o.spin*dt; o.y+=o.vy*dt;
      _p.set(o.x,o.y,o.z); _s.set(sc,sc,sc);
      if(o.flat){ _q.setFromAxisAngle(_fxax2,-Math.PI/2); _fxq.setFromAxisAngle(_fxax3,o.rot); _q.multiply(_fxq); }
      else { _q.copy(camBill); _fxq.setFromAxisAngle(_fxax,o.rot); _q.multiply(_fxq); }
      _m4.compose(_p,_q,_s); ms.setMatrixAt(n,_m4);
      _fxcol.setHex(o.col).multiplyScalar(0.35+0.65*a); ms.setColorAt(n,_fxcol); n++; }
    ms.count=n; ms.instanceMatrix.needsUpdate=true; if(ms.instanceColor) ms.instanceColor.needsUpdate=true; }
}

/* ================================================================ battle cards
   Between waves the player picks one of three cards. Every card is a real trade-off,
   so each run of the same stage plays differently. */
const SKY={
  tsukuyomi:{name:'Moonfall',      col:0xBFD4FF, n:14}, raiju:{name:'Storm Descent', col:0xFFF07A, n:16},
  baku:{name:'Dream Collapse',     col:0xC89CFF, n:12}, onryo:{name:'Grudge Rain',   col:0x9CE8E0, n:14},
  shachi:{name:'Tidal Fall',       col:0x7FD8FF, n:14}, amaterasu:{name:'Sunfall',    col:0xFFD24D, n:18},
  fujin:{name:'Sky Tempest',       col:0x9FF0C8, n:16}, yukionna:{name:'Hailstorm',   col:0xCFF2FF, n:18},
  benkei:{name:'Heaven Blades',    col:0xE8E0D0, n:16}, kagutsuchi:{name:'Meteor Rain',col:0xFF7A2A, n:16},
  izanagi:{name:'Spear of Heaven', col:0xFFF4C8, n:20}};
const hasSky=()=>!!(G&&G.heroDef&&(G.heroDef.price||0)>=20000&&SKY[G.heroDef.id]);
const sky2Max=()=>Math.round(ultMax()*1.7);
const sky2Ready=()=>hasSky()&&G.state==='play'&&(G.sky2Cd||0)<=0&&G.hero.alive;
function castSky(){
  if(!sky2Ready()) return; const h=G.hero, HD=G.heroDef, S=SKY[HD.id]; G.sky2Cd=sky2Max();
  const R0=MOD('ultR')*9.5, col=S.col;
  const dmg=MOD('ultDmg')*MOD('heroDmg')*HD.dmg*34*(1+0.5*G.si)*(1+0.12*PK('hero'))*(1+0.1*LV('m_hero'));
  /* the strike lands over a couple of seconds: columns of light fall from the sky around the hero */
  G.skyFall=[]; const cx=h.x, cz=h.z;
  for(let i=0;i<S.n;i++){ const a=Math.random()*6.283, r=R0*Math.sqrt(Math.random());
    G.skyFall.push({x:cx+Math.sin(a)*r, z:cz+Math.cos(a)*r, t:-i*0.07, col, dmg:dmg/S.n*2.2, done:false}); }
  G.camPunch=0.2; G.shake=1.0; G.hitStop=0.08;
  popText(h.x,3.6,h.z,S.name.toUpperCase(),'crit'); toast(S.name+'!',1.5); sfx('boss');
}
function updateSky(dt){
  if(!G.skyFall||!G.skyFall.length) return;
  for(const b of G.skyFall){ if(b.done) continue; b.t+=dt;
    if(b.t<0) continue;
    if(b.t<0.45){ const y=14*(1-b.t/0.45);                       /* the column streaking down */
      spawnParticles(b.x,y,b.z,2,b.col,1.2,0.22,1.5,0);
      if(b.t<0.1) fx('fx_glow',b.x,0.1,b.z,3.4,0.5,b.col,{flat:true,grow:1.1});
      continue; }
    b.done=true;                                                  /* impact */
    fx('fx_bolt',b.x,2.4,b.z,5.5,0.4,b.col,{grow:1.2});
    fx('fx_fire',b.x,0.9,b.z,4.6,0.45,b.col,{grow:1.3});
    fx('fx_seal',b.x,0.14,b.z,5.2,0.6,b.col,{flat:true,spin:3,grow:1.2});
    spawnParticles(b.x,0.8,b.z,14,b.col,7,0.5,1.4,-6);
    G.shake=Math.max(G.shake,0.45); sfx('slam');
    for(const e of G.enemies){ if(e.dead) continue; const d=Math.hypot(e.x-b.x,e.z-b.z); if(d>3.2+e.rad) continue;
      hitEnemy(e,b.dmg*(1-0.35*Math.min(1,d/3.2)),G.hero,null,1);
      if(e.cls!=='boss'){ e.stunT=Math.max(e.stunT||0,0.9); } }
  }
  if(G.skyFall.every(b=>b.done)) G.skyFall=null;
}
const DIFFS=[
  {id:0, name:'Normal',    mul:1,   reward:1,   desc:'The standard fight'},
  {id:1, name:'Hard',      mul:2.6, reward:1.8, desc:'Enemies hit and survive far harder'},
  {id:2, name:'Nightmare', mul:5.5, reward:3,   desc:'Only for a fully upgraded army'}];
const CARDS=[
  {id:'siege',   name:'Siege Doctrine',  good:'Towers +60% damage',        bad:'Buildings cost 40% more',      m:{towerDmg:1.6, buildCost:1.4}},
  {id:'rapid',   name:'Rapid Volley',    good:'Towers fire 45% faster',    bad:'Tower damage -15%',            m:{towerCd:0.55, towerDmg:0.85}},
  {id:'gold',    name:'Gold Fever',      good:'Every coin is worth double',bad:'Castle -25% health',           m:{coin:2, keep:0.75}},
  {id:'miser',   name:"Miser's Ledger",  good:'Buildings cost 35% less',   bad:'Coins worth 15% less',         m:{buildCost:0.65, coin:0.85}},
  {id:'blood',   name:'Blood Rite',      good:'Hero +50% damage',          bad:'Hero -30% health',             m:{heroDmg:1.5, heroHp:0.7}},
  {id:'glass',   name:'Glass Cannon',    good:'Everything you own +30% damage', bad:'Castle -40% health',      m:{heroDmg:1.3, squadDmg:1.3, towerDmg:1.3, keep:0.6}},
  {id:'iron',    name:'Iron Discipline', good:'Squad +45% health',         bad:'Squad -15% damage',            m:{squadHp:1.45, squadDmg:0.85}},
  {id:'drums',   name:'War Drums',       good:'Squad +40% damage',         bad:'Squad -20% health',            m:{squadDmg:1.4, squadHp:0.8}},
  {id:'phalanx', name:'Phalanx',         good:'+3 squad command points',   bad:'Squad -10% damage',            m:{cp:3, squadDmg:0.9}},
  {id:'bulwark', name:'Bulwark',         good:'Fences +120% health',       bad:'Squad moves 15% slower',       m:{fenceHp:2.2, squadSpd:0.85}},
  {id:'spirit',  name:'Focused Spirit',  good:'Special recharges 40% faster', bad:'Special radius -20%',       m:{ultCd:0.6, ultR:0.8}},
  {id:'tremor',  name:'Tremor',          good:'Special radius +50%',       bad:'Special damage -15%',          m:{ultR:1.5, ultDmg:0.85}},
  {id:'vanguard',name:'Vanguard',        good:'Hero moves 35% faster',     bad:'Hero -20% health',             m:{heroSpd:1.35, heroHp:0.8}},
  {id:'bounty',  name:'Bounty Hunter',   good:'+70% gold from every kill', bad:'Enemies move 10% faster',      m:{kill:1.7, enSpd:1.1}},
  {id:'overtime',name:'Overtime',        good:'Units train 50% faster',    bad:'Units -15% health',            m:{train:0.5, squadHp:0.85}},
  {id:'exec',    name:'Executioner',     good:'+120% damage to bosses',    bad:'-20% damage to everything else',m:{bossDmg:2.2, normDmg:0.8}},
  {id:'alchemy', name:'Alchemy',         good:'Kills drop ingots far more often', bad:'Coins worth 10% less',  m:{ingot:3, coin:0.9}},
  {id:'ward',    name:'Blessed Ward',    good:'Castle +50% health',        bad:'Hero -25% damage',             m:{keep:1.5, heroDmg:0.75}},
  {id:'frenzy',  name:'Frenzy',          good:'Squad attacks 30% faster',  bad:'Squad -15% health',            m:{squadCd:0.7, squadHp:0.85}},
  {id:'harvest', name:'Harvest Moon',    good:'Wave clear bonus doubled',  bad:'Buildings cost 15% more',      m:{waveBonus:2, buildCost:1.15}}
];
const MOD=(k,d)=>{ const v=G&&G.mods&&G.mods[k]; return v==null?(d==null?1:d):v; };
function applyCard(c){
  G.cards.push(c.id);
  for(const k in c.m){ if(k==='cp'){ G.cpCap+=c.m.cp; continue; }
    G.mods[k]=(G.mods[k]==null?1:G.mods[k])*c.m[k]; }
  if(c.m.keep){ const r=G.keepHp/G.keepMax; G.keepMax=Math.round(G.keepMax*c.m.keep); G.keepHp=Math.max(1,Math.round(G.keepMax*r)); }
  if(c.m.heroHp){ const r=G.hero.hp/G.hero.max; G.hero.max=Math.round(G.hero.max*c.m.heroHp); G.hero.hp=Math.max(1,Math.round(G.hero.max*r)); }
  if(c.m.squadHp) for(const u of G.units){ const r=u.hp/u.max; u.max=Math.round(u.max*c.m.squadHp); u.hp=Math.max(1,Math.round(u.max*r)); }
  if(c.m.fenceHp) for(const k in G.fences){ const f=G.fences[k]; const r=f.max?f.hp/f.max:0; f.max=Math.round(f.max*c.m.fenceHp); f.hp=Math.round(f.max*r); }
  toast(`${c.name}: ${c.good}`,2.6); sfx('rank');
}
function openDiff(si){
  const best=SAVE.tier[si]||0, open=Math.min(2,best+1);
  $('cardPick').classList.add('show');
  $('cardPick').querySelector('h3').textContent='Choose difficulty';
  $('cardPick').querySelector('p').textContent=STAGES[si].name;
  $('cardRow').innerHTML=DIFFS.map(d=>{
    const locked=d.id>open;
    return `<button class="battlecard${locked?' lockedcard':''}" data-d="${d.id}" data-si="${si}" ${locked?'disabled':''}><b>${d.name}</b>`+
      `<span class="good">${d.id?('Rewards x'+d.reward):'Normal rewards'}</span>`+
      `<span class="bad">${locked?('Clear '+DIFFS[d.id-1].name+' first'):(d.id?('Enemies x'+d.mul+' tougher'):d.desc)}</span>`+
      `${(SAVE.tier[si]||0)>=d.id&&d.id>0?'<span class="good">Cleared</span>':''}</button>`; }).join('');
  window.__diffPick=true;
}
function chooseDiff(si,d){
  $('cardPick').classList.remove('show'); window.__diffPick=false;
  window.__skipDiff=true; window.__pendDiff=d;
  startStage(si); showScreen('hud');
}
function offerCards(){
  if(!G||G.state!=='play') return;
  const taken=new Set(G.cards), pool=CARDS.filter(c=>!taken.has(c.id));
  if(pool.length<3) return;
  const pick=[]; while(pick.length<3){ const c=pool[(Math.random()*pool.length)|0]; if(!pick.includes(c)) pick.push(c); }
  G.cardPick=pick; G.cardOpen=true;
  $('cardRow').innerHTML=pick.map((c,i)=>`<button class="battlecard" data-c="${i}"><b>${c.name}</b><span class="good">${c.good}</span><span class="bad">${c.bad}</span></button>`).join('');
  $('cardPick').classList.add('show');
}
function chooseCard(i){ const c=G.cardPick&&G.cardPick[i]; $('cardPick').classList.remove('show'); G.cardOpen=false; G.cardPick=null; if(c) applyCard(c); }

/* ================================================================ hero attacks */
const PASS=id=>!!(G&&G.heroDef&&G.heroDef.id===id);
function heroAttack(h,HD){
  const mul=MOD('heroDmg')*(1+0.12*PK('hero'))*(1+0.1*LV('m_hero'))*(PASS('shogun')?1.15:1)*(PASS('mao')?1.25:1)*(PASS('mikaboshi')?1.3:1)*(PASS('akaoni')?1.1:1)*(PASS('susanoo')?1.4:1)*(PASS('ushioni')?1.15:1)*(PASS('tsukuyomi')?1.55:1)*(PASS('karura')?1.35:1)*(PASS('amaterasu')?1.7:1)*(PASS('onryo')?1.45:1)*(PASS('kagutsuchi')?1.6:1)*(PASS('izanagi')?1.8:1), dmg=HD.dmg*mul, tg=h.target;
  const aoe=(radius,arc,fx)=>{ const fwd=h.rot; let n=0;
    for(const e of G.enemies){ if(e.dead) continue; const dx=e.x-h.x, dz=e.z-h.z, d=Math.hypot(dx,dz); if(d>radius+e.rad*0.6) continue;
      if(arc<Math.PI){ let da=Math.atan2(dx,dz)-fwd; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)>arc&&d>1.2) continue; }
      fx(e); n++; }
    for(let k=0;k<10;k++){ const a=h.rot+(k/9-0.5)*(arc<Math.PI?arc*2:Math.PI*2); spawnParticles(h.x+Math.sin(a)*radius*0.7,0.9,h.z+Math.cos(a)*radius*0.7,1,HD.attack==='ice'?0xBFF0FF:HD.attack==='flame'?0xFF7A2A:0xFFFFFF,2,0.25,1.1,0); }
    return n; };
  switch(HD.attack){
    case 'arrow': fireArrow(h.x,1.4,h.z,tg,dmg,h);
      { const a=Math.atan2(tg.x-h.x,tg.z-h.z); fx('fx_glow',h.x+Math.sin(a)*1.1,1.5,h.z+Math.cos(a)*1.1,1.5,0.22,0xFFE9A8,{grow:1.2});
        for(let k=0;k<7;k++){ const r=0.8+k*0.45; spawnParticles(h.x+Math.sin(a)*r,1.35,h.z+Math.cos(a)*r,1,0xFFE9A8,1.2,0.22,1.3-k*0.07,0); }
        spawnParticles(h.x+Math.sin(a)*1.1,1.4,h.z+Math.cos(a)*1.1,4,0xFFFFFF,3,0.18,1.3,0); }
      if(U('vol2')){ let ex=tg; for(let k2=0;k2<2;k2++){ const o=nearestEnemy(tg.x,tg.z,5,ex)||tg; fireArrow(h.x,1.4,h.z,o,dmg*0.7,h); ex=o; } } break;
    case 'wind': { let ex=null; for(let k=0;k<3;k++){ const o=nearestEnemy(h.x,h.z,HD.range,ex)||tg; fireArrow(h.x,2,h.z,o,dmg,h);
        const a=Math.atan2(o.x-h.x,o.z-h.z); for(let q=0;q<10;q++){ const r=q*0.55; spawnParticles(h.x+Math.sin(a+q*0.05)*r,1.5+Math.sin(q)*0.25,h.z+Math.cos(a+q*0.05)*r,1,q%2?0xDDEBFF:0xFFFFFF,1.4,0.3,1.35,0.2); } ex=o; }
      sfx('dash'); break; }
    case 'orb': G.orbs.push({sx:h.x,sy:1.8,sz:h.z,tx:tg.x,tz:tg.z,t:0,dur:Math.max(0.3,Math.hypot(tg.x-h.x,tg.z-h.z)/14),src:h,dmg,rad:2.4*(U('h_orb')?1.45:1),big:true});
      fx('fx_seal',h.x,0.15,h.z,4.6,0.5,0xC58CFF,{flat:true,spin:1.6,grow:0.5});
      for(let k=0;k<12;k++){ const a=k/12*6.3; spawnParticles(h.x+Math.sin(a)*0.9,1.6,h.z+Math.cos(a)*0.9,1,0xC58CFF,1.6,0.35,1.4,0.6); } sfx('magic'); break;
    case 'fox': G.orbs.push({sx:h.x,sy:2.2,sz:h.z,tx:tg.x,tz:tg.z,t:0,dur:Math.max(0.3,Math.hypot(tg.x-h.x,tg.z-h.z)/12),src:h,dmg,rad:2.7*(U('h_orb')?1.45:1),burn:6*(1+0.35*G.si)*(U('h_burn')?1.7:1),fox:true,big:true});
      fx('fx_glow',h.x,1.8,h.z,3.4,0.4,0x6FE3FF,{grow:1.1});
      for(let k=0;k<14;k++){ const a=k/14*6.3; spawnParticles(h.x+Math.sin(a)*1.0,1.5,h.z+Math.cos(a)*1.0,1,k%2?0x6FE3FF:0xFFFFFF,2,0.4,1.5,1.2); } sfx('fire'); break;
    case 'melee': { aoe(HD.range*(U('h_sweep')?1.35:1),U('h_sweep')?1.5:1.1,e=>{ hitEnemy(e,dmg,h); if(U('h_sweep')) hitEnemy(e,dmg*0.6,h,null,1); });
      const a0=h.rot; for(let k=0;k<22;k++){ const a=a0+(k/21-0.5)*2.0, r=HD.range*(0.55+0.45*Math.sin(k/21*Math.PI));
        spawnParticles(h.x+Math.sin(a)*r,1.2,h.z+Math.cos(a)*r,1,k%3?0xFFFFFF:0xFFE27A,1.1,0.3,1.8,0); }
      fx('fx_slash',h.x+Math.sin(a0)*1.6,1.5,h.z+Math.cos(a0)*1.6,HD.range*1.9,0.3,0xFFFFFF,{rot:-a0+Math.PI/2,grow:0.7});
      G.shake=Math.max(G.shake,0.1); sfx('slash'); break; }
    case 'blade': { const crit=Math.random()<(U('h_edge')?0.5:0.35); hitEnemy(tg,dmg*(crit?(U('h_edge')?4.1:2.5):1),h); if(crit){ popText(tg.x,2.3,tg.z,'CRIT','crit'); sfx('crit'); } else sfx('slash');
      const a=Math.atan2(tg.x-h.x,tg.z-h.z);
      for(let k=0;k<12;k++){ const t2=k/11; spawnParticles(lerp(h.x,tg.x,t2),1.2,lerp(h.z,tg.z,t2),1,crit?0xFFE27A:0xD8B4FF,1.4,0.22,1.6,0); }
      fx('fx_slash',lerp(h.x,tg.x,0.6),1.4,lerp(h.z,tg.z,0.6),crit?4.2:3.2,0.26,crit?0xFFE27A:0xD8B4FF,{rot:-a+Math.PI/2,grow:0.6});
      spawnParticles(tg.x,1.1,tg.z,crit?18:10,crit?0xFFE27A:0xB04FD6,crit?7:5,0.3,1.8,0); if(crit) G.shake=Math.max(G.shake,0.14); break; }
    case 'ice': { aoe(HD.range,Math.PI,e=>{ hitEnemy(e,dmg,h); e.slowT=U('h_frost')?4:2; e.slowF=Math.max(e.slowF||0,(e.cls==='boss'?0.25:0.5)*(U('h_frost')?1.5:1)); });
      for(let k=0;k<16;k++){ const a=k/16*6.3; for(let q=0;q<3;q++) spawnParticles(h.x+Math.sin(a)*HD.range*0.8,0.5+q*0.6,h.z+Math.cos(a)*HD.range*0.8,1,q?0xBFF0FF:0xFFFFFF,0.8,0.5,1.7,0.2); }
      fx('fx_ice',h.x,1.2,h.z,HD.range*2.1,0.45,0xBFF0FF,{grow:0.5});
      sfx('ice'); break; }
    case 'bolt': { let from=h, hit=[]; for(let k=0;k<(U('h_fork')?8:5);k++){ const o=k===0?tg:nearestEnemy(from.x,from.z,5,null); let pick=o; if(k>0){ let best=null,bd=25; for(const e of G.enemies){ if(e.dead||hit.includes(e)) continue; const d=(e.x-from.x)**2+(e.z-from.z)**2; if(d<bd){bd=d;best=e;} } pick=best; } if(!pick) break;
        for(let q=0;q<14;q++){ const u=q/13; spawnParticles(lerp(from.x,pick.x,u),1.6+rand(-0.45,0.45),lerp(from.z,pick.z,u),1,q%3?0xFFF27A:0xFFFFFF,0.7,0.28,1.6,0); }
        spawnParticles(pick.x,1.2,pick.z,7,0xFFF27A,4,0.3,1.6,0);
        { const ang=Math.atan2(pick.x-from.x,pick.z-from.z), dd=Math.hypot(pick.x-from.x,pick.z-from.z);
          fx('fx_bolt',lerp(from.x,pick.x,0.5),1.6,lerp(from.z,pick.z,0.5),Math.max(2,dd),0.18,0xFFF7B0,{rot:-ang,grow:0.2}); } hit.push(pick); hitEnemy(pick,dmg*(k?0.8:1),h,null,1); from=pick; } sfx('zap'); break; }
    case 'flame': { aoe(HD.range,Math.PI,e=>{ hitEnemy(e,dmg,h); e.burnT=3; e.burnDps=Math.max(e.burnDps||0,8*(1+0.35*G.si)*(U('h_burn')?1.7:1)); });
      for(let k=0;k<18;k++){ const a=k/18*6.3, r=HD.range*0.75; for(let q=0;q<3;q++) spawnParticles(h.x+Math.sin(a)*r,0.4+q*0.8,h.z+Math.cos(a)*r,1,q>1?0xFFE27A:0xFF7A2A,1.5,0.55,1.9,2.2); }
      fx('fx_fire',h.x,1.3,h.z,HD.range*2.2,0.5,0xFF9A3C,{grow:0.8,spin:0.6});
      sfx('fire'); G.shake=Math.max(G.shake,0.14); break; }
  }
}

/* ================================================================ hero special attack */
const ULT_MAX=26;
const ULT_FX={fujin:'gale',yukionna:'frost',benkei:'slash',kagutsuchi:'inferno',izanagi:'stars',raiju:'storm',baku:'spirits',onryo:'shadow',shachi:'wave',amaterasu:'stars',ronin:'arrows',samurai:'slash',onmyoji:'seal',ninja:'shadow',tengu:'gale',kitsune:'inferno',yuki:'frost',shogun:'inferno',kappa:'wave',gasha:'quake',raijin:'storm',nue:'slash',ryujin:'wave',tsuchi:'web',nurari:'spirits',orochi:'venom',namazu:'quake',mao:'void',umibozu:'wave',kamaitachi:'gale',daidara:'quake',hannya:'spirits',mikaboshi:'stars',akaoni:'quake',brute:'quake',ushioni:'slash',shuten:'inferno',kirin:'storm',enma:'spirits',susanoo:'storm',jorogumo:'web',karura:'inferno',kuzuryu:'wave',izanami:'spirits',tsukuyomi:'stars'};
const ULTS={
  fujin:{name:'Tempest Unleashed',col:0x9FF0C8,r:11.0,mult:28,knock:7,hits:2,slow:0.6},
  yukionna:{name:'Endless Blizzard',col:0xCFF2FF,r:11.0,mult:28,slow:0.85,stun:3.0},
  benkei:{name:'Thousand Blades',col:0xE8E0D0,r:10.6,mult:32,hits:3,knock:5},
  kagutsuchi:{name:'Birth of Fire',col:0xFF7A2A,r:11.2,mult:30,burn:40,stun:2.4},
  izanagi:{name:'Heavenly Spear',col:0xFFF4C8,r:12.0,mult:36,chain:true,stun:3.0,heal:0.8,repair:0.8},
  raiju:{name:'Thunder Hunt',col:0xFFF27A,r:10.2,mult:21,chain:true,stun:2.4,hits:2},
  baku:{name:'Nightmare Feast',col:0x9A6FE0,r:9.8,mult:20,slow:0.75,stun:2.2,heal:0.6},
  onryo:{name:'Grudge Storm',col:0x8FD8FF,r:9.6,mult:22,hits:3,burn:24},
  shachi:{name:'Golden Deluge',col:0xFFD34D,r:10.4,mult:21,knock:6,slow:0.6,repair:0.6},
  amaterasu:{name:'Sunrise Judgement',col:0xFFE9A8,r:11.0,mult:26,burn:30,stun:2.6,heal:0.6},
  ushioni:{name:'Chain Rampage',col:0xE07A2A,r:8.6,mult:15,hits:2,knock:4,stun:1.6},
  shuten:{name:'Demon King Feast',col:0xD7393A,r:9.0,mult:16,burn:24,stun:1.8},
  kirin:{name:'Divine Thunder',col:0xFFE45C,r:9.4,mult:17,chain:true,stun:2.2},
  enma:{name:'Final Judgement',col:0x6FD66A,r:9.6,mult:18,burn:26,slow:0.7,repair:0.4},
  susanoo:{name:'Storm of Heaven',col:0x6FA8FF,r:10.0,mult:20,chain:true,stun:2.4,knock:4},
  akaoni:{name:'Iron Club Quake',col:0xE0A11B,r:7.4,mult:11,stun:1.8,knock:3},
  brute:{name:'Aooni Smash',col:0x4F7FD1,r:7.0,mult:10,stun:1.6,knock:3.5},
  ronin:{name:'Arrow Storm',col:0xFFE27A,r:8.0,mult:7,hits:3,knock:1.5},
  samurai:{name:'Crescent Sweep',col:0xE6ECF2,r:6.6,mult:11,knock:3.2,stun:1.6},
  onmyoji:{name:'Five-Element Seal',col:0xC58CFF,r:7.6,mult:8,stun:2.2,slow:0.6},
  ninja:{name:'Shadow Massacre',col:0xB04FD6,r:7.2,mult:9,hits:2,stun:1.2},
  tengu:{name:'Wing Gale',col:0xDDEBFF,r:8.6,mult:7,knock:6.0,slow:0.5},
  kitsune:{name:'Nine-Tail Inferno',col:0xFF7A2A,r:7.6,mult:8,burn:16},
  yuki:{name:'Absolute Zero',col:0xBFF0FF,r:7.8,mult:8,freeze:2.5,slow:0.7},
  shogun:{name:'Flame Nodachi',col:0xFF6A1A,r:7.4,mult:10,burn:14,knock:2},
  kappa:{name:'Tsunami Crash',col:0x6FE3FF,r:8.4,mult:8,knock:4.5,slow:0.55,repair:0.35},
  gasha:{name:'Bone Quake',col:0xC58CFF,r:8.2,mult:9,stun:2.6},
  raijin:{name:'Thunderstorm',col:0xFFF27A,r:8.8,mult:8,stun:1.8,chain:true},
  nue:{name:'Storm Pounce',col:0xFFD34D,r:7.0,mult:11,hits:2,stun:1.4},
  ryujin:{name:'Tidal Surge',col:0x6FE3FF,r:9.0,mult:9,knock:5,slow:0.6,heal:0.4},
  tsuchi:{name:'Web Cocoon',col:0xE8E8F5,r:8.0,mult:8,freeze:2.2,slow:0.75},
  nurari:{name:'Yokai Parade',col:0x8E4FD6,r:8.6,mult:9,slow:0.6,burn:12,heal:0.3},
  orochi:{name:'Eight Fangs',col:0x5EC46A,r:7.8,mult:12,burn:16,stun:1.2},
  namazu:{name:'Great Quake',col:0xC8A46E,r:9.2,mult:10,stun:2.4,repair:0.5},
  mao:{name:'Eclipse Blade',col:0xC58CFF,r:8.4,mult:13,stun:1.6,burn:14},
  umibozu:{name:'Drowning Tide',col:0x2F6FC0,r:9.0,mult:11,knock:5,slow:0.65},
  kamaitachi:{name:'Sickle Cyclone',col:0xDDEBFF,r:8.0,mult:12,hits:3,knock:3},
  daidara:{name:'Mountain Fall',col:0x8C7A56,r:9.6,mult:14,stun:2.8,repair:0.4},
  hannya:{name:'Jealous Flame',col:0x6FA8FF,r:8.6,mult:13,burn:20,stun:1.4},
  mikaboshi:{name:'Starfall',col:0x9FB8FF,r:9.6,mult:16,hits:2,stun:2,chain:true}
};
const ultMax=()=>MOD('ultCd')*ULT_MAX*Math.max(0.35,1-0.05*PK('ult')-0.06*LV('h_ult'));
function ultReady(){ return G&&G.state==='play'&&(G.ultCd||0)<=0&&G.hero.alive; }
function castUlt(){
  if(!ultReady()) return; const h=G.hero, HD=G.heroDef; G.ultCd=ultMax();
  const U0=ULTS[HD.id]||ULTS.ronin, R0=MOD('ultR')*U0.r, col=U0.col;
  const dmg=MOD('ultDmg')*MOD('heroDmg')*HD.dmg*U0.mult*(1+0.5*G.si)*(1+0.12*PK('hero'))*(1+0.1*LV('m_hero'))*(PASS('shogun')?1.15:1)*(PASS('mao')?1.25:1)*(PASS('mikaboshi')?1.3:1)*(PASS('akaoni')?1.1:1)*(PASS('susanoo')?1.4:1)*(PASS('ushioni')?1.15:1)*(PASS('tsukuyomi')?1.55:1)*(PASS('karura')?1.35:1)*(PASS('amaterasu')?1.7:1)*(PASS('onryo')?1.45:1)*(PASS('kagutsuchi')?1.6:1)*(PASS('izanagi')?1.8:1);
  const hits=U0.hits||1;
  for(const e of G.enemies){ if(e.dead) continue; const d=Math.hypot(e.x-h.x,e.z-h.z); if(d>R0+e.rad) continue;
    const fall=1-0.3*Math.min(1,d/R0), boss=e.cls==='boss';
    for(let q=0;q<hits;q++) hitEnemy(e,dmg*fall/hits,h,null,1);
    if(U0.stun) e.stunT=Math.max(e.stunT,boss?U0.stun*0.35:U0.stun);
    if(U0.freeze){ e.slowT=Math.max(e.slowT,U0.freeze*2); e.slowF=Math.max(e.slowF,boss?0.3:(U0.slow||0.6)); if(!boss) e.freezeT=Math.max(e.freezeT,U0.freeze); }
    else if(U0.slow){ e.slowT=Math.max(e.slowT,3); e.slowF=Math.max(e.slowF,boss?U0.slow*0.5:U0.slow); }
    if(U0.burn){ e.burnT=4; e.burnDps=Math.max(e.burnDps||0,U0.burn*(1+0.35*G.si)); }
    if(U0.knock&&!boss){ const k=Math.max(0.01,d); e.x+=(e.x-h.x)/k*U0.knock; e.z+=(e.z-h.z)/k*U0.knock; }
    if(U0.chain){ for(let q=0;q<6;q++){ const t2=q/5; spawnParticles(lerp(h.x,e.x,t2),1.4,lerp(h.z,e.z,t2),1,col,0.8,0.25,0.9,0); } }
  }
  for(const f of Object.values(G.fences)) if(f.built) f.hp=Math.min(f.max,f.hp+f.max*(U0.repair||0.25));
  for(const u of G.units) u.hp=Math.min(u.max,u.hp+u.max*(U0.heal||0.25));
  if(U0.repair) G.keepHp=Math.min(G.keepMax,G.keepHp+G.keepMax*U0.repair*0.3);
  G.camPunch=0.16; G.ultFx=0.0001; G.ultKind=ULT_FX[HD.id]||'slash'; G.ultCol=col; G.ultR=R0; G.shake=0.9; G.hitStop=0.1;
  ultBurst(h.x,h.z,G.ultKind,col,R0);
  { const K=G.ultKind;
    fx('fx_seal',h.x,0.16,h.z,R0*1.7,0.75,col,{flat:true,spin:2.2,grow:0.9});
    const m={inferno:'fx_fire',flame:'fx_fire',frost:'fx_ice',storm:'fx_bolt',wave:'fx_splash',quake:'fx_dust',slash:'fx_slash',shadow:'fx_slash',arrows:'fx_glow',stars:'fx_glow',spirits:'fx_glow',web:'fx_ice',venom:'fx_splash',void:'fx_seal',gale:'fx_slash',seal:'fx_seal'}[K]||'fx_glow';
    for(let k=0;k<7;k++){ const a=k/7*6.3+rand(-0.2,0.2), r=R0*rand(0.3,0.85);
      fx(m,h.x+Math.sin(a)*r,1.2,h.z+Math.cos(a)*r,R0*0.75,0.55,col,{grow:1.1}); }
    fx('fx_glow',h.x,1.6,h.z,R0*1.4,0.5,0xFFFFFF,{grow:1.3}); }
  popText(h.x,3.2,h.z,U0.name.toUpperCase(),'crit'); toast(U0.name+'!',1.4);
  sfx('slam'); sfx(U0.freeze?'ice':U0.chain?'zap':U0.burn?'fire':'magic');
}
const ultRing=(()=>{ const m=new T.Mesh(new T.RingGeometry(0.55,1,48),new T.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0.8,depthWrite:false,side:T.DoubleSide}));
  m.rotation.x=-Math.PI/2; m.visible=false; m.renderOrder=6; scene.add(m); return m; })();

function ultBurst(x,z,kind,col,R0){
  const ring=(n,r,c,sp,life,size,grav)=>{ for(let k=0;k<n;k++){ const a=k/n*Math.PI*2; spawnParticles(x+Math.sin(a)*r,1,z+Math.cos(a)*r,1,c,sp,life,size,grav); } };
  switch(kind){
    case 'arrows': for(let k=0;k<70;k++){ const a=rand(0,6.3), r=rand(1,R0); spawnParticles(x+Math.sin(a)*r,rand(5,8),z+Math.cos(a)*r,1,0xFFE27A,0.6,0.55,1.5,-26); } ring(30,R0*0.7,col,3,0.5,1.1,-4); break;
    case 'slash': for(let q=0;q<4;q++){ const a0=rand(0,6.3); for(let k=0;k<26;k++){ const a=a0+k/26*2.2, r=R0*(0.35+0.6*k/26); spawnParticles(x+Math.sin(a)*r,1.1,z+Math.cos(a)*r,1,q%2?0xFFFFFF:col,1.2,0.4,1.5,0); } } break;
    case 'seal': for(let q=1;q<=3;q++) ring(34,R0*q/3,q%2?col:0xFFFFFF,0.6,0.8,1.2,0.5); for(let k=0;k<20;k++) spawnParticles(x,rand(0.5,5),z,1,col,1.5,0.9,1.3,1.2); break;
    case 'shadow': for(let k=0;k<50;k++){ const a=rand(0,6.3), r=rand(0.5,R0); spawnParticles(x+Math.sin(a)*r,rand(0.5,2.5),z+Math.cos(a)*r,1,k%3?col:0x1A1422,7,0.4,1.6,0); } break;
    case 'gale': for(let q=0;q<80;q++){ const a=q*0.6, r=R0*q/80; spawnParticles(x+Math.sin(a)*r,0.8+q*0.03,z+Math.cos(a)*r,1,q%3?col:0xFFFFFF,2.5,0.7,1.3,0.4); } break;
    case 'inferno': for(let q=0;q<14;q++){ const a=q/14*6.3, r=R0*0.75; for(let k=0;k<7;k++) spawnParticles(x+Math.sin(a)*r,0.4+k*0.7,z+Math.cos(a)*r,1,k>4?0xFFE27A:col,1.6,0.8,1.7,2.5); } ring(40,1.5,0xFF7A2A,6,0.6,1.6,-2); break;
    case 'frost': for(let q=0;q<16;q++){ const a=q/16*6.3, r=R0*0.8; for(let k=0;k<5;k++) spawnParticles(x+Math.sin(a)*r,0.3+k*0.55,z+Math.cos(a)*r,1,k%2?0xFFFFFF:col,0.8,1.1,1.5,0.2); } for(let k=0;k<50;k++){ const a=rand(0,6.3),r=rand(0,R0); spawnParticles(x+Math.sin(a)*r,rand(3,6),z+Math.cos(a)*r,1,0xDFF8FF,0.5,1.4,1.1,-4); } break;
    case 'wave': for(let q=1;q<=4;q++) ring(46,R0*q/4,q%2?col:0xFFFFFF,3.5,0.75,1.6,-1.5); break;
    case 'quake': for(let k=0;k<60;k++){ const a=rand(0,6.3), r=rand(0.5,R0); spawnParticles(x+Math.sin(a)*r,0.2,z+Math.cos(a)*r,1,k%4?col:0x8C7A56,rand(5,11),0.9,2,-11); } ring(28,R0*0.5,0xC8A46E,4,0.7,2.2,-8); break;
    case 'storm': for(let q=0;q<12;q++){ const a=rand(0,6.3), r=rand(2,R0); for(let k=0;k<12;k++) spawnParticles(x+Math.sin(a)*r+rand(-0.3,0.3),7-k*0.55,z+Math.cos(a)*r,1,k<3?0xFFFFFF:col,0.4,0.35,1.5,0); } ring(36,R0*0.8,0xFFF27A,3,0.5,1.3,0); break;
    case 'web': for(let q=0;q<18;q++){ const a=q/18*6.3; for(let k=0;k<12;k++){ const r=R0*k/12; spawnParticles(x+Math.sin(a)*r,0.9,z+Math.cos(a)*r,1,0xF2F2F8,0.4,1.2,1.1,0.1); } } ring(30,R0*0.6,col,1,1,1.4,0); break;
    case 'spirits': for(let q=0;q<26;q++){ const a=rand(0,6.3), r=rand(1,R0); for(let k=0;k<3;k++) spawnParticles(x+Math.sin(a)*r,0.6+k*0.8,z+Math.cos(a)*r,1,k?col:0xFFFFFF,1.1,1.5,1.4,1.6); } break;
    case 'venom': for(let q=0;q<8;q++){ const a=q/8*6.3; for(let k=0;k<16;k++){ const r=R0*k/16; spawnParticles(x+Math.sin(a)*r,1+Math.sin(k*0.6)*0.8,z+Math.cos(a)*r,1,k%2?col:0xBFE36A,1,0.7,1.6,0.5); } } break;
    case 'void': for(let q=1;q<=3;q++) ring(40,R0*q/3,q===2?0x1A1422:col,-2,0.9,1.8,0.3); for(let k=0;k<40;k++){ const a=rand(0,6.3),r=R0; spawnParticles(x+Math.sin(a)*r,rand(0.5,4),z+Math.cos(a)*r,1,col,-5,0.8,1.5,0); } break;
    case 'stars': for(let k=0;k<70;k++){ const a=rand(0,6.3), r=rand(0,R0); spawnParticles(x+Math.sin(a)*r,rand(6,10),z+Math.cos(a)*r,1,k%3?col:0xFFFFFF,0.5,0.9,1.7,-20); } ring(44,R0*0.85,0xFFFFFF,2,0.8,1.4,-1); break;
    default: ring(60,1.2,col,R0*1.3,0.85,1.7,-3);
  }
  spawnParticles(x,1.4,z,30,0xFFFFFF,6,0.6,1.5,-4);
}

/* ================================================================ update */
function update(dt){
  G.time+=dt; const h=G.hero;
  // hero
  if(!h.alive){ h.respawn-=dt; hero.g.visible=false;
    if(h.respawn<=0){ h.alive=true; h.hp=h.max; h.x=0; h.z=6; h.vx=h.vz=0; hero.g.visible=true; spawnParticles(h.x,0.5,h.z,20,0xFFE27A,5,0.5,1,-8); } }
  else {
    const i=readInput(), wx=RIGHT.x*i.x+DOWN.x*i.y, wz=RIGHT.z*i.x+DOWN.z*i.y, k=1-Math.exp(-dt*13), pvx=h.vx, pvz=h.vz;
    h.vx+=(wx*MOD('heroSpd')*G.heroDef.speed*SQUAD_SPEED*(PASS('nue')?1.15:1)*(PASS('kamaitachi')?1.25:1)*(PASS('raiju')?1.3:1)*(PASS('fujin')?1.35:1)-h.vx)*k; h.vz+=(wz*MOD('heroSpd')*G.heroDef.speed*SQUAD_SPEED*(PASS('nue')?1.15:1)*(PASS('kamaitachi')?1.25:1)*(PASS('raiju')?1.3:1)*(PASS('fujin')?1.35:1)-h.vz)*k; h.ax=((h.vx-pvx)*RIGHT.x+(h.vz-pvz)*RIGHT.z)/Math.max(dt,1e-3);
    h.x+=h.vx*dt; h.z+=h.vz*dt; const dk=Math.hypot(h.x-KEEP.x,h.z-KEEP.z); if(dk>25){ h.x=KEEP.x+(h.x-KEEP.x)/dk*25; h.z=KEEP.z+(h.z-KEEP.z)/dk*25; }
    const was=h.moving; h.moving=Math.hypot(h.vx,h.vz)>0.5; if(was&&!h.moving) G.wob.v+=1.1;
    const HD=G.heroDef;
    h.rt-=dt; if(h.rt<=0){ h.rt=0.2; h.target=nearestEnemy(h.x,h.z,HD.range); } if(h.target&&h.target.dead) h.target=null;
    h.cd-=dt;
    if(h.target){ h.rot=lerpAngle(h.rot,Math.atan2(h.target.x-h.x,h.target.z-h.z),1-Math.exp(-dt*14));
      if(h.cd<=0){ h.cd=HD.cd; h.atk=0.9; heroAttack(h,HD); } }
    else if(h.moving) h.rot=lerpAngle(h.rot,Math.atan2(h.vx,h.vz),1-Math.exp(-dt*12));
    else h.rot=lerpAngle(h.rot,CAMROT,1-Math.exp(-dt*4));
    h.flash=Math.max(0,h.flash-dt*8); h.atk=Math.max(0,(h.atk||0)-dt*3.5); if(h.hp<h.max) h.hp=Math.min(h.max,h.hp+dt*3);
    // armory proximity
    if(G.armory){ const near=Math.hypot(h.x-G.armory.x,h.z-G.armory.z)<1.7&&!h.moving;
      if(near&&!G.armDismissed) openArmory(); if(Math.hypot(h.x-G.armory.x,h.z-G.armory.z)>2.4){ if(G.armOpen&&!G.armRemote) closeArmory(); G.armDismissed=false; } }
  }
  const L=G.lean, Wb=G.wob, leanT=clamp(-h.ax*0.018,-0.5,0.5);
  L.v+=(-(L.x-leanT)*42-L.v*8.5)*dt; L.x+=L.v*dt; Wb.v+=(-Wb.x*65-Wb.v*3.2)*dt; Wb.x+=Wb.v*dt;

  // squad
  const cx=h.alive?h.x:0, cz=h.alive?h.z:6;
  if(!G.sortT||G.sortT<=0){ G.units.sort((a,b)=>CLS[a.cls].order-CLS[b.cls].order); G.sortT=0.5; } G.sortT-=dt;
  for(let i=0;i<G.units.length;i++){
    const u=G.units[i], D=CLS[u.cls], o=slotOffset(i), tx=cx+o.x, tz=cz+o.z, rankMul=1+0.25*u.rank;
    u.flash=Math.max(0,u.flash-dt*8); u.atk=Math.max(0,(u.atk||0)-dt*4); u.cd-=dt; u.hp=Math.min(u.max,u.hp+dt*1.5);
    let mx=tx-u.x, mz=tz-u.z, speed=MOD('squadSpd')*D.speed*SQUAD_SPEED, chase=null;
    if(MELEE_CLS.includes(u.cls)){
      u.rt-=dt; if(u.rt<=0){ u.rt=0.25; const e=nearestEnemy(u.x,u.z,4.5); u.target=(e&&Math.hypot(e.x-cx,e.z-cz)<7.5)?e:null; }
      if(u.target&&!u.target.dead){ chase=u.target; mx=chase.x-u.x; mz=chase.z-u.z; const d=Math.hypot(mx,mz)-chase.rad*0.6;
        if(d<=D.range){ mx=mz=0; u.rot=lerpAngle(u.rot,Math.atan2(chase.x-u.x,chase.z-u.z),0.4);
          if(u.cd<=0){ u.cd=MOD('squadCd')*D.cd; u.atk=1; const dmg=MOD('squadDmg')*D.dmg*rankMul*(1+0.15*(G.gear[u.cls]||0))*(u.rally>0?1.25:1)*(U('blade1')?1.25:1)*(u.cls==='yari'?1.1:1)*(PASS('shogun')?1.15:1)*(PASS('mao')?1.25:1)*(PASS('mikaboshi')?1.3:1)*(PASS('akaoni')?1.1:1)*(PASS('susanoo')?1.4:1)*(PASS('ushioni')?1.15:1)*(PASS('tsukuyomi')?1.55:1)*(PASS('karura')?1.35:1)*(PASS('amaterasu')?1.7:1)*(PASS('onryo')?1.45:1)*(PASS('kagutsuchi')?1.6:1)*(PASS('izanagi')?1.8:1); if(D.knock&&chase.cls!=='boss'){ const dx=chase.x-u.x,dz=chase.z-u.z,dd=Math.hypot(dx,dz)||1; chase.x+=dx/dd*D.knock; chase.z+=dz/dd*D.knock; chase.stunT=Math.max(chase.stunT,0.5); }
            if(D.pull&&chase.cls!=='boss'){ const dx=u.x-chase.x,dz=u.z-chase.z,dd=Math.hypot(dx,dz)||1; chase.x+=dx/dd*1.6; chase.z+=dz/dd*1.6; chase.slowT=Math.max(chase.slowT,1.2); chase.slowF=Math.max(chase.slowF,0.4); }
            hitEnemy(chase,dmg,u); sfx('slash');
            spawnParticles(chase.x,1,chase.z,4,0xFFFFFF,4,0.2,0.9,0);
            if(U('blade2')){ let n=0; for(const o2 of G.enemies){ if(n>=2) break; if(o2.dead||o2===chase) continue; if(Math.hypot(o2.x-chase.x,o2.z-chase.z)<1.8){ hitEnemy(o2,dmg*0.7,u,null,1); n++; } } } } } }
    } else if(u.cls==='ninja'){
      if(u.st==='idle'){ if(u.cd<=0){ let best=null,bs=-1; for(const e of G.enemies){ if(e.dead) continue; const d=Math.hypot(e.x-u.x,e.z-u.z); const score=(e.cls==='boss'&&d<12)?1e6:(d<8?e.max:-1); if(score>bs){ bs=score; best=e; } } if(best&&bs>0){ u.target=best; u.st='dash'; } } }
      if(u.st==='dash'){ const e=u.target; if(!e||e.dead){ u.st='back'; } else { mx=e.x-u.x; mz=e.z-u.z; speed=16*SQUAD_SPEED; const d=Math.hypot(mx,mz);
        if(d<e.rad+0.7){ const crit=Math.random()<Math.min(0.9,D.crit+0.15*G.gear.ninja); const mul=crit?(U('blade3')?3.5:2.5):1; const dmg=D.dmg*rankMul*mul*(U('blade1')?1.25:1)*(PASS('shogun')?1.15:1);
          hitEnemy(e,dmg,u); if(crit){ popText(e.x,2.3,e.z,'CRIT','crit'); sfx('crit'); } spawnParticles(e.x,1,e.z,8,0xB04FD6,5,0.3,1,0); sfx('slash'); u.atk=1; u.cd=MOD('squadCd')*D.cd; u.st='back'; } } }
      if(u.st==='back'){ speed=12*SQUAD_SPEED; if(Math.hypot(tx-u.x,tz-u.z)<0.6) u.st='idle'; }
    } else {
      u.rt-=dt; if(u.rt<=0){ u.rt=0.25; u.target=nearestEnemy(u.x,u.z,D.range); } if(u.target&&u.target.dead) u.target=null;
      if(u.target&&u.cd<=0){
        u.cd=D.cd*rand(1,1.1); u.atk=0.9;
        if(u.cls==='archer'||u.cls==='teppo'||u.cls==='falcon'){ const dmg=D.dmg*rankMul*(1+0.25*(G.gear[u.cls]||0)); fireArrow(u.x,1.0,u.z,u.target,dmg,u);
          if(u.cls==='teppo'){ spawnParticles(u.x,1.2,u.z,6,0xE8E8E8,2,0.5,1,1); sfx('zap'); }
          if(u.cls==='falcon'){ spawnParticles(u.x,1.4,u.z,5,0xC8A46E,3,0.4,1.1,0.6); }
          if(U('vol1')&&u.cls==='archer'){ const o2=nearestEnemy(u.x,u.z,D.range,u.target); if(o2) fireArrow(u.x,1.0,u.z,o2,dmg*0.5,u); } }
        else if(u.cls==='miko'){ const heal=D.heal*(1+0.3*(G.gear.miko||0))*rankMul;
          for(const o of G.units) if(o!==u&&o.hp<o.max&&Math.hypot(o.x-u.x,o.z-u.z)<5) o.hp=Math.min(o.max,o.hp+heal);
          if(G.hero.alive&&Math.hypot(G.hero.x-u.x,G.hero.z-u.z)<5) G.hero.hp=Math.min(G.hero.max,G.hero.hp+heal);
          G.keepHp=Math.min(G.keepMax,G.keepHp+heal*0.5);
          spawnParticles(u.x,1.4,u.z,10,0xFFE9A8,3,0.6,1,2); sfx('rank'); if(u.target) hitEnemy(u.target,D.dmg*rankMul,u); }
        else if(u.cls==='kabuki'){ const D2=CLS.kabuki, dmg=D2.dmg*rankMul*(1+0.3*(G.gear.kabuki||0));
          for(const e of G.enemies){ if(e.dead) continue; const d=Math.hypot(e.x-u.target.x,e.z-u.target.z); if(d<D2.aoe+e.rad*0.5){ hitEnemy(e,dmg,u,null,1); e.slowT=Math.max(e.slowT,1.5); e.slowF=Math.max(e.slowF,0.3); } }
          for(const o of G.units) if(Math.hypot(o.x-u.x,o.z-u.z)<6){ o.rally=1.2; }
          for(let q=0;q<14;q++){ const a=q/14*6.3; spawnParticles(u.target.x+Math.sin(a)*D2.aoe*0.7,1,u.target.z+Math.cos(a)*D2.aoe*0.7,1,0xF7B6D2,2,0.5,1.2,0.4); } sfx('slash'); }
        else if(u.cls==='tanuki'){ const d=Math.hypot(u.target.x-u.x,u.target.z-u.z);
          G.orbs.push({sx:u.x,sy:1.4,sz:u.z,tx:u.target.x,tz:u.target.z,t:0,dur:Math.max(0.35,d/13),src:u,bomb:true,
            dmg:D.dmg*rankMul*(1+0.3*(G.gear.tanuki||0)), rad:D.aoe*(1+0.15*(G.gear.tanuki||0))}); sfx('bow'); }
        else { const d=Math.hypot(u.target.x-u.x,u.target.z-u.z); G.orbs.push({sx:u.x,sy:1.2,sz:u.z,tx:u.target.x,tz:u.target.z,t:0,dur:Math.max(0.3,d/14),src:u,
          dmg:D.dmg*rankMul*(1+0.3*G.gear.onmyoji), rad:D.aoe*(U('spirit1')?1.35:1)*(1+0.25*G.gear.onmyoji)}); sfx('magic'); }
      }
    }
    if(u.target&&!u.target.dead&&!chase) u.rot=lerpAngle(u.rot,Math.atan2(u.target.x-u.x,u.target.z-u.z),1-Math.exp(-dt*12));
    const d=Math.hypot(mx,mz);
    if(d>0.05){ const sp=chase||u.st==='dash'?speed:Math.min(d*8,speed*(d>4?1.4:1)); const step=Math.min(d,sp*dt); u.x+=mx/d*step; u.z+=mz/d*step; u.moving=sp>0.6;
      if(!(u.target&&!u.target.dead&&u.cls!=='samurai'&&u.cls!=='ninja')) u.rot=lerpAngle(u.rot,Math.atan2(mx,mz),1-Math.exp(-dt*10)); } else u.moving=false;
    if(!u.moving&&!(u.target&&!u.target.dead)) u.rot=lerpAngle(u.rot,CAMROT,1-Math.exp(-dt*4));
  }
  for(const u of G.units) if(u.rally>0) u.rally-=dt;
  G.units=G.units.filter(u=>u.alive);
  if(PASS('kappa')) for(const un of G.units) un.hp=Math.min(un.max,un.hp+3*dt);
  if(PASS('ryujin')) for(const un of G.units) un.hp=Math.min(un.max,un.hp+5*dt);
  if(PASS('umibozu')) for(const un of G.units) un.hp=Math.min(un.max,un.hp+6*dt);
  if(PASS('kuzuryu')) for(const un of G.units) un.hp=Math.min(un.max,un.hp+10*dt);
  if(PASS('baku')) for(const un of G.units) un.hp=Math.min(un.max,un.hp+14*dt);
  if(PASS('jorogumo')||PASS('yukionna')) for(const e2 of G.enemies){ if(!e2.dead&&Math.hypot(e2.x-G.hero.x,e2.z-G.hero.z)<6){ e2.slowT=Math.max(e2.slowT,0.4); e2.slowF=Math.max(e2.slowF,e2.cls==='boss'?0.2:0.45); } }
  if(PASS('tsuchi')) for(const e2 of G.enemies){ if(!e2.dead&&Math.hypot(e2.x-G.hero.x,e2.z-G.hero.z)<5){ e2.slowT=Math.max(e2.slowT,0.4); e2.slowF=Math.max(e2.slowF,e2.cls==='boss'?0.15:0.3); } }
  // recruitment
  for(let i=G.pending.length-1;i>=0;i--){ const p=G.pending[i]; p.t-=dt; if(p.t<=0){ if(cpUsed()+CLS[p.cls].cp<=G.cpCap){ spawnUnit(p.cls,p.x+rand(-0.6,0.6),p.z); spawnParticles(p.x,0.6,p.z,6,0xFFFFFF,3,0.4,0.8,-6); } G.pending.splice(i,1); } }
  for(const b of G.barracks){ const have=G.units.filter(u=>u.cls===b.cls).length+G.pending.filter(p=>p.cls===b.cls).length;
    const cap=G.barracks.filter(x=>x.cls===b.cls).reduce((s,x)=>s+x.cap,0);
    if(have<cap&&cpUsed()+CLS[b.cls].cp<=G.cpCap){ b.t-=dt; if(b.t<=0){ b.t=MOD('train')*CLS[b.cls].train*Math.max(0.4,1-0.07*PK('train')); spawnUnit(b.cls,b.x+rand(-0.5,0.5),b.z+1.5); } } }

  // towers
  for(const a of G.towerArchers){ a.atk=Math.max(0,(a.atk||0)-dt*3.5); a.rt-=dt; if(a.rt<=0){ a.rt=0.3; a.target=nearestEnemy(a.x,a.z,CFG.towerRange*(1+0.08*LV('t_range'))); } if(a.target&&a.target.dead) a.target=null; a.cd-=dt;
    if(!a.target) a.rot=lerpAngle(a.rot,CAMROT,1-Math.exp(-dt*3));
    if(a.target){ a.rot=lerpAngle(a.rot,Math.atan2(a.target.x-a.x,a.target.z-a.z),1-Math.exp(-dt*10));
      if(a.cd<=0){ a.atk=0.9; const tr=a.tower.tier-1, cannon=!!a.tower.cannon;
        const dmg=MOD('towerDmg')*CFG.towerDmg*(cannon?1.3*(1+0.10*PK('cannon'))*(1+0.12*LV('t_cannon')):1)*(1+0.08*PK('towerdmg'))*(PASS('kirin')?1.35:1)*(1+0.5*tr)*(PASS('yuki')?1.2:1);
        a.cd=MOD('towerCd')*CFG.towerCd*(cannon?1.35:1)*Math.max(0.45,1-0.1*tr)/(1+0.1*LV('m_tower'))*rand(1,1.12);
        if(cannon){ const tg=a.target, d=Math.hypot(tg.x-a.x,tg.z-a.z);
          { const g2=GS(); if(g2&&AUDIO_MODE>=1) try{ g2.sfx('shootCannon',{gain:0.7}); }catch(e){} } G.orbs.push({sx:a.x,sy:a.y+0.8,sz:a.z,tx:tg.x,tz:tg.z,t:0,dur:Math.max(0.3,d/16),src:null,bomb:true,dmg,rad:(2.4+0.25*tr)*(1+0.06*LV('t_cannon'))}); sfx('bow'); }
        else { fireArrow(a.x,a.y+0.9,a.z,a.target,dmg,null);
          if(U('vol3')){ const o2=nearestEnemy(a.x,a.z,CFG.towerRange*(1+0.08*LV('t_range')),a.target); if(o2) fireArrow(a.x,a.y+0.9,a.z,o2,dmg,null); } } } } }

  // enemies
  for(const e of G.enemies){
    if(e.dead) continue;
    e.flash=Math.max(0,e.flash-dt*10); e.atk=Math.max(0,e.atk-dt*4); e.cd-=dt;
    if(e.slowT>0) e.slowT-=dt; if(e.freezeT>0) e.freezeT-=dt; if(e.stunT>0) e.stunT-=dt;
    if(e.burnT>0){ e.burnT-=dt; e.hp-=e.burnDps*dt; e.burnFx-=dt; if(e.burnFx<=0){ e.burnFx=0.15; spawnParticles(e.x,e.cls==='boss'?2.5:1,e.z,1,0xFF7A2A,1.2,0.5,0.9,3); } if(e.hp<=0){ killEnemy(e,e.burnSrc); continue; } }
    if(e.freezeT>0||e.stunT>0){ e.moving=false; continue; }
    if(e.cls==='boss') updateBoss(e,dt); else updateGrunt(e,dt);
  }
  const en=G.enemies;
  for(let i=0;i<en.length;i++){ const a=en[i]; if(a.dead) continue; for(let j=i+1;j<en.length;j++){ const b=en[j]; if(b.dead) continue;
    const dx=b.x-a.x, dz=b.z-a.z, r=a.rad+b.rad, d2=dx*dx+dz*dz;
    if(d2<r*r&&d2>1e-6){ const d=Math.sqrt(d2), push=(r-d)*0.5, wa=a.cls==='boss'?0.1:0.5, wb=b.cls==='boss'?0.1:0.5; a.x-=dx/d*push*wa; a.z-=dz/d*push*wa; b.x+=dx/d*push*wb; b.z+=dz/d*push*wb; } } }
  for(const e of G.enemies) if(!e.dead) holdFenceLine(e);
  G.enemies=G.enemies.filter(e=>!e.dead);

  // telegraphs
  for(const tg of G.tgs){ tg.t+=dt; if(tg.t>=tg.dur){ tg.done=true; if(!tg.owner||!tg.owner.dead) resolveTg(tg); } }
  G.tgs=G.tgs.filter(t=>!t.done);

  // projectiles
  for(const ar of G.arrows){ ar.t+=dt; if(ar.t>=ar.dur){ ar.done=true; if(ar.target&&!ar.target.dead) hitEnemy(ar.target,ar.dmg,ar.src,ar.el,0,true); } }
  G.arrows=G.arrows.filter(a=>!a.done);
  /* enemy arrows and foxfire */
  for(const o of G.eshots){ o.t+=dt; const u=Math.min(1,o.t/o.dur); o.x=lerp(o.sx,o.tx,u); o.z=lerp(o.sz,o.tz,u); const y=1.2+Math.sin(u*Math.PI)*(o.kind==='arrow'?1.2:1.8);
    if(o.kind==='arrow') spawnParticles(o.x,y,o.z,1,0x3A2A1A,0.2,0.12,0.9,0); else { spawnParticles(o.x,y,o.z,2,0x7FD8FF,0.6,0.25,1.3,0.5); }
    if(u>=1&&!o.done){ o.done=true;
      if(o.aoe){ fx('fx_fire',o.tx,0.9,o.tz,o.aoe*2.2,0.4,0x7FD8FF,{grow:0.8}); for(const t of [G.hero,...G.units]){ if(t&&t.alive!==false&&Math.hypot(t.x-o.tx,t.z-o.tz)<o.aoe) damagePlayer(t,o.dmg*0.6); } }
      o.onHit(); } }
  G.eshots=G.eshots.filter(o=>!o.done);
  for(const o of G.orbs){ o.t+=dt; if(o.t>=o.dur){ o.done=true; fx(o.bomb||o.fox?'fx_fire':'fx_splash',o.tx,0.9,o.tz,(o.rad||2)*2.4,0.45,o.bomb?0xFF9A3C:(o.fox?0x6FE3FF:0xC58CFF),{grow:0.9});
  spawnParticles(o.tx,0.4,o.tz,o.bomb?24:(o.big?32:16),o.bomb?0xFF9A3C:(o.fox?0x6FE3FF:0xC58CFF),o.bomb?6:4.5,0.6,1.3,-4); if(o.bomb){ G.shake=Math.max(G.shake,0.12); sfx('slam'); } sfx('magic');
      for(const e of G.enemies){ if(e.dead) continue; if(Math.hypot(e.x-o.tx,e.z-o.tz)<o.rad+e.rad*0.5){ hitEnemy(e,o.dmg,o.src,null,1); if(o.burn){ e.burnT=3; e.burnDps=Math.max(e.burnDps||0,o.burn); } else { e.slowT=Math.max(e.slowT,1.2); e.slowF=Math.max(e.slowF,0.25); } } }
      if(U('spirit2')) for(const u of G.units) if(Math.hypot(u.x-o.sx,u.z-o.sz)<3.5) u.hp=Math.min(u.max,u.hp+6); } }
  G.orbs=G.orbs.filter(o=>!o.done);

  // coins & ingots
  for(const c of G.coins){
    c.t+=dt;
    if(c.st===0){
      if(c.y>0.15||c.vy>0){ c.vy-=18*dt; c.x+=c.vx*dt; c.z+=c.vz*dt; c.y+=c.vy*dt;
        if(c.y<=0.15){ if(c.bounces<2&&Math.abs(c.vy)>2){ c.y=0.15; c.vy*=-0.35; c.vx*=0.5; c.vz*=0.5; c.bounces++; } else { c.y=0.15; c.vy=0; c.vx=c.vz=0; } } }
      c.spin+=dt*3;
      if(h.alive&&c.t>0.35&&Math.hypot(h.x-c.x,h.z-c.z)<CFG.pickupR*(1+0.15*PK('magnet'))){ c.st=1; c.t=0; c.sx=c.x; c.sy=c.y; c.sz=c.z; }
    } else if(c.st===1){
      if(!h.alive){ c.st=0; c.t=0; continue; }
      const top=stackTop(c.kind), u=Math.min(1,c.t/(c.dur||0.24)), e2=u*u;
      c.x=lerp(c.sx,top.x,e2); c.z=lerp(c.sz,top.z,e2); c.y=lerp(c.sy,top.y,e2)+Math.sin(u*Math.PI)*1.3; c.spin+=dt*14;
      if(u>=1){ c.done=true; if(c.kind==='ingot'){ G.ingots++; sfx('ingot',1+Math.min(G.ingots,30)/40); } else { G.stack+=Math.max(1,Math.round(MOD('coin'))); sfx('coin',1+Math.min(G.stack,240)/300); } Wb.v+=0.12; }
    } else if(c.st===2){
      if(c.t<0) continue; const u=Math.min(1,c.t/c.dur);
      c.x=lerp(c.sx,c.tx,u); c.z=lerp(c.sz,c.tz,u); c.y=lerp(c.sy,0.35,u*u)+Math.sin(u*Math.PI)*1.6; c.spin+=dt*16;
      if(u>=1){ c.done=true; if(Math.random()<0.4) spawnParticles(c.tx,0.3,c.tz,1,c.kind==='ingot'?0x9FD0FF:0xFFE27A,2.5,0.3,0.8,-6); }
    }
  }
  G.coins=G.coins.filter(c=>!c.done);

  // squad-wide collection: any squad member near a coin or ingot sends it to the hero's stacks
  G.collectT=(G.collectT||0)-dt;
  if(h.alive&&G.collectT<=0){ G.collectT=0.1; const R2=(2.4*(1+0.15*PK('magnet')))**2;
    for(const c of G.coins){ if(c.st!==0||c.t<0.35) continue;
      for(const u of G.units){ if((u.x-c.x)**2+(u.z-c.z)**2<R2){ c.st=1; c.t=0; c.sx=c.x; c.sy=c.y; c.sz=c.z; c.dur=clamp(Math.hypot(h.x-c.x,h.z-c.z)/22,0.24,0.6); break; } } } }

  // pads
  for(const p of G.pads){
    if(!p.active||p.done) continue;
    const on=h.alive&&Math.abs(h.x-p.x)<1.45&&Math.abs(h.z-p.z)<1.45, ing=p.cur==='ingot';
    if(on&&p.paid<p.cost&&(ing?G.ingots:G.stack)>0){
      p.standT+=dt; const rate=lerp(4,30,clamp(p.standT/1.5,0,1)); p.carry+=rate*dt;
      while(p.carry>=1&&p.paid<p.cost&&(ing?G.ingots:G.stack)>0){ p.carry-=1; p.paid++; const top=stackTop(p.cur==='ingot'?'ingot':'gold'); if(ing) G.ingots--; else G.stack--;
        G.coins.push({kind:ing?'ingot':'gold',st:2,x:top.x,y:top.y,z:top.z,sx:top.x,sy:top.y,sz:top.z,tx:p.x+rand(-0.5,0.5),tz:p.z+rand(-0.5,0.5),t:0,dur:0.3,spin:0}); sfx('deposit',1+p.paid/p.cost*0.6); }
    } else { p.standT=0; p.carry=0; }
    if(p.paid>=p.cost&&(on||p.cost===0||p.doneT>=0)){ if(p.doneT<0) p.doneT=0.32; p.doneT-=dt;
      if(p.doneT<=0){ p.done=true; p.active=false; p.doneT=-1; p.g.visible=false; p.el.style.display='none'; buildStructure(p);
        if((p.kind==='tup'||p.kind==='lvl2')&&(p.level||1)<5){ p.level=(p.level||1)+1; p.cost=Math.round(p.cost*1.5); p.paid=0; p.done=false; p.active=false; p.shown=-1; activatePad(p); } } }
  }

  // fences
  for(const k in G.fences){ const f=G.fences[k]; f.shake=Math.max(0,f.shake-dt);
    if(f.built){ for(const pl of f.planks){ if(pl.delay>0) pl.delay-=dt; else pl.h=Math.min(1,pl.h+dt*5); } if(U('spirit3')&&f.hp<f.max) f.hp=Math.min(f.max,f.hp+8*dt); if(LV('f_hp')&&f.hp<f.max) f.hp=Math.min(f.max,f.hp+2*LV('f_hp')*dt); if(PASS('onmyoji')&&f.hp<f.max) f.hp=Math.min(f.max,f.hp+6*dt); } }

  // mine & forge
  const richMul=1+0.25*LV('m_rich');
  if(G.mine){ G.mine.t-=dt; if(G.mine.t<=0){ G.mine.t=1.5/richMul;
    if(h.alive){ const d=Math.hypot(h.x-G.mine.x,h.z-G.mine.z); G.coins.push({kind:'gold',st:1,x:G.mine.x,y:0.8,z:G.mine.z,sx:G.mine.x,sy:0.8,sz:G.mine.z,t:0,spin:0,dur:clamp(d/22,0.25,0.9)}); G.mineOut=(G.mineOut||0)+1; }
    else { let near=0; for(const c of G.coins) if(c.st===0&&Math.abs(c.x-G.mine.x)<3&&Math.abs(c.z-G.mine.z)<3) near++;
      if(near<24){ const a=rand(0,Math.PI*2); G.coins.push({kind:'gold',st:0,x:G.mine.x,y:0.6,z:G.mine.z,vx:Math.cos(a)*1.4,vy:4.5,vz:Math.sin(a)*1.4,t:0,bounces:0,spin:0}); } } } }
  if(G.forge){ const F=G.forge; F.t-=dt; if(F.t<=0){ F.t=2.2/richMul; if(F.pile<20) F.pile++; if(Math.random()<0.7) spawnParticles(F.x,1.3,F.z,3,0xFF8A2A,1.6,0.7,0.8,2); }
    const nearF=Math.hypot(h.x-F.x,h.z-(F.z+1.6))<2.6;
    if(h.alive&&F.pile>0){ F.give-=dt; if(F.give<=0){ F.give=nearF?0.07:0.5; F.pile--; const y=0.4+F.pile*0.17, d=Math.hypot(h.x-F.x,h.z-F.z);
      G.coins.push({kind:'ingot',st:1,x:F.x+1.2,y,z:F.z+1.4,sx:F.x+1.2,sy:y,sz:F.z+1.4,t:0,spin:0,dur:clamp(d/22,0.24,0.9)}); } } }

  // waves
  const W=G.waves, rate=G.stack>80?1.35:1; G.clock+=dt*rate;
  while(G.waveIdx<W.length&&G.clock>=W[G.waveIdx].t){ for(const g of W[G.waveIdx].g) G.spawners.push({type:g[0],lane:g[1],left:g[2],interval:g[3],timer:rand(0,0.3)}); G.waveIdx++; Music.stinger('wave'); }
  for(const s of G.spawners){ s.timer-=dt; if(s.timer<=0&&s.left>0){ spawnEnemy(s.type,s.lane); s.left--; s.timer=s.interval; } }
  G.spawners=G.spawners.filter(s=>s.left>0);
  if(G.waveIdx>0&&G.waveIdx<W.length&&G.spawners.length===0&&G.enemies.length===0&&!G.breaks[G.waveIdx]){
    G.breaks[G.waveIdx]=true; const bonus=Math.round((5+G.waveIdx*2)*(1+0.2*G.si)*MOD('waveBonus')); G.stack+=bonus;
    if([3,6,9].includes(G.waveIdx)&&!G.cardWaves[G.waveIdx]){ G.cardWaves[G.waveIdx]=true; setTimeout(offerCards,700); } G.bonusTotal+=bonus; G.lastBreakBonus=bonus;
    G.breakT=5; $('breakCard').classList.add('show'); sfx('waveclear'); popText(h.x,2.8,h.z,'+'+bonus+' wave bonus','gold'); }

  // particles, tweens, ambience
  G.ambT-=dt; if(G.ambT<=0){ G.ambT=0.12; const th=THEMES[G.st.theme];
    const ax=G.focus.x+rand(-10,10), az=G.focus.z+rand(-12,8);
    if(G.st.theme==='volcano'||G.st.theme==='grave'||G.st.theme==='swamp'||G.st.theme==='cave'||G.st.theme==='eclipse'||G.st.theme==='mist') G.parts.push({x:ax,y:0.2,z:az,vx:rand(-0.3,0.3),vy:rand(0.5,G.st.theme==='volcano'?2:1),vz:rand(-0.3,0.3),life:3,max:3,size:G.st.theme==='swamp'?0.35:0.6,col:th.amb,grav:G.st.theme==='volcano'?0.2:0,rx:0,ry:0});
    else if(G.st.theme==='storm'){ for(let r=0;r<3;r++) G.parts.push({x:ax+rand(-4,4),y:rand(7,10),z:az+rand(-4,4),vx:-1.5,vy:-14,vz:0.5,life:0.8,max:0.8,size:0.35,col:th.amb,grav:0,rx:0,ry:0}); if(Math.random()<0.035){ G.flashT=0.35; sfx('slam'); } }
    else G.parts.push({x:ax,y:rand(6,9),z:az,vx:rand(0.3,0.9),vy:-rand(0.6,1.1),vz:rand(-0.2,0.3),life:6,max:6,size:st_amb_size(),col:th.amb,grav:0,rx:rand(0,3),ry:rand(0,3)}); }
  if(G.flashT>0){ G.flashT-=dt; hemi.intensity=0.62+Math.max(0,G.flashT)*3; } else if(G.st.theme==='storm') hemi.intensity=0.55;
  for(const pt of G.parts){ pt.life-=dt; pt.vy+=pt.grav*dt; pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.z+=pt.vz*dt; if(pt.y<0.05){ pt.y=0.05; pt.vy*=-0.3; pt.vx*=0.6; pt.vz*=0.6; } }
  G.parts=G.parts.filter(p=>p.life>0);
  for(const tw of G.tweens){ if(tw.delay>0){ tw.delay-=dt; continue; } tw.t+=dt; const u=Math.min(1,tw.t/tw.dur); tw.obj.scale.setScalar(Math.max(0.01,easeOutBack(u)*tw.to)); if(u>=1) tw.done=true; }
  G.tweens=G.tweens.filter(t=>!t.done);
  if(G.armOpen){ G.armRefresh=(G.armRefresh||0)-dt; if(G.armRefresh<=0){ G.armRefresh=0.3; refreshArmoryStates(); } }

  G.ultCd=Math.max(0,(G.ultCd||0)-dt); G.sky2Cd=Math.max(0,(G.sky2Cd||0)-dt); updateSky(dt);
  if(G.keepHp<=0) endStage(false);
  else if(G.waveIdx>=W.length&&G.spawners.length===0&&G.enemies.length===0) endStage(true);
}
const st_amb_size=()=>G.st.theme==='snow'?0.7:0.55;
function slotOffset(i){ const sp=0.9; let ring=1,start=0; while(i>=start+6*ring){ start+=6*ring; ring++; } const a=((i-start)/(6*ring))*Math.PI*2+ring*0.5; return {x:Math.cos(a)*ring*sp,z:Math.sin(a)*ring*sp,ring}; }
function fenceNear(x,z,pad){ for(const k in G.fences){ const f=G.fences[k]; if(!f.built||f.hp<=0) continue;
    for(const g of f.segs) if(pointSegDist(x,z,g[0],g[1],g[2],g[3])<pad) return f; } return null; }
function moveEnemy(e,mx,mz,dt,onBlocked){
  const reach=e.rad+0.5;
  const f=fenceBlocking(e.x,e.z,e.x+mx*reach,e.z+mz*reach); if(f){ onBlocked(f); e.moving=false; return; }
  const sp=MOD('enSpd')*e.speed*(e.slowT>0?1-e.slowF:1), nx=e.x+mx*sp*dt, nz=e.z+mz*sp*dt;
  const f2=fenceBlocking(e.x,e.z,nx,nz)||fenceNear(nx,nz,e.rad*0.5+0.35); if(f2){ onBlocked(f2); e.moving=false; return; }
  e.x=nx; e.z=nz; e.moving=true; e.rot=lerpAngle(e.rot,Math.atan2(mx,mz),1-Math.exp(-dt*9));
}
/* hard wall check: undo any movement (including crowd shoving and knockback) that crossed a standing fence */
function holdFenceLine(e){
  if(e.px===undefined){ e.px=e.x; e.pz=e.z; return; }
  if(e.cls==='boss'){ const bf=fenceBlocking(e.px,e.pz,e.x,e.z); if(bf){ e.x=e.px; e.z=e.pz; } e.px=e.x; e.pz=e.z; return; }
  const f=fenceBlocking(e.px,e.pz,e.x,e.z);
  if(f){ e.x=e.px; e.z=e.pz; return; }
  const near=fenceNear(e.x,e.z,e.rad*0.5+0.3);
  if(near){ let bx=0,bz=0,bd=1e9;
    for(const g of near.segs){ const d=pointSegDist(e.x,e.z,g[0],g[1],g[2],g[3]); if(d<bd){ bd=d; const vx=g[2]-g[0],vz=g[3]-g[1],l=vx*vx+vz*vz;
      let t=l?((e.x-g[0])*vx+(e.z-g[1])*vz)/l:0; t=clamp(t,0,1); bx=g[0]+vx*t; bz=g[1]+vz*t; } }
    const dx=e.x-bx, dz=e.z-bz, d=Math.hypot(dx,dz)||1, push=(e.rad*0.5+0.32)-d;
    if(push>0){ e.x+=dx/d*push; e.z+=dz/d*push; } }
  e.px=e.x; e.pz=e.z;
}
function laneDir(e){ const lane=LAYOUT.lanes[e.lane]; let wp=lane[e.wp], dx=wp[0]-e.x, dz=wp[1]-e.z, d=Math.hypot(dx,dz);
  if(d<1.0&&e.wp<lane.length-1){ e.wp++; wp=lane[e.wp]; dx=wp[0]-e.x; dz=wp[1]-e.z; d=Math.hypot(dx,dz); } return {mx:d?dx/d:0,mz:d?dz/d:0}; }
function updateGrunt(e,dt){
  if(e.mut){
    if(e.rage&&!e.raged&&e.hp<e.max*0.5){ e.raged=true; e.speed*=1.5; e.dmg*=1.6; spawnParticles(e.x,1.2,e.z,12,0xFF6A4A,5,0.5,1.5,0); popText(e.x,2.2,e.z,'ENRAGED','crit'); }
    if(e.healer&&(e.healT=(e.healT||0)-dt)<=0){ e.healT=1.2;
      for(const o of G.enemies){ if(o.dead||o===e) continue; if(Math.hypot(o.x-e.x,o.z-e.z)<5.5&&o.hp<o.max){ o.hp=Math.min(o.max,o.hp+o.max*0.06); spawnParticles(o.x,1.4,o.z,2,0x8CFFB4,1.5,0.5,1,1.5); } } }
    if((e.auraT=(e.auraT||0)-dt)<=0){ e.auraT=0.25; spawnParticles(e.x,0.5,e.z,1,e.mutCol,0.8,0.5,1.1,0.6); }
  }
  const D=EN[e.cls];
  e.rt-=dt; if(e.rt<=0){ e.rt=0.3; e.target=nearestPlayer(e.x,e.z,D.aggro); } if(e.target&&!e.target.alive) e.target=null;
  const kd=Math.hypot(e.x-KEEP.x,e.z-KEEP.z), reach=0.55+e.rad+(D.range||0);
  const hitFence=f=>{ if(e.cd<=0){ e.cd=D.cd; e.atk=1; damageFence(f,e.dmg); sfx('hit'); } };
  const strike=(tx,tz,onHit)=>{ e.cd=D.cd; e.atk=1;
    if(D.proj){ const dd=Math.hypot(tx-e.x,tz-e.z); G.eshots.push({x:e.x,z:e.z,sx:e.x,sz:e.z,tx,tz,t:0,dur:Math.max(0.2,dd/(D.proj==='arrow'?18:11)),kind:D.proj,aoe:D.aoe||0,dmg:e.dmg,onHit}); sfx(D.proj==='arrow'?'bow':'magic'); }
    else { if(D.range){ const a=Math.atan2(tx-e.x,tz-e.z); for(let q=1;q<=5;q++) spawnParticles(e.x+Math.sin(a)*q*0.45,1.1,e.z+Math.cos(a)*q*0.45,1,0xDDE6F0,0.6,0.18,1,0); } onHit(); } };
  if(e.target){ const dx=e.target.x-e.x, dz=e.target.z-e.z, d=Math.hypot(dx,dz);
    if(d>reach) moveEnemy(e,dx/d,dz/d,dt,hitFence);
    else { e.moving=false; e.rot=lerpAngle(e.rot,Math.atan2(dx,dz),0.3); if(e.cd<=0){ const tg=e.target; strike(tg.x,tg.z,()=>{ if(tg.alive!==false) damagePlayer(tg,e.dmg); }); } } }
  else if(kd<2.9+(D.range||0)){ e.moving=false; e.rot=lerpAngle(e.rot,Math.atan2(KEEP.x-e.x,KEEP.z-e.z),0.3);
    if(e.cd<=0){ strike(KEEP.x,KEEP.z,()=>{ G.keepHp-=e.dmg; spawnParticles(lerp(e.x,KEEP.x,0.6),1.4,lerp(e.z,KEEP.z,0.6),3,0xCFC6B6,3,0.4,1,-8); sfx('hit'); }); } }
  else { const {mx,mz}=laneDir(e); moveEnemy(e,mx,mz,dt,hitFence); }
}
const PAT_RANGE={slam:3.2,dash:10,volley:10,line:12,donut:4.8,summon:99,blink:99};
function segDist(px,pz,s){ const ax=s[0],az=s[1],bx=s[2],bz=s[3], vx=bx-ax, vz=bz-az, l2=vx*vx+vz*vz||1; const t=clamp(((px-ax)*vx+(pz-az)*vz)/l2,0,1); return Math.hypot(px-(ax+vx*t),pz-(az+vz*t)); }
function nearFenceOf(x,z,r){ let best=null,bd=r; for(const k in G.fences){ const f=G.fences[k]; if(!f.built||f.hp<=0) continue; for(const sg of f.segs){ const d=segDist(x,z,sg); if(d<bd){ bd=d; best=f; } } } return best; }
function bossWatchdog(e,dt){
  if(e._ls!==e.st){ e._ls=e.st; e.stateT=0; } else e.stateT=(e.stateT||0)+dt;
  if(e.st==='cast'&&e.stateT>4){ e.st='move'; e.stateT=0; }          /* a spell that never resolved */
  if(e.st==='recover'&&e.stateT>3){ e.st='move'; e.stateT=0; }
  if(e._wx===undefined){ e._wx=e.x; e._wz=e.z; e._wt=0; e._hp=e.hp; }
  e._wt+=dt;
  if(e._wt>=2.2){ const moved=Math.hypot(e.x-e._wx,e.z-e._wz), kd=Math.hypot(e.x-KEEP.x,e.z-KEEP.z);
    if(moved<0.5&&kd>4.6&&e.st!=='dash'){                            /* standing still, not at the castle */
      const f=nearFenceOf(e.x,e.z,6);
      if(f){ damageFence(f,Math.max(e.dmg*4,f.max*0.34)); e.atk=1; G.shake=Math.max(G.shake,0.3); sfx('slam');
        fx('fx_dust',e.x+Math.sin(e.rot)*1.8,0.8,e.z+Math.cos(e.rot)*1.8,5,0.5,0xC8BBA6,{grow:1.2}); }
      else { const {mx,mz}=laneDir(e); if(!fenceBlocking(e.x,e.z,e.x+mx*1.4,e.z+mz*1.4)){ e.x+=mx*1.4; e.z+=mz*1.4; } }
      e.st='move'; e.atkT=Math.min(e.atkT,0.2); }
    e._wx=e.x; e._wz=e.z; e._wt=0; } }
function updateBoss(e,dt){
  bossWatchdog(e,dt);
  const D=BOSSES[e.kind], enr=e.hp<e.max*0.4;
  if(e.st==='cast'){ e.moving=false; return; }
  if(e.st==='recover'){ e.timer-=dt; e.moving=false; if(e.timer<=0) e.st='move'; return; }
  if(e.st==='dash'){ const dx=e.dx2-e.x, dz=e.dz2-e.z, d=Math.hypot(dx,dz); const step=22*dt;
    if(d<=step){ e.x=e.dx2; e.z=e.dz2; e.st='recover'; e.timer=0.8; } else { const bf=fenceBlocking(e.x,e.z,e.x+dx/d*step,e.z+dz/d*step); if(bf){ damageFence(bf,140); e.st='recover'; e.timer=0.8; return; } e.x+=dx/d*step; e.z+=dz/d*step; spawnParticles(e.x,1,e.z,1,0x2A2433,2,0.4,1.2,0); } return; }
  e.atkT-=dt;
  e.rt-=dt; if(e.rt<=0){ e.rt=0.3; e.target=nearestPlayer(e.x,e.z,9); } if(e.target&&!e.target.alive) e.target=null;
  const next=D.patterns[e.pi%D.patterns.length];
  let aim=null, blocked=null;
  const kd=Math.hypot(e.x-KEEP.x,e.z-KEEP.z);
  if(e.target){ const dx=e.target.x-e.x, dz=e.target.z-e.z, d=Math.hypot(dx,dz);
    if(d<=PAT_RANGE[next]&&e.atkT<=0) aim=[e.target.x,e.target.z];
    else if(d>2.4) moveEnemy(e,dx/d,dz/d,dt,f=>{ blocked=f; }); else e.moving=false; }
  else if(kd<4.4){ e.moving=false; aim=[KEEP.x,KEEP.z]; }
  else { const {mx,mz}=laneDir(e); moveEnemy(e,mx,mz,dt,f=>{ blocked=f; }); }
  if(blocked){ e.blockT=(e.blockT||0)+dt;
    // a blocked boss tears at the fence directly instead of waiting for its next spell
    e.fenceCd=(e.fenceCd||0)-dt;
    if(e.fenceCd<=0){ e.fenceCd=0.8; e.atk=1; damageFence(blocked,e.dmg*1.8); G.shake=Math.max(G.shake,0.18); sfx('slam');
      fx('fx_dust',e.x+Math.sin(e.rot)*1.6,0.8,e.z+Math.cos(e.rot)*1.6,4,0.45,0xC8BBA6,{grow:1.1});
      spawnParticles(e.x+Math.sin(e.rot)*1.6,1,e.z+Math.cos(e.rot)*1.6,8,0x94643F,4,0.4,1.2,-6); }
    if(!aim) aim=[e.x+Math.sin(e.rot)*2.2,e.z+Math.cos(e.rot)*2.2]; }
  else e.blockT=0;
  if(!aim&&(e.stallT=(e.stallT||0)+dt)>1.2){ aim=[e.x+Math.sin(e.rot)*2.2,e.z+Math.cos(e.rot)*2.2]; e.atkT=Math.min(e.atkT,0); }
  if(aim) e.stallT=0;
  if(aim&&e.atkT<=0){ let pat=next;
    if(blocked||e.blockT>0.5){ const wall=['slam','donut','line','summon']; if(!wall.includes(pat)) pat=wall[e.pi%wall.length]; }
    castPattern(e,pat,aim[0],aim[1],enr); e.pi++; e.atkT=enr?1.5:2.5; }
}
function castPattern(e,p,ax,az,enr){
  const D=BOSSES[e.kind], dx0=ax-e.x, dz0=az-e.z, d0=Math.hypot(dx0,dz0)||1, ux=dx0/d0, uz=dz0/d0, dmg=e.dmg;
  e.rot=Math.atan2(ux,uz); e.castKind=p; e.castT=0;
  const fin=(rec=0.8)=>()=>{ e.st='recover'; e.timer=rec; };
  e.st='cast'; const delay=enr?0.7:0.95;
  if(p==='slam'){ const off=Math.min(2,d0); addTg({shape:'circle',x:e.x+ux*off,z:e.z+uz*off,r:D.slamR,dur:delay,dmg:dmg*1.2,owner:e,onDone:fin(),col:e.kind==='yuki'?0xBFF0FF:0xE2C28C}); e.castDur=delay; }
  else if(p==='dash'){ const len=10; addTg({shape:'rect',x:e.x,z:e.z,dx:ux,dz:uz,len,w:2.4,dur:0.8,dmg,owner:e,shake:0.25,sound:'dash',col:0x2A2433,
      onDone:()=>{ let ex=e.x+ux*len, ez=e.z+uz*len; for(let s=0.5;s<=len;s+=0.5){ const f=fenceBlocking(e.x+ux*(s-0.5),e.z+uz*(s-0.5),e.x+ux*s,e.z+uz*s); if(f){ damageFence(f,130); ex=e.x+ux*(s-0.8); ez=e.z+uz*(s-0.8); break; } }
        const dk=Math.hypot(ex-KEEP.x,ez-KEEP.z); if(dk<2.8){ ex=KEEP.x+(ex-KEEP.x)/dk*2.8; ez=KEEP.z+(ez-KEEP.z)/dk*2.8; } e.dx2=ex; e.dz2=ez; e.st='dash'; }}); e.castDur=0.8; }
  else if(p==='volley'){ for(let k=0;k<5;k++){ const a=rand(0,Math.PI*2), r=k?rand(1.5,3.8):0; addTg({shape:'circle',x:ax+Math.cos(a)*r,z:az+Math.sin(a)*r,r:1.6,dur:0.9+k*0.12,dmg:dmg*0.8,owner:e,shake:0.15,sound:'fire',col:0x6FE3FF,keepDmg:8,fenceDmg:40,onDone:k===4?fin(0.5):null}); } e.castDur=1.4; }
  else if(p==='line'){ addTg({shape:'rect',x:e.x,z:e.z,dx:ux,dz:uz,len:13,w:2.2,dur:1.0,dmg:dmg*1.1,owner:e,sound:'ice',col:e.kind==='shogun'?0xFF7A2A:0xBFF0FF,onDone:fin()}); e.castDur=1.0; }
  else if(p==='donut'){ addTg({shape:'donut',x:e.x,z:e.z,r:7,dur:1.1,dmg:dmg*1.1,owner:e,col:0xFF7A2A,sound:'fire',onDone:fin()}); e.castDur=1.1; }
  else if(p==='summon'){ const [type,n]=D.summon; for(let k=0;k<n;k++) spawnEnemy(type,e.lane,e); spawnParticles(e.x,1,e.z,30,0xB04FD6,6,0.7,1.3,-4); sfx('magic'); toast('Minions summoned',1.2); e.st='recover'; e.timer=0.6; }
  else if(p==='blink'){ const h=G.hero; const bx=(h.alive?h.x:KEEP.x)+rand(-1,1)*6, bz=(h.alive?h.z:KEEP.z)+rand(-1,1)*6; spawnParticles(e.x,1.5,e.z,24,0xF5F5F5,5,0.6,1.2,-2);
    const dk=Math.hypot(bx-KEEP.x,bz-KEEP.z)||1; e.x=dk<3.5?KEEP.x+(bx-KEEP.x)/dk*3.5:bx; e.z=dk<3.5?KEEP.z+(bz-KEEP.z)/dk*3.5:bz; spawnParticles(e.x,1.5,e.z,24,0x6FE3FF,5,0.6,1.2,-2); sfx('magic'); e.st='recover'; e.timer=0.5; }
}

/* ================================================================ render */
const camQ=new T.Quaternion();
let QL=1, _fpsT=0, _fpsN=0, _fps=60;
function perfTick(dt){
  _fpsT+=dt; _fpsN++;
  if(_fpsT>=1){ _fps=_fpsN/_fpsT; _fpsT=0; _fpsN=0;
    /* quality follows the measured frame rate only: a phone that copes keeps full detail */
    if(_fps<30) QL=Math.max(0.3,QL-0.25);
    else if(_fps>50) QL=Math.min(1,QL+0.15);
    try{ if(renderer){ const want=QL>=0.9?Math.min(2,window.devicePixelRatio||1):(QL>=0.5?1:0.75);
      if(Math.abs((renderer.getPixelRatio()||1)-want)>0.05) renderer.setPixelRatio(want);
      if(sun&&sun.castShadow!==(QL>=0.55)) sun.castShadow=(QL>=0.55); } }catch(err){} } }
function render(dt){ perfTick(dt);
  const h=G.hero, t=TIME;
  const tx=h.alive?h.x+h.vx*0.16:0, tz=h.alive?h.z+h.vz*0.16:6, k=1-Math.exp(-dt*8);
  G.focus.x+=(tx-G.focus.x)*k; G.focus.z+=(tz-G.focus.z)*k;
  const bossNear=G.enemies.some(e=>e.cls==='boss'&&Math.hypot(e.x-G.focus.x,e.z-G.focus.z)<15);
  G.zoom=lerp(G.zoom,(1+0.12*Math.min(1,G.units.length/30))*(bossNear?1.14:1),1-Math.exp(-dt*2));
  if(G.camPunch===undefined) G.camPunch=0; G.camPunch+=(0-G.camPunch)*(1-Math.exp(-dt*3.2));
  const uz=userZoom; const d=camDist*G.zoom*uz*(window.__zoomMul||1)*(1-(G.camPunch||0));
  if(G.shadowZ!==uz){ G.shadowZ=uz; const ss=30*Math.max(1,uz*1.05); Object.assign(sun.shadow.camera,{left:-ss,right:ss,top:ss,bottom:-ss,far:90*Math.max(1,uz)}); sun.shadow.camera.updateProjectionMatrix(); scene.fog.near=70*Math.max(1,uz); scene.fog.far=150*Math.max(1,uz); } G.shake=Math.max(0,G.shake-dt*1.6); const sh=G.shake*G.shake*0.9;
  camera.position.set(G.focus.x+OFF.x*d+rand(-sh,sh),OFF.y*d+rand(-sh,sh),G.focus.z+OFF.z*d); camera.lookAt(G.focus.x,0.8,G.focus.z); camQ.copy(camera.quaternion);
  sun.position.set(G.focus.x-14,32,G.focus.z+12); sun.target.position.set(G.focus.x,0,G.focus.z);

  const bob=h.moving?Math.abs(Math.sin(t*13))*0.12:0;
  hero.g.position.set(h.x,bob,h.z); hero.g.rotation.y=h.rot; hero.g.rotation.z=h.moving?Math.sin(t*13)*0.05:0;
  for(const m of hero.mats) m.emissive.setScalar(h.flash*0.5);
  const n=G.units.length, rings=n?slotOffset(n-1).ring:0, rr=0.9*(rings+0.9)+0.35, rc=h.alive?h:{x:0,z:6};
  hero.ring.position.set(rc.x,0.06,rc.z); hero.ring.scale.setScalar(lerp(hero.ring.scale.x,Math.max(1.5,rr),1-Math.exp(-dt*6)));

  hero.g.visible=false;
  Object.values(SB).forEach(bBegin); bBegin(B.badge); bBegin(BLOB);
  if(h.alive) drawSprite(G.heroDef.sprite,h,h.x,0,h.z,h.rot,h.flash,h.moving,0,false,h.atk||0,G.heroDef.h/SPR_H[G.heroDef.sprite],false);
  for(const u of G.units){ const H=drawSprite(UNIT_SPR[u.cls],u,u.x,0,u.z,u.rot,u.flash,u.moving,u.seed,false,u.atk,1,false);
    if(u.cls==='oniw') bYaw(B.badge,u.x,H+0.12,u.z,t*2,1.3,1.3,1.3,C(0x5AD843));
    if(u.rank>0) bYaw(B.badge,u.x,H+0.25+Math.sin(t*3+u.seed)*0.05,u.z,t*2,1,1,1,RANKCOL[u.rank]); }
  for(const a of G.towerArchers){ if(a.hidden) continue; drawSprite('archer',a,a.x,a.y,a.z,a.rot,0,false,a.seed||0,false,a.atk||0,0.95,false); }
  for(const e of G.enemies){
    if(e.cls==='boss'){
      let sc=1, y=0;
      if(e.st==='cast'){ e.castT+=dt; const u=Math.min(1,e.castT/(e.castDur||1)); sc=1+0.1*u; y=0.25*u; }
      else if(e.st==='recover') sc=0.94+0.06*Math.min(1,(0.8-(e.timer||0))/0.8);
      if(e.kind==='kitsune'||e.kind==='raijin'||e.kind==='ryujin'||e.kind==='nurari'||e.kind==='umibozu'||e.kind==='hannya'||e.kind==='mikaboshi'||e.kind==='kirin'||e.kind==='susanoo'||e.kind==='karura'||e.kind==='izanami'||e.kind==='tsukuyomi'||e.kind==='kuzuryu'||e.kind==='onryo'||e.kind==='amaterasu'||e.kind==='raiju'||e.kind==='shachi'||e.kind==='fujin'||e.kind==='yukionna'||e.kind==='kagutsuchi'||e.kind==='izanagi') y+=0.45+Math.sin(t*2)*0.25;
      if(e.kind==='mao'&&Math.random()<dt*8) spawnParticles(e.x+rand(-1.5,1.5),rand(2,6),e.z,1,0xC58CFF,1,0.6,1,1);
      if(e.kind==='raijin'&&Math.random()<dt*5) spawnParticles(e.x+rand(-1.5,1.5),rand(2,5),e.z,1,0xFFF27A,2,0.3,0.9,0);
      if(e.kind==='gasha'&&Math.random()<dt*6) spawnParticles(e.x+rand(-1.2,1.2),rand(3,6),e.z,1,0xC58CFF,0.8,0.8,1,1.5);
      if(e.st==='dash') sc=1.05;
      const bf=(e.st==='cast'||e.st==='dash'||(e.st==='recover'&&(e.timer||0)>0.45))?2:null;
      drawSprite(e.kind,e,e.x,y,e.z,e.rot,e.flash,e.moving,e.seed,e.slowT>0.8,0,sc,e.burnT>0,bf);
      if(e.kind==='shogun'&&Math.random()<dt*10) spawnParticles(e.x+rand(-1,1),5.2,e.z,1,0xFF7A2A,1,0.6,1,3);
      if(e.kind==='kitsune'&&Math.random()<dt*6) spawnParticles(e.x+rand(-1.5,1.5),rand(1.5,4),e.z,1,0x6FE3FF,0.6,0.7,0.9,1);
      continue; }
    drawSprite(e.cls,e,e.x,0,e.z,e.rot,Math.max(e.flash,e.mut?0.42+Math.sin(TIME*4+e.seed)*0.12:0),e.moving,e.seed,e.freezeT>0||e.slowT>0.8,e.atk,e.mut?1.18:1,e.burnT>0);
  }
  Object.values(SB).forEach(b=>{ bEnd(b); b.fa.needsUpdate=true; }); bEnd(B.badge); bEnd(BLOB);

  bBegin(B.coin); bBegin(B.ingot);
  for(const c of G.coins){ if(c.st===2&&c.t<0) continue;
    if(c.kind==='ingot') bEuler(B.ingot,c.x,c.y,c.z,c.st?c.spin*0.4:0,c.spin,0,1,C(0x4A9BE6));
    else bEuler(B.coin,c.x,c.y+(c.st===0&&c.vy===0?Math.sin(t*3+c.spin)*0.05:0),c.z,c.st===0?0:c.spin*0.5,c.spin,c.st===2?0.4:0,1,C(0xF5B820)); }
  if(h.alive){
    const H=Math.min(G.stack,CFG.stackCap)*CFG.coinStep, Hc=Math.min(H,28), cnt=Math.min(G.stack,CFG.stackCap), baseY=G.heroDef.h+0.2+bob;
    for(let i=0;i<cnt;i++){ const hh=i*CFG.coinStep, u=H>0?hh/H:0, bend=(G.lean.x+G.wob.x*Math.sin(u*5-t*9)*0.6)*u*u*Hc*0.34;
      bEuler(B.coin,h.x+RIGHT.x*bend,baseY+hh,h.z+RIGHT.z*bend,0,i*0.35,0,1,C(0xF5B820)); }
    const Hi=G.ingots*CFG.ingotStep;
    for(let i=0;i<Math.min(G.ingots,60);i++){ const hh=i*CFG.ingotStep, u=Hi>0?hh/Hi:0, bend=G.lean.x*u*u*Math.min(Hi,10)*0.3;
      bEuler(B.ingot,h.x+RIGHT.x*(0.62+bend),1.55+bob+hh,h.z+RIGHT.z*(0.62+bend),0,h.rot+(i%2)*0.2,0,1,C(0x4A9BE6)); }
  }
  if(G.mine) for(let i=0;i<14;i++){ const a=i*2.4; bEuler(B.coin,G.mine.x-2+Math.cos(a)*0.4*(i%3),0.1+(i%5)*0.1,G.mine.z-0.6+Math.sin(a)*0.4*(i%3),0,a,0,1,C(0xF5B820)); }
  if(G.forge) for(let i=0;i<G.forge.pile;i++) bEuler(B.ingot,G.forge.x+1.2,0.1+i*0.17,G.forge.z+1.4,0,(i%2)*1.5708,0,1,C(0x4A9BE6));
  bEnd(B.coin); bEnd(B.ingot);

  bBegin(B.arrow);
  for(const ar of G.arrows){ const tg=ar.target, u=ar.t/ar.dur, ex=tg.x, ez=tg.z, ey=tg.cls==='boss'?2.2:0.8;
    bYaw(B.arrow,lerp(ar.sx,ex,u),lerp(ar.sy,ey,u)+Math.sin(u*Math.PI)*0.4,lerp(ar.sz,ez,u),Math.atan2(ex-ar.sx,ez-ar.sz),1,1,1,C(ar.el?ELCOL[ar.el]:0xEAF6FF)); }
  bEnd(B.arrow);
  bBegin(B.talis);
  for(const o of G.orbs){ const u=o.t/o.dur; bEuler(B.talis,lerp(o.sx,o.tx,u),lerp(o.sy,0.5,u)+Math.sin(u*Math.PI)*2,lerp(o.sz,o.tz,u),0,t*12,0.3,1,C(0xFFF6D8));
    if(Math.random()<0.5) spawnParticles(lerp(o.sx,o.tx,u),lerp(o.sy,0.5,u)+Math.sin(u*Math.PI)*2,lerp(o.sz,o.tz,u),1,0xC58CFF,0.5,0.3,0.7,0); }
  bEnd(B.talis);
  bBegin(B.part); for(const p of G.parts){ const s=p.size*Math.max(0.05,Math.min(1,p.life/p.max*1.5)); bEuler(B.part,p.x,p.y,p.z,p.rx+t*4,p.ry+t*3,0,s,C(p.col)); } bEnd(B.part);
  bBegin(B.plank);
  for(const k2 in G.fences){ const f=G.fences[k2]; if(!f.built) continue; const jit=f.shake>0?0.06:0;
    for(const pl of f.planks){ if(pl.h<=0) continue; const s=easeOutBack(pl.h); bYaw(B.plank,pl.x+rand(-jit,jit),0.75*pl.tall*s,pl.z,pl.rot,1,Math.max(0.01,s*pl.tall),1,C(0x94643F)); } }
  bEnd(B.plank);

  bBegin(B.hpBg); bBegin(B.hpFg);
  const rightV=_v.set(1,0,0).applyQuaternion(camQ); const rx=rightV.x, ry=rightV.y, rz=rightV.z;
  const bar=(x,y,z,w,f,col)=>{ bQuat(B.hpBg,x,y,z,camQ,w+0.12,1.75,1,C(0x140C0C)); const fw=w*clamp(f,0,1); bQuat(B.hpFg,x-rx*(w-fw)/2,y-ry*(w-fw)/2,z-rz*(w-fw)/2,camQ,Math.max(0.001,fw),1.2,1,col); };
  const hpCol=f=>f>0.6?C(0x5CE04A):f>0.3?C(0xFFC928):C(0xFF4436);
  for(const e of G.enemies){ if(!e.dead&&e.hp<e.max&&e!==G.boss){ const f=e.hp/e.max; bar(e.x,e.cls==='boss'?BOSSES[e.kind].h+0.4:(e.cls==='oni'?2.95:e.cls==='eshield'?4.6:e.cls==='eshaman'?4.0:e.cls==='earcher'?3.7:e.cls==='espear'?2.9:2.3),e.z,e.cls==='boss'?2.6:(e.cls==='oni'||e.cls==='eshield'?1.6:1.35),f,hpCol(f)); } }
  if(h.alive&&h.hp<h.max) bar(h.x,2.6,h.z,1.1,h.hp/h.max,C(0x5AD843));
  for(const u of G.units) if(u.hp<u.max*0.98&&MELEE_CLS.includes(u.cls)) bar(u.x,1.95,u.z,0.7,u.hp/u.max,C(0x5AD843));
  for(const k2 in G.fences){ const f=G.fences[k2]; if(f.built&&f.hp<f.max) bar(f.mid[0],2.2,f.mid[1],2,f.hp/f.max,C(0x5AD843)); }
  bEnd(B.hpBg); bEnd(B.hpFg);

  // telegraphs
  TG_POOL.forEach(p=>{ p.disc.visible=p.ring.visible=p.donut.visible=p.rect.visible=p.rectE.visible=false; });
  G.tgs.slice(0,TG_POOL.length).forEach((tg,i)=>{ const P=TG_POOL[i], u=Math.min(1,tg.t/tg.dur), pulse=0.55+0.25*Math.sin(t*20);
    if(tg.shape==='circle'){ P.ring.visible=P.disc.visible=true; P.ring.position.set(tg.x,0.07,tg.z); P.ring.scale.setScalar(tg.r); P.disc.position.set(tg.x,0.06,tg.z); P.disc.scale.setScalar(Math.max(0.01,tg.r*u)); P.ring.material.opacity=pulse; }
    else if(tg.shape==='donut'){ P.donut.visible=true; P.donut.position.set(tg.x,0.07,tg.z); P.donut.scale.setScalar(tg.r); P.donut.material.opacity=0.2+0.35*u; }
    else { const yaw=Math.atan2(tg.dx,tg.dz); P.rectE.visible=P.rect.visible=true; P.rectE.position.set(tg.x,0.06,tg.z); P.rectE.rotation.y=yaw; P.rectE.scale.set(tg.w,1,tg.len);
      P.rect.position.set(tg.x,0.07,tg.z); P.rect.rotation.y=yaw; P.rect.scale.set(tg.w,1,Math.max(0.01,tg.len*u)); P.rect.material.opacity=0.3; } });

  // guidance
  bBegin(B.chev);
  if(h.alive&&!G.armOpen){ let gt=null;
    const boss=G.enemies.find(e=>e.cls==='boss'&&Math.hypot(e.x-KEEP.x,e.z-KEEP.z)<20); if(boss) gt=boss;
    else { let best=null,bc=1e9; for(const p of G.pads){ if(!p.active||p.done) continue; const need=p.cost-p.paid, have=p.cur==='ingot'?G.ingots:G.stack;
        if(need<=have||p.cost===0){ const dd=Math.hypot(p.x-h.x,p.z-h.z)+need*0.2; if(dd<bc){ bc=dd; best=p; } } }
      if(best) gt=best; else if(G.forge&&G.forge.pile>=3&&(G.pads.some(p=>p.active&&!p.done&&p.cur==='ingot')||G.armory)) gt={x:G.forge.x,z:G.forge.z+1.6}; }
    if(gt){ const dx=gt.x-h.x, dz=gt.z-h.z, dist=Math.hypot(dx,dz);
      if(dist>3.2){ const ux=dx/dist, uz=dz/dist, yaw=Math.atan2(-dx,-dz), off=(t*1.6)%0.75;
        for(let s=1.6+off;s<Math.min(dist-1.4,22);s+=0.75){ const fade=Math.min(1,(s-1.2)/1.2,(dist-1.4-s)/1.2); bYaw(B.chev,h.x+ux*s,0.08,h.z+uz*s,yaw,Math.max(0.2,fade),1,Math.max(0.2,fade),C(0x3FDDF5)); } } } }
  bEnd(B.chev);

  for(const p of G.pads){ if(!p.active||p.done) continue;
    const pr=p.cost?p.paid/p.cost:0; p.fill.scale.set(Math.max(0.001,pr),1,Math.max(0.001,pr));
    _v.set(p.x,0.3,p.z).project(camera); const sx=(_v.x+1)/2*cw, sy=(1-_v.y)/2*ch;
    if(_v.z>1||sx<-60||sx>cw+60||sy<-60||sy>ch+60){ p.el.style.display='none'; continue; }
    p.el.style.display='flex'; const left=p.cost-p.paid; if(left!==p.shown){ p.shown=left; p.numEl.textContent=left; }
    p.el.classList.toggle('off',(p.cur==='ingot'?G.ingots:G.stack)<=0&&left>0);
    p.el.style.transform=`translate(${sx-p.el.offsetWidth/2}px,${sy-p.el.offsetHeight-6}px)`; }
  for(const nn of numPool){ if(!nn.active) continue; nn.t+=dt; if(nn.t>0.85){ nn.active=false; nn.el.style.display='none'; continue; }
    const u=nn.t/0.85; _v.set(nn.x,nn.y+u*1.3,nn.z).project(camera); const sx=(_v.x+1)/2*cw, sy=(1-_v.y)/2*ch, sc=nn.t<0.1?1.45-nn.t*4.5:1;
    nn.el.style.opacity=u>0.65?String(1-(u-0.65)/0.35):'1'; nn.el.style.transform=`translate(${sx-16}px,${sy-14}px) scale(${sc})`; }
  fxUpdate(dt);
  if(G.ultFx>0){ G.ultFx+=dt; const u=Math.min(1,G.ultFx/0.65), r=0.6+u*(G.ultR||7.6);
    ultRing.visible=true; ultRing.position.set(h.x,0.12,h.z); ultRing.rotation.z=(G.ultKind==='void'?-1:1)*u*2;
    ultRing.scale.set(r,r,r); ultRing.material.color.setHex(G.ultCol||0xFFFFFF); ultRing.material.opacity=0.9*(1-u);
    if(u>=1){ G.ultFx=0; ultRing.visible=false; } } else ultRing.visible=false;
  
  renderer.render(scene,camera);
}

/* ================================================================ call wave, zoom */
function callBonus(){ const W=G.waves; if(G.waveIdx>=W.length) return 0; const left=W[G.waveIdx].t-G.clock; return left<1?0:Math.ceil(left*0.6*(1+0.2*G.si)*(PASS('tengu')?1.5:1)); }
function callWave(){ if(!G||G.state!=='play') return; const b=callBonus(); if(b<=0) return;
  G.clock=G.waves[G.waveIdx].t; G.stack+=b; G.bonusTotal+=b; G.breakT=0; $('breakCard').classList.remove('show');
  popText(G.hero.x,2.8,G.hero.z,'+'+b+' early call','gold'); sfx('horn'); toast(`Wave called early: +${b} coins`); }
$('callWave').addEventListener('click',()=>{ audioInit(); callWave(); });
$('ultBtn').addEventListener('click',()=>{ audioInit(); castUlt(); });
$('sky2Btn').addEventListener('click',()=>{ audioInit(); castSky(); });
$('cardRow').addEventListener('click',e=>{ const b=e.target.closest('.battlecard'); if(!b||b.disabled) return;
  if(b.dataset.d!==undefined) chooseDiff(+b.dataset.si,+b.dataset.d); else chooseCard(+b.dataset.c); });
function cardList(){ return (G&&G.cards||[]).map(id=>{ const c=CARDS.find(x=>x.id===id); return c?c.name:id; }).join(' · '); }
function setPause(v){ if(!G||G.state!=='play') return; G.paused=v; $('pausedTag').classList.toggle('show',!!v&&!G.armOpen); $('pauseBtn').textContent=v?'▶':'⏸'; if(v) toast(G&&G.cards&&G.cards.length?('Paused · cards: '+cardList()):'Paused — tap ▶ to continue',2.2); }
$('pauseBtn').addEventListener('click',()=>{ audioInit(); if(G&&G.armOpen){ closeArmory(); return; } setPause(!(G&&G.paused)); });
let userZoom=clamp(+SAVE.zoom||1,0.5,2.2);
function setZoom(z){ userZoom=clamp(z,0.5,2.2); SAVE.zoom=+userZoom.toFixed(2); persist(); }
$('zIn').addEventListener('click',()=>setZoom(userZoom/1.2));
$('audioBtn').addEventListener('click',()=>{ audioInit(); Music.start(); cycleAudio(); });
$('audioBtn').textContent=['🔇','🔔','🎵'][AUDIO_MODE];
$('zOut').addEventListener('click',()=>setZoom(userZoom*1.2));
addEventListener('wheel',e=>{ if(e.target.closest&&e.target.closest('#armory,.screen')) return; setZoom(userZoom*(e.deltaY>0?1.1:1/1.1)); },{passive:true});
addEventListener('keydown',e=>{ const k=e.key; if(k==='+'||k==='=') setZoom(userZoom/1.2); else if(k==='-'||k==='_') setZoom(userZoom*1.2); else if(k==='p'||k==='P'||k==='Escape'){ if(G&&G.armOpen) closeArmory(); else setPause(!(G&&G.paused)); }
  else if(k==='e'||k==='E') callWave(); else if(k===' '||k==='q'||k==='Q'){ e.preventDefault(); castUlt(); } });

/* ================================================================ HUD & screens */
function updateHud(force){
  const W=G.waves, wave=Math.min(G.waveIdx,W.length), next=G.waveIdx<W.length?Math.max(0,Math.ceil(W[G.waveIdx].t-G.clock)):null;
  const title=`Stage ${G.si+1}: ${G.st.name}`, sub=`Wave ${wave} of ${W.length}`+(next!==null?`, next in ${next}s`:(G.enemies.length?', final wave':''));
  if($('wave').dataset.t!==title+sub){ $('wave').dataset.t=title+sub; $('waveTitle').textContent=title; $('waveNext').textContent=sub; }
  $('keepFill').style.transform=`scaleX(${clamp(G.keepHp/G.keepMax,0,1)})`;
  if(G.boss) $('bossFill').style.transform=`scaleX(${clamp(G.boss.hp/G.boss.max,0,1)})`;
  if(force||G.stack!==G.lastStack){ const pill=$('coinPill'); $('coinTxt').textContent=G.stack;
    if(!force){ pill.classList.toggle('up',G.stack>G.lastStack); pill.classList.toggle('down',G.stack<G.lastStack); if(G.pillT<=0){ pill.classList.remove('punch'); void pill.offsetWidth; pill.classList.add('punch'); G.pillT=0.12; } G.pillColT=0.3; }
    G.lastStack=G.stack; }
  if(force||G.ingots!==G.lastIng){ $('ingTxt').textContent=G.ingots; G.lastIng=G.ingots; }
  { const ub=$('ultBtn'), cd=G.ultCd||0, pct=Math.round(100-cd/ultMax()*100), key=pct+(cd<=0?'R':'');
  { const b2=$('sky2Btn'); if(b2){ const on=hasSky();
      if(b2.classList.contains('show')!==on) b2.classList.toggle('show',on);
      if(on){ const c2=G.sky2Cd||0, p2=Math.round(100-c2/sky2Max()*100), S=SKY[G.heroDef.id];
        const hex='#'+S.col.toString(16).padStart(6,'0');
        if(b2.dataset.col!==hex){ b2.dataset.col=hex; b2.style.setProperty('--c',hex); b2.style.setProperty('--c2',hex+'70'); }
        b2.style.setProperty('--p',p2+'%');
        b2.style.setProperty('--glow',c2>0?'rgba(0,0,0,0)':hex+'cc');
        b2.classList.toggle('ready',c2<=0); b2.disabled=c2>0;
        const lab=b2.querySelector('small'), want=c2>0?Math.ceil(c2)+'s':'SKY'; if(lab.textContent!==want) lab.textContent=want; } } }
    ub.style.display=G.state==='play'&&!G.armOpen?'block':'none';
    if(G.ultPct!==key){ G.ultPct=key; ub.style.setProperty('--p',pct+'%'); ub.classList.toggle('ready',cd<=0); ub.querySelector('small').textContent=cd<=0?'READY':Math.ceil(cd)+'s'; }
    if(G.ultHero!==G.heroDef.id){ G.ultHero=G.heroDef.id; ub.querySelector('img').src=ART[G.heroDef.sprite]||ART.hero; } }
  { const pb=$('pauseBtn'); pb.style.display=G.state==='play'?'block':'none'; pb.textContent=(G.paused||G.armOpen)?'▶':'⏸'; $('pausedTag').classList.toggle('show',!!G.paused&&!G.armOpen); }
  { const ab=$('armBtn'), show=G.state==='play'&&!G.armOpen; ab.style.display=show?'block':'none'; ab.classList.toggle('dim',!G.armory); }
  const sq=`${cpUsed()}/${G.cpCap}`; if($('sqTxt').textContent!==sq) $('sqTxt').textContent=sq;
  const counts={}; for(const u of G.units) counts[u.cls]=(counts[u.cls]||0)+1;
  const rk=Object.keys(CLS).filter(c=>counts[c]).map(c=>c+counts[c]).join(',');
  if(G.rosterKey!==rk){ G.rosterKey=rk; $('roster').innerHTML=Object.keys(CLS).filter(c=>counts[c]).map(c=>`<span title="${CLS[c].name}"><img src="${ART[UNIT_SPR[c]]}" alt="${CLS[c].name}"><b>${counts[c]}</b></span>`).join(''); }
  const cb=G.state==='play'?callBonus():0, cbKey=cb?`${G.waveIdx+1}|${cb}`:'';
  if(G.cbKey!==cbKey){ G.cbKey=cbKey; const btn=$('callWave'); if(cb){ btn.style.display='block'; btn.firstChild.nodeValue=`Call wave ${G.waveIdx+1}`; btn.querySelector('small').textContent=`+${cb} bonus coins`; } else btn.style.display='none'; }
  if(G.breakT>0){ const nx=G.waveIdx<W.length?W[G.waveIdx]:null; const types=nx?[...new Set(nx.g.map(g=>g[0].startsWith('boss:')?g[0].slice(5):g[0]))]:[];
    const html=`<h4>Wave ${G.waveIdx} of ${W.length} cleared</h4><div class="coins"><span><i></i>+${G.lastBreakBonus} bonus</span><span><i></i>${G.stack} carried</span></div>`+
      (nx?`<div class="foes">Next wave in ${Math.max(0,Math.ceil(nx.t-G.clock))}s: ${types.map(t=>`<img src="${ART[t==='brute'?'oni':t]||ART.bandit}" alt="${t}">`).join('')}</div>`:'');
    if(G.breakHtml!==html){ G.breakHtml=html; $('breakCard').innerHTML=html; } }
}
function showScreen(id){ if(id!=='hud'){ const g=$('grade'), v=$('vig'); if(g) g.style.opacity='0'; if(v) v.style.opacity='0'; }
 ['title','map','end'].forEach(s=>$(s).classList.toggle('hide',s!==id)); }
let _sprStyle=null;
function buildSprCss(){ if(!_sprStyle){ _sprStyle=document.createElement('style'); document.head.appendChild(_sprStyle); }
  const anim=Object.keys(ANIM).map(k=>`.spr-${k}{background-image:url(${ANIM[k]});background-size:300% 100%;aspect-ratio:${(ANIM_META[k]||{ar:1}).ar};animation:sprwalk 1.05s steps(3) infinite;}`);
  const still=Object.keys(ART).filter(k=>!ANIM[k]).map(k=>`.spr-${k}{background-image:url(${ART[k]});background-size:cover;aspect-ratio:1;animation:none;}`);
  _sprStyle.textContent=anim.concat(still).join('\n'); }
buildSprCss();
const PACKS=window.GKA_ALL?{core:1,ui:1,chars:1,world:1,bosses:1}:{core:true}; const packWaiters=[];
window.PACKS=PACKS;
window.GK_PACK=function(name){ PACKS[name]=true; buildSprCss();
  if(typeof renderHome==='function'&&document.getElementById('map')&&!document.getElementById('map').classList.contains('hide')) renderHome();
  for(let i=packWaiters.length-1;i>=0;i--) if(packWaiters[i].test()){ const w=packWaiters.splice(i,1)[0]; w.go(); }
  const el=document.getElementById('streamTag');
  if(el){ if(allPacks()){ el.style.display='none'; } else { el.textContent='Loading art… '+Object.keys(PACKS).length+'/5'; } } };
function allPacks(){ return !!(PACKS.core&&PACKS.ui&&PACKS.chars&&PACKS.world&&PACKS.bosses); }
window.allPacks=allPacks;
function whenPacks(test,go){ if(test()) go(); else { packWaiters.push({test,go}); const el=document.getElementById('streamTag'); if(el){ el.style.display='block'; el.textContent='Preparing battlefield…'; } } }
let homeTab='stages';
function statBars(d){ const dps=d.dmg/d.cd; return `<div class="stat">HP<i style="--v:${Math.round(d.hp/950*100)}%"></i></div><div class="stat">DMG<i style="--v:${Math.round(Math.min(1,dps/70)*100)}%"></i></div><div class="stat">SPD<i style="--v:${Math.round(d.speed/7*100)}%"></i></div>`; }
function priceTag(d){ return `🪙 ${d.price}${d.jade?`<br>💠 ${d.jade}`:''}`; }
function canAfford(d){ return SAVE.honor>=d.price&&(SAVE.jade||0)>=(d.jade||0); }
function renderHome(){
  if(!SAVE.giftShop){ SAVE.giftShop=true; SAVE.honor+=300; SAVE.jade=(SAVE.jade||0)+5; persist(); homeMsg('Welcome gift: 🪙 300 coins and 💠 5 Spirit Jade to spend on heroes and recruits'); }
  const HD=HEROES[SAVE.hero]||HEROES.ronin;
  $('homeHeroSpr').className='spr spr-'+HD.sprite; $('homeHeroName').textContent=HD.name; $('walCoins').textContent=SAVE.honor; $('walJade').textContent=SAVE.jade||0;
  $('titleHero').src=ART[HD.sprite]||ART.hero;
  renderMap();
  $('heroList').innerHTML=Object.entries(HEROES).map(([id,d])=>{
    const owned=SAVE.heroes.includes(id), eq=SAVE.hero===id, locked=d.req!=null&&!(SAVE.stars[d.req]>0);
    const btn=eq?'<button class="hbtn eqd" disabled>Equipped</button>':owned?`<button class="hbtn equip" data-equip="${id}">Equip</button>`:locked?`<button class="hbtn lock" disabled>Stage ${d.req+1}</button>`:`<button class="hbtn buy${canAfford(d)?'':' poor'}" data-buyhero="${id}">${priceTag(d)}</button>`;
    return `<div class="hcard${eq?' eq':''}"><span class="rdot ${d.rarity}"></span><div class="spr spr-${d.sprite}"></div><b>${d.name}</b><span class="rtag ${d.rarity}">${d.rarity}</span><small class="atk">${d.desc}</small><small class="pas">Passive: ${d.passive}</small><small class="nums">${Math.round(d.hp)}hp · ${d.dmg}dmg · ${d.range>=7?'long':d.range>=3?'reach':'close'}</small>${btn}</div>`; }).join('');
  $('unitList').innerHTML=Object.entries(RECRUITS).map(([id,d])=>{
    const owned=d.starter||SAVE.units.includes(id), locked=d.req!=null&&!(SAVE.stars[d.req]>0), c=CLS[id];
    const btn=owned?`<button class="hbtn own" disabled>${d.starter?'Starter':'Unlocked'}</button>`:locked?`<button class="hbtn lock" disabled>Stage ${d.req+1}</button>`:`<button class="hbtn buy${canAfford(d)?'':' poor'}" data-buyunit="${id}">${priceTag(d)}</button>`;
    const rng=c.range>=7?'long range':c.range>=3?'medium reach':'close combat';
    return `<div class="hcard"><div class="spr spr-${d.sprite}"></div><b>${d.name}</b><small class="atk">${d.desc}</small><small class="pas">${rng} · ${c.cp} squad cost</small><small class="nums">${c.hp}hp · ${c.dmg}dmg</small>${btn}</div>`; }).join('');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.tab===homeTab));
  document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('hide',p.id!=='tab-'+homeTab));
}
let homeMsgT=null;
function homeMsg(t){ $('homeMsg').textContent=t; clearTimeout(homeMsgT); homeMsgT=setTimeout(()=>{ $('homeMsg').textContent=''; },4000); }
document.querySelector('.tabs').addEventListener('click',e=>{ const t=e.target.closest('.tab'); if(!t) return; homeTab=t.dataset.tab; renderHome(); });
$('map').addEventListener('click',e=>{
  const b=e.target.closest('[data-buyhero],[data-buyunit],[data-equip]'); if(!b) return;
  if(b.dataset.equip){ SAVE.hero=b.dataset.equip; persist(); sfx('rank'); homeMsg(`${HEROES[SAVE.hero].name} equipped`); renderHome(); return; }
  const isHero=!!b.dataset.buyhero, id=b.dataset.buyhero||b.dataset.buyunit, d=isHero?HEROES[id]:RECRUITS[id];
  if(!canAfford(d)){ b.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:250}); homeMsg(`Need 🪙 ${Math.max(0,d.price-SAVE.honor)} more coins${d.jade&&(SAVE.jade||0)<d.jade?` and 💠 ${d.jade-(SAVE.jade||0)} more jade`:''}. Win stages to earn them.`); return; }
  SAVE.honor-=d.price; SAVE.jade=(SAVE.jade||0)-(d.jade||0);
  if(isHero){ SAVE.heroes.push(id); SAVE.hero=id; homeMsg(`${d.name} joined and is now your hero!`); }
  else { SAVE.units.push(id); homeMsg(`${d.name} unlocked: its building now appears in every stage`); }
  persist(); sfx('build'); renderHome();
});
function renderMap(){
  let html='';
  STAGES.forEach((s,i)=>{ const locked=i>=SAVE.unlocked, stars=SAVE.stars[i]||0, th=THEMES[s.theme];
    html+=`<button class="stage${locked?' locked':''}" data-i="${i}" title="${locked?'Locked':s.name+' — '+BOSSES[s.boss].name}"><span class="no" style="background:${th.stageCol}">${i+1}</span><img src="${ART[s.boss]}" alt=""><b>${s.name}</b><span class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span></button>`; });
  $('stageList').innerHTML=html; $('stageList').className='stagegrid'; renderShops(); if($('walCoins')){ $('walCoins').textContent=SAVE.honor; $('walJade').textContent=SAVE.jade||0; }
}
function renderShops(){
  const h=PERKS.map(p=>{ const lv=PK(p.id), max=lv>=PERK_MAX;
    return `<button class="perk${max?' max':''}" data-p="${p.id}"><b>${p.name}</b><em>Lv ${lv}/${PERK_MAX}</em><small>${p.desc} per level</small><small class="now">Now: ${p.at?p.at(lv):'+'+lv+' levels'}</small><span>${max?'Max':'🪙 '+perkCost(p,lv)}</span></button>`; }).join('');
  $('perkList').innerHTML=h; $('endShop').innerHTML=h; $('honorTxt').textContent=SAVE.honor; $('endTreas').textContent=SAVE.honor;
}
$('acctBtn').addEventListener('click',async()=>{ if(Cloud.user){ await Cloud.signOut(); renderHome(); } else { authMsg(Cloud.enabled?'':'Accounts are not configured for this site yet.'); showAuth(true); } });
$('stageList').addEventListener('click',e=>{ const b=e.target.closest('.stage'); if(!b) return; const i=+b.dataset.i; if(i>=SAVE.unlocked) return;
  if(!(PACKS.chars&&PACKS.world&&PACKS.bosses)){ whenPacks(()=>PACKS.chars&&PACKS.world&&PACKS.bosses,()=>{ const el=document.getElementById('streamTag'); if(el) el.style.display='none'; if((SAVE.stars[i]||0)>0&&!window.__skipDiff){ openDiff(i); return; } window.__skipDiff=false; startStage(i); showScreen('hud'); }); return; }
  audioInit(); if((SAVE.stars[i]||0)>0&&!window.__skipDiff){ openDiff(i); return; } window.__skipDiff=false; startStage(i); });
function buyPerk(e){ const b=e.target.closest('.perk'); if(!b) return; const p=PERKS.find(x=>x.id===b.dataset.p), lv=PK(p.id), c=perkCost(p,lv);
  if(lv>=PERK_MAX||SAVE.honor<c){ b.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:250}); return; }
  SAVE.honor-=c; SAVE.perks[p.id]++; persist(); sfx('buy'); renderShops(); if($('walCoins')) $('walCoins').textContent=SAVE.honor; }
$('perkList').addEventListener('click',buyPerk); $('endShop').addEventListener('click',buyPerk);
function endStage(won){
  if(G.state!=='play') return; G.state=won?'win':'lose'; gsDrive(G); closeArmory(); joy.style.display='none'; inp.active=false; inp.x=inp.y=0;
  const f=G.keepHp/G.keepMax, stars=won?1+(f>=0.5?1:0)+(f>=0.85?1:0):0;
  const carried=G.stack, ingVal=G.ingots*5, starB=won?stars*25:0, bounty=G.bossBounty||0;
  const starMul=(won?(stars>=3?2.5:stars===2?1.5:1):1)*(G.diffReward||1);
  if(won&&G.diff>(SAVE.tier[G.si]||0)) SAVE.tier[G.si]=G.diff;
  const honor=won?Math.round((carried+ingVal+starB+bounty)*starMul):Math.floor((carried+ingVal)/2);
  const firstClear=won&&!(SAVE.stars[G.si]>0), jade=won?(G.si+1)*2+stars+(firstClear?5:0):0;
  SAVE.honor+=honor; SAVE.jade=(SAVE.jade||0)+jade;
  $('endCoins').innerHTML=`<div><span>Gold still carried</span><span>🪙 ${carried}</span></div><div><span>Ingots (×5)</span><span>🪙 ${ingVal}</span></div>`+
    (won?`<div><span>Star bonus (${stars}★)</span><span>🪙 ${starB}</span></div><div><span>Boss bounty</span><span>🪙 ${bounty}</span></div>`:`<div><span>Retreat penalty</span><span>half kept</span></div>`)+
    `<div><span>Wave and early-call bonuses earned</span><span>🪙 ${G.bonusTotal}</span></div>${won?`<div><span>Star multiplier (${stars}★)</span><span>×${starMul}</span></div>`:''}<div class="tot"><span>Banked to treasury</span><span>🪙 +${honor}</span></div>`+(jade?`<div class="tot"><span>Spirit Jade earned${firstClear?' (first clear +5)':''}</span><span>💠 +${jade}</span></div>`:'')+`<div><span>Treasury total</span><span>🪙 ${SAVE.honor} · 💠 ${SAVE.jade}</span></div>`; if(won){ SAVE.stars[G.si]=Math.max(SAVE.stars[G.si]||0,stars); SAVE.unlocked=Math.max(SAVE.unlocked,Math.min(STAGES.length,G.si+2)); } persist();
  $('endTitle').textContent=won?(G.si===STAGES.length-1?'The oni are vanquished':'Castle held'):'The castle fell';
  $('endStars').innerHTML=won?'★'.repeat(stars)+`<span class="dim">${'★'.repeat(3-stars)}</span>`:'';
  const m=Math.floor(G.time/60), s=String(Math.floor(G.time%60)).padStart(2,'0');
  $('endStats').innerHTML=`Time ${m}:${s}<br>Foes defeated ${G.kills}<br>Structures built ${G.built}`; renderShops();
  $('nextBtn').style.display=won&&G.si<STAGES.length-1?'inline-block':'none';
  Music.stinger(won?'win':'lose');
  setTimeout(()=>showScreen('end'),won?700:900);
}
$('startBtn').addEventListener('click',()=>{ audioInit(); Music.start(); renderHome(); showScreen('map'); });
$('nextBtn').addEventListener('click',()=>{ audioInit(); startStage(G.si+1); });
$('retryBtn').addEventListener('click',()=>{ audioInit(); startStage(G.si); });
$('mapBtn').addEventListener('click',()=>{ renderHome(); showScreen('map'); G.state='title'; });

/* ================================================================ loop */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,0.05); last=now; TIME+=dt;
  if(!G) return;
  const frozen=G.state==='play'&&(G.paused||G.armOpen||G.cardOpen);
  if(G.state==='play'&&!frozen){ let sd=dt; if(G.hitStop>0){ G.hitStop-=dt; sd=dt*0.08; }
    const steps=window.__fast||1; for(let i=0;i<steps&&G.state==='play';i++) update(sd);
    G.pillT-=dt; if(G.pillColT>0){ G.pillColT-=dt; if(G.pillColT<=0) $('coinPill').classList.remove('up','down'); }
    updateHud(false); }
  else if(frozen) updateHud(false);
  Music.update(G,dt);
  if(toastTimer>0){ toastTimer-=dt; if(toastTimer<=0) $('toast').classList.remove('show'); }
  if(G&&G.breakT>0){ G.breakT-=dt; if(G.breakT<=0) $('breakCard').classList.remove('show'); }
  if(introTimer>0){ introTimer-=dt; if(introTimer<=0) $('intro').classList.remove('show'); }
  render(frozen?0:dt);
}
['title','map','end'].forEach(id=>{ $(id).style.backgroundImage=`linear-gradient(180deg, rgba(255,240,248,.10) 0%, rgba(31,28,40,.55) 55%, rgba(31,28,40,.85) 100%), url(${ART.keyart})`; });
$('avatar').src=ART.hero; $('titleHero').src=ART[(HEROES[SAVE.hero]||HEROES.ronin).sprite]||ART.hero;
(async()=>{ let guest=false; try{ guest=localStorage.getItem('gk-guest')==='1'; }catch(e){}
  const signed=await Cloud.init();
  document.getElementById('auth').style.backgroundImage=`linear-gradient(180deg, rgba(255,240,248,.10) 0%, rgba(31,28,40,.62) 55%, rgba(31,28,40,.88) 100%), url(${ART.keyart})`;
  if(Cloud.enabled&&!signed&&!guest) showAuth(true);
})();
startStage(0); G.state='title'; showScreen('title'); $('toast').classList.remove('show'); toastTimer=0;
requestAnimationFrame(frame);
window.__T={ sky:()=>({has:hasSky(),cd:Math.round(G.sky2Cd||0),max:sky2Max(),falling:(G.skyFall||[]).length}), castSky:()=>castSky(), diff:()=>({diff:G.diff,mul:G.diffMul,reward:G.diffReward,tiers:SAVE.tier}), ql:()=>({quality:QL,fps:Math.round(_fps)}), muts:()=>G.enemies.filter(e=>e.mut).map(e=>({m:e.mut,hp:Math.round(e.hp),max:Math.round(e.max),ward:Math.round(e.ward||0)})), cards:()=>({taken:G.cards,mods:G.mods}), offer:()=>offerCards(), spawn:(t,l)=>spawnEnemy(t,l||0), snd:()=>SND.dbg(), hpn:()=>B.hpBg.n, gs:()=>gsState, camQ:()=>camQ.toArray(), camBill:()=>camBill.toArray(), frames:k=>FRAMES(k), sb:k=>SB[k], packs:()=>PACKS, fx:()=>FX, layout:()=>LAYOUT, home:()=>{ renderHome(); showScreen('map'); }, music:()=>Music.dbg(), ac:()=>AC&&AC.state, build:id=>{ const p=G.pads.find(x=>x.id===id); if(p){ p.done=true; p.active=false; p.g.visible=false; p.el.style.display='none'; buildStructure(p); } }, spawnBoss:k=>{ const e=spawnEnemy('boss:'+k,0); e.x=G.hero.x; e.z=G.hero.z-4.5; e.atkT=999; e.speed=0; return 1; }, G:()=>G, start:i=>startStage(i), save:()=>SAVE, clock:t=>{ G.clock=t; }, give:(g,i)=>{ G.stack+=g; G.ingots+=i; } };
})();
