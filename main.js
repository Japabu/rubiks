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

// Add the renderer to the DOM and set it to fill the window
const canvasContainer = document.getElementById("canvasContainer");
renderer.setSize(window.innerWidth, window.innerHeight);
canvasContainer.appendChild(renderer.domElement);

// Add the Rubik's Cube to the scene
scene.add(rubiks);

// Set up camera orbit controls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5; // Position camera at a good viewing distance
controls.update();

// Add window resize handler to maintain proper perspective
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

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
     * @param {string} className - Optional CSS class to add to the button
     * @returns {HTMLButtonElement} The created button element
     */
    const addBtn = (text, fn, className) => {
        const btn = document.createElement("button");
        btn.innerText = text;
        btn.addEventListener("click", () => fn(btn));
        if (className) {
            btn.classList.add(className);
        }
        container.appendChild(btn);
        return btn;
    }
    
    // Create a container for the manual rotation buttons
    const rotationContainer = document.createElement("div");
    rotationContainer.classList.add("rotation-buttons");
    
    // Add a header with toggle functionality
    const rotationHeader = document.createElement("div");
    rotationHeader.classList.add("control-header");
    
    // Create the label for rotation buttons
    const rotationLabel = document.createElement("div");
    rotationLabel.innerText = "Manual Rotation";
    rotationLabel.classList.add("control-label");
    
    // Create the toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.innerHTML = "▼"; // Down arrow
    toggleBtn.classList.add("toggle-button");
    toggleBtn.setAttribute("aria-label", "Toggle manual controls");
    
    // Add elements to header
    rotationHeader.appendChild(rotationLabel);
    rotationHeader.appendChild(toggleBtn);
    
    // Add header to container
    rotationContainer.appendChild(rotationHeader);
    
    // Create a div to hold the buttons (the collapsible part)
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-drawer");
    
    // Add rotation buttons for each face (l = left, r = right, etc.)
    const rotationButtons = [
        addBtn("Left", () => rubiks.rot(Face.Left, 0), "rotation-button"),
        addBtn("Right", () => rubiks.rot(Face.Right, 0), "rotation-button"),
        addBtn("Down", () => rubiks.rot(Face.Down, 0), "rotation-button"),
        addBtn("Up", () => rubiks.rot(Face.Up, 0), "rotation-button"),
        addBtn("Back", () => rubiks.rot(Face.Back, 0), "rotation-button"),
        addBtn("Front", () => rubiks.rot(Face.Front, 0), "rotation-button")
    ];
    
    // Add rotation buttons to the buttons container
    rotationButtons.forEach(btn => buttonsContainer.appendChild(btn));
    
    // Add the buttons container to the rotation container
    rotationContainer.appendChild(buttonsContainer);
    
    // Add toggle functionality
    toggleBtn.addEventListener("click", () => {
        buttonsContainer.classList.toggle("expanded");
        toggleBtn.innerHTML = buttonsContainer.classList.contains("expanded") ? "▲" : "▼";
    });
    
    // Make the entire header clickable for toggling
    rotationHeader.addEventListener("click", (e) => {
        // Only toggle if the clicked element is not the toggle button itself
        // (to avoid double-toggling)
        if (e.target !== toggleBtn) {
            buttonsContainer.classList.toggle("expanded");
            toggleBtn.innerHTML = buttonsContainer.classList.contains("expanded") ? "▲" : "▼";
        }
    });
    
    // Add the rotation container to the main container
    container.appendChild(rotationContainer);
    
    // Create a container for automated controls
    const automatedContainer = document.createElement("div");
    automatedContainer.classList.add("automated-buttons");
    
    // Add a label for automated buttons
    const automatedLabel = document.createElement("div");
    automatedLabel.innerText = "Automated Controls";
    automatedLabel.classList.add("control-label");
    automatedContainer.appendChild(automatedLabel);
    
    // Create a container for the buttons
    const buttonsRow = document.createElement("div");
    buttonsRow.classList.add("automated-buttons-container");
    
    // Create the shuffle button so we can reference it from the solve button
    const shuffleBtn = addBtn("Shuffle", async (btn) => {
        if (btn.innerText === "Stop") {
            btn.innerText = "Shuffle";
            btn.classList.remove("active-shuffle");
            
            // Re-enable all controls
            solveBtn.disabled = false;
            rotationButtons.forEach(btn => btn.disabled = false);
            return;
        }
        
        btn.innerText = "Stop";
        btn.classList.add("active-shuffle");
        
        // Disable all other controls during shuffling
        solveBtn.disabled = true;
        rotationButtons.forEach(btn => btn.disabled = true);
        
        // Continue rotating random faces until the button is clicked again
        while (btn.innerText === "Stop") {
            await rubiks.rot(Object.values(Face)[Math.floor(Math.random() * 6)], Math.floor(Math.random() * rubiks.size));
        }
    }, "shuffle-button");
    
    // Create the solve button so we can reference it from the shuffle button
    const solveBtn = addBtn("Solve", async () => {
        // Disable all controls during solving
        solveBtn.disabled = true;
        shuffleBtn.disabled = true;
        rotationButtons.forEach(btn => btn.disabled = true);
        
        // Get the solution moves using the cube's move history
        const solution = rubiks.generateSolution();
        
        // Animate each move in the solution
        for (const move of solution) {
            // When solving, we need to invert the rotation direction
            await rubiks.rot(move.face, move.index, !move.isClockwise);
        }
        
        // Reset the move history after solving
        rubiks.moveHistory = [];
        
        // Re-enable all controls when done
        solveBtn.disabled = false;
        shuffleBtn.disabled = false;
        rotationButtons.forEach(btn => btn.disabled = false);
    }, "solve-button");
    
    // Add automated buttons to the buttons row container
    buttonsRow.appendChild(shuffleBtn);
    buttonsRow.appendChild(solveBtn);
    
    // Add the buttons row to the automated container
    automatedContainer.appendChild(buttonsRow);
    
    // Add the automated container to the main container
    container.appendChild(automatedContainer);
    
    // Create a container for settings
    const settingsContainer = document.createElement("div");
    settingsContainer.classList.add("settings-container");
    
    // Add a label for settings
    const settingsLabel = document.createElement("div");
    settingsLabel.innerText = "Settings";
    settingsLabel.classList.add("control-label");
    settingsContainer.appendChild(settingsLabel);

    // Create a row for cube size settings
    const sizeRow = document.createElement("div");
    sizeRow.classList.add("settings-row");
    
    // Add control for cube size
    const sizeLabel = document.createElement("span");
    sizeLabel.innerText = "Size:";
    sizeRow.appendChild(sizeLabel);
    
    const size = document.createElement("input");
    size.type = "number";
    size.min = "2";
    size.max = "5";
    size.value = rubiks.size;
    sizeRow.appendChild(size);
    
    // Add the size row to the settings container
    settingsContainer.appendChild(sizeRow);

    // Create a row for animation duration settings
    const animRow = document.createElement("div");
    animRow.classList.add("settings-row");
    
    // Add control for animation duration
    const animLabel = document.createElement("span");
    animLabel.innerText = "Speed (ms):";
    animRow.appendChild(animLabel);
    
    const animationTime = document.createElement("input");
    animationTime.type = "number";
    animationTime.min = "100";
    animationTime.max = "1000";
    animationTime.step = "100";
    animationTime.value = rubiks.animationTime;
    animRow.appendChild(animationTime);
    
    // Add the animation row to the settings container
    settingsContainer.appendChild(animRow);

    // Add the settings container to the main container
    container.appendChild(settingsContainer);
    
    // Set up event listeners for the controls
    size.addEventListener("input", () => rubiks.setSize(size.value));
    animationTime.addEventListener("input", () => rubiks.animationTime = animationTime.value);
}

/**
 * Generate a solution for the current state of the Rubik's Cube
 * @returns {Promise<Array>} A promise that resolves to an array of moves to solve the cube
 */
async function generateSolution() {
    // This function is no longer needed as we're using the cube's built-in solution generator
    // Kept for reference, but functionality moved to the Rubiks class
    return [];
}