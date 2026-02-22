import * as THREE from 'three';

export function setupSceneEnvironment(scene) {
    // ============================================
    // Lighting
    // ============================================

    // Ambient — very dim
    const ambient = new THREE.AmbientLight(0x334466, 3);
    scene.add(ambient);

    // Moonlight — blue directional
    const moonLight = new THREE.DirectionalLight(0x88aadd, 4);
    moonLight.position.set(-15, 25, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 80;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -30;
    moonLight.shadow.bias = -0.001;
    scene.add(moonLight);

    // Faint purple backfill
    const fillLight = new THREE.DirectionalLight(0xaa88dd, 1.5);
    fillLight.position.set(10, 10, 15);
    scene.add(fillLight);

    // Ground-level eerie green point light
    const eerieLight = new THREE.PointLight(0x44cc66, 1.5, 40, 2);
    eerieLight.position.set(0, 0.5, 0);
    scene.add(eerieLight);

    // ============================================
    // Ground — dark grassy terrain
    // ============================================
    const groundGeo = new THREE.PlaneGeometry(80, 80, 64, 64);
    const groundVerts = groundGeo.attributes.position;
    for (let i = 0; i < groundVerts.count; i++) {
        const x = groundVerts.getX(i);
        const y = groundVerts.getY(i);
        const z = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.15 +
            Math.sin(x * 0.8 + 1.3) * Math.cos(y * 0.6) * 0.08;
        groundVerts.setZ(i, z);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        color: '#2a3a28',
        roughness: 1.0,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Darker dirt patches
    for (let i = 0; i < 15; i++) {
        const patchGeo = new THREE.CircleGeometry(0.8 + Math.random() * 1.2, 12);
        const patchMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.08, 0.2, 0.1 + Math.random() * 0.04),
            roughness: 1.0,
        });
        const patch = new THREE.Mesh(patchGeo, patchMat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set((Math.random() - 0.5) * 30, 0.06, (Math.random() - 0.5) * 30);
        patch.receiveShadow = true;
        scene.add(patch);
    }

    // ============================================
    // Graveyard Environment props
    // ============================================

    const stoneMat = new THREE.MeshStandardMaterial({ color: '#4a4a55', roughness: 0.9, metalness: 0.05 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#333340', roughness: 0.95, metalness: 0.05 });
    const ironMat = new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.6, metalness: 0.4 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#3d2b1f', roughness: 0.95, metalness: 0.0 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.95, metalness: 0.0 });

    // --- External Functions attached via scoping ---
    const gateObj = createGate(scene, stoneMat, darkStoneMat, ironMat);
    createStonePath(scene);
    createFogLayers(scene);
    const lanterns = createLanterns(scene);
    createFences(scene, woodMat, darkWoodMat);
    createDeadTrees(scene);
    createRocks(scene);

    return {
        eerieLight,
        signPivot: gateObj.userData.signPivot,
        leftLantern: lanterns.left,
        rightLantern: lanterns.right
    };
}

export function updateEnvironment(envProps, timeStr) {
    if (!envProps) return;
    const { eerieLight, signPivot, leftLantern, rightLantern } = envProps;
    const elapsed = timeStr * 0.001;

    if (eerieLight) {
        eerieLight.intensity = 1.2 + Math.sin(elapsed * 1.5) * 0.3;
    }

    if (signPivot) {
        signPivot.rotation.z = 0.18 + Math.sin(elapsed * 0.8) * 0.04 + Math.sin(elapsed * 1.3) * 0.02;
    }

    if (leftLantern && leftLantern.userData.light) {
        leftLantern.userData.light.intensity = 1.5 + Math.sin(elapsed * 8.3) * 0.3 + Math.sin(elapsed * 13.7) * 0.15;
    }

    if (rightLantern && rightLantern.userData.light) {
        rightLantern.userData.light.intensity = 1.5 + Math.sin(elapsed * 7.1 + 1) * 0.3 + Math.sin(elapsed * 11.3) * 0.15;
    }
}

// -------------------------------------------------------------
// Helper sub-functions
// -------------------------------------------------------------

function createGate(scene, stoneMat, darkStoneMat, ironMat) {
    const gate = new THREE.Group();

    // Left pillar
    const pillarGeo = new THREE.BoxGeometry(1.2, 6, 1.2);
    const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
    leftPillar.position.set(-4, 3, 0);
    leftPillar.castShadow = true;
    gate.add(leftPillar);

    // Left pillar cap
    const capGeo = new THREE.BoxGeometry(1.5, 0.4, 1.5);
    const leftCap = new THREE.Mesh(capGeo, darkStoneMat);
    leftCap.position.set(-4, 6.2, 0);
    leftCap.castShadow = true;
    gate.add(leftCap);

    // Right pillar
    const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
    rightPillar.position.set(4, 3, 0);
    rightPillar.castShadow = true;
    gate.add(rightPillar);

    // Right pillar cap
    const rightCap = new THREE.Mesh(capGeo, darkStoneMat);
    rightCap.position.set(4, 6.2, 0);
    rightCap.castShadow = true;
    gate.add(rightCap);

    // Arch beam
    const archGeo = new THREE.BoxGeometry(9.6, 0.6, 0.8);
    const arch = new THREE.Mesh(archGeo, ironMat);
    arch.position.set(0, 6.5, 0);
    arch.castShadow = true;
    gate.add(arch);

    // Broken sign hanging from arch
    const signPivot = new THREE.Group();
    signPivot.position.set(2, 6.5, 1.5);

    const signBoardGeo = new THREE.BoxGeometry(5.5, 1.2, 0.12);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.8, metalness: 0.1 });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signBoard.position.set(-2.75, -1.2, 0);
    signBoard.castShadow = true;
    signPivot.add(signBoard);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signTextGeo = new THREE.PlaneGeometry(5.5, 1.2);
    const signTextMat = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, depthWrite: false });
    const signText = new THREE.Mesh(signTextGeo, signTextMat);
    signText.position.set(-2.75, -1.2, 0.07);
    signPivot.add(signText);

    // Explicitly load the font using the CSS Font Loading API
    // so the Canvas can use it immediately without waiting for a hidden DOM element
    const creepsterFont = new FontFace(
        'Creepster',
        'url(https://fonts.gstatic.com/s/creepster/v13/AlZy_zVUqJz4yMrniH4Rcn35.woff2)'
    );

    creepsterFont.load().then((font) => {
        document.fonts.add(font);
        sctx.clearRect(0, 0, 512, 128);
        sctx.fillStyle = '#c0c8b0';
        sctx.font = '48px Creepster, cursive';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('PROJECT GRAVEYARD', 256, 64);
        signTexture.needsUpdate = true;
    }).catch(err => {
        console.warn('Font failed to load for canvas', err);
        // Fallback draw
        sctx.clearRect(0, 0, 512, 128);
        sctx.fillStyle = '#c0c8b0';
        sctx.font = '48px sans-serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('PROJECT GRAVEYARD', 256, 64);
        signTexture.needsUpdate = true;
    });

    const chainGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    const chainMat = new THREE.MeshStandardMaterial({ color: '#3a3a40', roughness: 0.5, metalness: 0.6 });
    const rightChain = new THREE.Mesh(chainGeo, chainMat);
    rightChain.position.set(0, -0.3, 0);
    signPivot.add(rightChain);

    const brokenChainGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6);
    const brokenChain = new THREE.Mesh(brokenChainGeo, chainMat);
    brokenChain.position.set(-4, 6.2, 1.5);
    brokenChain.rotation.z = 0.3;
    gate.add(brokenChain);

    signPivot.rotation.z = 0.18;
    gate.add(signPivot);
    gate.userData.signPivot = signPivot;

    for (let i = -3; i <= 3; i++) {
        const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 5, 8);
        const bar = new THREE.Mesh(barGeo, ironMat);
        bar.position.set(i * 0.9, 2.5, 0);
        bar.castShadow = true;
        gate.add(bar);
    }

    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, 7, 8);
    const topRail = new THREE.Mesh(railGeo, ironMat);
    topRail.rotation.z = Math.PI / 2;
    topRail.position.set(0, 4.6, 0);
    gate.add(topRail);

    for (let i = -3; i <= 3; i++) {
        const tipGeo = new THREE.ConeGeometry(0.1, 0.4, 6);
        const tip = new THREE.Mesh(tipGeo, ironMat);
        tip.position.set(i * 0.9, 5.2, 0);
        tip.castShadow = true;
        gate.add(tip);
    }

    gate.position.set(0, 0, 18);
    scene.add(gate);

    // Create random scattered crosses near front
    const crossGeo = new THREE.BoxGeometry(0.15, 1.0, 0.08);
    const crossBarGeo = new THREE.BoxGeometry(0.7, 0.15, 0.08);
    const crossMat = new THREE.MeshStandardMaterial({ color: '#312319', roughness: 0.9 });

    const createCross = (x, z, s) => {
        const cg = new THREE.Group();
        const v = new THREE.Mesh(crossGeo, crossMat);
        v.position.y = 0.5;
        v.castShadow = true;
        cg.add(v);
        const h = new THREE.Mesh(crossBarGeo, crossMat);
        h.position.set(0, 0.7, 0);
        h.castShadow = true;
        cg.add(h);
        cg.position.set(x, 0, z);
        cg.scale.set(s, s, s);
        cg.rotation.y = (Math.random() - 0.5) * 0.5;
        cg.rotation.z = (Math.random() - 0.5) * 0.2;
        cg.rotation.x = (Math.random() - 0.5) * 0.1;
        scene.add(cg);
    };
    createCross(12, 8, 0.85);
    createCross(-10, 2, 0.6);

    return gate;
}

