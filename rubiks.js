import { BoxGeometry, Color, Float32BufferAttribute, Group, Matrix3, Matrix4, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";

export const Face = Object.freeze({
    Left: "Left",
    Right: "Right",
    Down: "Down",
    Up: "Up",
    Back: "Back",
    Front: "Front",
});

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

export class Rubiks extends Group {
    constructor(size) {
        super();
        this.size = size;
        this.anims = [];

        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                for (let x = 0; x < size; x++) {
                    const faceNames = [];
                    if (y === 0) faceNames.push(Face.Down);
                    if (y === size - 1) faceNames.push(Face.Up);
                    if (z === 0) faceNames.push(Face.Back);
                    if (z === size - 1) faceNames.push(Face.Front);
                    if (x === 0) faceNames.push(Face.Left);
                    if (x === size - 1) faceNames.push(Face.Right);
                    if (faceNames.length === 0) continue;

                    const faces = {};
                    for (const faceName of faceNames) {
                        faces[faceName] = { color: faceCenterColor(faceName) };
                    }

                    this.add(new RubiksPart(
                        1.0 / size,
                        new Vector3(x, y, z).divideScalar(size).subScalar(0.5).addScalar(0.5 / size),
                        faces
                    ));
                }
            }
        }
    }

    update(delta) {
        while (delta > 0 && this.anims[0]) {
            delta -= this.anims[0].update(delta);
            if (delta > 0) this.anims.shift();
        }
    }

    ring(face, index) {
        const n = faceNormal(face);

        const axis = n.x ? "x" : n.y ? "y" : n.z ? "z" : null;
        if (!axis) throw new Error("Unable to determine axis");

        let pos = index * 1 / this.size + 0.5 / this.size;
        if (n[axis] > 0) pos = -pos;

        const delta = 1 / this.size * 0.1;
        const ring = [];

        for (const part of this.children) {
            if (Math.abs(part.position[axis] - pos) <= delta) ring.push(part);
        }

        return ring;
    }

    rot(face, index) {
        const n = faceNormal(face);
        const axis = n.x ? "x" : n.y ? "y" : n.z ? "z" : null;
        if (!axis) throw new Error("Unable to determine axis");


        let theta = Math.PI / 2;
        if (n[axis] > 0) theta = -theta;

        const parts = this.ring(face, index, axis);
        this.anims.push(new RotationAnim(theta, axis, 1000, parts));
    }
}

export class RubiksPart extends Mesh {
    constructor(size, position, faces) {
        const geometry = new BoxGeometry(size, size, size).toNonIndexed();
        const material = new MeshBasicMaterial({ vertexColors: true });

        const facesInVertexOrder = [Face.Right, Face.Left, Face.Up, Face.Down, Face.Front, Face.Back];
        const colors = [];
        for (let i = 0; i < 6; i++) {
            const color = new Color(faces[facesInVertexOrder[i]]?.color ?? Color.NAMES.gray);

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

class RotationAnim {
    constructor(totalTheta, axis, totalTime, parts) {
        this.totalTheta = totalTheta;
        this.rotFn = "makeRotation" + axis.toUpperCase();
        this.totalTime = totalTime;
        this.parts = parts;
        this.theta = 0;
        this.time = 0;
    }

    update(delta) {
        delta = Math.min(this.totalTime - this.time, delta);
        this.time += delta;
        const deltaTheta = this.totalTheta / this.totalTime * delta;
        const m = new Matrix4();
        m[this.rotFn](deltaTheta);
        for (const part of this.parts) {
            part.applyMatrix4(m);
        }

        return delta;
    }
}