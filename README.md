# InteractiveGraphicsProject

/*
Instructions to run the project
1. open terminal in folder and write: npx vite
2. open the browser by visiting: http://localhost:5173
*/

/* INSTALLATION PROCESS
Option 1: Install with NPM and a build tool
Development
Installing from the npm package registry and using a build tool is the recommended approach for most users — the more dependencies your project needs, the more likely you are to run into problems that the static hosting cannot easily resolve. With a build tool, importing local JavaScript files and npm packages should work out of the box, without import maps.

Install Node.js. We'll need it to load manage dependencies and to run our build tool.
Install three.js and a build tool, Vite, using a terminal in your project folder. Vite will be used during development, but it isn't part of the final webpage. If you prefer to use another build tool, that's fine — we support modern build tools that can import ES Modules.

# three.js
npm install --save three

# vite
npm install --save-dev vite
Installation added node_modules/ and package.json to my project. What are they?
npm uses package.json to describe which versions of each dependency you've installed. If you have other people working on the project with you, they can install the original versions of each dependency simply by running npm install. If you're using version history, commit package.json.

npm installs the code for each dependency in a new node_modules/ folder. When Vite builds your application, it sees imports for 'three' and pulls three.js files automatically from this folder. The node_modules/ folder is used only during development, and shouldn't be uploaded to your web hosting provider or committed to version history.

From your terminal, run:
npx vite
What is npx?
npx is installed with Node.js, and runs command line programs like Vite so that you don't have to search for the right file in node_modules/ yourself. If you prefer, you can put Vite's common commands into the package.json:scripts list, and use npm run dev instead.

If everything went well, you'll see a URL like http://localhost:5173 appear in your terminal, and can open that URL to see your web application.
The page will be blank — you're ready to create a scene.
*/ 

AXES
An axis object to visualize the 3 axes in a simple way.
The X axis is red. The Y axis is green. The Z axis is blue.

RAYCASTER
Raycaster
This class is designed to assist with raycasting. Raycasting is used for mouse picking (working out what objects in the 3d space the mouse is over) amongst other things.


#Is pin fallen
er determinare se un birillo è caduto, puoi verificare l'angolo di inclinazione del birillo rispetto al piano verticale. Se l'angolo di inclinazione supera una certa soglia (ad esempio, 10 gradi), puoi considerare il birillo come caduto.

Metodo per Verificare se un Birillo è Caduto
Calcola l'angolo di inclinazione del birillo:

Usa la quaternione del birillo per ottenere l'orientamento.
Confronta l'orientamento con il vettore verticale (0, 1, 0).
Imposta una soglia di inclinazione:

Se l'angolo di inclinazione supera la soglia, considera il birillo caduto.