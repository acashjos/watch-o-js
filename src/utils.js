
let unsupportedNativeConstructors = [
	Array,
	Function,
	Number,
	Boolean,
	Error
]
try { unsupportedNativeConstructors.push(Symbol) } catch (e) { };
try { unsupportedNativeConstructors.push(Map) } catch (e) { };
try { unsupportedNativeConstructors.push(Set) } catch (e) { };
try { unsupportedNativeConstructors.push(WeakMap) } catch (e) { };
try { unsupportedNativeConstructors.push(WeakSet) } catch (e) { };
try { unsupportedNativeConstructors.push(ArrayBuffer) } catch (e) { };
try { unsupportedNativeConstructors.push(DataView) } catch (e) { };
try { unsupportedNativeConstructors.push(Promise) } catch (e) { };
try { unsupportedNativeConstructors.push(Generator) } catch (e) { };
try { unsupportedNativeConstructors.push(GeneratorFunction) } catch (e) { };
try { unsupportedNativeConstructors.push(RegExp) } catch (e) { };

try {
	unsupportedNativeConstructors.push(
		WebAssembly.Module,
		WebAssembly.Instance,
		WebAssembly.Memory,
		WebAssembly.Table,
)
} catch (e) { };

try {
	unsupportedNativeConstructors.push(
		Intl.Collator,
		Intl.DateTimeFormat,
		Intl.NumberFormat,
)
} catch (e) { };

try {
	unsupportedNativeConstructors.push(
		Int8Array,
		Uint8Array,
		Uint8ClampedArray,
		Int16Array,
		Uint16Array,
		Int32Array,
		Uint32Array,
		Float32Array,
		Float64Array
	)
} catch (e) { };

function isUnsupportedNative(obj) {
	return unsupportedNativeConstructors.some(constructor => obj instanceof constructor)
}

function getNativeType(obj) {
	let type = unsupportedNativeConstructors.find(constructor => obj instanceof constructor)
	if (type) return type.name;
	return 'Object';

}

function isFunction(functionToCheck) {
	// https://stackoverflow.com/a/7356528/2605574
	// var getType = {};
	// return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	return typeof functionToCheck === 'function';
}

module.exports = {
	isUnsupportedNative,
	getNativeType,
	isFunction,
}