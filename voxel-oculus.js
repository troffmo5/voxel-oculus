module.exports = function (game, opts) {
	var THREE = game.THREE;
	var renderer = game.renderer;

	this.separation = 10;
	_distortion = 0.1;
	this.aspectFactor = 1;

	if (opts) {
		if (opts.separation !== undefined) this.separation = opts.separation;
		if (opts.distortion !== undefined) _distortion = opts.distortion;
		if (opts.aspectFactor !== undefined) this.aspectFactor = opts.aspectFactor;
	}

	var _width, _height;
	var _cameraL = new THREE.PerspectiveCamera();
	_cameraL.matrixAutoUpdate = false;
	_cameraL.target = new THREE.Vector3();

	var _cameraR = new THREE.PerspectiveCamera();
	_cameraR.matrixAutoUpdate = false;
	_cameraR.target = new THREE.Vector3();

	var _scene = new THREE.Scene();

	var _camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 1, 1000 );
	_camera.position.z = 1;
	_scene.add( _camera );

	// initialization
	renderer.autoClear = false;

	var _params = { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };
	var _renderTarget = new THREE.WebGLRenderTarget( 800, 600, _params );
	var _material = new THREE.ShaderMaterial( {
		uniforms: {
			"tex": { type: "t", value: _renderTarget },
			"c": { type: "f", value: _distortion }
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			" vUv = uv;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"}"
		].join("\n"),

		fragmentShader: [
			"uniform float c;",
			"uniform sampler2D tex;",
			"varying vec2 vUv;",
			"void main()",
			"{",
			"	vec2 uv = vUv;",
			"	vec2 vector = uv * 2.0 - 1.0;",
			"	float factor = 1.0/(1.0+c);",
			"	float vectorLen = length(vector);",
			"	vec2 direction = vector / vectorLen;",
			"	float newLen = vectorLen + c * pow(vectorLen,3.0);",
			"	vec2 newVector = direction * newLen * factor;",
			"	newVector = (newVector + 1.0) / 2.0;",
			"	gl_FragColor = texture2D(tex, newVector);",
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


	this.setDistortion = function(c) {
		_material.uniforms['c'].value = c;
	};

	this.render = function ( scene, camera ) {
		renderer.clear();
		renderer.setClearColor(renderer.getClearColor());

		if (camera.matrixAutoUpdate) camera.updateMatrix();

		// Render left
		_cameraL.fov = camera.fov;
		_cameraL.aspect = camera.aspect / (2*this.aspectFactor);
		_cameraL.near = camera.near;
		_cameraL.far = camera.far;		
		_cameraL.updateProjectionMatrix();

		var offset = new THREE.Vector3(-this.separation,0,0);
		_cameraL.matrix.copy(camera.matrixWorld);
		_cameraL.matrix.translate(offset);
		_cameraL.matrixWorldNeedsUpdate = true;

		renderer.setViewport( 0, 0, _width, _height );

		renderer.render( scene, _cameraL, _renderTarget, true );

		renderer.render( _scene, _camera );

		// Render right
		_cameraR.near = camera.near;
		_cameraR.far = camera.far;
		_cameraR.projectionMatrix = _cameraL.projectionMatrix;

		offset.set(this.separation,0,0);
		_cameraR.matrix.copy(camera.matrixWorld);
		_cameraR.matrix.translate(offset);
		_cameraR.matrixWorldNeedsUpdate = true;

		renderer.setViewport( _width, 0, _width, _height );
	 	renderer.render( scene, _cameraR, _renderTarget, true );

		renderer.render( _scene, _camera );
	};

	game.renderer = this;
};
