import { portfolio } from './content.js?v=1';

const { identity, profile, services, lab, contact } = portfolio;

function element(tag, text, className) {
  const result = document.createElement(tag);
  if (text) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function link(text, href) {
  const result = element('a', text);
  result.href = href;
  return result;
}

function listSection(title, items) {
  const section = element('section');
  const list = element('ul', null, 'text-list');
  for (const item of items) list.append(element('li', item));
  section.append(element('h3', title, 'label'), list);
  return section;
}

function displayItems(items) {
  return items.map((item) => typeof item === 'string' ? item : item.name).filter(Boolean);
}

const projects = portfolio.projects
  .filter((project) => project.published)
  .sort((first, second) => first.order - second.order);
const projectsById = new Map(projects.map((project) => [project.id, project]));
const placeholderStyles = ['portrait', 'landscape', 'square', 'detail', 'editorial', 'motion-still'];

function projectMedia(project) {
  const images = project.images.filter((image) => image.src);
  if (project.coverImage?.src) {
    return [project.coverImage, ...images.filter((image) => image.src !== project.coverImage.src)];
  }
  if (images.length) return images;
  if (project.id === 'orbital') {
    return [
      { caption: 'Overview', format: 'square' },
      { caption: 'Vertical still', format: 'editorial' },
      { caption: 'Motion still', format: 'motion-still' },
      { caption: 'Detail', format: 'detail' },
      { caption: 'Process', format: 'landscape' }
    ];
  }
  return [
    { caption: 'Cover', format: placeholderStyles[(project.order - 1) % placeholderStyles.length] },
    { caption: 'Overview', format: 'landscape' },
    { caption: 'Detail', format: 'detail' },
    { caption: 'Process', format: 'square' },
    { caption: 'Additional view', format: 'editorial' }
  ];
}

function mediaFrame(media, detail = false) {
  const frame = element('span', null, 'tile-art ' + (media.format || 'landscape'));
  if (!media.src || (!detail && media.type === 'video' && !media.poster)) return frame;

  const isVideo = detail && media.type === 'video';
  const asset = element(isVideo ? 'video' : 'img');
  if (isVideo) {
    asset.controls = true;
    asset.preload = 'none';
    if (media.poster) asset.poster = media.poster;
    if (media.alt) asset.setAttribute('aria-label', media.alt);
  } else {
    asset.alt = detail ? (media.alt || '') : '';
    asset.loading = 'lazy';
  }
  asset.addEventListener('error', () => asset.remove(), { once: true });
  asset.src = !detail && media.type === 'video' ? media.poster : media.src;
  frame.append(asset);
  return frame;
}

const dialog = document.querySelector('#project-dialog');
const projectLink = dialog?.querySelector('.project-lab-link');
const projectGallery = dialog?.querySelector('.detail-gallery');

projectLink?.addEventListener('click', () => {
  if (projectLink.getAttribute('href').startsWith('#')) dialog.close();
});
dialog?.addEventListener('close', () => {
  document.body.classList.remove('detail-open');
  for (const video of projectGallery.querySelectorAll('video')) video.pause();
});

function openProject(project) {
  const media = projectMedia(project);
  dialog.querySelector('#project-title').textContent = project.title;
  dialog.querySelector('#project-subtitle').textContent = project.subtitle;
  dialog.querySelector('#project-description').textContent = project.description;
  const metadata = [
    ['Category', project.category],
    ['Year', project.year],
    ['Role', displayItems(project.role).join(', ')],
    ['Institution', project.institution],
    ['Exhibition', project.exhibition],
    ['Collaboration', project.collaboration],
    ['Organization', project.organization],
    ['Tags', project.tags.join(', ')]
  ].filter(([, value]) => value);
  dialog.querySelector('.detail-meta').replaceChildren(...metadata.map(([name, value]) => {
    const row = element('div');
    row.append(element('dt', name), element('dd', value));
    return row;
  }));
  const detailLists = dialog.querySelector('.detail-lists');
  detailLists.replaceChildren();
  for (const [label, items] of [
    ['Credits', displayItems(project.credits)],
    ['Related works', project.relatedWorks],
    ['Selected productions', project.selectedProductions]
  ]) {
    if (items?.length) detailLists.append(listSection(label, items));
  }

  projectLink.hidden = !project.externalLink;
  if (project.externalLink) {
    projectLink.href = project.externalLink === '#lab' && !document.querySelector('#lab')
      ? './index.html#lab' : project.externalLink;
    projectLink.textContent = project.externalLink === '#lab' ? 'Explore in Lab' : 'Visit project';
  } else {
    projectLink.removeAttribute('href');
  }

  projectGallery.replaceChildren(...media.map((entry) => {
    const figure = element('figure');
    figure.append(mediaFrame(entry, true));
    if (entry.caption) figure.append(element('figcaption', entry.caption));
    return figure;
  }));

  dialog.showModal();
  document.body.classList.add('detail-open');
  dialog.scrollTop = 0;
}

function projectButton(project, label, className) {
  const button = element('button', label, className);
  button.type = 'button';
  button.dataset.project = project.id;
  button.setAttribute('aria-haspopup', 'dialog');
  button.addEventListener('click', () => openProject(project));
  return button;
}

function renderArchive() {
  const board = document.querySelector('#board');
  const index = document.querySelector('#work-index');
  const boardObserver = new ResizeObserver((entries) => {
    const layout = getComputedStyle(board);
    const rowHeight = parseFloat(layout.gridAutoRows);
    const gap = parseFloat(layout.columnGap);
    for (const { target, borderBoxSize } of entries) {
      const height = borderBoxSize[0].blockSize;
      if (height > 0) {
        const span = 'span ' + Math.ceil((height + gap) / rowHeight);
        if (target.style.gridRowEnd !== span) target.style.gridRowEnd = span;
      }
    }
  });

  for (const project of projects) {
    const group = element('section', null, 'work-group');
    const heading = element('header', null, 'group-heading');
    const title = element('h2', project.title);
    title.id = 'project-group-' + project.slug;
    group.setAttribute('aria-labelledby', title.id);
    heading.append(title, element('p', project.category, 'label'));

    const cover = projectMedia(project)[0];
    const tile = projectButton(project, null, 'tile');
    tile.setAttribute('aria-label', project.title + ' project details');
    tile.append(mediaFrame(cover), element('span', project.subtitle, 'tile-label'));
    group.append(heading, tile);
    board.append(group);
    boardObserver.observe(group);

    const row = element('li');
    const indexButton = projectButton(project, null, 'project');
    const plus = element('span', '+', 'plus');
    plus.setAttribute('aria-hidden', 'true');
    indexButton.append(element('strong', project.title), element('span', project.category), plus);
    row.append(indexButton);
    index.querySelector('.index').append(row);
  }

  const viewOptions = document.querySelector('.view-options');
  const viewButtons = [...viewOptions.querySelectorAll('button')];

  function selectView(showBoard) {
    board.hidden = !showBoard;
    index.hidden = showBoard;
    for (const [position, button] of viewButtons.entries()) {
      button.setAttribute('aria-pressed', String(position === (showBoard ? 0 : 1)));
    }
  }

  viewOptions.hidden = false;
  for (const [position, button] of viewButtons.entries()) {
    button.addEventListener('click', () => selectView(position === 0));
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === '#work-index') selectView(false);
  });
  selectView(location.hash !== '#work-index');
}

