import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//variables and constants definition
//useful to reset the animation 
const initialPositions = {};
const initialRotations = {};
let planewidth = 15;
let planeheight = 40;
var mesh = [];
var meshBody = [];
var index= 0.5;
const timeStep = 1/60;
var play = true;
var roundNumber = 1;
const totalRounds = 5;
var prevScore = 0;
const fallenSphereHeight = -20;
const initialForceMagnitude = 100;
const maxForceMagnitude = 500;
var forceMagnitude = 100;
var forceDirection = new THREE.Vector3(0, 0, -1);
var arrowVisibility = true;

//renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
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
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0); 
controls.update();


//adding light
//DirectionalLight( color , intensity )
const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
directionalLight.position.set(0, 20, 20);
//directionalLight.target = mesh[0];
scene.add( directionalLight );
directionalLight.castShadow = true;
//directionalLight.shadow.bias = -0.0001;
//Set up shadow properties for the light
directionalLight.shadow.mapSize.width = 4096; 
directionalLight.shadow.mapSize.height = 4096; 
const shadowCamera = directionalLight.shadow.camera;
shadowCamera.left = -30;
shadowCamera.right = 30;
shadowCamera.top = 20;
shadowCamera.bottom = -20;
shadowCamera.near = 0.5;
shadowCamera.far = 500;

/*const helper = new THREE.DirectionalLightHelper( directionalLight, 5 );
scene.add( helper );*/

//ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // luce ambientale
scene.add(ambientLight);

//CANNON INITIALIZATION
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

//materials
const pinMaterial = new CANNON.Material("pinMaterial");
const groundMaterial1 = new CANNON.Material("groundMaterial");
const pinGroundContactMaterial = new CANNON.ContactMaterial(
	pinMaterial,
	groundMaterial1,
	{friction: 0.8, restitution: 0.1}
);
world.addContactMaterial(pinGroundContactMaterial);

// GROUND PLANE
//texture of the plane
let TextureLoader = new THREE.TextureLoader();
let texture = TextureLoader.load('ParquetFlooring.png');

//adding a plane

const groundGeometry = new THREE.PlaneGeometry(planewidth, planeheight);
//setting a grey colour for this material + we're making sure that both sides of the plane are rendered
const groundMaterial = new THREE.MeshStandardMaterial({
	//color: 0xffff00
	//side: THREE.DoubleSide,
	map: texture
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
//now the plane is horizontal (otherwise it's vertical)
groundMesh.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0));
groundMesh.receiveShadow = true;
scene.add(groundMesh);
groundMesh.userData.ground = true;

//CANNON: plane
const groundBody = new CANNON.Body({
	//shape: new CANNON.Plane(),
	mass: 0,
	shape: new CANNON.Box(new CANNON.Vec3(planewidth/2, planeheight/2, 0.001)),
	type: CANNON.Body.STATIC,
	material: groundMaterial1,
	//position: new CANNON.Vec3(0, -1, 0)
});
world.addBody(groundBody);
groundBody.position.set(groundMesh.position.x, groundMesh.position.y, groundMesh.position.z);
groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);

//SHPERE
/*radius — sphere radius. Default is 1.*/
const sphereGeometry = new THREE.SphereGeometry(0.6); 
const sphereMaterial = new THREE.MeshPhongMaterial( { 
	color: 0x000000,
	shininess: 100,       // Lucentezza (più alto è il valore, più lucido sarà)
    specular: 0x555555    // Colore speculare (riflessi)
	//map: spheretexture
	} );
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.position.set(0.5, 4, 15); 
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add( sphere );
//userData: An object that can be used to store custom data about the Object3D.
sphere.userData.draggable = true;
sphere.userData.name ="SPHERE";
//store the initial position of the sphere
initialPositions.sphere = sphere.position.clone();
initialRotations.sphere = sphere.quaternion.clone();

//CANNON: sphere
const sphereBody = new CANNON.Body({
	mass: 10,
	shape: new CANNON.Sphere(0.5),
	position: new CANNON.Vec3(sphere.position.x, sphere.position.y, sphere.position.z)
});
world.addBody(sphereBody);
sphereBody.linearDamping = 0.31;

//DASHED LINE FOR THE FORCE
const lineMaterial = new THREE.LineDashedMaterial( { 
	color: 0xff0000, 
	linewidth: 10, 
	dashSize: 1, 
	gapSize: 0.5  } );
const points = [sphereBody.position, new THREE.Vector3(5,1,3)];

const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
const line = new THREE.Line( lineGeometry, lineMaterial );
line.computeLineDistances();
scene.add( line );

//adding the blender object 
function getPosition(i){
	var x, z;
	if(i>=0 && i<4){
		x=i;
		z=0;
	} else if (i>=4 && i<7){
		x=index;
		z=1;
		index += 1;
	} else if (i>=7 && i<9){
		//7%6=1
		//8%6=2
		x=i%6;
		z=2;
	} else {
		x=1.5;
		z=3;
	}
	return [x, z];
}

