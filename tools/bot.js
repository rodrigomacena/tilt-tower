/* Tilt Tower test bot: plays a phase aiming at the current objective.
   Before pressing a flipper it simulates the shot (ball + flipper only) and checks where the ball would go.
   Usage (browser console, with the game loaded): TTBot.run({ phases:[0,1,2], trials:4, jitter:.02 }).then(console.table)
   Human-like play: TTBot.run({ human:'medio', loadout:'era' })  (presets: bom, medio, novato) */
(function(){
const T = window.__tiltTower, G = T.G, Y = T.Y, S = T.S, H = 1/600;
function taskTargets(L, f, t, out){
  if(t.kind === "bumps") L.bumpers.forEach(c => { if(c.f === f) out.push([c.x, c.y + c.r]); });
  else if(t.kind === "coins") L.coins.forEach(c => { if(c.f === f && !c.taken && !c.gold) out.push([c.x, c.y]); });
  else if(t.kind === "spin") L.spinners.forEach(q => { if(q.f === f) out.push([(q.x1+q.x2)/2, q.y + 30]); });
  else if(t.kind === "order") t.tg.forEach(q => { if(q.ord === t.n) out.push([q.x, q.y + 10]); });
  else if(t.kind === "chase" || t.kind === "zig") out.push([t.tg[t.cur].x, t.tg[t.cur].y + 10]);
  else if(t.kind === "switch"){ if(t.shut) out.push([t.tg[0].x, t.tg[0].y + 10]); }
  else if(t.kind === "pots") t.pots.forEach(q => { if(!q.done) out.push([q.x, q.y, "s"]); });
}
function targets(L, f){
  const fl = L.floors[f], out = []; if(!fl) return out;
  const B = L.boss;
  for(const e of L.enemies) if(e.alive && e.f === f) out.push([e.x, e.y, 'e']);
  if(out.length) return out;
  if(fl.m === 'boss' && B){
    if(B.dead) out.push([L.exit.x, L.exit.y, 's']);
    else if(B.weak && !B.shield) out.push([(B.weak.ax+B.weak.bx)/2, B.weak.ay + 14]);
    else if(B.bx !== undefined) out.push([B.bx, B.by]);
    else if(B.type === 'needle' && B.hx !== undefined) out.push([B.hx, B.hy]);
    else if(B.type === 'globe') out.push([B.gx, B.gy + B.gr]);
    else if(B.type === 'tape') out.push([B.hubs[B.open].x, B.hubs[B.open].y + 18]);
    else if(B.type === 'robot') out.push([B.rx, B.ry]);
    else if(B.type === 'pet') out.push([B.px, B.py + B.pr]);
    else if(B.type === 'modem') out.push([[110,180,250][B.idx], Y(f, 154)]);
    else if(B.type === 'poly') out.push([B.hx, B.hy + B.hr]);
    else if(B.type === 'drone') out.push([B.dx, B.dy]);
    else if(B.type === 'hole') out.push([B.kx, B.ky]);
    else if(B.type === 'ai') out.push([B.ex, B.ey + B.er]);
    else if(B.weak) out.push([(B.weak.ax+B.weak.bx)/2, B.weak.ay + 14]);
    else out.push([180, Y(f, 230)]);
    return out;
  }
  if(fl.m === 'goal'){
    if(L.exit.lit) return [[L.exit.x, L.exit.y, 's']];
    if(L.goalCond === 'targets') L.goalStands.forEach(t => { if(!t.lit) out.push([t.x, t.y + 10]); });
    if(L.goalCond === 'bank') L.goalBank.targets.forEach(t => { if(!t.down) out.push([t.x + t.w/2, t.y + 10]); });
    if(L.goalTask && !L.goalTask.cleared) taskTargets(L, f, L.goalTask, out);
    return out;
  }
  const r = fl.rail;
  if(r && r.locked && fl.lockObj){
    const o = fl.lockObj;
    if(fl.lockBy === 'task') taskTargets(L, f, o, out);
    else if(fl.lockBy === 'bank') o.targets.forEach(t => { if(!t.down) out.push([t.x + t.w/2, t.y + 10]); });
    else if(fl.lockBy === 'roll') o.xs.forEach((x, i) => { if(!o.lit[i]) out.push([x, o.y + 30]); });
    else if(fl.lockBy === 'dance') o.tiles.forEach(t => { if(!t.lit) out.push([t.x, t.y]); });
    else if(fl.lockBy === 'code'){ const t = o.btns[o.seq[o.step]]; out.push([t.x, t.y + 10]); }
    else if(o.targets) o.targets.forEach(t => { if(!t.down) out.push([t.x + t.w/2, t.y + 10]); });
    if(out.length) return out;
  }
  if(fl.m === 'elev'){ const sc = L.saucers.find(s => s.f === f && s.kind === 'elev'); if(sc) return [[sc.x, sc.y, 's']]; }
  const sg = (L.sigs||[]).find(q => q.f === f);
  if(sg && sg.seq && sg.seq.n < 1 && !window.TTBot.noSeq){ if(sg.seq.step === 0 && sg.vari) return [[sg.vari.x - sg.vari.dx*14, sg.vari.y - sg.vari.dy*14]]; if(sg.seq.step === 1 && sg.cap) return [[sg.cap.x, sg.cap.y0 + 14]]; if(sg.seq.step === 1 && sg.bp) return [[sg.bp.x, sg.bp.y + (sg.era === 4 ? -6 : 12), sg.era === 1 ? 's' : '']]; }
  for(const q of [fl.rail, fl.extra]) if(q && !q.locked && q.type !== 'elev') out.push([(q.mx0+q.mx1)/2, q.y0 + 6]);
  return out;
}
// ball + one flipper, flipper pressed from now on: where does the ball leave?
function ghost(b, F, grav, upW){
  let x = b.x, y = b.y, vx = b.vx, vy = b.vy, sw = b.w||0, ang = F.ang, hit = false;
  for(let i = 0; i < 110; i++){
    const prev = ang; ang = Math.max(F.up, ang - upW*H); const av = (ang - prev)/H;
    vy += grav*H; x += vx*H; y += vy*H;
    const c = Math.cos(ang), s = Math.sin(ang), dx = F.side*c, dy = s;
    let t = ((x-F.px)*dx + (y-F.py)*dy)/F.len; t = t<0?0:t>1?1:t;
    const qx = F.px+dx*F.len*t, qy = F.py+dy*F.len*t; let nx = x-qx, ny = y-qy; const R = b.r + F.r1 + (F.r2-F.r1)*t, d2 = nx*nx+ny*ny;
    if(d2 < R*R){
      let d = Math.sqrt(d2); if(d < 1e-4){ nx = 0; ny = -1; d = 1; } nx /= d; ny /= d; x = qx+nx*R; y = qy+ny*R;
      const w = F.side*av, cxp = x-nx*b.r-F.px, cyp = y-ny*b.r-F.py, rvx = vx+w*cyp, rvy = vy-w*cxp, vn = rvx*nx+rvy*ny;
      if(vn < 0){ const jn = -(1+T.FLIP_E)*vn, tx = -ny, ty = nx, vt = rvx*tx+rvy*ty, jt = Math.max(-T.FLIP_MU*jn, Math.min(T.FLIP_MU*jn, -vt)); vx += jn*nx+jt*tx; vy += jn*ny+jt*ty; if(av < -1) hit = true; }
    } else if(hit && ang <= F.up + 1e-6) break;
  }
  return { x, y, vx, vy, hit };
}
function miss(g, tx, ty, grav, kind){
  // ballistic flight up to height ty (side walls mirrored)
  const a = grav/2, bq = g.vy, c = g.y - ty, D = bq*bq - 4*a*c; if(D < 0) return 1e9;
  const t = (-bq - Math.sqrt(D))/(2*a); if(t <= 0) return 1e9;
  let x = g.x + g.vx*t; const lo = 20, hi = 340, span = hi-lo; x = ((x-lo) % (2*span) + 2*span) % (2*span); if(x > span) x = 2*span - x; x += lo;
  const sp = Math.hypot(g.vx, g.vy + grav*t);
  if(kind === 's' && sp > 1050) return 1e9; if(kind === 'e' && sp < 620) return 1e9;
  return Math.abs(x - tx);
}
function makeBot(o){
  const st = { hold:{L:0,R:0}, cool:{L:0,R:0}, pend:{L:-1,R:-1}, flips:0, aimed:0, lapses:0 };
  const press = k => { G.press[k] = true; st.hold[k] = .2; st.flips++; st.pend[k] = -1; };
  return function step(dt){
    const L = G.L, b = G.ball, grav = (G.grav||1000)*(G.gravMul||1), upW = T.FLIP_W*(1+.07*S.up.power)*(G.curses && G.curses.has('slow') ? .42 : 1), inv = !!(G.curses && G.curses.has('invert'));
    if(G.inPlunger && !b.rail && !b.held && Math.abs(b.vy) < 40) T.launch();
    const f = Math.max(0, Math.min(L.n-1, T.floorOf(b.y))), tg = targets(L, f);
    for(const k of ['L','R']){
      if(st.hold[k] > 0){ st.hold[k] -= dt; if(st.hold[k] <= 0){ G.press[k] = false; st.cool[k] = .12; } continue; }
      if(st.cool[k] > 0){ st.cool[k] -= dt; continue; }
      if(st.pend[k] >= 0){ st.pend[k] -= dt; if(st.pend[k] < 0) press(k); continue; }
      if(b.rail || b.held) continue;
      let fire = false, aimed = false;
      for(const F of L.flippers){
        if((((F.side > 0) !== inv) ? 'L' : 'R') !== k || F.frozen > 0) continue;
        const c = Math.cos(F.ang), s = Math.sin(F.ang), dx = F.side*c, dy = s, rx = b.x-F.px, ry = b.y-F.py, t = (rx*dx + ry*dy)/F.len, dist = Math.abs(rx*(-dy) + ry*dx);
        if(F.py - Y(F.f, 0) < 600) continue;   // only the main pair: the wall mini-flippers are not aimed
        if(t < -.1 || t > 1.25 || dist > 70 || b.y > F.py + 30) continue;
        const g = ghost(b, F, grav, upW); if(!g.hit || g.vy > -350) continue;
        let m = 1e9; for(const q of tg) m = Math.min(m, miss(g, q[0], q[1], grav, q[2]));
        if(m < o.tol){ fire = aimed = true; break; }
        // no aim solution: flip anyway before the ball rolls off the tip, or as a reflex on a fast ball
        if(dist < 30 && (t > .82 || (Math.hypot(b.vx,b.vy) > 520 && t > .25))) fire = true;
      }
      if(fire){
        // human model: now and then the flip is missed altogether, and it always comes a little late
        if(o.lapse && Math.random() < o.lapse){ st.cool[k] = .3; st.lapses++; continue; }
        if(aimed) st.aimed++; const d = o.jitter*(Math.random()+Math.random()-1) + (o.late||0)*(Math.random()+Math.random()); if(d > 0) st.pend[k] = d; else press(k); }
    }
    return st;
  };
}
function playOnce(pi, o){
  T.startPhase(pi); G.banner = null;
  const bot = makeBot(o), dt = 1/120, L = G.L, floorT = Array(L.n).fill(0); let t = 0, st, drains = 0, lastBalls = G.balls, maxF = 0;
  while(t < o.maxT){
    G.paused = false; st = bot(dt); T.update(dt); t += dt;
    if(G.balls < lastBalls){ drains += lastBalls - G.balls; lastBalls = G.balls; }
    if(G.mode !== 'play' || G.done) break;
    const f = Math.max(0, Math.min(L.n-1, T.floorOf(G.ball.y))); floorT[f] += dt; if(f > maxF) maxF = f;
  }
  G.press.L = G.press.R = false;
  return { win:!!G.done, fichas:G.fichasRun + Math.floor(G.score/T.SCORE_PER_FICHA), t, drains, maxF, floorT, score:G.score, discos:G.discos||0, flips:st.flips, aimed:st.aimed, searches:G.searches||0, bossHp: L.boss ? L.boss.hp : null };
}
const TTBot = {
  // human-like presets: wider aim, late and noisy timing, missed flips
  HUMAN:{ bom:{ tol:22, jitter:.025, late:.02, lapse:.03, seq:false }, medio:{ tol:30, jitter:.04, late:.035, lapse:.07, seq:false }, novato:{ tol:44, jitter:.06, late:.055, lapse:.14, seq:false } },
  noSeq:false,   // true: ignore the signature sequence and just climb (set by run({ seq:false }))
  targets, ghost, playOnce, makeBot, state:null,
  run(opt){
    const o = Object.assign({ phases:[...Array(50).keys()], trials:4, jitter:.02, tol:16, maxT:420, upgrades:null }, opt && opt.human ? TTBot.HUMAN[opt.human] : null, opt||{});
    TTBot.noSeq = o.seq === false;
    const keepUp = JSON.parse(JSON.stringify(S.up)), keepParts = S.parts.slice();
    const setUp = pi => { const era = Math.floor(pi/10); S.parts.length = 0; T.UPG.forEach(u => { S.up[u.id] = o.loadout === 'era' ? u.era.filter(e => e < era).length : o.upgrades ? (o.upgrades[u.id]||0) : 0; }); if(o.loadout === 'era' && era >= 3) S.parts.push('coin'); };
    const res = [], q = []; for(const pi of o.phases) for(let k = 0; k < o.trials; k++) q.push(pi);
    TTBot.state = { done:0, total:q.length, res };
    return new Promise(resolve => {
      const tick = () => {
        const t0 = performance.now();
        try { while(q.length && performance.now() - t0 < 900){ const pi = q.shift(); setUp(pi); G.searches = 0; const r = playOnce(pi, o); r.pi = pi; res.push(r); TTBot.state.done++; } }
        catch(e){ TTBot.state.error = String(e && e.stack || e); q.length = 0; }
        if(q.length) setTimeout(tick, 0);
        else { Object.assign(S.up, keepUp); S.parts.length = 0; S.parts.push(...keepParts); T.startPhase(0, true); TTBot.state.summary = TTBot.summary(res); TTBot.state.finished = true; resolve(TTBot.state.summary); }
      };
      tick();
    });
  },
  summary(res){
    const by = {}; for(const r of res) (by[r.pi] = by[r.pi] || []).push(r);
    const avg = xs => xs.length ? xs.reduce((p,c)=>p+c,0)/xs.length : 0;
    return Object.keys(by).map(pi => { const a = by[pi], w = a.filter(r => r.win);
      const ft = a[0].floorT.map((_, i) => Math.round(avg(a.map(r => r.floorT[i]))));
      return { fase:+pi+1, win:w.length+'/'+a.length, tWin:Math.round(avg(w.map(r => r.t))), drains:+avg(a.map(r => r.drains)).toFixed(1), maxF:+avg(a.map(r => r.maxF)).toFixed(1), floorT:ft.join(','), aimed:Math.round(100*avg(a.map(r => r.aimed/Math.max(1,r.flips)))), searches:+avg(a.map(r => r.searches)).toFixed(1), fichas:Math.round(avg(w.map(r => r.fichas))), score:Math.round(avg(w.map(r => r.score))), discos:+avg(a.map(r => r.discos)).toFixed(1), bossHp:a[0].bossHp === null ? '' : avg(a.map(r => r.bossHp)).toFixed(1) };
    });
  }
};
window.TTBot = TTBot;
})();
