"use strict"

const {
	isUnsupportedNative,
	getNativeType,
	isFunction,
} = require('./src/utils');

let objectMap = new Map();

function WatchO(object, config) {

	if (isWatchable(object)) {
		return object;
	}
	if (objectMap.has(object)) {
		let watchO = objectMap.get(object);
		// watchO._reshape(object);
		return watchO
	}

	if (object && typeof object != "object")
		throw new TypeError(
			"Expected an object as first parameter, got "
			+ (typeof object))
	if(isUnsupportedNative(object)) {
		throw new TypeError(
			"Expected a non-native object. Native types are not supported at the moment. got "
			+ getNativeType(object))
	}
	let reactiveObj;
	let closureFields;

	let listeners = new Set(); // parents
	let lastKnownKeys = new Set(); // properties
	let watchableChildren = new Map();
	let isActive = true;

	let pendingDespatch = null;
	let pendingDiff = {};
	let pendingHistory = [];
	let nudgeWatcher = function nudgeWatcher( diff, action) {

		if (diff) {
			action = action || "update";
			if (action == "update" || action == "add") Object.assign(pendingDiff, diff);
			if (action == "delete" && Array.isArray(diff)) {
				diff.forEach(field => { pendingDiff[field] = undefined; })
			}
			
			if(config && config.log)
				pendingHistory.push({ action: diff })
		}

		// A function invokation should not cause a nudge. 
		// A nudge will already be pending if the function modifies a field. 
		//If not, it shouldn't nudge
		if (action == 'invoke' ) return;

		//If already pending, return
		if (pendingDespatch !== null) {
			return;
		}

		pendingDespatch = setTimeout(() => {

			adaptStructChanges(reactiveObj, reactiveObj, closureFields);
			Object.freeze(pendingDiff);
			listeners.forEach(listener => listener(pendingDiff, reactiveObj))
			pendingDespatch = null;
			pendingDiff = {}
		}, 0)
	}

	let onNotify = function onNotify(diff, original) {
		// do something when a nudge is received from a child watchable
		if (!diff) return nudgeWatcher();
		watchableChildren.forEach((watchable, key) => {
			if (watchable === original)
				nudgeWatcher( { [key]: diff });
			return;
		})
	}

	let destroy = function destroy() {
		watchableChildren.forEach((watchable, key) => {
			watchable._detachListener(onNotify);
		})
		isActive = false;
	}


	let activateIfDead = function activateIfDead() {
		if (isActive || listeners.size == 0) return;
		watchableChildren.forEach((watchable, key) => {
			watchable._attachListener(onNotify)
		})
		isActive = true;
	}

	watchableChildren.$remove = (key) => {
		watchableChildren.get(key)._detachListener(onNotify)
		watchableChildren.delete(key);
	}

	watchableChildren.$add = (key, value) => {
		value._attachListener(onNotify)
		watchableChildren.set(key, value);
	}

	closureFields = {
		
		get isActive() { return isActive; },
		object,
		listeners,
		lastKnownKeys,
		watchableChildren,
		nudgeWatcher,
		onNotify,
		activateIfDead,
		destroy,
	}

	reactiveObj = generateReactiveStub(object, closureFields);

	objectMap.set(object, reactiveObj);
	adaptStructChanges(object, reactiveObj, closureFields);
	return reactiveObj;
}


function adaptStructChanges(currentState, reactiveObj, closureFields) {

	let deletedFields = []
	let { lastKnownKeys, watchableChildren, object: baseObject } = closureFields;
	let currentKeys = new Set(Object.getOwnPropertyNames(currentState));

	// to make all enumerable objects in prototype chain trackable
	/* for (let key in currentState) {
		currentKeys.add(key);
	} */

	// first detatch removed items
	lastKnownKeys.forEach(key => {
		if (currentKeys.has(key)) { // if both set have them, its not a interesting key.
			currentKeys.delete(key);

			// if a watchable exists in the object-tree but not in watchableChildren, add it.
			if (isWatchable(baseObject[key]) && !watchableChildren.has(key)) {
				watchableChildren.$add(key, baseObject[key]);
			}
		} else {
			delete reactiveObj[key];
			lastKnownKeys.delete(key);
			if (watchableChildren.has(key)) {
				watchableChildren.$remove(key)
			}
			deletedFields.push(key);
		}
		let propDesc = Object.getOwnPropertyDescriptor(reactiveObj, key);
		if (propDesc && !propDesc.configurable)
			throw new TypeError(`Could not modify PropertyDescriptor in currect state at object.${key}`)
	})

	if (deletedFields.length) closureFields.nudgeWatcher( deletedFields, 'delete')
	// attach new properties. everything left in currentKeys is new
	currentKeys.forEach(key => {
		let propDescriptor = Object.getOwnPropertyDescriptor(currentState, key)

		animateField(reactiveObj, key, propDescriptor, closureFields)
		lastKnownKeys.add(key);
	})
}


