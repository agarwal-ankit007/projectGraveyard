import * as THREE from 'three';
import { createTombstoneGroup } from '../components/tombstone.js';
import { showToast } from '../ui/toast.js';

export class GraveyardState {
    constructor(scene, controls, camera, maxAnisotropy = 1) {
        this.scene = scene;
        this.controls = controls;
        this.camera = camera;
        this.maxAnisotropy = maxAnisotropy;

        this.graves = [];
        this.causeStats = {};
        this.STORAGE_KEY = 'projectGraveyard_projects';

        // UI binds
        this.buriedCountEl = document.getElementById('buriedCount');
        this.topCauseEl = document.getElementById('topCause');
        this.sceneOverlay = document.getElementById('sceneOverlay');
    }

    loadFromLocalStorage() {
        const projects = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        if (projects.length > 0) {
            this.sceneOverlay.classList.add('hidden');
            projects.forEach(p => {
                const dateStr = p.dateStr || '2024 — 2025';
                const tomb = this._createTombstone(p.name, p.cause, dateStr);
                // Skip rise animation for restored projects
                tomb.position.y = 0;
                tomb.userData.rising = false;
            });
        }
    }

    saveToLocalStorage(name, cause, dateStr) {
        const projects = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        projects.push({ name, cause, dateStr, buriedAt: Date.now() });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }

    rebuildLocalStorage() {
        const projects = this.graves.map(g => ({
            name: g.userData.projectName,
            cause: g.userData.causeOfDeath,
            dateStr: g.userData.dateStr,
            buriedAt: Date.now(),
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }

    clearLocalStorage() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    buryProject(name, cause, dateStr) {
        this._createTombstone(name, cause, dateStr);
        this.saveToLocalStorage(name, cause, dateStr);

        if (this.graves.length === 1) {
            this.sceneOverlay.classList.add('hidden');
        }

        showToast(`🪦 ${name} has been laid to rest.`);
    }

    exhumeGrave(graveGroup) {
        const projectName = graveGroup.userData.projectName;
        const causeOfDeath = graveGroup.userData.causeOfDeath;

        // Remove from scene
        this.scene.remove(graveGroup);

        // Remove from graves array
        const idx = this.graves.indexOf(graveGroup);
        if (idx > -1) this.graves.splice(idx, 1);

        // Update cause stats
        if (this.causeStats[causeOfDeath]) {
            this.causeStats[causeOfDeath]--;
            if (this.causeStats[causeOfDeath] <= 0) delete this.causeStats[causeOfDeath];
        }
        this.updateStats();

        this.rebuildLocalStorage();

        // Show overlay if empty
        if (this.graves.length === 0) {
            this.sceneOverlay.classList.remove('hidden');
        }

        showToast(`👻 ${projectName} has risen from the grave!`);
    }

    clearAll() {
        if (this.graves.length === 0) {
            showToast('The graveyard is already empty!');
            return;
        }

        this.graves.forEach(g => this.scene.remove(g));
        this.graves.length = 0;

        for (const key of Object.keys(this.causeStats)) delete this.causeStats[key];
        this.updateStats();

        this.clearLocalStorage();

        this.sceneOverlay.classList.remove('hidden');
        showToast('💀 All projects have been exhumed!');
    }

    updateStats() {
        if (!this.buriedCountEl || !this.topCauseEl) return;

        this.buriedCountEl.textContent = this.graves.length;

        let topCause = '—';
        let topCount = 0;
        for (const [cause, count] of Object.entries(this.causeStats)) {
            if (count > topCount) {
                topCount = count;
                topCause = cause.length > 12 ? cause.slice(0, 12) + '…' : cause;
            }
        }
        this.topCauseEl.textContent = topCause;
    }

    updateAnimations() {
        for (const grave of this.graves) {
            if (grave.userData.rising) {
                grave.position.y += (grave.userData.targetY - grave.position.y) * 0.06;
                if (Math.abs(grave.position.y - grave.userData.targetY) < 0.01) {
                    grave.position.y = grave.userData.targetY;
                    grave.userData.rising = false;
                }
            }
        }
    }

    _createTombstone(projectName, causeOfDeath, dateStr) {
        const group = createTombstoneGroup(projectName, causeOfDeath, dateStr, this.maxAnisotropy);

        // Position in layout grid
        const idx = this.graves.length;
        const cols = 4;
        const spacingX = 5;
        const spacingZ = 5.5;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const offsetX = -(cols - 1) * spacingX / 2;
        const offsetZ = -2;

        group.position.set(
            offsetX + col * spacingX + (Math.random() - 0.5) * 0.8,
            0,
            offsetZ + row * spacingZ + (Math.random() - 0.5) * 0.6
        );

        // Random rotation
        group.rotation.y = (Math.random() - 0.5) * 0.15;

        // Animate from ground
        group.position.y = -4;
        group.userData.targetY = 0;
        group.userData.rising = true;

        group.userData.projectName = projectName;
        group.userData.causeOfDeath = causeOfDeath;
        group.userData.dateStr = dateStr;

        this.scene.add(group);
        this.graves.push(group);

        this.causeStats[causeOfDeath] = (this.causeStats[causeOfDeath] || 0) + 1;
        this.updateStats();

        // Adjust camera target
        const centerZ = row * spacingZ / 2 - 1;
        this.controls.target.lerp(new THREE.Vector3(0, 0, Math.max(0, centerZ)), 0.3);

        return group;
    }
}