if (document.querySelector('#board')) renderArchive();

if (document.querySelector('#board')) document.title = identity.browserTitle;
document.querySelector('meta[name="description"]').content = identity.description;
document.querySelector('meta[name="keywords"]').content = identity.keywords.join(', ');
document.querySelector('.masthead .brand').textContent = identity.displayName;
document.querySelector('.masthead .brand').setAttribute('aria-label', identity.displayName + ' home');
if (dialog) dialog.querySelector('.brand').textContent = identity.displayName;
const boardNote = document.querySelector('.board-note');
if (boardNote) boardNote.textContent = identity.statement;
const emailLink = document.querySelector('.email-link');
emailLink.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const popup = window.open(emailLink.href, emailLink.target, 'popup,width=580,height=440');
  if (!popup) return;
  event.preventDefault();
  popup.focus();
});

const serviceList = document.querySelector('.service-list');
const serviceNav = document.querySelector('.service-nav');
for (const service of services) {
  const navigationItem = element('li');
  navigationItem.append(link(service.title, './services.html#' + service.id));
  serviceNav.append(navigationItem);
  if (!serviceList) continue;

  const row = element('li', null, 'content-stack');
  row.id = service.id;
  row.append(
    element('h3', service.title, 'service-name'),
    element('p', service.headline, 'content-lead'),
    element('p', service.description),
    listSection('Scope', service.scope)
  );
  if (service.institution) row.append(element('p', service.institution));
  if (service.courses.length) row.append(listSection('Courses', service.courses));

  const related = service.relatedProjects.map((id) => projectsById.get(id)).filter(Boolean);
  if (related.length) {
    const list = element('ul', null, 'text-list');
    for (const project of related) {
      const item = element('li');
      item.append(projectButton(project, project.title, 'text-button'));
      list.append(item);
    }
    row.append(element('h4', 'Related projects', 'label'), list);
  }
  serviceList.append(row);
}

function renderProfile(profileCopy) {
  profileCopy.append(
    element('h3', identity.publicName, 'content-lead'),
    element('p', identity.professionalTitle + ' · ' + identity.location, 'label'),
    ...profile.biography.map((paragraph) => element('p', paragraph)),
    element('p', identity.philosophy, 'content-lead'),
    listSection('Education', profile.education),
    listSection('Selected experience', profile.experience),
    listSection('Selected exhibitions', profile.exhibitions)
  );
  if (profile.portrait?.src) {
    profileCopy.prepend(mediaFrame(profile.portrait, true));
  }
  const profileLinks = element('div', null, 'section-links');
  for (const [label, url] of Object.entries(profile.links)) {
    if (url) profileLinks.append(link(label, url));
  }
  if (profileLinks.childElementCount) profileCopy.append(profileLinks);
}