function createStonePath(scene) {
    const pathMat = new THREE.MeshStandardMaterial({ color: '#3a3a42', roughness: 0.9, metalness: 0.05 });
    for (let z = -5; z <= 16; z += 1.5) {
        const stoneGeo = new THREE.BoxGeometry(
            1.8 + Math.random() * 0.6,
            0.08,
            0.8 + Math.random() * 0.4
        );
        const stone = new THREE.Mesh(stoneGeo, pathMat);
        stone.position.set((Math.random() - 0.5) * 0.5, 0.08, z + (Math.random() - 0.5) * 0.3);
        stone.rotation.y = (Math.random() - 0.5) * 0.2;
        stone.receiveShadow = true;
        scene.add(stone);
    }
}

function createFogLayers(scene) {
    const fogLayers = [
        { y: 0.15, opacity: 0.08, size: 60, color: '#1a2a35' },
        { y: 0.4, opacity: 0.05, size: 45, color: '#1c2530' },
        { y: 0.8, opacity: 0.03, size: 35, color: '#182028' },
    ];
    fogLayers.forEach(cfg => {
        const fGeo = new THREE.PlaneGeometry(cfg.size, cfg.size);
        const fMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: cfg.opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const fMesh = new THREE.Mesh(fGeo, fMat);
        fMesh.rotation.x = -Math.PI / 2;
        fMesh.position.y = cfg.y;
        scene.add(fMesh);
    });
}

