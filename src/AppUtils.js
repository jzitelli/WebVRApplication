window.YAWVRB = window.YAWVRB || {};

YAWVRB.AppUtils = ( function () {
	"use strict";

	const UP = THREE.Object3D.DefaultUp;
	const RIGHT = new THREE.Vector3(1, 0, 0);

	function ObjectSelector() {

		var selectables = [];
		var headings = [];
		var pitches = [];

		this.selection;
		var heading = 0;
		var pitch = 0;

		this.addSelectable = function (obj) {
			selectables.push(obj);
			pitches.push(obj.rotation.x);
			headings.push(obj.rotation.y);
			if (!this.selection) this.selection = obj;
		}.bind(this);

		this.cycleSelection = ( function () {
			var i = 0;
			return function () {
				headings[i] = heading;
				pitches[i] = pitch;
				i = (i + 1) % selectables.length;
				this.selection = selectables[i];
				heading = headings[i];
				pitch = pitches[i];
			};
		} )().bind(this);

		const MOVESPEED = 0.3;
		var pitchQuat = new THREE.Quaternion();

		this.moveByKeyboard = function (dt, moveFB, moveRL, moveUD, turnLR, turnUD) {
			var selection = this.selection;
			if (!selection) return;
			if (moveFB || moveRL || moveUD || turnLR || turnUD) {
				heading += (turnLR) * dt;
				pitch   -= (turnUD) * dt;
				var cos = Math.cos(heading),
					sin = Math.sin(heading);
				selection.position.z -= dt * MOVESPEED * ((moveFB) * cos + (moveRL) * sin);
				selection.position.x += dt * MOVESPEED * ((moveRL) * cos - (moveFB) * sin);
				selection.position.y += dt * MOVESPEED * moveUD;
				selection.quaternion.multiplyQuaternions(selection.quaternion.setFromAxisAngle(UP, heading), pitchQuat.setFromAxisAngle(RIGHT, pitch));
				selection.updateMatrix();
				selection.updateMatrixWorld();
			}
		}.bind(this);

		this.saveAllTransforms = function (key) {
			if (!window.localStorage) {
				console.error('platform does not support localStorage');
				return;
			}
			key = key || 'YAWVRB_TRANSFORMS';
			var transforms = {};
			selectables.forEach( function (object, i) {
				if (object.name) {
					transforms[object.name] = {
						heading: headings[i],
						pitch: pitches[i],
						position: object.position.toArray()
					};
				}
			} );
			window.localStorage[key] = transforms;
		};

		this.loadTransforms = function (key) {
			if (!window.localStorage) {
				console.error('platform does not support localStorage');
				return;
			}
			key = key || 'YAWVRB_TRANSFORMS';
			var transforms = window.localStorage[key];
			selectables.forEach( function (object, i) {
				if (object.name && transforms[object.name]) {
					var transform = transforms[object.name];
					headings[i] = transform.heading;
					pitches[i] = transform.pitch;
					object.position.fromArray(transform.position);
					object.quaternion.setFromAxisAngle(UP, transform.heading).multiply(pitchQuat.setFromAxisAngle(RIGHT, transform.pitch));
					object.updateMatrix();
				}
			} );
		};
	}

	var displayText = ( function () {
		const DEFAULT_OPTIONS = {
			object: YAWVRB.DEADSCENE,
			position: [0,0,0],
			rotation: [0,0,0],
			coordSystem: 'local'
		};
		var textMeshes = {};
		var quadGeom = new THREE.PlaneBufferGeometry(1, 1);
		function displayText(text, options) {
			options = options || {};
			for (var kwarg in DEFAULT_OPTIONS) {
				if (options[kwarg] === undefined) options[kwarg] = DEFAULT_OPTIONS[options[kwarg]];
			}
			var mesh = textMeshes[{text, options}.toString()];
			if (!mesh) {
				mesh = new THREE.Mesh(quadGeom);
				if (options.coordSystem === 'local') {
					options.object.add(mesh);
					mesh.position.fromArray(options.position);
					//mesh.rotation.fromArray(options.rotation);
				}
			}
		}
		return displayText;
	} )();

	var logFPS = ( function () {
		var tLogFPS = 1000;
	    var fpsCount = 0;
	    // setInterval(logFPS, tLogFPS);
	    function logFPS() {
	        console.log('FPS: ' + (frameCount - fpsCount) * (1000 / tLogFPS));
	        fpsCount = frameCount;
	    }
	    return logFPS;
	} )();

	return {
		ObjectSelector: ObjectSelector,
		displayText: displayText,
		logFPS: logFPS
	};

} )();