const loader = new GLTFLoader().setPath('/');
for(let i=0; i<10; i++){
	loader.load('birillo.glb', (gltf) => {
		const m = gltf.scene.children.find((child) => child.name === "Cylinder");
		//console.log('loading model');
		
		m.scale.set(0.3, 0.3, 0.3);
		//BOUNDING BOX
		const box = new THREE.Box3().setFromObject(m);
		const size = new THREE.Vector3();
		box.getSize(size);
		console.log(i+ ": " +size.x +", "+ size.y+", " + size.z); 
		//console.log('Bowling Pin dimension: ', size);
		//setting positions
		var res = getPosition(i);
		var x = res[0];
		var z = res[1];
		var offset_z = -7;
		var offset_x = -1.5
		var y=1;
		m.position.set(x+offset_x,y,z+offset_z);
		initialPositions[`pin${i}`] = m.position.clone();
		console.log(i+ " posizione " + m.position.x +", "+ m.position.y+", " + m.position.z);
		initialRotations[`pin${i}`] = m.quaternion.clone();

		scene.add(m);

		//adding shadows
		m.traverse(function (node) {
			//console.log(node);
            if (node.isMesh) {
                node.castShadow = true;
                //node.receiveShadow = true;
			}
        });

		//console.log(m);

		m.userData.draggable = false;
		m.userData.name ="BOWLING PIN";
		mesh[i] = m;

		//CANNON
		const mBody = new CANNON.Body({
			mass: 10,
			shape: new CANNON.Cylinder(size.x / 2, size.x / 2, size.y/2, 32), //?
			position: new CANNON.Vec3(m.position.x, m.position.y, m.position.z),
			material: pinMaterial
		})
		world.addBody(mBody);
		mBody.linearDamping = 0.31;
		//mBody.angularDamping = 0.9;
		mBody.position.set(m.position.x, m.position.y, m.position.z);
		mBody.collisionResponse = true;
		console.log("cannon " + mBody.position.x + "," +  mBody.position.y + "," + mBody.position.z);
		meshBody[i] = mBody;
	});
};

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
				// Check if the bowling pin has been hit and if it has fallen
				if (isPinFallen(mesh[i])) {
					fallenPins.add(i);
					//console.log(`The bowling pin number ${i} has fallen`);
				}
				//console.log("cannon " + mesh[i].position.x + "," + mesh[i].position.y + "," + mesh[i].position.z);

			}
		}

		//function to move the sphere with the mouse
		dragObject();
		
		if(roundNumber == totalRounds){
			//console.log("Game over!");
			endAnimation();	
		}

		 // Check if the sphere has fallen off the plane
        if (sphere.position.y < fallenSphereHeight) { 
            console.log("The ball is fallen, resetting the scene");
            resetAnimation();
        }		

		renderer.render( scene, camera );
	}
}

renderer.setAnimationLoop(animate);

//rounds
function resetAnimation(){
	play = true;
	//updating the score
	var x = prevScore + fallenPins.size;
	document.getElementById('currentScore').innerHTML = x;
	document.getElementById('totalScore').innerHTML = x;

	if(fallenPins.size == 10 && roundNumber%2 == 1){ //strike
		document.getElementById('event').innerHTML = "Strike!";
		showStrikeText();
		//skip the round and show all bowling pins again
		roundNumber +=1;
	} else if(fallenPins.size == 10 && roundNumber%2 == 0) { //spare
		document.getElementById('event').innerHTML = "Spare!";
		showStrikeText();
	}

	//round and score management
	if(roundNumber%2 == 0){
		fallenPins.clear();
		//score is updated every two rounds because it is summed to the size of the fallen pins set
		prevScore = x;
	}
	
	//reset sphere
    sphere.position.copy(initialPositions.sphere);
    sphere.quaternion.copy(initialRotations.sphere);
    sphereBody.position.copy(initialPositions.sphere);
    sphereBody.quaternion.copy(initialRotations.sphere);
    sphereBody.velocity.set(0, 0, 0);
    sphereBody.angularVelocity.set(0, 0, 0);
	sphereBody.force.set(0, 0, 0);
    sphereBody.torque.set(0, 0, 0);
	//reset pins
    for (let i = 0; i < mesh.length; i++) {
        const m = mesh[i];
		//If the pin has fallen in the previous round don't show it
		if(fallenPins.has(i)){
			m.visible = false;
			continue;
		}else{
			m.visible = true;
		}
        if (m) {
            const initialPosition = initialPositions[`pin${i}`];
            const initialRotation = initialRotations[`pin${i}`];
            m.position.copy(initialPosition);
            m.quaternion.copy(initialRotation);
            meshBody[i].position.copy(initialPosition);
            meshBody[i].quaternion.copy(initialRotation);
            meshBody[i].velocity.set(0, 0, 0);
            meshBody[i].angularVelocity.set(0, 0, 0);
			meshBody[i].force.set(0, 0, 0);
            meshBody[i].torque.set(0, 0, 0);
        }
    }
	
	// Annulla l'effetto della forza di applicazione
	forceMagnitude = 100; // Ripristina la magnitudine della forza di default
	forceDirection.set(0, 0, -1); // Ripristina la direzione della forza di default
    arrowVisibility = true;
	roundNumber += 1;
}