function createLanterns(scene) {
    const createLantern = (x, y, z) => {
        const lanternGroup = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        lanternGroup.add(body);

        const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: '#ff8833' });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        lanternGroup.add(glow);

        const light = new THREE.PointLight(0xff8833, 2, 12, 2);
        lanternGroup.add(light);
        lanternGroup.userData.light = light;

        lanternGroup.position.set(x, y, z);
        scene.add(lanternGroup);
        return lanternGroup;
    };
    const left = createLantern(-4, 6.8, 18);
    const right = createLantern(4, 6.8, 18);
    return { left, right };
}

function createFences(scene, woodMat, darkWoodMat) {
    const createFencePost = (x, z, rotY = 0, broken = false) => {
        const group = new THREE.Group();
        const height = broken ? 1.5 + Math.random() * 1 : 2.5 + Math.random() * 0.5;
        const tilt = broken ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.05;

        const postGeo = new THREE.BoxGeometry(0.25, height, 0.25);
        const post = new THREE.Mesh(postGeo, broken ? darkWoodMat : woodMat);
        post.position.y = height / 2;
        post.rotation.z = tilt;
        post.rotation.x = broken ? (Math.random() - 0.5) * 0.2 : 0;
        post.castShadow = true;
        post.receiveShadow = true;
        group.add(post);

        if (!broken) {
            const tipGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
            const tip = new THREE.Mesh(tipGeo, woodMat);
            tip.position.y = height + 0.2;
            tip.rotation.z = tilt;
            tip.castShadow = true;
            group.add(tip);
        }

        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        scene.add(group);
    };

    const createFenceRail = (x1, z1, x2, z2, y, broken = false) => {
        if (broken && Math.random() > 0.5) return;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        const railGeo = new THREE.BoxGeometry(length, 0.12, 0.08);
        const rail = new THREE.Mesh(railGeo, broken ? darkWoodMat : woodMat);
        rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        rail.rotation.y = Math.atan2(dz, dx);
        if (broken) {
            rail.rotation.z = (Math.random() - 0.5) * 0.3;
            rail.position.y += (Math.random() - 0.5) * 0.3;
        }
        rail.castShadow = true;
        scene.add(rail);
    };

    const fenceSpacing = 3;
    const fenceExtent = 15;

    // Left and right
    for (let z = -fenceExtent; z <= fenceExtent; z += fenceSpacing) {
        let broken = Math.random() > 0.5;
        createFencePost(-18, z, 0, broken);
        if (z < fenceExtent) {
            createFenceRail(-18, z, -18, z + fenceSpacing, 1.2, broken);
            createFenceRail(-18, z, -18, z + fenceSpacing, 2.0, broken);
        }
        broken = Math.random() > 0.5;
        createFencePost(18, z, 0, broken);
        if (z < fenceExtent) {
            createFenceRail(18, z, 18, z + fenceSpacing, 1.2, broken);
            createFenceRail(18, z, 18, z + fenceSpacing, 2.0, broken);
        }
    }

    // Back fence
    for (let x = -18; x <= 18; x += fenceSpacing) {
        let broken = Math.random() > 0.6;
        createFencePost(x, -18, Math.PI / 2, broken);
        if (x + fenceSpacing <= 18) {
            createFenceRail(x, -18, x + fenceSpacing, -18, 1.2, broken);
            createFenceRail(x, -18, x + fenceSpacing, -18, 2.0, broken);
        }
    }

    // Front fence (gap for gate)
    for (let x = -18; x <= 18; x += fenceSpacing) {
        if (Math.abs(x) < 5) continue;
        let broken = Math.random() > 0.4;
        createFencePost(x, 18, Math.PI / 2, broken);
        if (x + fenceSpacing <= 18 && Math.abs(x + fenceSpacing) >= 5) {
            createFenceRail(x, 18, x + fenceSpacing, 18, 1.2, broken);
            createFenceRail(x, 18, x + fenceSpacing, 18, 2.0, broken);
        }
    }
}

