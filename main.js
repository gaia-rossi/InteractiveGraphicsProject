import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

//renderer
const renderer = new THREE.WebGLRenderer();
//set the background color
renderer.setClearColor(0x000000);
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild( renderer.domElement );

//scene object
const scene = new THREE.Scene();

//camera object (fieldOfView, aspectRatio, near and far plane of the camera)
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set(4, 5, 11);
camera.lookAt(0, 0, 0); 

//adding a plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
//setting a grey colour for this material + we're making sure that both sides of the plane are rendered
const groundMaterial = new THREE.MeshStandardMaterial({
	color: 0x555555,
	side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
//now the plane is horizontal (otherwise it's vertical)
groundMesh.quaternion.setFromEuler(-Math.PI/2, 0, 0);
scene.add(groundMesh);

//adding a sphere
/*radius — sphere radius. Default is 1.
widthSegments — number of horizontal segments. Minimum value is 3, and the default is 32.
heightSegments — number of vertical segments. Minimum value is 2, and the default is 16.*/
const sphereGeometry = new THREE.SphereGeometry(0.4); 
const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.position.set(0 , 15, 0); 
scene.add( sphere );

//adding light
//DirectionalLight( color , intensity )
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );
//ambient light
const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

//adding the blender object 
var mesh = [];
var meshBody = [];
var index= 0.5;
const loader = new GLTFLoader().setPath('/');
for(let i=0; i<10; i++){
	loader.load('bowlingPin.glb', (gltf) => {
		console.log('loading model');
		var m = gltf.scene;
		//setting positions
		if(i>=0 && i<4){
			m.position.set(i, 10, 0);
		} else if (i>=4 && i<7){
			m.position.set(index, 10, 1);
			index += 1;
		} else if (i>=7 && i<9){
			//7%6=1
			//8%6=2
			m.position.set(i%6 ,10, 2);
		} else {
			m.position.set(1.5 ,10, 3);
		}
		console.log(i+ " posizione " + m.position.x +", "+ m.position.y+", " + m.position.z);
		m.scale.set(0.3, 0.3, 0.3);
		scene.add(m);
		mesh[i] = m;

		//CANNON
		const mBody = new CANNON.Body({
			mass: 10,
			shape: new CANNON.Cylinder(0.15, 0.15, 0.45, 12), //?
			position: new CANNON.Vec3(m.position.x, m.position.y, m.position.z)
		});
		world.addBody(mBody);
		meshBody[i] = mBody;
	});
}

//CANNON
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.81, 0)
});

const timeStep = 1/60;

//CANNON: plane
const groundBody = new CANNON.Body({
	//shape: new CANNON.Plane(),
	//mass: 0
	shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.1)),
	type: CANNON.Body.STATIC
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

//CANNON: sphere
const sphereBody = new CANNON.Body({
	mass: 10,
	shape: new CANNON.Sphere(0.4),
	position: new CANNON.Vec3(0, 15, 0)
});
world.addBody(sphereBody);
sphereBody.linearDamping = 0.31;

var play = true;
function animate() {
	if(play){
		world.step(timeStep);
		groundMesh.position.copy(groundBody.position);
		groundMesh.quaternion.copy(groundBody.quaternion);

		sphere.position.copy(sphereBody.position);
		sphere.quaternion.copy(sphereBody.quaternion);

		for(let i=0; i<10; i++){
			if(meshBody[i]){
				mesh[i].position.copy(meshBody[i].position);
				mesh[i].quaternion.copy(meshBody[i].quaternion);
			}
		}

		renderer.render( scene, camera );
	}
	
}

//to adapt the window to the current screen size
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//adding event listener
//document.addEventListener("click", function(){ alert("Hello World!"); });
function getMousePosition(canvas, event) {
	let x = event.clientX ; //to get the coordinate of the click
	let y = event.clientY ;
	console.log("Coordinate x: " + x,
		"Coordinate y: " + y);
}

document.addEventListener("click", function (e) {
	getMousePosition(document, e);
});


// Apply force to the sphere
function applyForceToSphere(e) {
	let x = e.clientX ; //to get the coordinate of the click
	let y = e.clientY ;
    const force = new CANNON.Vec3((Math.abs(sphereBody.position.x-x)), (Math.abs(sphereBody.position.y-y)), 0); // Example force vector
    const worldPoint = new CANNON.Vec3(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
    sphereBody.applyForce(force, worldPoint);
}

// Add event listener for applying force
document.addEventListener("click", function (event) {
    applyForceToSphere(event);
});


//event listener to pause/play the simulation
document.addEventListener("keydown", function (event) {
    if (event.code === "KeyP") { // Press 'P' to pause/resume
        play = !play;
    }
});