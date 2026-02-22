import * as THREE from 'three';

export function createTextCanvas(text, subtext, dateStr = '2024 — 2025', width = 512, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, width, height);

    const maxWidth = width - 40; // slightly wider max wrapping width

    // Project name
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 72px Inter, sans-serif'; // Bigger font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap project name dynamically
    const nameLines = wrapText(ctx, text, maxWidth);

    // Adjust y-position based on number of lines for the name, to keep it somewhat centered
    let nameStartY = height * 0.28;
    if (nameLines.length > 1) {
        nameStartY = height * 0.22; // shift up if multi-line
    }

    nameLines.forEach((line, i) => {
        ctx.fillText(line, width / 2, nameStartY + i * 80);
    });

    // RIP
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText('R.I.P.', width / 2, height * 0.50);

    // Cause of death
    ctx.fillStyle = '#58a6ff';
    ctx.font = '36px Inter, sans-serif';
    const causeLines = wrapText(ctx, subtext, maxWidth);
    causeLines.forEach((line, i) => {
        ctx.fillText(line, width / 2, height * 0.65 + i * 44);
    });

    // Year
    ctx.fillStyle = '#484f58';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText(dateStr, width / 2, height * 0.88);

    return canvas;
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // max 2 lines
}

export function createTombstoneGroup(projectName, causeOfDeath, dateStr = '2024 — 2025', maxAnisotropy = 1) {
    const group = new THREE.Group();

    // Weathered stone materials
    const stoneColor = new THREE.Color('#8a8a95').offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
    const stoneMat = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.9, metalness: 0.03 });
    const darkStoneMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#5a5a65').offsetHSL(0, 0, (Math.random() - 0.5) * 0.04),
        roughness: 0.95, metalness: 0.02,
    });
    const recessedMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#6a6a75').offsetHSL(0, 0, (Math.random() - 0.5) * 0.03),
        roughness: 0.95, metalness: 0.02,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#7a7a88', roughness: 0.85, metalness: 0.05 });

    // === PEDESTAL (two stepped blocks) ===
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 1.4), darkStoneMat);
    step1.position.y = 0.15;
    step1.castShadow = true; step1.receiveShadow = true;
    group.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.25, 1.3), darkStoneMat);
    step2.position.y = 0.425;
    step2.castShadow = true; step2.receiveShadow = true;
    group.add(step2);

    // === MAIN BODY (rectangular slab) ===
    const bodyW = 2.3;
    const bodyH = 2.8;
    const bodyD = 0.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), stoneMat);
    body.position.set(0, 0.55 + bodyH / 2, 0);
    body.castShadow = true; body.receiveShadow = true;
    group.add(body);

    // === ARCHED TOP (half-cylinder) ===
    const archRadius = bodyW / 2;
    const archGeo = new THREE.CylinderGeometry(archRadius, archRadius, bodyD, 32, 1, false, 0, Math.PI);
    const arch = new THREE.Mesh(archGeo, stoneMat);
    // Rotate so the flat side faces down and the arch faces up
    arch.rotation.x = 0;
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 0.55 + bodyH, 0);
    arch.castShadow = true;
    group.add(arch);

    // === RECESSED FRONT PANEL (darker, slightly inset) ===
    // Rectangular part of the recess
    const panelW = bodyW - 0.35;
    const panelH = bodyH - 0.3;
    const recessPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), recessedMat);
    recessPanel.position.set(0, 0.55 + bodyH / 2 + 0.05, bodyD / 2 + 0.005);
    group.add(recessPanel);

    // Arched part of the recess (semi-circle)
    const recessArchRadius = panelW / 2;
    const recessArchGeo = new THREE.CircleGeometry(recessArchRadius, 32, 0, Math.PI);
    const recessArch = new THREE.Mesh(recessArchGeo, recessedMat);
    recessArch.rotation.z = 0;
    recessArch.position.set(0, 0.55 + bodyH - 0.1, bodyD / 2 + 0.005);
    group.add(recessArch);

    // === BORDER TRIM (raised edges around the recessed panel) ===
    const trimThick = 0.06;
    const trimDepth = 0.04;

    // Bottom trim
    const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(panelW + trimThick, trimThick, trimDepth), trimMat);
    bottomTrim.position.set(0, 0.55 + (bodyH - panelH) / 2 + 0.05, bodyD / 2 + 0.01);
    group.add(bottomTrim);

    // Left trim
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(trimThick, panelH, trimDepth), trimMat);
    leftTrim.position.set(-panelW / 2, 0.55 + bodyH / 2 + 0.05, bodyD / 2 + 0.01);
    group.add(leftTrim);

    // Right trim
    const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(trimThick, panelH, trimDepth), trimMat);
    rightTrim.position.set(panelW / 2, 0.55 + bodyH / 2 + 0.05, bodyD / 2 + 0.01);
    group.add(rightTrim);

    // Arch trim (torus slice for the curved top border)
    const archTrimGeo = new THREE.TorusGeometry(recessArchRadius, trimThick / 2, 8, 32, Math.PI);
    const archTrim = new THREE.Mesh(archTrimGeo, trimMat);
    archTrim.position.set(0, 0.55 + bodyH - 0.1, bodyD / 2 + 0.01);
    group.add(archTrim);

    // === CORNER ORNAMENTS (decorative blocks at trim corners) ===
    const ornamentGeo = new THREE.BoxGeometry(0.18, 0.18, trimDepth + 0.02);
    const ornPositions = [
        [-panelW / 2, 0.55 + bodyH - 0.25],
        [panelW / 2, 0.55 + bodyH - 0.25],
    ];
    ornPositions.forEach(([ox, oy]) => {
        const orn = new THREE.Mesh(ornamentGeo, trimMat);
        orn.position.set(ox, oy, bodyD / 2 + 0.01);
        orn.rotation.z = Math.PI / 4; // diamond shape
        group.add(orn);
    });

    // === TEXT FACE (clearly in front of everything) ===
    const textCanvas = createTextCanvas(projectName, causeOfDeath, dateStr);
    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.anisotropy = maxAnisotropy;
    const textGeo = new THREE.PlaneGeometry(1.7, 2.0);
    const textMat = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        depthWrite: false,
    });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(0, 2.3, bodyD / 2 + 0.02);
    group.add(textMesh);

    // === DIRT MOUND in front ===
    const moundGeo = new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const moundMat = new THREE.MeshStandardMaterial({ color: '#2a3025', roughness: 1.0 });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.scale.set(1, 0.25, 0.5);
    mound.position.set(0, 0, 0.9);
    mound.receiveShadow = true;
    group.add(mound);

    return group;
}
