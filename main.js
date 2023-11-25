import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Face, Rubiks } from './rubiks';

const rubiks = new Rubiks(10, 100);

addControls();


const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new WebGLRenderer({ antialias: true });

const canvasContainer = document.getElementById("canvasContainer");
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
canvasContainer.appendChild(renderer.domElement);

scene.add(rubiks);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5;
controls.update();


const clock = new Clock();
function animate() {
    requestAnimationFrame(animate);
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
        btn.addEventListener("click", () => fn(btn));
        container.appendChild(btn);
    }
    addBtn("l", () => rubiks.rot(Face.Left, 0));
    addBtn("r", () => rubiks.rot(Face.Right, 0));
    addBtn("d", () => rubiks.rot(Face.Down, 0));
    addBtn("u", () => rubiks.rot(Face.Up, 0));
    addBtn("b", () => rubiks.rot(Face.Back, 0));
    addBtn("f", () => rubiks.rot(Face.Front, 0));
    addBtn("play", async (btn) => {
        if (btn.innerText === "stop") {
            btn.innerText = "play";
            return;
        }
        btn.innerText = "stop";
        while (btn.innerText === "stop") {
            await rubiks.rot(Object.values(Face)[Math.floor(Math.random() * 6)], Math.floor(Math.random() * rubiks.size));
        }
    });
}