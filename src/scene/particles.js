import * as THREE from 'three';

export function createParticles(scene) {
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 50;
        particlePositions[i * 3 + 1] = Math.random() * 10 + 0.3;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        particleSpeeds[i] = Math.random() * 0.3 + 0.1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xaaccff,
        size: 0.12,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    return {
        mesh: particles,
        speeds: particleSpeeds,
        positions: particlePositions
    };
}

export function updateParticles(particleData, delta, timeStr) {
    if (!particleData) return;

    const { mesh, speeds, positions } = particleData;
    const count = speeds.length;

    for (let i = 0; i < count; i++) {
        // Drift upwards
        positions[i * 3 + 1] += speeds[i] * delta * 2;

        // Sway sideways (X and Z)
        positions[i * 3] += Math.sin(timeStr * 0.5 + i) * delta * 0.5;
        positions[i * 3 + 2] += Math.cos(timeStr * 0.3 + i) * delta * 0.5;

        // Reset if too high
        if (positions[i * 3 + 1] > 20) {
            positions[i * 3 + 1] = 0;
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
    }
    mesh.geometry.attributes.position.needsUpdate = true;
}
