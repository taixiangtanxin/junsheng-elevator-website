(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileExperience = matchMedia('(max-width: 800px)').matches;

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
    if (!mobileExperience && !reducedMotion && q('.detail-page .hero')) document.documentElement.style.setProperty('--hero-shift', `${Math.min(48, scrollY * .075)}px`);
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

  const mobileAssetUrl = raw => {
    if (!mobileExperience || !raw) return raw;
    try {
      const url = new URL(raw, location.href);
      const marker = '/assets/';
      if (url.origin !== location.origin || !url.pathname.includes(marker) || url.pathname.includes('/assets/mobile/')) return raw;
      url.pathname = url.pathname.replace(marker, '/assets/mobile/').replace(/\.(?:jpe?g|png|webp)$/i, '.webp');
      url.search = '';
      return url.href;
    } catch { return raw; }
  };
  if (mobileExperience) {
    const heroValue = document.body.style.getPropertyValue('--hero');
    const heroMatch = heroValue.match(/url\(["']?([^"')]+)["']?\)/i);
    if (heroMatch) {
      const mobileHero = mobileAssetUrl(heroMatch[1]);
      if (mobileHero !== heroMatch[1]) document.body.style.setProperty('--hero', `url("${mobileHero}")`);
    }
  }
  const optimizeImage = (img, index = 2) => {
    if (!(img instanceof HTMLImageElement) || img.dataset.mobileOptimized) return;
    img.dataset.mobileOptimized = 'true';
    if (mobileExperience) {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
      const originalSrc = img.getAttribute('src');
      const mobileSrc = mobileAssetUrl(originalSrc);
      if (mobileSrc && mobileSrc !== originalSrc) {
        img.dataset.originalSrc = originalSrc;
        img.src = mobileSrc;
        img.addEventListener('error', () => {
          if (!img.dataset.mobileFallback && img.dataset.originalSrc) {
            img.dataset.mobileFallback = 'true';
            img.src = img.dataset.originalSrc;
          }
        }, { once: true });
      }
    } else if (index > 1) img.loading = 'lazy';
    img.decoding = 'async';
    if (!img.alt) img.alt = '';
  };
  qa('img').forEach(optimizeImage);
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

  // Subtle, section-specific ambient backgrounds. Animation only runs near the viewport.
  const ambientTargets = new Set([
    ...qa('main#home > section'),
    ...qa('.detail-page > .hero, .detail-page > .cta'),
    ...qa('.detail-page .main > .series, .detail-page .damingfu-content > .series')
  ]);
  qa('.detail-page .main').forEach(container => { if (!q('.series', container)) ambientTargets.add(container); });
  const homeAmbients = { home: 'cinematic', about: 'mist', honors: 'aurora', cases: 'lines', products: 'blueprint', contact: 'halo' };
  const detailAmbients = ['mist', 'lines', 'aurora', 'blueprint'];
  [...ambientTargets].forEach((section, index) => {
    if (section.dataset.ambientReady) return;
    const semanticId = section.id || (section.matches('.hero') ? 'home' : section.matches('.cta') ? 'contact' : '');
    section.dataset.ambient = homeAmbients[semanticId] || detailAmbients[index % detailAmbients.length];
    section.dataset.ambientReady = 'true';
    section.classList.add('ambient-section');
    const scene = document.createElement('div');
    scene.className = 'ambient-scene';
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML = '<i></i><i></i><i></i>';
    section.prepend(scene);
  });
  if (reducedMotion || !('IntersectionObserver' in window)) {
    ambientTargets.forEach(section => section.classList.add('ambient-active'));
  } else {
    const ambientObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('ambient-active', entry.isIntersecting)), { rootMargin: '18% 0px', threshold: 0 });
    ambientTargets.forEach(section => ambientObserver.observe(section));
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
    if (node.matches('img')) optimizeImage(node);
    qa('img', node).forEach(optimizeImage);
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
    viewer.innerHTML = '<div class="image-viewer-bar"><div class="image-viewer-title"></div><div class="image-viewer-actions"><span class="image-viewer-counter"></span><a target="_blank" rel="noopener">打开原图</a><button type="button" aria-label="关闭图片预览">关闭 ×</button></div></div><div class="image-viewer-stage"><button class="image-viewer-nav image-viewer-prev" type="button" aria-label="上一张">‹</button><img alt=""><button class="image-viewer-nav image-viewer-next" type="button" aria-label="下一张">›</button><span class="image-viewer-hint">点击图片缩放 · 方向键切换</span><div class="image-viewer-status" role="status" aria-live="polite"><span class="image-viewer-spinner"></span><strong>高清图片加载中…</strong><small>已自动使用手机轻量图片，请稍候</small><button class="image-viewer-retry" type="button">重新加载</button></div></div>';
    document.body.append(viewer);
    const image = q('img', viewer);
    const title = q('.image-viewer-title', viewer);
    const original = q('a', viewer);
    const closeButton = q('button', viewer);
    const counter = q('.image-viewer-counter', viewer);
    const prevButton = q('.image-viewer-prev', viewer);
    const nextButton = q('.image-viewer-next', viewer);
    const stage = q('.image-viewer-stage', viewer);
    const statusText = q('.image-viewer-status strong', viewer);
    const statusNote = q('.image-viewer-status small', viewer);
    const retryButton = q('.image-viewer-retry', viewer);
    if (mobileExperience) q('.image-viewer-hint', viewer).textContent = '点击图片缩放 · 左右滑动切换';
    let sourceLink;
    let gallery = [], galleryIndex = 0;
    let loadSequence = 0, loadTimer = 0;
    let activePreferredSrc = '', activeOriginalSrc = '', activeLabel = '';
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
      const originalSrc = sourceLink.href;
      const src = mobileExperience ? mobileAssetUrl(originalSrc) : originalSrc;
      const label = sourceLink.getAttribute('title') || q('img', sourceLink)?.alt || '产品详情';
      image.style.opacity = '0'; viewer.classList.remove('zoomed');
      image.alt = label; title.textContent = label; original.href = originalSrc;
      counter.textContent = `${galleryIndex + 1} / ${gallery.length}`;
      prevButton.hidden = nextButton.hidden = gallery.length < 2;
      if (!mobileExperience) {
        image.src = src;
        requestAnimationFrame(() => image.style.opacity = '1');
        return;
      }
      activePreferredSrc = src; activeOriginalSrc = originalSrc; activeLabel = label;
      const sequence = ++loadSequence;
      clearTimeout(loadTimer);
      viewer.classList.remove('has-error'); viewer.classList.add('is-loading');
      statusText.textContent = '高清图片加载中…';
      statusNote.textContent = navigator.onLine ? '已自动使用手机轻量图片，请稍候' : '当前网络已断开，请检查网络连接';
      image.removeAttribute('src');
      const fail = () => {
        if (sequence !== loadSequence) return;
        clearTimeout(loadTimer);
        viewer.classList.remove('is-loading'); viewer.classList.add('has-error');
        statusText.textContent = navigator.onLine ? '图片暂时未能加载' : '当前网络已断开';
        statusNote.textContent = navigator.onLine ? '请点击重新加载，或稍后切换网络再试' : '恢复网络后点击重新加载';
      };
      const attempt = (candidate, allowOriginalFallback) => {
        const loader = new Image();
        loader.decoding = 'async';
        loadTimer = setTimeout(fail, 12000);
        loader.onload = async () => {
          if (sequence !== loadSequence) return;
          clearTimeout(loadTimer);
          image.src = candidate;
          try { await image.decode(); } catch {}
          if (sequence !== loadSequence) return;
          viewer.classList.remove('is-loading', 'has-error');
          image.style.opacity = '1';
          const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          if (gallery.length > 1 && !connection?.saveData && connection?.effectiveType !== '2g') {
            const nextLink = gallery[(galleryIndex + 1) % gallery.length];
            const prefetch = new Image(); prefetch.decoding = 'async'; prefetch.src = mobileAssetUrl(nextLink.href);
          }
        };
        loader.onerror = () => {
          clearTimeout(loadTimer);
          if (sequence !== loadSequence) return;
          if (allowOriginalFallback && candidate !== originalSrc) attempt(originalSrc, false); else fail();
        };
        loader.src = candidate;
      };
      attempt(src, true);
    };
    const close = () => {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('viewer-open');
      ++loadSequence; clearTimeout(loadTimer);
      image.removeAttribute('src');
      viewer.classList.remove('zoomed', 'is-loading', 'has-error');
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
    retryButton.addEventListener('click', event => { event.stopPropagation(); if (sourceLink) showGalleryItem(galleryIndex); });
    image.addEventListener('click', () => viewer.classList.toggle('zoomed'));
    stage.addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
    if (mobileExperience) {
      let touchX = 0, touchY = 0;
      stage.addEventListener('touchstart', event => { const touch = event.changedTouches[0]; touchX = touch.clientX; touchY = touch.clientY; }, { passive: true });
      stage.addEventListener('touchend', event => {
        if (viewer.classList.contains('zoomed') || gallery.length < 2) return;
        const touch = event.changedTouches[0], dx = touch.clientX - touchX, dy = touch.clientY - touchY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) showGalleryItem(galleryIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }
    addEventListener('keydown', event => { if (!viewer.classList.contains('open')) return; if (event.key === 'Escape') close(); if (event.key === 'ArrowLeft') showGalleryItem(galleryIndex - 1); if (event.key === 'ArrowRight') showGalleryItem(galleryIndex + 1); });
  }

  if (mobileExperience && 'IntersectionObserver' in window) {
    const logoShowcase = q('.project-logo-showcase');
    if (logoShowcase) new IntersectionObserver(([entry]) => logoShowcase.classList.toggle('mobile-offscreen', !entry.isIntersecting), { rootMargin: '120px 0px' }).observe(logoShowcase);
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
    // Let the mobile menu trigger open its navigation drawer instead of following #contact.
    if (link.matches('.mobile-menu,[aria-controls="mobile-navigation"]')) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    let target;
    try { target = q(decodeURIComponent(hash)); } catch { return; }
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const openDrawer = link.closest('.mobile-drawer');
    if (openDrawer) {
      openDrawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
      q('.mobile-menu')?.setAttribute('aria-expanded', 'false');
    }
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
