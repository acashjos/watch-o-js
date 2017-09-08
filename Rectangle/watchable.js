//let utils = require('./utils')

// CHILD-UPDATE-HANDLER  is the placeholder for a closure-global function 
// which receives a nudge whenever a child watchable has changed.
// This calls despatch thus forwarding the nudge to all parents holding a reference to this.

window.Rectangle = window.Rectangle || {}

window.Rectangle.watchable = function Watchable(object, optionalDefaultListener) {
	// optionalDefaultListener will be added as the first listener - TO.DO

	let reactiveObj;
	let closureFields;

	let blockDespatch = false;
	let listeners = new Set(); // parents
	let lastKnownKeySet = new Set(); // properties
	let watchableChildren = new Map();

	let despatchChanges = function despatchChanges() {
		adaptStructChanges(reactiveObj, closureFields);
		// listeners.forEach
	}

	closureFields = {
		set blockDespatch(val) { blockDespatch = val },
		get blockDespatch() { return blockDespatch; },
		listeners,
		lastKnownKeySet,
		watchableChildren,
		despatchChanges,
	}
	reactiveObj = generateReactiveStub(closureFields)

	for (var key in object) {
		// if(object.hasOwnProperty(key)){
		animateField(reactiveObj, key, object[key])
		reference.add(key);
		// }
	}
}

function adaptStructChanges(currentObj, closureFields) {

	let {lastKnownKeys, watchableChildren} = closureFields;
	let currentKeys = new Set();

	for (let key in currentObj) {
		currentKeys.add(key);
	}

	// first detatch removed items
	lastKnownKeys.forEach(key => {
		if (currentKeys.has(key)) { // if both set have them, its not a interesting key.
			currentKeys.delete(key);
		} else {
			lastKnownKeys.delete(key);
			if (watchableChildren.has(key)) {
				watchableChildren.get(key)._detachListener(CHILD - UPDATE - HANDLER);
				watchableChildren.delete(key)
			}
		}
	})
	// attach new properties. everything left in currentKeys is new
	currentKeys.forEach(key => {
		animateField(currentObj, key, currentObj[key], closureFields)
	})
}

function animateField(parent, fieldName, value, closureFields) {

	let descriptor = {}
	if (utils.isFunction(value)) {
		let boundFn = value.bind(parent);
		descriptor.value = (...args) => {
			if (closureFields.blockDespatch) return boundFn(...args);
			closureFields.blockDespatch = true;
			let result = boundFn(...args);
			closureFields.blockDespatch = false;
			closureFields.despatchChanges();
			return result;
		}
	}
	// else TO.DO
	Object.defineProperty(parent, fieldName, {
		set: () => {

		}
	})
}

function generateReactiveStub(closureFields) {
	closureFields.blockDespatch = false;

	let reactiveObj = Object.create(Watchable.prototype);

	Object.defineProperty(reactiveObj, '_attachListener', {
		value: function _attachListener(listener) {
			if (utils.isFunction(listener))
				closureFields.listeners.add(listener);
		}
	})


	Object.defineProperty(reactiveObj, '_detachListener', {
		value: function _detachListener(listener) {
			if (utils.isFunction(listener))
				closureFields.listeners.delete(listener);
		}
	})


	Object.defineProperty(reactiveObj, '_destroy', {
		value: function _destroy(listener) {
			// loop through all children Watchables and call detach on them.
			// This is crusial to avoid trapping references to dead parents.
			// DO NOT DESTROY if there are listeners attached to this object, EXCEPT optionalDefaultListener
			// Re-attach if any new operation happens on this Object or a new listener attaches.
			// This should be a temporary unlinked state.
			// ENSURE THAT ALL REFERENCES (outside of Rectangle) CALL THIS BEFORE CLEARING THEIR REFERENCES

		}
	})

	return reactiveObj;
}