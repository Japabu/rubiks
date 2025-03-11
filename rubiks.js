import { BoxGeometry, Color, Float32BufferAttribute, Group, Matrix3, Matrix4, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";

/**
 * Enum for the six faces of the Rubik's Cube
 * Using Object.freeze to make it immutable
 */
export const Face = Object.freeze({
    Left: "Left",
    Right: "Right",
    Down: "Down",
    Up: "Up",
    Back: "Back",
    Front: "Front",
});

/**
 * Returns the standard color for a given face of the Rubik's Cube
 * @param {string} face - The face identifier from the Face enum
 * @returns {string} The color name for the face
 */
function faceCenterColor(face) {
    return {
        [Face.Left]: Color.NAMES.orangered,
        [Face.Right]: Color.NAMES.red,
        [Face.Down]: Color.NAMES.yellow,
        [Face.Up]: Color.NAMES.white,
        [Face.Back]: Color.NAMES.blue,
        [Face.Front]: Color.NAMES.green,
    }[face];
}

/**
 * Returns the normal vector for a given face of the Rubik's Cube
 * @param {string} face - The face identifier from the Face enum
 * @returns {Vector3} A unit vector pointing in the direction of the face normal
 */
function faceNormal(face) {
    return {
        [Face.Left]: new Vector3(-1, 0, 0),
        [Face.Right]: new Vector3(+1, 0, 0),
        [Face.Down]: new Vector3(0, -1, 0),
        [Face.Up]: new Vector3(0, +1, 0),
        [Face.Back]: new Vector3(0, 0, -1),
        [Face.Front]: new Vector3(0, 0, +1),
    }[face];
}

/**
 * Main class representing the entire Rubik's Cube
 * Extends Three.js Group to contain all cube parts
 */
export class Rubiks extends Group {
    /**
     * Creates a new Rubik's Cube
     * @param {number} size - The size of the cube (e.g. 3 for a 3x3x3 cube)
     * @param {number} animationTime - Duration of rotation animations in milliseconds
     */
    constructor(size, animationTime) {
        super();
        this.size = size;
        this.anims = [];
        this.animationTime = animationTime;
        this.setSize(size);
    }

    /**
     * Sets the size of the Rubik's Cube and creates all the cube parts
     * @param {number} size - The size of the cube (e.g. 3 for a 3x3x3 cube)
     */
    setSize(size) {
        this.size = size;
        this.clear(); // Remove all existing cube parts
        this.animations = [];
        
        // Create each cubie at the correct position
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                for (let x = 0; x < size; x++) {
                    // Determine which faces this cubie has (only cubies on the outside have visible faces)
                    const faceNames = [];
                    if (y === 0) faceNames.push(Face.Down);
                    if (y === size - 1) faceNames.push(Face.Up);
                    if (z === 0) faceNames.push(Face.Back);
                    if (z === size - 1) faceNames.push(Face.Front);
                    if (x === 0) faceNames.push(Face.Left);
                    if (x === size - 1) faceNames.push(Face.Right);
                    if (faceNames.length === 0) continue; // Skip internal cubies with no visible faces

                    // Create a face configuration object with colors
                    const faces = {};
                    for (const faceName of faceNames) {
                        faces[faceName] = { color: faceCenterColor(faceName) };
                    }

                    // Add the cubie to the group
                    this.add(new RubiksPart(
                        1.0 / size, // Size of each cubie
                        new Vector3(x, y, z).divideScalar(size).subScalar(0.5).addScalar(0.5 / size), // Position of cubie
                        faces
                    ));
                }
            }
        }
    }

    /**
     * Updates the Rubik's Cube animations
     * @param {number} delta - Time delta in milliseconds since last update
     */
    update(delta) {
        while (delta > 0 && this.anims[0]) {
            delta -= this.anims[0].update(delta);
            if (delta > 0) this.anims.shift(); // Remove finished animations
        }
    }

    /**
     * Selects a ring of cubies for rotation
     * @param {string} face - The face the ring belongs to
     * @param {number} index - The index of the ring (0 is outer edge)
     * @returns {Array} Array of cube parts in the selected ring
     */
    ring(face, index) {
        const n = faceNormal(face);

        // Determine which axis this face is on (x, y, or z)
        const axis = n.x ? "x" : n.y ? "y" : n.z ? "z" : null;
        if (!axis) throw new Error("Unable to determine axis");

        // Calculate the position along the axis
        let pos = index * 1 / this.size + 0.5 / this.size - 0.5;
        if (n[axis] > 0) pos = -pos;

        const epsilon = 1 / this.size * 0.1; // Small error margin for floating point comparison
        const ring = [];

        // Find all cubies at the specified position along the axis
        for (const part of this.children) {
            if (Math.abs(part.position[axis] - pos) <= epsilon) ring.push(part);
        }

        return ring;
    }

    /**
     * Rotates a ring of the cube
     * @param {string} face - The face to rotate
     * @param {number} index - The index of the ring to rotate
     * @returns {Promise} A promise that resolves when the rotation is complete
     */
    rot(face, index) {
        const n = faceNormal(face);
        const axis = n.x ? "x" : n.y ? "y" : n.z ? "z" : null;
        if (!axis) throw new Error("Unable to determine axis");

        // Determine the rotation direction based on the face normal
        let theta = Math.PI / 2; // 90 degrees in radians
        if (n[axis] > 0) theta = -theta;

        // Create and return a promise that resolves when the animation is complete
        return new Promise(resolve => {
            this.anims.push(new RotationAnim(theta, axis, this.animationTime, () => this.ring(face, index, axis), resolve));
        });
    }
}

