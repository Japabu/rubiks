import * as THREE from 'three';
import { Face, Rubiks } from './rubiks';

const rubiks = new Rubiks(2);

addControls();


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();

const canvasContainer = document.getElementById("canvasContainer");
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
canvasContainer.appendChild(renderer.domElement);

scene.add(rubiks);

camera.position.z = 5;

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    rubiks.rotation.x += 0.01;
    rubiks.rotation.y += 0.01;

    const delta = Math.min(clock.getDelta() * 1000, 100);
    rubiks.update(delta);
    renderer.render(scene, camera);
}

animate();

function addControls() {
    const container = document.getElementById("controlsContainer");
    const addBtn = (text, fn) => {
        const btn = document.createElement("button");
        btn.innerText = text;
        btn.addEventListener("click", () => fn());
        container.appendChild(btn);
    }
    addBtn("R", () => rubiks.rot(Face.Right, 0));
    addBtn("U", () => rubiks.rot(Face.Up, 0));
}