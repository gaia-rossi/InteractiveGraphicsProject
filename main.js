import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { update } from 'three/examples/jsm/libs/tween.module.js';

//renderer
const renderer = new THREE.WebGLRenderer();
//set the background color
//renderer.setClearColor(0x000000);
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

//scene object
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5)
//camera object (fieldOfView, aspectRatio, near and far plane of the camera)
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set(4, 5, 11);
camera.lookAt(0, 0, 0); 

//adding light
//DirectionalLight( color , intensity )
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(10, 20, 10);
scene.add( directionalLight );
directionalLight.castShadow = true;
//Set up shadow properties for the light
directionalLight.shadow.mapSize.width = 2048; 
directionalLight.shadow.mapSize.height = 2048; 
directionalLight.shadow.camera.near = 0.5; 
directionalLight.shadow.camera.far = 500; 
//ambient light
const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

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
groundMesh.receiveShadow = true;
scene.add(groundMesh);
groundMesh.userData.ground = true;

//useful to reset the animation 
const initialPositions = {};
const initialRotations = {};

//adding a sphere
/*radius — sphere radius. Default is 1.*/
const sphereGeometry = new THREE.SphereGeometry(0.4); 
const sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.position.set(1.5/2, 15, 5); 
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add( sphere );
//userData: An object that can be used to store custom data about the Object3D.
sphere.userData.draggable = true;
sphere.userData.name ="SPHERE";
//store the initial position of the sphere
initialPositions.sphere = sphere.position.clone();
initialRotations.sphere = sphere.quaternion.clone();

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
		initialPositions[`pin${i}`] = m.position.clone();
		console.log(i+ " posizione " + m.position.x +", "+ m.position.y+", " + m.position.z);
		initialRotations[`pin${i}`] = m.quaternion.clone();

		m.scale.set(0.4, 0.4, 0.4);
		scene.add(m);

		//adding shadows
		m.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true; // Se vuoi che i birilli ricevano ombre
            }
        });

		m.userData.draggable = false;
		m.userData.name ="BOWLING PIN";
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

function resetAnimation(){
//reset sphere
    sphere.position.copy(initialPositions.sphere);
    sphere.quaternion.copy(initialRotations.sphere);
    sphereBody.position.copy(initialPositions.sphere);
    sphereBody.quaternion.copy(initialRotations.sphere);
    sphereBody.velocity.set(0, 0, 0);
    sphereBody.angularVelocity.set(0, 0, 0);

    //reset pins
    for (let i = 0; i < mesh.length; i++) {
        const m = mesh[i];
        if (m) {
            const initialPosition = initialPositions[`pin${i}`];
            const initialRotation = initialRotations[`pin${i}`];
            m.position.copy(initialPosition);
            m.quaternion.copy(initialRotation);
            meshBody[i].position.copy(initialPosition);
            meshBody[i].quaternion.copy(initialRotation);
            meshBody[i].velocity.set(0, 0, 0);
            meshBody[i].angularVelocity.set(0, 0, 0);
        }
    }

    arrowVisibility = true;
}

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

		//function to move the sphere with the mouse
		dragObject();
		
		 // Check if the sphere has fallen off the plane
        if (sphere.position.y < -5) { 
            console.log("The ball is fallen, resetting the scene");
            resetAnimation();
        }

		renderer.render( scene, camera );
	}
}

var forceMagnitude = 1000;
var forceDirection = new THREE.Vector3(0, 0, -1);
var arrowVisibility = true;

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
	arrowVisibility = false;
    console.log("Forza applicata: " + force.x + ", " + force.y + ", " + force.z);
}

function updateArrowHelper() {
    arrowHelper.setDirection(forceDirection);
    arrowHelper.setLength(forceMagnitude/1000);
    arrowHelper.position.copy(sphereBody.position);
    arrowHelper.visible = arrowVisibility;
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

//RAYCASTER FOR MOUSE PICKING
const raycaster = new THREE.Raycaster();
//variable to store the position of the mouse click
const clickMouse = new THREE.Vector2();
//variable about the last mouse movement position
const moveMouse = new THREE.Vector2();
//it will contain the last selected object that I want to drag;
var draggable;

//PICK AND DROP
window.addEventListener('click', function(e){
	if(draggable){
		console.log("dropping draggable " + draggable.userData.name);
		draggable = null;
		return;
	}
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	clickMouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	clickMouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( clickMouse, camera );
	// calculate objects intersecting the picking ray
	// the array is sorted: the closest intersecting object is at position 0 and the furthest is at the last index
	const found = raycaster.intersectObjects( scene.children );

	//If I found some object
	if(found.length>0 && found[0].object.userData.draggable){
		draggable = found[0].object;
		console.log("found draggable: " + draggable.userData.name);
	}

});

window.addEventListener('mousemove', function(e){
	moveMouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	moveMouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
});

function dragObject(){
	if(draggable != null){
		raycaster.setFromCamera(moveMouse, camera);
		const found = raycaster.intersectObjects( scene.children );
		if(found.length > 0){
			for(let i=0; i<found.length; i++){
				var o = found[i];
				//I will not change the y coordinate because I don't want to move the object upwards
				draggable.position.x = o.point.x;
				draggable.position.z = o.point.z;
				sphereBody.position.x = o.point.x;
                sphereBody.position.z = o.point.z;
			}
		}
	}
}

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
