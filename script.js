/* Lightweight interactive effects:
   - Canvas particle background with mouse parallax
   - Button ripple effect (.ripple)
   - Project modal population & keyboard accessible
   - Theme toggle
   - Smooth scrolling & small accessibility helpers
*/

// ---------- Helper: DOM ready ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  initCanvasBackground();
  initRipples();
  initProjectModal();
  initThemeToggle();
  initSmoothScroll();
});

/* ---------- Canvas background (particles) ---------- */
function initCanvasBackground(){
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [], mouse = {x:-9999,y:-9999};

  function resize(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });

  class P {
    constructor(){
      this.reset();
    }
    reset(){
      this.x = Math.random()*w;
      this.y = Math.random()*h;
      this.vx = (Math.random()-0.5)*0.3;
      this.vy = (Math.random()-0.5)*0.3;
      this.r = 0.8 + Math.random()*2.2;
      this.alpha = 0.2 + Math.random()*0.6;
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      // wrap
      if(this.x < -10) this.x = w+10;
      if(this.x > w+10) this.x = -10;
      if(this.y < -10) this.y = h+10;
      if(this.y > h+10) this.y = -10;

      // small attraction to mouse
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d2 = dx*dx + dy*dy;
      if(mouse.x >= 0 && d2 < 120000){
        this.vx += (dx / Math.sqrt(d2)) * 0.0008;
        this.vy += (dy / Math.sqrt(d2)) * 0.0008;
      }
    }
    draw(){
      ctx.beginPath();
      ctx.fillStyle = `rgba(110,231,183,${this.alpha})`;
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function initParticles(n=120){
    particles = [];
    for(let i=0;i<n;i++) particles.push(new P());
  }

  function anim(){
    ctx.clearRect(0,0,w,h);
    // subtle gradient overlay
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'rgba(7,20,34,0.08)');
    g.addColorStop(1,'rgba(3,10,18,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // draw particles
    particles.forEach(p => { p.step(); p.draw(); });

    // draw lines between close particles
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < 12000){
          ctx.beginPath();
          ctx.strokeStyle = `rgba(110,231,183,${0.06})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(anim);
  }

  resize();
  initParticles(Math.min(160, Math.floor((innerWidth*innerHeight)/60000)));
  anim();
}

/* ---------- Ripple effect for buttons ---------- */
function initRipples(){
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.style.position = 'relative';
    btn.addEventListener('click', function(e){
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const d = Math.max(rect.width, rect.height) * 1.4;
      circle.style.width = circle.style.height = d + 'px';
      circle.style.left = (e.clientX - rect.left - d/2) + 'px';
      circle.style.top = (e.clientY - rect.top - d/2) + 'px';
      circle.className = 'ripple-circle';
      circle.style.background = getComputedStyle(btn).getPropertyValue('--ripple-color') || 'rgba(255,255,255,0.12)';
      btn.appendChild(circle);
      setTimeout(()=> {
        circle.remove();
      }, 600);
    });
  });
  // add ripple styles
  const style = document.createElement('style');
  style.textContent = `
    .ripple-circle{position:absolute;border-radius:50%;transform:scale(0);animation:ripple-anim .6s linear;pointer-events:none;opacity:0.95}
    @keyframes ripple-anim{to{transform:scale(1);opacity:0}}
  `;
  document.head.appendChild(style);
}

/* ---------- Project modal ---------- */
function initProjectModal(){
  const modal = document.getElementById('proj-modal');
  const panel = modal.querySelector('.modal-panel');
  const title = document.getElementById('proj-title');
  const tech = document.getElementById('proj-tech');
  const desc = document.getElementById('proj-desc');
  const repo = document.getElementById('proj-repo');
  const closeBtn = modal.querySelector('.modal-close');

  document.querySelectorAll('.proj-card').forEach(card => {
    card.querySelector('.view-btn').addEventListener('click', () => open(card));
    // allow clicking whole card
    card.addEventListener('click', (e)=>{
      if(e.target.closest('.view-btn')) return;
      open(card);
    });
  });

  function open(card){
    const data = JSON.parse(card.getAttribute('data-proj'));
    title.textContent = data.title;
    tech.textContent = data.tech || '';
    desc.textContent = data.desc || '';
    repo.href = data.repo || '#';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    // trap focus on panel
    panel.focus();
  }

  function close(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  }

  closeBtn.addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && modal.classList.contains('show')) close();
  });
}

/* ---------- Theme toggle ---------- */
function initThemeToggle(){
  const btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
  });
}

/* ---------- Smooth scroll for internal links ---------- */
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const href = a.getAttribute('href');
      if(href === '#') return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth', block:'start'});
        el.focus({preventScroll:true});
      }
    });
  });
}

