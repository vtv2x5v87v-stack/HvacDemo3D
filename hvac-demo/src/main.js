import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { ParticleHVAC } from './ParticleHVAC.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 14); // 相机稍微拉远一点，看清全貌
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
gridHelper.position.y = -2;
scene.add(gridHelper);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const hvacSystem = new ParticleHVAC(scene);

// --- 后期处理 ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 0.07;
bloomPass.radius = 0.5;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- GUI 控制 ---
const gui = new dat.GUI();

// 1. 基础控制
const folderBase = gui.addFolder('HVAC 基础控制');
folderBase.add(hvacSystem.params, 'evaporatorOn').name('AC (蒸发器)');
folderBase.add(hvacSystem.params, 'heaterOn').name('PTC (暖芯)');
folderBase.add(hvacSystem.params, 'blendDoor', 0, 1).name('温度风门').step(0.01).listen();
folderBase.add(hvacSystem.params, 'airSpeed', 0, 0.2).name('风速');
folderBase.open();

// 2. 出风模式控制 (新增)
const folderMode = gui.addFolder('出风模式 (Distribution)');
folderMode.add(hvacSystem.params, 'modeDefrost').name('吹窗 (Defrost)').listen();
folderMode.add(hvacSystem.params, 'modeFace').name('吹面 (Face)').listen();
folderMode.add(hvacSystem.params, 'modeFoot').name('吹脚 (Foot)').listen();
folderMode.open();

// 3. 特效控制
const folderFX = gui.addFolder('视觉特效');
folderFX.add(bloomPass, 'strength', 0, 1).name('发光强度');

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (hvacSystem) {
        hvacSystem.update();
    }

    composer.render();
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});