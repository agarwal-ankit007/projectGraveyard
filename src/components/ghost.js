import * as THREE from 'three';

// Create a simple radial glow texture (bright center to transparent edge)
function createGlowTexture(r, g, b, size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
    gradient.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, 0.7)`);
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.08)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return canvas;
}

export function createGhostSpirit() {
    const ghost = new THREE.Group();

    // Outer glow — large, faint, blue-white
    const outerCanvas = createGlowTexture(160, 200, 255, 256);
    const outerTex = new THREE.CanvasTexture(outerCanvas);
    const outerMat = new THREE.SpriteMaterial({
        map: outerTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const outerSprite = new THREE.Sprite(outerMat);
    outerSprite.scale.set(4, 4, 1);
    outerSprite.position.y = 1.0;
    ghost.add(outerSprite);

    // Mid layer — brighter, smaller
    const midCanvas = createGlowTexture(180, 220, 255, 128);
    const midTex = new THREE.CanvasTexture(midCanvas);
    const midMat = new THREE.SpriteMaterial({
        map: midTex,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const midSprite = new THREE.Sprite(midMat);
    midSprite.scale.set(2.5, 3, 1);
    midSprite.position.y = 1.0;
    ghost.add(midSprite);

    // Core — bright white-cyan center
    const coreCanvas = createGlowTexture(230, 245, 255, 64);
    const coreTex = new THREE.CanvasTexture(coreCanvas);
    const coreMat = new THREE.SpriteMaterial({
        map: coreTex,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const coreSprite = new THREE.Sprite(coreMat);
    coreSprite.scale.set(1.2, 1.5, 1);
    coreSprite.position.y = 1.2;
    ghost.add(coreSprite);

    // Small orbiting wisps
    for (let i = 0; i < 3; i++) {
        const wispCanvas = createGlowTexture(200, 230, 255, 32);
        const wispTex = new THREE.CanvasTexture(wispCanvas);
        const wispMat = new THREE.SpriteMaterial({
            map: wispTex,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const wisp = new THREE.Sprite(wispMat);
        wisp.scale.set(0.5, 0.5, 1);
        wisp.userData.orbitOffset = (i / 3) * Math.PI * 2;
        wisp.userData.orbitRadius = 0.8 + Math.random() * 0.3;
        wisp.userData.orbitSpeed = 1.5 + Math.random() * 0.5;
        ghost.add(wisp);
    }

    // Ghost glow light — much brighter
    const ghostLight = new THREE.PointLight('#aaddff', 5, 10);
    ghostLight.position.set(0, 1.5, 0);
    ghost.userData.light = ghostLight;
    ghost.add(ghostLight);

    // Macro orbiting logic for the whole ghost grouping
    ghost.userData.macroOrbitOffset = Math.random() * Math.PI * 2;
    ghost.userData.macroOrbitRadius = 1.0 + Math.random() * 1.5;
    ghost.userData.macroOrbitSpeed = 0.4 + Math.random() * 0.4;
    // Direction: 1 or -1
    ghost.userData.orbitDirection = Math.random() > 0.5 ? 1 : -1;

    return ghost;
}

export function animateGhost(ghostSpirit, timeStr, gravePosition) {
    if (!ghostSpirit) return;
    const t = timeStr * 0.001;

    // Macro orbit targeting the grave position
    if (gravePosition) {
        const macroAngle = t * ghostSpirit.userData.macroOrbitSpeed * ghostSpirit.userData.orbitDirection + ghostSpirit.userData.macroOrbitOffset;
        const macroRadius = ghostSpirit.userData.macroOrbitRadius;

        // Add some wandering wobble to the orbit radius
        const wobbleRadius = macroRadius + Math.sin(t * 0.8 + ghostSpirit.userData.macroOrbitOffset) * 0.5;

        ghostSpirit.position.x = gravePosition.x + Math.cos(macroAngle) * wobbleRadius;
        ghostSpirit.position.z = gravePosition.z + Math.sin(macroAngle) * wobbleRadius;
        ghostSpirit.position.y = gravePosition.y + 2.5 + Math.sin(t * 1.5 + ghostSpirit.userData.macroOrbitOffset) * 0.4;
    } else {
        ghostSpirit.position.y = 2.5 + Math.sin(t * 1.5) * 0.4;
    }

    // Pulse outer glow
    const outerSprite = ghostSpirit.children[0];
    if (outerSprite && outerSprite.material) {
        outerSprite.material.opacity = 0.5 + Math.sin(t * 2) * 0.2;
    }

    // Pulse mid layer
    const midSprite = ghostSpirit.children[1];
    if (midSprite && midSprite.material) {
        midSprite.material.opacity = 0.7 + Math.sin(t * 2.5 + 0.5) * 0.2;
    }

    // Animate orbiting wisps
    for (let i = 3; i < 6; i++) {
        const child = ghostSpirit.children[i];
        if (child && child.userData.orbitOffset !== undefined) {
            const angle = t * child.userData.orbitSpeed + child.userData.orbitOffset;
            const r = child.userData.orbitRadius;
            child.position.set(
                Math.cos(angle) * r,
                1.5 + Math.sin(angle * 0.7) * 0.5,
                Math.sin(angle) * r
            );
            child.material.opacity = 0.5 + Math.sin(t * 3 + child.userData.orbitOffset) * 0.3;
        }
    }

    if (ghostSpirit.userData.light) {
        ghostSpirit.userData.light.intensity = 4 + Math.sin(t * 3) * 1.5;
    }
}