//variable to store which bowling pins have fallen
var fallenPins = new Set();
function isPinFallen(pin) {
	// Create a vector pointing upwards (along the y-axis)
    const upVector = new THREE.Vector3(0, 1, 0);
	// Create another vector pointing upwards and apply the pin's rotation to it
    const pinUp = new THREE.Vector3(0, 1, 0).applyQuaternion(pin.quaternion);
	// Calculate the dot product of the two vectors
    const dot = upVector.dot(pinUp);
	// Calculate the angle between the two vectors
    const angle = Math.acos(dot);
	// Check if the angle is greater than 45 degrees (π / 4 radians)
    return angle > Math.PI / 4; // Angolo di 45 gradi
}

function updateForce(command){
	//code to update the arrow/force according to up-down
	switch (command){
		case "Up":
			forceMagnitude += initialForceMagnitude;
			break;
		case "Down":
			// to avoid negative forces
			forceMagnitude = Math.max(0, forceMagnitude - initialForceMagnitude);
			break;
		default:
			console.log("invalid command");
			break;	
	}
	console.log("Magnitudine della forza: " + forceMagnitude);
}

function updateDirectionForce(command){
	//update the direction according to left-right
	const angle = Math.PI / 180 //angle increase of 1 degrees
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
	forceMagnitude = Math.min(maxForceMagnitude, forceMagnitude);
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
    sphereBody.applyImpulse(force, worldPoint);
	arrowVisibility = false;
    console.log("Forza applicata: " + force.x + ", " + force.y + ", " + force.z);
}

function updateArrowHelper() {
	// Calculate startPoint and endPoint for the line
    const startPoint = new THREE.Vector3().copy(sphereBody.position);
    const endPoint = new THREE.Vector3().copy(sphereBody.position).add(
        new THREE.Vector3(
            forceDirection.x * forceMagnitude / initialForceMagnitude,
            forceDirection.y * forceMagnitude / initialForceMagnitude,
            forceDirection.z * forceMagnitude / initialForceMagnitude
        )
    );

	const points = [startPoint, endPoint];
    lineGeometry.setFromPoints(points);
	lineGeometry.computeBoundingSphere(); // Ensure bounding sphere is updated
    line.computeLineDistances(); 
	line.visible = arrowVisibility;
}

function endAnimation(){
	/*const div = document.getElementById('endgame');
	// clientWidth e clientHeight
	const clientWidth = div.clientWidth;
	const clientHeight = div.clientHeight;
	var x = clientWidth / 10;
	var y = clientHeight / 10;
	console.log(`Client Width: ${clientWidth}px, Client Height: ${clientHeight}px`);

	world.gravity.set(0,0,0);
	sphere.visible = false;
	arrowVisibility = false;
	for(let i=1; i<10; i++){
		mesh[i].position.set(i, y, 0);
		console.log(i+ " fine: ("+mesh[i].position.x + " "+mesh[i].position.y);
	}*/
	
	play=false;
	updateCommands();
}

function updateCommands(){
	if(!play){
		document.getElementById('endgame').classList.toggle('visible');
	}
}

//event listener to pause/play the simulation
document.addEventListener("keydown", function (event) {
	switch(event.code) {
		case "KeyP": // Press 'P' to pause/resume
			play = !play;
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
				sphereBody.position.copy(draggable.position);
				sphereBody.quaternion.copy(draggable.quaternion);
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

//HTML settings controller
document.getElementById('toggle-button-settings').addEventListener('click', function() {
	if(play){
		play = false;
	} else {
		play = true;
	}
    document.getElementById('settings').classList.toggle('visible');
});

//HTML legend controller
document.getElementById('toggle-button-legend').addEventListener('click', function() {
    document.getElementById('commands').classList.toggle('visible');
});

//HTML restart button controller
const restartButtons = document.getElementsByClassName('restart');
for(var i=0; i<restartButtons.length; i++){
	var restart = restartButtons[i];
	restart.addEventListener('click', function(event) {
		play = true;
		roundNumber = 0;
		prevScore = 0;
		sphere.visible= true;
		arrowVisibility = true;
		resetAnimation();
		document.getElementById('settings').classList.remove('visible');
		document.getElementById('endgame').classList.remove('visible');
	});
}
    
//HTML quit game button controller
document.getElementById('quit').addEventListener('click', function() {
    document.getElementById('endgame').classList.add('visible');
});

//HTML resume button controller
document.getElementById('resume').addEventListener('click', function() {
	play = true;
    document.getElementById('settings').classList.remove('visible');
});


//Strike and Spare message
function showStrikeText() {
	var strikeText = document.getElementById('event');
	strikeText.style.display = 'block'; // Mostra il testo

	// Nascondi il testo dopo 2 secondi
	setTimeout(function() {
		strikeText.style.display = 'none';
	}, 2000); // 2000 millisecondi = 2 secondi
}