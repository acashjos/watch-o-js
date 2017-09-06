//let utils = require('./utils')



window.Rectangle = window.Rectangle || {}

window.Rectangle.watchable = function Watchable(object) {

	let reactiveObj = Object.create(Watchable.prototype);

	Object.defineProperty(reactiveObj, '__despatch__', {
		value: () => {

		}
	})
	for (var key in object) {
		// if(object.hasOwnProperty(key)){
		let descriptor = {}
		if(utils.isFunction(object[key])){
			let boundFn = object[key].bind(reactiveObj);
			descriptor.value = (...args) => {

				boundFn(...args)
			}
		}
		Object.defineProperty(reactiveObj, key, {
			set: () => {

			}
		})
		// }
	}
}