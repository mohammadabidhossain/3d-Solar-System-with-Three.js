// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Sphere (Earth-like) parameters
const radius = 5;
const particleCount = 1000;

const vertices = [];
for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    vertices.push(x, y, z);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
});
const numberSphere = new THREE.Points(geometry, material);
scene.add(numberSphere);
numberSphere.position.set(0, 0, 0);

// Moon parameters
const moonRadius = 1;
const moonDistance = 10;
const moonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, emissive: 0xffd700 });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

// Position the camera
camera.position.z = 20; // Adjusted for visibility

// Moon orbit variables
let angle = 0;
const moonSpeed = 0.02;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Earth-like rotation: Rotate only around the Y-axis
    numberSphere.rotation.y += 0.01; // Adjust speed for a smoother rotation

    // Moon's orbital motion
    angle += moonSpeed;
    moon.position.x = numberSphere.position.x + moonDistance * Math.cos(angle);
    moon.position.z = numberSphere.position.z + moonDistance * Math.sin(angle);
    moon.position.y = numberSphere.position.y; // Keeping it on the same plane

    renderer.render(scene, camera);
}


// Start animation
animate();
