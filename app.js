const projects = {
  orbital: {
    title: 'Orbital',
    description: 'Lab에서 볼 수 있는 3D 실험입니다. 곡선을 반복해 만든 형태가 회전하며, 포인터를 움직이면 보는 각도가 부드럽게 달라집니다.'
  },
  form: {
    title: 'Form Index',
    description: '타이포그래피와 반복되는 도형으로 시각적 질서를 만드는 예시입니다. 원 안의 선 간격과 기울기로 움직임을 표현했습니다.'
  }
};

const dialog = document.querySelector('#project-dialog');
const projectLabLink = dialog.querySelector('.project-lab-link');
projectLabLink.addEventListener('click', () => dialog.close());
for (const button of document.querySelectorAll('[data-project]')) {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    dialog.querySelector('#project-title').textContent = project.title;
    dialog.querySelector('#project-description').textContent = project.description;
    projectLabLink.hidden = button.dataset.project !== 'orbital';
    dialog.showModal();
  });
}

const canvas = document.querySelector('#orbital');
const sceneElement = canvas.parentElement;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

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
  const dark = new THREE.Color('#9290fb');

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
    motionToggle.textContent = paused ? '움직임 재생' : '움직임 멈추기';
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

startScene().catch(() => {
  sceneElement.classList.remove('ready');
});
