(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = document.createElement('div');
  progress.className = 'site-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.prepend(progress);
  const progressBar = q('span', progress);
  let scrollTick = false;
  const updateScrollEffects = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    q('.nav')?.classList.toggle('nav-elevated', scrollY > 18);
    if (!reducedMotion && q('.detail-page .hero')) document.documentElement.style.setProperty('--hero-shift', `${Math.min(48, scrollY * .075)}px`);
    scrollTick = false;
  };
  addEventListener('scroll', () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(updateScrollEffects); } }, { passive: true });
  addEventListener('resize', updateScrollEffects, { passive: true });
  updateScrollEffects();

  const main = q('main');
  if (main && !main.id) main.id = 'main-content';
  if (main) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = `#${main.id || 'home'}`;
    skip.textContent = '跳到主要内容';
    document.body.prepend(skip);
  }

  qa('img').forEach((img, index) => {
    if (index > 1) img.loading = 'lazy';
    img.decoding = 'async';
    if (!img.alt) img.alt = '';
  });
  qa('a[target="_blank"]').forEach(link => link.rel = 'noopener noreferrer');

  const revealTargets = qa('.main > .series, .damingfu-group, .accessory-collection').filter(el => !el.classList.contains('js-reveal'));
  revealTargets.forEach(el => el.classList.add('js-reveal'));
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .08, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach(el => observer.observe(el));
  }

  const existingTop = q('.back-top');
  const topButton = existingTop || document.createElement('button');
  if (!existingTop) {
    topButton.className = 'enhanced-top';
    topButton.type = 'button';
    topButton.setAttribute('aria-label', '返回页面顶部');
    topButton.textContent = '↑';
    document.body.append(topButton);
    topButton.addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    addEventListener('scroll', () => topButton.classList.toggle('visible', scrollY > 650), { passive: true });
  }

  const nav = q('.nav');
  if (nav && !nav.getAttribute('aria-label')) nav.setAttribute('aria-label', '主导航');
  if (nav) {
    nav.classList.remove('nav-hidden');
    document.body.classList.add('persistent-navigation');
    if (!q('main#home')) document.body.classList.add('detail-page');
  }

  const hoverFine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const decorateCard = card => {
    if (card.dataset.fxReady) return;
    card.dataset.fxReady = 'true';
    card.classList.add('fx-card');
    if (hoverFine && !reducedMotion && card.matches('.model,.material-card,.honor,.case')) {
      card.classList.add('fx-tilt');
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        card.style.setProperty('--mx', `${x}px`); card.style.setProperty('--my', `${y}px`);
        card.style.setProperty('--rx', `${((y / rect.height) - .5) * -3.2}deg`);
        card.style.setProperty('--ry', `${((x / rect.width) - .5) * 3.2}deg`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    }
  };
  qa('.model,.material-card,.strength-card,.honor,.case').forEach(decorateCard);
  if ('MutationObserver' in window) new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (!(node instanceof Element)) return;
    if (node.matches('.model,.material-card,.strength-card,.honor,.case')) decorateCard(node);
    qa('.model,.material-card,.strength-card,.honor,.case', node).forEach(decorateCard);
  }))).observe(document.body, { childList: true, subtree: true });

  const staggerContainers = qa('.models,.material-grid');
  staggerContainers.forEach(container => qa('.model,.material-card', container).forEach((card, index) => card.style.setProperty('--stagger', `${Math.min(index, 9) * 45}ms`)));
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const staggerObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-staggered'); staggerObserver.unobserve(entry.target); }
    }), { threshold: .06, rootMargin: '0px 0px -4% 0px' });
    staggerContainers.forEach(container => { container.classList.add('js-stagger'); staggerObserver.observe(container); });
  }

  document.addEventListener('pointerdown', event => {
    const control = event.target.closest('.button,.back,.ask,.nav-contact,.material-tab,.material-filter');
    if (!control || reducedMotion) return;
    const rect = control.getBoundingClientRect(), ripple = document.createElement('span');
    ripple.className = 'fx-ripple'; ripple.style.left = `${event.clientX - rect.left}px`; ripple.style.top = `${event.clientY - rect.top}px`;
    control.append(ripple); ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  const mobileTrigger = q('.mobile-menu');
  const desktopLinks = q('.nav-links');
  if (mobileTrigger && desktopLinks) {
    mobileTrigger.setAttribute('role', 'button');
    mobileTrigger.setAttribute('aria-expanded', 'false');
    mobileTrigger.setAttribute('aria-controls', 'mobile-navigation');
    mobileTrigger.textContent = '菜单 +';
    const drawer = document.createElement('div');
    drawer.className = 'mobile-drawer';
    drawer.id = 'mobile-navigation';
    drawer.innerHTML = `<div class="mobile-drawer-backdrop"></div><div class="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="网站导航"><div class="mobile-drawer-head"><strong>骏升电梯</strong><button class="mobile-drawer-close" type="button" aria-label="关闭菜单">×</button></div><nav class="mobile-drawer-links">${desktopLinks.innerHTML}</nav></div>`;
    document.body.append(drawer);
    const close = () => {
      drawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
      mobileTrigger.setAttribute('aria-expanded', 'false');
      mobileTrigger.focus();
    };
    const open = event => {
      event.preventDefault();
      drawer.classList.add('open');
      document.body.classList.add('drawer-open');
      mobileTrigger.setAttribute('aria-expanded', 'true');
      q('.mobile-drawer-close', drawer).focus();
    };
    mobileTrigger.addEventListener('click', open);
    q('.mobile-drawer-close', drawer).addEventListener('click', close);
    q('.mobile-drawer-backdrop', drawer).addEventListener('click', close);
    qa('a', drawer).forEach(link => link.addEventListener('click', () => {
      drawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
      mobileTrigger.setAttribute('aria-expanded', 'false');
    }));
    addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  }

  const detailLinks = qa('.car-detail-link[href$=".jpg"], .car-detail-link[href$=".png"], .car-detail-link[href$=".webp"]');
  if (detailLinks.length) {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML = '<div class="image-viewer-bar"><div class="image-viewer-title"></div><div class="image-viewer-actions"><span class="image-viewer-counter"></span><a target="_blank" rel="noopener">打开原图</a><button type="button" aria-label="关闭图片预览">关闭 ×</button></div></div><div class="image-viewer-stage"><button class="image-viewer-nav image-viewer-prev" type="button" aria-label="上一张">‹</button><img alt=""><button class="image-viewer-nav image-viewer-next" type="button" aria-label="下一张">›</button><span class="image-viewer-hint">点击图片缩放 · 方向键切换</span></div>';
    document.body.append(viewer);
    const image = q('img', viewer);
    const title = q('.image-viewer-title', viewer);
    const original = q('a', viewer);
    const closeButton = q('button', viewer);
    const counter = q('.image-viewer-counter', viewer);
    const prevButton = q('.image-viewer-prev', viewer);
    const nextButton = q('.image-viewer-next', viewer);
    let sourceLink;
    let gallery = [], galleryIndex = 0;
    const collectGallery = link => {
      const scope = link.closest('.showcase-gallery,.models,.material-grid,.damingfu-group,.series') || document;
      gallery = qa('.car-detail-link[href$=".jpg"],.car-detail-link[href$=".png"],.car-detail-link[href$=".webp"]', scope);
      if (gallery.length < 2) gallery = qa('.car-detail-link[href$=".jpg"],.car-detail-link[href$=".png"],.car-detail-link[href$=".webp"]');
      if (!gallery.includes(link)) gallery = [link];
      galleryIndex = gallery.indexOf(link);
    };
    const showGalleryItem = index => {
      if (!gallery.length) return;
      galleryIndex = (index + gallery.length) % gallery.length;
      sourceLink = gallery[galleryIndex];
      const src = sourceLink.href;
      const label = sourceLink.getAttribute('title') || q('img', sourceLink)?.alt || '产品详情';
      image.style.opacity = '0'; viewer.classList.remove('zoomed');
      image.src = src; image.alt = label; title.textContent = label; original.href = src;
      counter.textContent = `${galleryIndex + 1} / ${gallery.length}`;
      prevButton.hidden = nextButton.hidden = gallery.length < 2;
      requestAnimationFrame(() => image.style.opacity = '1');
    };
    const close = () => {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('viewer-open');
      image.removeAttribute('src');
      viewer.classList.remove('zoomed');
      sourceLink?.focus();
    };
    document.addEventListener('click', event => {
      const link = event.target.closest('.car-detail-link[href$=".jpg"], .car-detail-link[href$=".png"], .car-detail-link[href$=".webp"]');
      if (!link) return;
      event.preventDefault();
      collectGallery(link);
      showGalleryItem(galleryIndex);
      viewer.classList.add('open');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('viewer-open');
      closeButton.focus();
    });
    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', event => { event.stopPropagation(); showGalleryItem(galleryIndex - 1); });
    nextButton.addEventListener('click', event => { event.stopPropagation(); showGalleryItem(galleryIndex + 1); });
    image.addEventListener('click', () => viewer.classList.toggle('zoomed'));
    q('.image-viewer-stage', viewer).addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
    addEventListener('keydown', event => { if (!viewer.classList.contains('open')) return; if (event.key === 'Escape') close(); if (event.key === 'ArrowLeft') showGalleryItem(galleryIndex - 1); if (event.key === 'ArrowRight') showGalleryItem(galleryIndex + 1); });
  }

  // Keep every in-page navigation target exactly below the fixed primary header.
  const primaryHeader = q('header.nav');
  const headerBottom = () => primaryHeader ? primaryHeader.getBoundingClientRect().bottom : 0;
  const correctAnchorPosition = target => {
    if (!target) return;
    const delta = target.getBoundingClientRect().top - headerBottom();
    if (Math.abs(delta) > .5) scrollBy({ top: delta, behavior: 'auto' });
  };
  const scrollToHashTarget = (target, smooth = true) => {
    if (!target) return;
    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + scrollY - headerBottom()));
    const useSmoothScroll = smooth && !reducedMotion;
    scrollTo({ top, behavior: useSmoothScroll ? 'smooth' : 'auto' });
    if (useSmoothScroll) {
      // The homepage header becomes shorter after scrolling; correct once that transition ends.
      addEventListener('scrollend', () => correctAnchorPosition(target), { once: true });
      setTimeout(() => correctAnchorPosition(target), 900);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => correctAnchorPosition(target)));
      // Also wait for compact-header and font/layout transitions on direct hash loads.
      setTimeout(() => correctAnchorPosition(target), 400);
      setTimeout(() => correctAnchorPosition(target), 1000);
    }
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    let target;
    try { target = q(decodeURIComponent(hash)); } catch { return; }
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    history.replaceState(null, '', hash);
    scrollToHashTarget(target, true);
  }, true);
  const alignInitialHash = () => {
    if (!location.hash) return;
    let target;
    try { target = q(decodeURIComponent(location.hash)); } catch { return; }
    if (target) requestAnimationFrame(() => scrollToHashTarget(target, false));
  };
  addEventListener('load', alignInitialHash, { once: true });
  addEventListener('hashchange', alignInitialHash);
})();
