import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { inject } from '@vercel/analytics';

import { setupSceneEnvironment, updateEnvironment } from './scene/setup.js';
import { createParticles, updateParticles } from './scene/particles.js';
import { GraveyardState } from './features/graveyard.js';
import { animateGhost, createGhostSpirit } from './components/ghost.js';
import { setupWaitlist } from './features/waitlist.js';
import { setupExport } from './ui/export.js';
import { showToast } from './ui/toast.js';

// Initialize Vercel Analytics
inject();

// --- DOM ---
const container = document.getElementById('canvas-container');
const nameInput = document.getElementById('projectName');
const causeSelect = document.getElementById('causeOfDeath');
const customCauseGroup = document.getElementById('customCauseGroup');
const customCauseInput = document.getElementById('customCause');
const buryBtn = document.getElementById('buryBtn');
const clearBtn = document.getElementById('clearBtn');
const ghostTooltip = document.getElementById('ghostTooltip');
const ghostNameEl = ghostTooltip.querySelector('.ghost-name');
const ghostRemoveBtn = ghostTooltip.querySelector('.ghost-remove-btn');

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a0e14');
scene.fog = new THREE.FogExp2('#0a0e14', 0.018);

const aspect = container.clientWidth / container.clientHeight;
const d = 12;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
camera.position.set(20, 18, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 5;
controls.maxDistance = 60;
controls.target.set(0, 0, 0);
controls.enablePan = true;

// --- Initialize Subsystems ---
const envProps = setupSceneEnvironment(scene);
const particleData = createParticles(scene);
const graveyard = new GraveyardState(scene, controls, camera, renderer.capabilities.getMaxAnisotropy());
setupWaitlist();
setupExport(renderer, scene, camera);

// --- Window Resize ---
window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const a = w / h;
    renderer.setSize(w, h);
    camera.left = -d * a;
    camera.right = d * a;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
});

// --- UI Interaction ---
causeSelect.addEventListener('change', () => {
    if (causeSelect.value === 'Custom') {
        customCauseGroup.classList.remove('hidden');
        customCauseInput.focus();
    } else {
        customCauseGroup.classList.add('hidden');
    }
});

const handleBury = () => {
    const name = nameInput.value.trim();
    if (!name) {
        nameInput.classList.add('shake');
        setTimeout(() => nameInput.classList.remove('shake'), 500);
        showToast('💀 Give the dead project a name first!');
        return;
    }

    let cause = causeSelect.value;
    if (cause === 'Custom') cause = customCauseInput.value.trim() || 'Unknown causes';

    const bornYear = document.getElementById('bornYear').value || '2024';
    const diedYear = document.getElementById('diedYear').value || '2025';
    graveyard.buryProject(name, cause, `${bornYear} — ${diedYear}`);

    nameInput.value = '';
    customCauseInput.value = '';
    nameInput.focus();
};

buryBtn.addEventListener('click', handleBury);
nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleBury();
});

clearBtn.addEventListener('click', () => graveyard.clearAll());

// --- Ghost Raycaster & Tooltip ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredGrave = null;
let ghostSpirit = null;
let hideTimeout = null;

function showGhost(graveGroup) {
    if (hideTimeout) clearTimeout(hideTimeout), hideTimeout = null;
    if (ghostSpirit) scene.remove(ghostSpirit);

    ghostSpirit = createGhostSpirit();
    ghostSpirit.position.copy(graveGroup.position);
    ghostSpirit.position.y = 5;
    scene.add(ghostSpirit);

    hoveredGrave = graveGroup;
    updateTooltipPosition();
    ghostNameEl.textContent = `👻 ${graveGroup.userData.projectName || 'Unknown'}`;
    ghostTooltip.classList.remove('hidden');
}

function updateTooltipPosition() {
    if (!hoveredGrave) return;
    const worldPos = new THREE.Vector3().copy(hoveredGrave.position);
    worldPos.x += 3;
    worldPos.y = 5.5;
    worldPos.project(camera);

    const rect = container.getBoundingClientRect();
    const x = (worldPos.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-worldPos.y * 0.5 + 0.5) * rect.height + rect.top;
    ghostTooltip.style.left = x + 'px';
    ghostTooltip.style.top = y + 'px';
}

function hideGhost() {
    if (ghostSpirit) scene.remove(ghostSpirit), ghostSpirit = null;
    hoveredGrave = null;
    ghostTooltip.classList.add('hidden');
}

const scheduleHide = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        if (!ghostTooltip.matches(':hover')) hideGhost();
    }, 300);
};

container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const graveMeshes = [];
    graveyard.graves.forEach(g => {
        g.traverse(child => {
            if (child.isMesh) {
                child.userData.parentGrave = g;
                graveMeshes.push(child);
            }
        });
    });

    const intersects = raycaster.intersectObjects(graveMeshes, false);
    if (intersects.length > 0) {
        const hitGrave = intersects[0].object.userData.parentGrave;
        if (hitGrave && hitGrave !== hoveredGrave) showGhost(hitGrave);
        if (hideTimeout) clearTimeout(hideTimeout), hideTimeout = null;
    } else {
        scheduleHide();
    }
});

ghostTooltip.addEventListener('mouseenter', () => {
    if (hideTimeout) clearTimeout(hideTimeout), hideTimeout = null;
    ghostTooltip.classList.remove('hidden');
});
ghostTooltip.addEventListener('mouseleave', scheduleHide);

ghostRemoveBtn.addEventListener('click', () => {
    if (!hoveredGrave) return;
    graveyard.exhumeGrave(hoveredGrave);
    hideGhost();
});

// --- Boot & Render Loop ---
graveyard.loadFromLocalStorage();

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const timeStr = performance.now();

    controls.update();
    graveyard.updateAnimations();
    updateEnvironment(envProps, timeStr);
    updateParticles(particleData, delta, Math.floor(timeStr / 1000));
    animateGhost(ghostSpirit, timeStr);

    if (hoveredGrave) updateTooltipPosition();
    renderer.render(scene, camera);
}
animate();