function createDeadTrees(scene) {
    const createDeadTree = (x, z, scale = 1) => {
        const tree = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 0.95 });

        const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.5 * scale, 5 * scale, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.5 * scale;
        trunk.castShadow = true;
        tree.add(trunk);

        const branchCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < branchCount; i++) {
            const bLen = (1.5 + Math.random() * 2.5) * scale;
            const bGeo = new THREE.CylinderGeometry(0.04 * scale, 0.12 * scale, bLen, 6);
            const branch = new THREE.Mesh(bGeo, trunkMat);

            const bHeight = (2 + Math.random() * 3) * scale;
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
            const tilt = 0.3 + Math.random() * 0.8;

            branch.position.set(
                Math.cos(angle) * bLen * 0.3, bHeight, Math.sin(angle) * bLen * 0.3
            );
            branch.rotation.z = Math.cos(angle) * tilt;
            branch.rotation.x = Math.sin(angle) * tilt;
            branch.castShadow = true;
            tree.add(branch);

            if (Math.random() > 0.4) {
                const twigLen = bLen * 0.5;
                const twigGeo = new THREE.CylinderGeometry(0.02 * scale, 0.05 * scale, twigLen, 4);
                const twig = new THREE.Mesh(twigGeo, trunkMat);
                twig.position.copy(branch.position);
                twig.position.y += bLen * 0.3;
                twig.position.x += Math.cos(angle + 0.5) * twigLen * 0.3;
                twig.rotation.z = Math.cos(angle + 1) * (tilt + 0.3);
                twig.rotation.x = Math.sin(angle + 1) * (tilt + 0.3);
                twig.castShadow = true;
                tree.add(twig);
            }
        }
        tree.position.set(x, 0, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        scene.add(tree);
    };

    createDeadTree(-14, -12, 1.2);
    createDeadTree(13, -8, 1.0);
    createDeadTree(-12, 10, 0.9);
    createDeadTree(15, 12, 1.1);
    createDeadTree(-8, -16, 0.7);
    createDeadTree(10, 16, 0.8);
}

function createRocks(scene) {
    const createRock = (x, z, scale = 1) => {
        const geo = new THREE.DodecahedronGeometry(0.5 * scale, 0);
        const verts = geo.attributes.position;
        for (let i = 0; i < verts.count; i++) {
            verts.setX(i, verts.getX(i) + (Math.random() - 0.5) * 0.15 * scale);
            verts.setY(i, verts.getY(i) * (0.6 + Math.random() * 0.4));
            verts.setZ(i, verts.getZ(i) + (Math.random() - 0.5) * 0.15 * scale);
        }
        geo.computeVertexNormals();
        const rockMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0, 0, 0.2 + Math.random() * 0.15),
            roughness: 0.9, metalness: 0.05
        });
        const rock = new THREE.Mesh(geo, rockMat);
        rock.position.set(x, 0.1 * scale, z);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    };

    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 15;
        const rs = 0.5 + Math.random() * 1.5;
        createRock(Math.cos(angle) * radius, Math.sin(angle) * radius, rs);
    }
}
