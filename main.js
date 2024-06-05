import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
//now the plane is horizontal (otherwise it's vertical)
groundGeometry.rotateX(-Math.PI /2);
//setting a grey colour for this material + we're making sure that both sides of the plane are rendered
const groundMaterial = new THREE.MeshStandardMaterial({
	color: 0x555555,
	side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(groundMesh);

//adding a sphere
/*radius — sphere radius. Default is 1.
widthSegments — number of horizontal segments. Minimum value is 3, and the default is 32.
heightSegments — number of vertical segments. Minimum value is 2, and the default is 16.*/
const sphereGeometry = new THREE.SphereGeometry( 0.4 , 32, 16 ); 
const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.position.set(1.5 , 1, 6); 
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
var index= 0.5;
const loader = new GLTFLoader().setPath('/');
for(let i=0; i<10; i++){
	loader.load('bowlingPin.glb', (gltf) => {
		console.log('loading model');
		var m = gltf.scene;
		//setting positions
		if(i>=0 && i<4){
			m.position.set(i, 0, 0);
		} else if (i>=4 && i<7){
			m.position.set(index, 0, 1);
			index += 1;
		} else if (i>=7 && i<9){
			//7%6=1
			//8%6=2
			m.position.set(i%6 ,0, 2);
		} else {
			m.position.set(1.5 ,0, 3);
		}
		console.log(i+ " posizione " + m.position.x +", "+ m.position.y+", " + m.position.z);
		m.scale.set(0.3, 0.3, 0.3);
		scene.add(m);
		mesh[i] = m;
	});
}

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

function animate() {
	if(mesh){
		//mesh.rotation.x += 0.01;
		//mesh.rotation.y += 0.01;
	}
	renderer.render( scene, camera );
}




