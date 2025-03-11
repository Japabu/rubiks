import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Face, Rubiks } from './rubiks';

/**
 * Create the main Rubik's Cube instance
 * Parameters: size (3 for 3x3x3 cube), animation duration in milliseconds
 */
const rubiks = new Rubiks(3, 500);

// Initialize control buttons for cube manipulation
addControls();

/**
 * Set up the Three.js scene, camera, and renderer
 */
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create renderer with antialiasing for smoother edges
const renderer = new WebGLRenderer({ antialias: true });

// Add the renderer to the DOM
const canvasContainer = document.getElementById("canvasContainer");
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
canvasContainer.appendChild(renderer.domElement);

// Add the Rubik's Cube to the scene
scene.add(rubiks);

// Set up camera orbit controls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5; // Position camera at a good viewing distance
controls.update();

/**
 * Animation loop - updates and renders the scene at every frame
 */
const clock = new Clock();
function animate() {
    requestAnimationFrame(animate); // Request the next frame
    const delta = Math.min(clock.getDelta() * 1000, 100); // Calculate time since last frame (capped at 100ms)
    rubiks.update(delta); // Update cube animations
    renderer.render(scene, camera); // Render the scene
}

// Start the animation loop
animate();

/**
 * Creates UI controls for interacting with the Rubik's Cube
 * - Rotation buttons for each face
 * - Random scramble button
 * - Size control
 * - Animation speed control
 */
function addControls() {
    const container = document.getElementById("controlsContainer");
    
    /**
     * Helper function to create a button with text and click handler
     * @param {string} text - Button label
     * @param {Function} fn - Click handler function
     */
    const addBtn = (text, fn) => {
        const btn = document.createElement("button");
        btn.innerText = text;
        btn.addEventListener("click", () => fn(btn));
        container.appendChild(btn);
    }
    
    // Add rotation buttons for each face (l = left, r = right, etc.)
    addBtn("l", () => rubiks.rot(Face.Left, 0));
    addBtn("r", () => rubiks.rot(Face.Right, 0));
    addBtn("d", () => rubiks.rot(Face.Down, 0));
    addBtn("u", () => rubiks.rot(Face.Up, 0));
    addBtn("b", () => rubiks.rot(Face.Back, 0));
    addBtn("f", () => rubiks.rot(Face.Front, 0));
    
    // Add play/stop button for random cube scrambling
    addBtn("play", async (btn) => {
        if (btn.innerText === "stop") {
            btn.innerText = "play";
            return;
        }
        btn.innerText = "stop";
        // Continue rotating random faces until the button is clicked again
        while (btn.innerText === "stop") {
            await rubiks.rot(Object.values(Face)[Math.floor(Math.random() * 6)], Math.floor(Math.random() * rubiks.size));
        }
    });

    // Add control for cube size
    const size = document.createElement("input");
    size.type = "number";
    size.value = rubiks.size;
    container.append(size);

    // Add control for animation duration
    const animationTime = document.createElement("input");
    animationTime.type = "number";
    animationTime.value = rubiks.animationTime;
    container.append(animationTime);

    // Set up event listeners for the controls
    size.addEventListener("input", () => rubiks.setSize(size.value));
    animationTime.addEventListener("input", () => rubiks.animationTime = animationTime.value);
}