/**
 * Class representing a single part (cubie) of the Rubik's Cube
 * Extends Three.js Mesh to provide 3D rendering
 */
export class RubiksPart extends Mesh {
    /**
     * Creates a new Rubik's Cube part
     * @param {number} size - The size of the cubie
     * @param {Vector3} position - The position of the cubie
     * @param {Object} faces - Object mapping face names to face properties (including color)
     */
    constructor(size, position, faces) {
        const geometry = new BoxGeometry(size, size, size).toNonIndexed();
        const material = new MeshBasicMaterial({ vertexColors: true });

        // Map faces to vertices in the cube geometry
        const facesInVertexOrder = [Face.Right, Face.Left, Face.Up, Face.Down, Face.Front, Face.Back];
        const colors = [];
        
        // Apply colors to each face of the cubie
        for (let i = 0; i < 6; i++) {
            const color = new Color(faces[facesInVertexOrder[i]]?.color ?? Color.NAMES.gray);

            // Each face has 2 triangles, each with 3 vertices
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);

            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

        super(geometry, material);
        this.position.set(position.x, position.y, position.z);
    }
}

/**
 * Class handling the animation of rotating a ring of cubies
 */
class RotationAnim {
    /**
     * Creates a new rotation animation
     * @param {number} totalTheta - The total angle to rotate in radians
     * @param {string} axis - The axis to rotate around ('x', 'y', or 'z')
     * @param {number} totalTime - The total time for the animation in milliseconds
     * @param {Function} partsFn - Function that returns the parts to rotate
     * @param {Function} doneCallback - Callback function to call when animation is complete
     */
    constructor(totalTheta, axis, totalTime, partsFn, doneCallback) {
        this.totalTheta = totalTheta;
        this.rotFn = "makeRotation" + axis.toUpperCase(); // e.g., makeRotationX, makeRotationY, makeRotationZ
        this.totalTime = totalTime;
        this.partsFn = partsFn;
        this.parts = null;
        this.theta = 0;
        this.time = 0;
        this.doneCallback = doneCallback;
        this.done = false;
    }

    /**
     * Updates the animation state
     * @param {number} deltaTime - Time delta in milliseconds since last update
     * @returns {number} The amount of time consumed by this update
     */
    update(deltaTime) {
        if (this.done) throw new Error("Animation is already done");

        // Lazy initialization of parts
        if (!this.parts) {
            this.parts = this.partsFn();
        }

        // Limit deltaTime to avoid going past the end of the animation
        if (deltaTime > this.totalTime - this.time) {
            deltaTime = this.totalTime - this.time;
            this.done = true;
        }

        this.time += deltaTime;
        
        // Calculate how much to rotate this frame
        const deltaTheta = this.totalTheta / this.totalTime * deltaTime;
        
        // Create rotation matrix and apply to all parts
        const m = new Matrix4();
        m[this.rotFn](deltaTheta);
        for (const part of this.parts) {
            part.applyMatrix4(m);
        }

        // Call the callback if the animation is complete
        if (this.done) {
            this.doneCallback();
        }

        return deltaTime;
    }
}