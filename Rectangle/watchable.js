//let utils = require('./utils')



window.Rectangle = window.Rectangle || {}

window.Rectangle.watchable = function Watchable(object) {

	let reactiveObj;

	let blockDespatch = false;
	let listeners = new Set();
	let reference = new Set();
	let despatchChanges = function despatchChanges() {
		adaptStructChanges(reactiveObj, reference);
		// listeners.forEach
	}

	let closureFields = {
		set blockDespatch(val) { blockDespatch = val },
		get blockDespatch() { return blockDespatch; },
		listeners,
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

function adaptStructChanges(currentObj, lastKnownKeySet) {
	let temporarySet = new Set();
	for(let key in currentObj) {
		if(lastKnownKeySet.has(key)) {
			temporarySet.add(key) ************ blah blah..
			2 settum test cheythittu mutually exclusive aayitollathokke address cheyyanam
		}
	}
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
			// DO NOT DESTROY if there are listeners attached to this object.
			// Re-attach if any new operation happens on this Object or a new listener attaches.
			// This should be a temporary unlinked state.
			// ENSURE THAT ALL REFERENCES (outside of Rectangle) CALL THIS BEFORE CLEARING THEIR REFERENCES

		}
	})

	return reactiveObj;
}