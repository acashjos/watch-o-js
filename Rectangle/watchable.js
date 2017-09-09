let utils = require('./utils')

// CHILD-UPDATE-HANDLER  is the placeholder for a closure-global function 
// which receives a nudge whenever a child watchable has changed.
// This calls despatch thus forwarding the nudge to all parents holding a reference to this.


function Watchable(object, optionalDefaultListener, optionalListOfFieldsToListen) {
	// optionalDefaultListener will be added as the first listener - TO.DO
	if(isWatchable(object)) {
		//if optionalDefaultListener, optionalListOfFieldsToListen are given,
		// attach them on the watchable TO.DO
		return object;
	}
	let reactiveObj;
	let closureFields;

	let blockDespatch = false;
	let hasPendingDespatch = false;
	let listeners = new Set(); // parents
	let lastKnownKeys = new Set(); // properties
	let watchableChildren = new Map();

	let nudgeWatcher = function nudgeWatcher() {
		if (blockDespatch) {
			hasPendingDespatch = true;
			return;
		}
		adaptStructChanges(reactiveObj, closureFields);
		let summary = []; // list of keys changed TO.DO
		listeners.forEach( listener => listener(summary))
	}

	closureFields = {
		object,
		set blockDespatch(val) { blockDespatch = val },
		get blockDespatch() { return blockDespatch; },
		get hasPendingDespatch() { return hasPendingDespatch; },
		listeners,
		lastKnownKeys,
		watchableChildren,
		nudgeWatcher,
	}
	reactiveObj = generateReactiveStub(closureFields)

	for (var key in object) {
		// if(object.hasOwnProperty(key)){
		animateField(reactiveObj, key, object[key],closureFields)
		lastKnownKeys.add(key);
		// }
	}

	return reactiveObj;
}

function adaptStructChanges(currentObj, closureFields) {

	let { lastKnownKeys, watchableChildren } = closureFields;
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

	let descriptor = {
		enumerable: true,
		configurable: true
	}

	if (Object.hasOwnProperty(parent, fieldName)) delete parent[fieldName]
	closureFields.object[fieldName] = value;

	if (utils.isFunction(value)) {
		closureFields.object[fieldName] = setApplyTrap(value, parent, closureFields)
	}
	else if( typeof value == "object") {
ithokke work cheyandonnu nokkanam............
		value = Watchable(value); // Watchable will return same object if the baseobject is already a watchable
		let baseClass = value._attachListener(CHILD - UPDATE - HANDLER)
		closureFields.watchableChildren.add(fieldName,value);
		closureFields.object[fieldName] = baseClass
	}
	// else TO.DO
	descriptor.set = (val) => {
		closureFields.object[fieldName] = val;

		if (utils.isFunction(value)) {
			closureFields.object[fieldName] = setApplyTrap(value, parent, closureFields)
		}
		closureFields.nudgeWatcher();
	}
	descriptor.get = () => {
		return closureFields.object[fieldName];
	}
	Object.defineProperty(parent, fieldName, descriptor)
}

function setApplyTrap(fn, context, closureFields) {
	// equivalent of `apply` trap
	let boundFn = fn.bind(context);
	return (...args) => {
		if (closureFields.blockDespatch) return boundFn(...args);
		closureFields.blockDespatch = true;
		let result = boundFn(...args);
		closureFields.blockDespatch = false;
		if (closureFields.hasPendingDespatch)
			closureFields.nudgeWatcher();
		return result;
	}
}
function isWatchable(object) {
	return object instanceof Watchable;
}
function generateReactiveStub(closureFields) {
	closureFields.blockDespatch = false;

	let reactiveObj = Object.create(Watchable.prototype);

	Object.defineProperty(reactiveObj, '_attachListener', {
		value: function _attachListener(listener, optionalListOfFieldsToListen) {
			// `optionalListOfFieldsToListen` if given, call listener only if a field in list is updated. TO.DO
			if (utils.isFunction(listener)){
				closureFields.listeners.add(listener);
				return closureFields.object;
			}
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


try{
	window.Rectangle.watchable = Watchable
}catch(e){ module.exports = Watchable}
