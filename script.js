// Fully scaled model: 1 AU = 40 units, 1 unit = 2,123.67 km for planets, but Moon reverted to original scale

// ### General Setup ###
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.5;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 200;
controls.target.set(0, 0, 0);

camera.position.z = 100;

const textureLoader = new THREE.TextureLoader();

// ### Utility Functions ###
function solveKepler(M, e, tolerance = 1e-6, maxIterations = 100) {
    let E = M;
    for (let i = 0; i < maxIterations; i++) {
        const f = E - e * Math.sin(E) - M;
        const fPrime = 1 - e * Math.cos(E);
        const delta = f / fPrime;
        E -= delta;
        if (Math.abs(delta) < tolerance) break;
    }
    return E;
}

function createOrbitCircle(radius, color) {
    const orbitGeometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const orbitCircle = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitCircle.rotation.x = Math.PI / 2;
    return orbitCircle;
}

function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    for (let i = 0; i < 500; i++) {
        starsVertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.7 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}
addStars();

// ### Sun ###
const sunRadius = 8; // Reverted to original size
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
let sun;

textureLoader.load(
    'sun.jpg',
    (sunTexture) => {
        const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
        sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        sun.position.set(0, 0, 0);
    },
    undefined,
    (err) => console.error('Error loading Sun texture:', err)
);

const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// ### Mercury ###
const mercuryRadius = 2439.7 / 2123.67; // ~1.15 units
let mercury;

const aMercury = 0.387 * 40; // 15.48 units
const eMercury = 0.2056;
let meanAnomalyMercury = 0;
const meanAnomalyStepMercury = 0.0298;

textureLoader.load(
    'mercury.jpg',
    (mercuryTexture) => {
        const mercuryGeometry = new THREE.SphereGeometry(mercuryRadius, 64, 64);
        const mercuryMaterial = new THREE.MeshStandardMaterial({ map: mercuryTexture });
        mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
        scene.add(mercury);
        mercury.position.x = aMercury * (1 - eMercury);
        mercury.position.z = 0;
        mercury.rotation.y = 0;
    },
    undefined,
    (err) => console.error('Error loading Mercury texture:', err)
);

const mercuryOrbitPoints = [];
const numPoints = 100;
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI;
    const x = aMercury * (Math.cos(E) - eMercury);
    const z = aMercury * Math.sqrt(1 - eMercury * eMercury) * Math.sin(E);
    mercuryOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const mercuryOrbitGeometry = new THREE.BufferGeometry().setFromPoints(mercuryOrbitPoints);
const mercuryOrbitMaterial = new THREE.LineBasicMaterial({ color: 0x808080, transparent: true, opacity: 0.5 });
const mercuryOrbitPath = new THREE.Line(mercuryOrbitGeometry, mercuryOrbitMaterial);
scene.add(mercuryOrbitPath);

// ### Venus ###
const venusRadius = 6051.8 / 2123.67; // ~2.85 units
let venus;

const aVenus = 0.723 * 40; // 28.92 units
const eVenus = 0.0067;
let meanAnomalyVenus = 0;
const meanAnomalyStepVenus = 0.0116;

textureLoader.load(
    'venus.jpg',
    (venusTexture) => {
        const venusGeometry = new THREE.SphereGeometry(venusRadius, 64, 64);
        const venusMaterial = new THREE.MeshStandardMaterial({ map: venusTexture });
        venus = new THREE.Mesh(venusGeometry, venusMaterial);
        scene.add(venus);
        venus.position.x = aVenus * (1 - eVenus);
        venus.position.z = 0;
        venus.rotation.y = 0;
    },
    undefined,
    (err) => console.error('Error loading Venus texture:', err)
);

const venusOrbitPoints = [];
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI;
    const x = aVenus * (Math.cos(E) - eVenus);
    const z = aVenus * Math.sqrt(1 - eVenus * eVenus) * Math.sin(E);
    venusOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const venusOrbitGeometry = new THREE.BufferGeometry().setFromPoints(venusOrbitPoints);
const venusOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
const venusOrbitPath = new THREE.Line(venusOrbitGeometry, venusOrbitMaterial);
scene.add(venusOrbitPath);

// ### Earth ###
const earthRadius = 6371 / 2123.67; // ~3 units
let earth;

const aEarth = 1.0 * 40; // 40 units
const eEarth = 0.0167;
let meanAnomalyEarth = 0;
const meanAnomalyStepEarth = 0.009;

textureLoader.load(
    'earth.jpg',
    (earthTexture) => {
        const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        earth.position.x = aEarth * (1 - eEarth);
        earth.position.z = 0;
        earth.rotation.y = 0;
    },
    undefined,
    (err) => console.error('Error loading Earth texture:', err)
);

const earthOrbitPoints = [];
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI;
    const x = aEarth * (Math.cos(E) - eEarth);
    const z = aEarth * Math.sqrt(1 - eEarth * eEarth) * Math.sin(E);
    earthOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthOrbitPoints);
const earthOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const earthOrbitPath = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
scene.add(earthOrbitPath);

