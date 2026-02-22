import { showToast } from './toast.js';

export function setupExport(renderer, scene, camera) {
    const exportBtn = document.getElementById('exportBtn');

    exportBtn.addEventListener('click', () => {
        renderer.render(scene, camera);
        const link = document.createElement('a');
        link.download = 'project-graveyard.png';
        link.href = renderer.domElement.toDataURL('image/png');
        link.click();
        showToast('📸 Screenshot saved!');
    });
}