const profileCopy = document.querySelector('.profile-copy');
if (profileCopy) renderProfile(profileCopy);

const contactCopy = document.querySelector('.contact-copy');
contactCopy?.append(element('p', contact.statement), link(contact.email, 'mailto:' + contact.email));

function renderLab() {
  document.querySelector('#lab-title').firstChild.textContent = lab.title;
  document.querySelector('.lab-intro').append(
    element('p', lab.subtitle, 'content-lead'),
    element('p', lab.description),
    element('p', 'Move your pointer to change the viewing angle.')
  );

  const studies = document.querySelector('.lab-studies');
  for (const study of lab.experiments.filter((entry) => entry.published).sort((a, b) => a.order - b.order)) {
    const article = element('article', null, 'content-stack');
    article.append(
      element('h3', study.title),
      element('p', study.category + ' · ' + study.status, 'label'),
      element('p', study.description)
    );
    if (study.materials.length) article.append(element('p', study.materials.join(', '), 'label'));
    if (study.externalLink) article.append(link(study.action || 'Launch Experiment', study.externalLink));
    studies.append(article);
  }
}

const labElement = document.querySelector('#lab');
if (labElement) renderLab();

const canvas = document.querySelector('#orbital');
const sceneElement = canvas?.parentElement;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

const masthead = document.querySelector('.masthead');
function updateMastheadBlend() {
  masthead.classList.toggle('is-scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', updateMastheadBlend, { passive: true });
updateMastheadBlend();

new ResizeObserver(() => {
  document.documentElement.style.setProperty('--masthead-height', masthead.offsetHeight + 'px');
}).observe(masthead);

async function startScene() {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  const sculpture = new THREE.Group();
  sculpture.rotation.set(0.6, -0.25, -0.42);
  scene.add(sculpture);

  const positions = [];
  const colors = [];
  const bright = new THREE.Color('#ffffff');
  const dark = new THREE.Color('#8a8a8a');

  for (let strand = 0; strand < 48; strand++) {
    const phase = strand / 48 * Math.PI * 2;
    const points = [];
    for (let sample = 0; sample <= 192; sample++) {
      const angle = sample / 192 * Math.PI * 2;
      const twist = phase + angle * 3;
      const thickness = 0.48 + 0.13 * Math.cos(angle * 3);
      const radius = 1.46 + thickness * Math.cos(twist);
      points.push([radius * Math.cos(angle), radius * Math.sin(angle), thickness * Math.sin(twist) + 0.24 * Math.sin(angle * 3)]);
    }
    const shade = bright.clone().lerp(dark, (1 + Math.cos(phase)) * 0.4);
    for (let index = 1; index < points.length; index++) {
      positions.push(...points[index - 1], ...points[index]);
      colors.push(shade.r, shade.g, shade.b, shade.r, shade.g, shade.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  sculpture.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.72
  })));

  function render() {
    renderer.render(scene, camera);
  }

  function resize() {
    const { clientWidth, clientHeight } = sceneElement;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.position.z = 7.8 * Math.max(1, 1 / camera.aspect);
    camera.updateProjectionMatrix();
    render();
  }

  let pointerX = 0;
  let pointerY = 0;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let paused = motionPreference.matches;
  const motionToggle = sceneElement.querySelector('.motion-toggle');

  function animate(time) {
    sculpture.rotation.x += (0.6 + pointerY * 0.4 - sculpture.rotation.x) * 0.05;
    sculpture.rotation.y += (-0.25 + pointerX * 0.5 - sculpture.rotation.y) * 0.05;
    if (lastTime) sculpture.rotation.z += Math.min(time - lastTime, 40) * 0.00023;
    lastTime = time;
    render();
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    motionToggle.textContent = paused ? 'Resume motion' : 'Pause motion';
    if (visible && !paused) frame = requestAnimationFrame(animate);
  }

  sceneElement.addEventListener('pointermove', (event) => {
    const bounds = sceneElement.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
  });
  sceneElement.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });
  new ResizeObserver(resize).observe(sceneElement);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateMotion();
  });
  observer.observe(sceneElement);
  motionToggle.hidden = false;
  motionToggle.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  motionPreference.addEventListener('change', (event) => {
    paused = event.matches;
    updateMotion();
  });
  resize();
  sceneElement.classList.add('ready');
}

if (sceneElement) {
  startScene().catch(() => sceneElement.classList.remove('ready'));
}

if (document.querySelector('#board')) {
  const previousPages = {
    '#services': './services.html',
    '#object-design': './services.html#object-design',
    '#web-interaction': './services.html#web-interaction',
    '#educator': './services.html#educator',
    '#info': './profile.html'
  };
  if (Object.hasOwn(previousPages, location.hash)) location.replace(previousPages[location.hash]);
}
