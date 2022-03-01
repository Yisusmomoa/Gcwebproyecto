class Game{

    OBSTACLE_PREFAB=new THREE.BoxBufferGeometry(1,1,1);
    OBSTACLE_MATERIAL=new THREE.MeshBasicMaterial({color:0xccdeee});
    BONUS_PREFAB=new THREE.SphereBufferGeometry(1,12,12);

    constructor(scene,camera){
        //inicializa las variables
        this.speedZ = 25;
        //prepare 3d scene
        //bind event callbacks

        this._initializeScene(scene,camera);
        document.addEventListener('keydown',this._keydown.bind(this));
        document.addEventListener('keyup',this._keyup.bind(this));

    }
    update(){
       
        this.time+=this.clock.getDelta();

        //event handling
        //recompute the game state
        this._updateGrid();
        this._checkCollisions();
        this._updateInfoPanel();

    }


    _keydown(event){
        //check for the key to move the ship accordingly
    }
    _keyup(){

    }
    
    _updateGrid(){
        this.grid.material.uniforms.time.value=this.time;
        this.objectsParent.position.z=this.speedZ*this.time;

        this.objectsParent.traverse((child)=>{
            if(child instanceof THREE.Mesh){
                //pos in world space
                const childZPos=child.position.z+this.objectsParent.position.z;
                if(childZPos>0){
                    //reset the object
                    if(child.userData.type==='obstacle'){
                        this._setupObstacle(child,this.ship.position.x,-this.objectsParent.position.z)
                    }
                    else{
                        this._setupBonus(child,this.ship.position.x,-this.objectsParent.position.z)
                    }
                }
            }
        });


    }

    _checkCollisions(){
        //obstacles
        //bonus

    }

    _updateInfoPanel(){

    }

    _gameOver(){
        //prepare end state
        //show ui
        //reset variables

    }

    _createShip(scene){
        //prepare 3d scene
        const shipBody=new THREE.Mesh(
            new THREE.TetrahedronBufferGeometry(0.4),
            new THREE.MeshBasicMaterial({color: 0xbbccdd})
        );
        shipBody.rotateX(45*Math.PI/180);
        shipBody.rotateY(45*Math.PI/180);

        this.ship=new THREE.Group();
        this.ship.add(shipBody);
        scene.add(this.ship);

        const reactorSocketGeometry=new THREE.CylinderBufferGeometry(0.08,0.08,0.1,16);
        const reactorSocketMaterial=new THREE.MeshBasicMaterial({color: 0x99aacc});

        const reactorSocket1=new THREE.Mesh(reactorSocketGeometry,reactorSocketMaterial);
        const reactorSocket2=new THREE.Mesh(reactorSocketGeometry,reactorSocketMaterial);
        const reactorSocket3=new THREE.Mesh(reactorSocketGeometry,reactorSocketMaterial);

        this.ship.add(reactorSocket1);
        this.ship.add(reactorSocket2);
        this.ship.add(reactorSocket3);

        reactorSocket1.rotateX(90*Math.PI/180);
        reactorSocket1.position.set(-0.15,0,0.1);
        reactorSocket2.rotateX(90*Math.PI/180);
        reactorSocket2.position.set(0.15,0,0.1);
        reactorSocket3.rotateX(90*Math.PI/180);
        reactorSocket3.position.set(0,-0.15,0.1);
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
        const reactorLightGeometry=new THREE.CylinderBufferGeometry(0.055,0.055,0.1,16);
        const reactorLightMaterial=new THREE.MeshBasicMaterial({color: 0xaadeff});

        const reactorLight1=new THREE.Mesh(reactorLightGeometry,reactorLightMaterial);
        const reactorLight2=new THREE.Mesh(reactorLightGeometry,reactorLightMaterial);
        const reactorLight3=new THREE.Mesh(reactorLightGeometry,reactorLightMaterial);

        this.ship.add(reactorLight1);
        this.ship.add(reactorLight2);
        this.ship.add(reactorLight3);

        reactorLight1.rotateX(90*Math.PI/180);
        reactorLight1.position.set(-0.15,0,0.11);
        reactorLight2.rotateX(90*Math.PI/180);
        reactorLight2.position.set(0.15,0,0.11);
        reactorLight3.rotateX(90*Math.PI/180);
        reactorLight3.position.set(0,-0.15,0.11);
    }

     _createGrid(scene) {
       
        
        let divisions = 30;
        let gridLimit = 200;
        this.grid = new THREE.GridHelper(gridLimit * 2, divisions, 0xccddee, 0xccddee);
    
        const moveableZ = [];
        for (let i = 0; i <= divisions; i++) {
          moveableZ.push(1, 1, 0, 0); // move horizontal lines only (1 - point is moveable)
        }
        this.grid.geometry.setAttribute('moveableZ', new THREE.BufferAttribute(new Uint8Array(moveableZ), 1));
    
        this.grid.material = new THREE.ShaderMaterial({
          uniforms: {
            speedZ: {
              value: this.speedZ
            },
            gridLimits: {
              value: new THREE.Vector2(-gridLimit, gridLimit)
            },
            time: {
              value: 0
            }
          },
          vertexShader: `
            uniform float time;
            uniform vec2 gridLimits;
            uniform float speedZ;
            
            attribute float moveableZ;
            
            varying vec3 vColor;
          
            void main() {
              vColor = color;
              float limLen = gridLimits.y - gridLimits.x;
              vec3 pos = position;
              if (floor(moveableZ + 0.5) > 0.5) { // if a point has "moveableZ" attribute = 1 
                float zDist = speedZ * time;
                float curZPos = mod((pos.z + zDist) - gridLimits.x, limLen) + gridLimits.x;
                pos.z = curZPos;
              }
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
          
            void main() {
              gl_FragColor = vec4(vColor, 1.); // r, g, b channels + alpha (transparency)
            }
          `,
          vertexColors: THREE.VertexColors
        });
    
        scene.add(this.grid);
        this.time=0;
        this.clock=new THREE.Clock();
      }
    _initializeScene(scene,camera){
        this._createShip(scene);
        this._createGrid(scene);

        this.objectsParent=new THREE.Group();
        scene.add(this.objectsParent);

        for(let i=0; i<10;i++){
            this._spawnObstacle();
        }
        for(let i=0; i<10;i++){
            this._spawnBonus();
        }

        camera.rotateX(-20*Math.PI/180);
        camera.position.set(0,1.5,2);

    }

    _spawnObstacle(){
        //create geometry
        const obj=new THREE.Mesh(
            this.OBSTACLE_PREFAB,
            this.OBSTACLE_MATERIAL
        );
        //get random scale
        
        this._setupObstacle(obj);
        obj.userData={type:'obstacle'};

        this.objectsParent.add(obj);
    }

    _setupObstacle(obj,refXPos=0,refZPos=0){
        //random scale
        obj.scale.set(
            this._randomFloat(0.5,2),
            this._randomFloat(0.5,2),
            this._randomFloat(0.5,2)
        );
        //random position
        obj.position.set(
            refXPos+this._randomFloat(-30,30),
            obj.scale.y*0.5,
            refZPos-100-this._randomFloat(0,100)
        );
    }


    _spawnBonus(){
        const obj=new THREE.Mesh(
            this.BONUS_PREFAB,
            new THREE.MeshBasicMaterial({color:0x000000})
        );
        this._setupBonus(obj);
        obj.userData={type:'bonus'};
        this.objectsParent.add(obj);
    }

    _setupBonus(obj,refXPos=0,refZPos=0){
        const price=this._randomInt(5,20);
        const ratio=price/20;

        const size=ratio*0.5;
        obj.scale.set(size,size,size);

        const hue=0.5+0.5+ratio;
        obj.material.color.setHSL(hue,1,0.5);
        
        obj.position.set(
            refXPos+this._randomFloat(-30,30),
            obj.scale.y*0.5,
            refZPos-100-this._randomFloat(0,100)
        );
    }

    _randomFloat(min,max){
        return Math.random()*(max-min)+min;
    }
    _randomInt(min,max){
        min=Math.ceil(min);
        max=Math.floor(max);
        return Math.floor(Math.random()*(max-min+1))+min;
    }
}