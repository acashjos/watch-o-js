
let objectMap = new Map();

function WatchO(object, optionalDefaultListener, optionalListOfFieldsToListen) {
	// optionalDefaultListener will be added as the first listener - TO.DO
	if (isWatchable(object)) {
		//if optionalDefaultListener, optionalListOfFieldsToListen are given,
		// attach them on the watchable TO.DO
		return object;
	}
	if (objectMap.has(object)) {
		let watchO = objectMap.get(object);
		watchO._reshape(object);
		// Object.assign(watchO,object);
		return watchO
	}

	if (object && typeof object != "object")
		throw new TypeError(
			"Expected an object as first parameter, got "
			+ (typeof object))

	let reactiveObj;
	let baseObject = {};
	let closureFields;

	let blockDespatch = false;
	let hasPendingDespatch = false;
	let listeners = new Set(); // parents
	let lastKnownKeys = new Set(); // properties
	let watchableChildren = new Map();
	let isActive = true;

	let pendingDespatch = null;
	let nudgeWatcher = function nudgeWatcher(flag) {

		if (flag == 'ifpending' && pendingDespatch === null) return;

		//If already pending, return
		if (pendingDespatch !== null) {
			return;
		}

		pendingDespatch = setTimeout(() => {

			adaptStructChanges(reactiveObj, reactiveObj, closureFields);
			let summary = []; // list of keys changed TO.DO
			listeners.forEach(listener => listener(summary))
			pendingDespatch = null;
		}, 0)
	}

	let onNotify = function onNotify(summary) {
		// do something when a nudge is received from a child watchable
		nudgeWatcher();
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
		object: baseObject,
		set blockDespatch(val) { blockDespatch = val },
		get blockDespatch() { return blockDespatch; },
		// set isActive(val) { isActive = val; },
		get isActive() { return isActive; },
		get hasPendingDespatch() { return hasPendingDespatch; },
		listeners,
		lastKnownKeys,
		watchableChildren,
		nudgeWatcher,
		onNotify,
		activateIfDead,
		destroy,
	}

	reactiveObj = generateReactiveStub(closureFields);

	objectMap.set(object, reactiveObj);
	adaptStructChanges(object, reactiveObj, closureFields);
	return reactiveObj;
}


function adaptStructChanges(currentState, reactiveObj, closureFields) {

	let { lastKnownKeys, watchableChildren, object: baseObject } = closureFields;
	let currentKeys = new Set(Object.getOwnPropertyNames(currentState));

	for (let key in currentState) {
		currentKeys.add(key);
	}

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
		}
		let propDesc = Object.getOwnPropertyDescriptor(reactiveObj, key);
		if (propDesc && !propDesc.configurable)
			throw new TypeError(`Could not modify PropertyDescriptor in currect state at object.${key}`)
	})

	// attach new properties. everything left in currentKeys is new
	currentKeys.forEach(key => {
		let propDescriptor = Object.getOwnPropertyDescriptor(currentState, key)

		animateField(reactiveObj, key, propDescriptor, closureFields)
		lastKnownKeys.add(key);
	})
}


function animateField(reactiveObj, fieldName, propDescriptor, closureFields) {

	propDescriptor.configurable = true;
	let value = propDescriptor.value;

	// if (Object.hasOwnProperty(reactiveObj, fieldName)) delete reactiveObj[fieldName];

	if (isFunction(value)) {
		propDescriptor.value = value = setApplyTrap(value, reactiveObj, closureFields)
	}
	else if (typeof value == "object") {
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
			closureFields.watchableChildren.$add (fieldName, newVal);
		}
		if (isWatchable(oldVal)) {
			closureFields.watchableChildren.$remove(fieldName, oldVal);
		}
		if (newVal === oldVal) return;
		closureFields.object[fieldName] = newVal;
		closureFields.nudgeWatcher();
	}

	watchoPropDescriptor.get = () => {
		closureFields.activateIfDead();
		return closureFields.object[fieldName];
	}
	Object.defineProperty(reactiveObj, fieldName, watchoPropDescriptor)
}

function setApplyTrap(fn, context, closureFields) {
	// equivalent of `apply` trap
	let boundFn = fn.bind(context);

	let wrappedFn = (...args) => {
		let result = boundFn(...args);
		closureFields.nudgeWatcher("ifpending");
		return result;
	}

	Object.defineProperty(wrappedFn, "prototype", { configurable: false, enumerable: false, value: fn })
	return wrappedFn
}
function isWatchable(object) {
	return object instanceof WatchO;
}

// https://stackoverflow.com/a/7356528/2605574
function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}


function generateReactiveStub(closureFields) {
	closureFields.blockDespatch = false;

	let inheritedProto = Object.create(WatchO.prototype);

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
