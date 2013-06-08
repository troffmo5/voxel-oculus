module.exports = function (game, opts) {
	var THREE = game.THREE;
	var renderer = game.view.renderer;

	this.separation = 10;
	this.distortion = 0.1;
	this.aspectFactor = 1;

	if (opts) {
		if (opts.separation !== undefined) this.separation = opts.separation;
		if (opts.distortion !== undefined) this.distortion = opts.distortion;
		if (opts.aspectFactor !== undefined) this.aspectFactor = opts.aspectFactor;
	}

	var _width, _height;

	var _pCamera = new THREE.PerspectiveCamera();
	_pCamera.matrixAutoUpdate = false;
	_pCamera.target = new THREE.Vector3();

	var _scene = new THREE.Scene();

	var _oCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 1, 1000 );
	_oCamera.position.z = 1;
	_scene.add( _oCamera );

	// initialization
	renderer.autoClear = false;

	var _params = { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };
	var _renderTarget = new THREE.WebGLRenderTarget( 800, 600, _params );
	var _material = new THREE.ShaderMaterial( {
		uniforms: {
			"tex": { type: "t", value: _renderTarget },
			"c": { type: "f", value: this.distortion }
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			" vUv = uv;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"}"
		].join("\n"),

        // Formula used from the paper: "Applying and removing lens distortion in post production"
        // by Gergely Vass , Tamás Perlaki
		// http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.136.3745
		fragmentShader: [
			"uniform float c;",
			"uniform sampler2D tex;",
			"varying vec2 vUv;",
			"void main()",
			"{",
			"	vec2 uv = vUv;",
			"	vec2 vector = uv * 2.0 - 1.0;",
			"   float factor = 1.0/(1.0+c);",
			"   float vectorLen = length(vector);",
			"   vec2 direction = vector / vectorLen;",
			"   float newLen = vectorLen + c * pow(vectorLen,3.0);",
			"   vec2 newVector = direction * newLen * factor;",
			"	newVector = (newVector + 1.0) / 2.0;",
			"	if (newVector.x < 0.0 || newVector.x > 1.0 || newVector.y < 0.0 || newVector.y > 1.0)",
			"		gl_FragColor = vec4(0.0,0.0,0.0,1.0);",
			"	else",
			"   	gl_FragColor = texture2D(tex, newVector);",
			"}"
		].join("\n")
	} );
	var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), _material );
	_scene.add( mesh );

	this.setSize = function ( width, height ) {
		_width = width / 2;
		_height = height;
		_renderTarget = new THREE.WebGLRenderTarget( width, height, _params );
		_material.uniforms[ "tex" ].value = _renderTarget;
		renderer.setSize( width, height );

	};
	this.setSize(game.width, game.height);

	this.render = function ( scene, camera ) {
		renderer.clear();
    	_material.uniforms['c'].value = this.distortion;

		// camera parameters
		if (camera.matrixAutoUpdate) camera.updateMatrix();
		_pCamera.fov = camera.fov;
		_pCamera.aspect = camera.aspect / (2*this.aspectFactor);
		_pCamera.near = camera.near;
		_pCamera.far = camera.far;		
		_pCamera.updateProjectionMatrix();


		// Render left

		var offset = new THREE.Vector3(-this.separation,0,0);
		_pCamera.matrix.copy(camera.matrixWorld);
 		_pCamera.matrix.translate(offset);
 		_pCamera.matrixWorldNeedsUpdate = true;

		renderer.setViewport( 0, 0, _width, _height );
		renderer.render( scene, _pCamera, _renderTarget, true );
		renderer.render( _scene, _oCamera );

		// Render right

		offset.set(this.separation,0,0);
		_pCamera.matrix.copy(camera.matrixWorld);
		_pCamera.matrix.translate(offset);
 		_pCamera.matrixWorldNeedsUpdate = true;

		renderer.setViewport( _width, 0, _width, _height );
    	renderer.render( scene, _pCamera, _renderTarget, true );

		renderer.render( _scene, _oCamera );
	};

	game.view.renderer = this;
};
