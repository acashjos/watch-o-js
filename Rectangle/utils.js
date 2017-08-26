// https://stackoverflow.com/a/7356528/2605574
function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function hasNativeFeature(feature) {
	if (!hasNativeFeature.featureMap.has(feature))
		hasNativeFeature.featureMap.set(feature, (typeof feature !== "undefined" && feature.toString().indexOf("[native code]") !== -1));
	return hasNativeFeature.featureMap.get(feature);
};

hasNativeFeature.featureMap = new WeakMap();

function generateProxyContext(updateState,props,context) {
	let context = Object.create({},{
		props: { value: props},
		context: { value: context}
	 })

	return new Proxy(context, {
		set(target, key, val) {
			if (isFunction(val)) target[key] = new Proxy(val, {
				apply(target, thisVal, params) {
					let result = target.call(thisVal, ...params);
					updateState(context);
				}
			})
			else target[key] = val;
		}
	})
}

function generatePOJOContext(props,context) {

	let context = Object.create({ 
		_hasNoProxy: true
	 },{
		props: { value: props},
		context: { value: context}
	 })
	return context;
}

let utils = {isFunction,hasNativeFeature,generateProxyContext,generatePOJOContext}

// module.exports = utils;