function animateField(reactiveObj, fieldName, propDescriptor, closureFields) {

	propDescriptor.configurable = true;
	let origVal = propDescriptor.value;
	let value = origVal;

	// if (Object.hasOwnProperty(reactiveObj, fieldName)) delete reactiveObj[fieldName];

	if (isFunction(value)) {
		propDescriptor.value = value = setApplyTrap(value, reactiveObj, closureFields)
	}
	else if (typeof value == "object" && !isUnsupportedNative(value)) {
		propDescriptor.value = value = WatchO(value); // Watchable will return same object if the baseobject is already a watchable
		closureFields.watchableChildren.$add(fieldName, value);
	}
	Object.defineProperty(closureFields.object, fieldName, propDescriptor);

	let watchoPropDescriptor = {
		enumerable: true,
		configurable: true
	}

	watchoPropDescriptor.set = (val) => {

		closureFields.activateIfDead();
		if (!propDescriptor.writable && !propDescriptor.get && !propDescriptor.set) return;
		let oldVal = closureFields.object[fieldName];
		let newVal = val;
		if (isFunction(val)) {
			if (val == oldVal || val == oldVal.prototype) return;
			newVal = setApplyTrap(val, reactiveObj, closureFields)
		}
		else if (typeof val == "object") {
			newVal = WatchO(val); // Watchable will return same object if the baseobject is already a watchable
			if (oldVal == newVal) return;
			closureFields.watchableChildren.$add(fieldName, newVal);
		}
		if (isWatchable(oldVal)) {
			closureFields.watchableChildren.$remove(fieldName, oldVal);
		}
		if (newVal === oldVal) return;
		closureFields.object[fieldName] = newVal;
		closureFields.nudgeWatcher({ [fieldName]: newVal });
	}

	watchoPropDescriptor.get = () => {
		closureFields.activateIfDead();
		return closureFields.object[fieldName];
	}
	Object.defineProperty(reactiveObj, fieldName, watchoPropDescriptor)
	closureFields.nudgeWatcher( { [fieldName]: origVal }, 'add')
}

function setApplyTrap(fn, context, closureFields) {
	// equivalent of `apply` trap
	let boundFn = fn.bind(context);
	let wrappedFn = (...args) => {
		let result = boundFn(...args);
		closureFields.nudgeWatcher("Function "+fn.name+"()", 'invoke');
		return result;
	}

	Object.defineProperty(wrappedFn, "prototype", { configurable: false, enumerable: false, value: fn })
	return wrappedFn
}
function isWatchable(object) {
	return object && object.WatchO == WatchO;
}


function generateReactiveStub(prototype,closureFields) {

	let inheritedProto = Object.create(prototype);
	Object.defineProperty(inheritedProto, 'WatchO', { value: WatchO})
		
	Object.defineProperty(inheritedProto, '_attachListener', {
		value: function _attachListener(listener, optionalListOfFieldsToListen) {
			// `optionalListOfFieldsToListen` if given, call listener only if a field in list is updated. TO.DO
			if (isFunction(listener)) {
				closureFields.listeners.add(listener);
				// return closureFields.object;
			}
		}
	})

	Object.defineProperty(inheritedProto, '_detachListener', {
		value: function _detachListener(listener) {
			if (isFunction(listener))
				closureFields.listeners.delete(listener);
			if (closureFields.listeners.size == 0)
				closureFields.destroy();
		}
	})

	Object.defineProperty(inheritedProto, '_nudge', {
		value: function _nudge() {
			closureFields.nudgeWatcher();
		}
	})

	Object.defineProperty(inheritedProto, '_reshape', {
		value: function _reshape(object) {
			closureFields.destroy();
			closureFields.watchableChildren.clear();
			closureFields.lastKnownKeys.clear();
			Object.getOwnPropertyNames(reactiveObj).forEach(key => delete reactiveObj[key])

			adaptStructChanges(object, reactiveObj, closureFields);
			if (objectMap.get(object) != reactiveObj)
				throw "Warning!! calling _reshape with any object other than the base object is discouraged. However, calling _reshape wrapped in a try-catch will yield the desired result."
		}
	})

	let reactiveObj = Object.create(inheritedProto);
	return reactiveObj;
}


try {
	window.Rectangle.WatchO = WatchO
} catch (e) { module.exports = WatchO }