// ### Moon ###
const moonRadius = 0.7; // Restored to original
const moonDistanceFromEarth = 4.033; // Restored to original
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
const moon = new THREE.Mesh(moonGeometry, new THREE.MeshPhongMaterial({ color: 0xffffff }));
scene.add(moon);

const moonVertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const moonFragmentShader = `
    varying vec3 vNormal;
    uniform vec3 sunDirection;
    void main() {
        float illumination = dot(vNormal, sunDirection);
        illumination = smoothstep(-0.5, 0.5, illumination);
        gl_FragColor = vec4(vec3(illumination), 1.0);
    }
`;

moon.material = new THREE.ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: { sunDirection: { value: new THREE.Vector3(1, 0, 0) } }
});

let moonAngle = 0;
const moonSpeed = 0.09203;

const moonOrbitCircle = createOrbitCircle(moonDistanceFromEarth, 0xffffff);
scene.add(moonOrbitCircle);

// ### Mars ###
const marsRadius = 3389.5 / 2123.67; // ~1.596 units
let mars;

const aMars = 1.524 * 40; // 60.96 units
const eMars = 0.0934;
let meanAnomalyMars = 0;
const meanAnomalyStepMars = 0.0048;

textureLoader.load(
    'mars.jpg',
    (marsTexture) => {
        const marsGeometry = new THREE.SphereGeometry(marsRadius, 64, 64);
        const marsMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
        mars = new THREE.Mesh(marsGeometry, marsMaterial);
        scene.add(mars);
        mars.position.x = aMars * (1 - eMars);
        mars.position.z = 0;
        mars.rotation.y = 0;
    },
    undefined,
    (err) => console.error('Error loading Mars texture:', err)
);

const marsOrbitPoints = [];
for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI;
    const x = aMars * (Math.cos(E) - eMars);
    const z = aMars * Math.sqrt(1 - eMars * eMars) * Math.sin(E);
    marsOrbitPoints.push(new THREE.Vector3(x, 0, z));
}
const marsOrbitGeometry = new THREE.BufferGeometry().setFromPoints(marsOrbitPoints);
const marsOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
const marsOrbitPath = new THREE.Line(marsOrbitGeometry, marsOrbitMaterial);
scene.add(marsOrbitPath);

// ### Animation Loop ###
function animate() {
    requestAnimationFrame(animate);

    if (sun) sun.rotation.y += 0.002;

    if (mercury) {
        mercury.rotation.y += 0.0021;
        meanAnomalyMercury -= meanAnomalyStepMercury;
        if (meanAnomalyMercury < 0) meanAnomalyMercury += 2 * Math.PI;
        const E_mercury = solveKepler(meanAnomalyMercury, eMercury);
        mercury.position.x = aMercury * (Math.cos(E_mercury) - eMercury);
        mercury.position.z = aMercury * Math.sqrt(1 - eMercury * eMercury) * Math.sin(E_mercury);
    }

    if (venus) {
        venus.rotation.y -= 0.0005;
        meanAnomalyVenus -= meanAnomalyStepVenus;
        if (meanAnomalyVenus < 0) meanAnomalyVenus += 2 * Math.PI;
        const E_venus = solveKepler(meanAnomalyVenus, eVenus);
        venus.position.x = aVenus * (Math.cos(E_venus) - eVenus);
        venus.position.z = aVenus * Math.sqrt(1 - eVenus * eVenus) * Math.sin(E_venus);
    }

    if (earth) {
        earth.rotation.y += 0.12;
        meanAnomalyEarth -= meanAnomalyStepEarth;
        if (meanAnomalyEarth < 0) meanAnomalyEarth += 2 * Math.PI;
        const E_earth = solveKepler(meanAnomalyEarth, eEarth);
        earth.position.x = aEarth * (Math.cos(E_earth) - eEarth);
        earth.position.z = aEarth * Math.sqrt(1 - eEarth * eEarth) * Math.sin(E_earth);

        moonAngle -= moonSpeed;
        moon.position.x = earth.position.x + moonDistanceFromEarth * Math.cos(moonAngle);
        moon.position.z = earth.position.z + moonDistanceFromEarth * Math.sin(moonAngle);
        moon.position.y = earth.position.y;

        moonOrbitCircle.position.x = earth.position.x;
        moonOrbitCircle.position.z = earth.position.z;
    }

    if (mars) {
        mars.rotation.y += 0.015;
        meanAnomalyMars -= meanAnomalyStepMars;
        if (meanAnomalyMars < 0) meanAnomalyMars += 2 * Math.PI;
        const E_mars = solveKepler(meanAnomalyMars, eMars);
        mars.position.x = aMars * (Math.cos(E_mars) - eMars);
        mars.position.z = aMars * Math.sqrt(1 - eMars * eMars) * Math.sin(E_mars);
    }

    const sunDirection = new THREE.Vector3().subVectors(sunLight.position, moon.position).normalize();
    moon.material.uniforms.sunDirection.value.copy(sunDirection);

    controls.update();
    renderer.render(scene, camera);
}

animate();
