import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { update } from 'three/examples/jsm/libs/tween.module.js';

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
sphere.position.set(1.5/2, 15, 5); 
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

//Arrow for the sphere
const dir = new THREE.Vector3(1, 1 ,0);
//normalize the direction vector (convert to vector of length 1)
dir.normalize();
const origin = new THREE.Vector3( 0, 0, 0 );
const length = 1;
const hex = 0xffff00;
const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
scene.add( arrowHelper );

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
			m.position.set(i/2, 10, 0-7);
		} else if (i>=4 && i<7){
			m.position.set(index/2, 10, 1-7);
			index += 1;
		} else if (i>=7 && i<9){
			//7%6=1
			//8%6=2
			m.position.set(i%6/2 ,10, 2-7);
		} else {
			m.position.set(1.5/2 ,10, 3-7);
		}
		console.log(i+ " posizione " + m.position.x +", "+ m.position.y+", " + m.position.z);
		m.scale.set(0.4, 0.4, 0.4);
		scene.add(m);
		mesh[i] = m;

		//CANNON
		const mBody = new CANNON.Body({
			mass: 3,
			shape: new CANNON.Cylinder(0.2, 0.2, 0.5, 12), //?
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

const timeStep = 1/45;

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
	position: new CANNON.Vec3(sphere.position.x, sphere.position.y, sphere.position.z)
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

		updateArrowHelper();

		for(let i=0; i<10; i++){
			if(meshBody[i]){
				mesh[i].position.copy(meshBody[i].position);
				mesh[i].quaternion.copy(meshBody[i].quaternion);
			}
		}

		renderer.render( scene, camera );
	}
}

var forceMagnitude = 1000;
var forceDirection = new THREE.Vector3(0, 0, -1);

function updateForce(command){
	//code to update the arrow/force according to up-down
	switch (command){
		case "Up":
			forceMagnitude += 1000;
			break;
		case "Down":
			// to avoid negative forces
			forceMagnitude = Math.max(0, forceMagnitude -1000);
			break;
		default:
			console.log("invalid command");
			break;	
	}
	console.log("Magnitudine della forza: " + forceMagnitude);
}

function updateDirectionForce(command){
	//update the direction according to left-right
	const angle = Math.PI / 18 //angle increase of 10 degrees
	const quaternion = new THREE.Quaternion(); //It deals with rotations
	switch (command){
		case "Right":
			/*Sets this quaternion from rotation specified by axis and angle.
				Axis is assumed to be normalized, angle is in radians.*/
			quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), - angle);
			forceDirection.applyQuaternion(quaternion);
			break;
		case "Left":
			quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            forceDirection.applyQuaternion(quaternion);
			break;
		default:
			console.log("invalid command");
			break;
	}
	forceDirection.normalize(); // Mantieni la direzione normalizzata
    console.log("Direzione della forza: " + forceDirection.x + ", " + forceDirection.y + ", " + forceDirection.z);
}

function applyForce(){
	//apply the force when pressing enter
	const force = new CANNON.Vec3(
        forceDirection.x * forceMagnitude,
        forceDirection.y * forceMagnitude,
        forceDirection.z * forceMagnitude
    );
    const worldPoint = new CANNON.Vec3(
        sphereBody.position.x,
        sphereBody.position.y,
        sphereBody.position.z
    );
    sphereBody.applyForce(force, worldPoint);
    console.log("Forza applicata: " + force.x + ", " + force.y + ", " + force.z);
}

function updateArrowHelper() {
    arrowHelper.setDirection(forceDirection);
    arrowHelper.setLength(forceMagnitude/1000);
    arrowHelper.position.copy(sphereBody.position);
    arrowHelper.visible = true;
}

//event listener to pause/play the simulation
document.addEventListener("keydown", function (event) {
	switch(event.code) {
		case "KeyP": // Press 'P' to pause/resume
			play = !play;
			arrowHelper.visible = false;
			break;
        case "ArrowUp":
			// Press 'up' to increase the force module
            console.log("Freccia su premuta");
			updateForce("Up");
            break;
        case "ArrowDown":
			// Press 'down' to decrease the force module
            console.log("Freccia giù premuta");
			updateForce("Down");
            break;
        case "ArrowLeft":
			// Press 'left' to rotate the force direction
            console.log("Freccia sinistra premuta");
			updateDirectionForce("Left");
            break;
        case "ArrowRight":
			// Press 'right' to rotate the force direction
            console.log("Freccia destra premuta");
			updateDirectionForce("Right");
            break;
		case "Enter":
			// Press 'enter' to apply the force
			console.log("Tasto Invio premuto");
			applyForce();
			break;
        default:
            // Altri tasti possono essere gestiti qui
            break;
    };
});

//to adapt the window to the current screen size
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//HTML legend controller
var legend = document.getElementById("legend");
legend.addEventListener("click", function() {
	if (legend.classList.contains("expanded")) {
		legend.classList.remove("expanded");
		legend.classList.add("collapsed");
	} else {
		legend.classList.remove("collapsed");
		legend.classList.add("expanded");
	}
});

//adding event listener
//document.addEventListener("click", function(){ alert("Hello World!"); });
/*function getMousePosition(canvas, event) {
	let x = event.clientX ; //to get the coordinate of the click
	let y = event.clientY ;
	console.log("Coordinate x: " + x,
		"Coordinate y: " + y);
}*/

/*document.addEventListener("click", function (e) {
	getMousePosition(document, e);
});*/

/*
// Apply force to the sphere
function applyForceToSphere(e) {
	const rect = renderer.domElement.getBoundingClientRect();
	const mouse_x = e.clientX - rect.left;
	const mouse_y = e.clientY - rect.top;

	//coordinate between -1 and 1
	const nor_x = (mouse_x/ rect.width) * 2 -1;
	const nor_y = -(mouse_y/ rect.height) *2 +1;

	const clickPosition = new THREE.Vector3(nor_x, nor_y, 0.5);
	clickPosition.unproject(camera);
	const f = new THREE.Vector3().subVectors(clickPosition, sphere.position).normalize().multiplyScalar(100);
  	const force = new CANNON.Vec3(f.x, f.y, f.z); // Example force vector
    const worldPoint = new CANNON.Vec3(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
    sphereBody.applyForce(force, worldPoint);
}

function updateArrowHelper(e){
	const rect = renderer.domElement.getBoundingClientRect();
	const mouse_x = e.clientX - rect.left;
	const mouse_y = e.clientY - rect.top;

	//coordinate between -1 and 1
	const nor_x = (mouse_x/ rect.width) * 2 -1;
	const nor_y = -(mouse_y/ rect.height) *2 +1;

	const clickPosition = new THREE.Vector3(nor_x, nor_y, 0.5);
	/*Projects this vector from the camera's normalized device coordinate (NDC) space into world space.
	clickPosition.unproject(camera);

	const direction = new THREE.Vector3().subVectors(clickPosition, sphere.position).normalize();
	const distance = clickPosition.distanceTo(sphere.position);
	console.log(distance + " " + direction);
	arrowHelper.setDirection(direction);
	arrowHelper.setLength(distance);
	arrowHelper.visible = true;
}*/

// Add event listener for applying force
/*document.addEventListener("click", applyForceToSphere);
document.addEventListener("mousemove", updateArrowHelper);*/
//ATTENZIONE
/*document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('mouseup', onMouseUp, false);*/