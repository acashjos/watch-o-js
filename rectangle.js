// class RectangleComponent extends React.Component{
// 	constructor(template){

// 		if(this.constructor.name === "Rectangle"){ //simple function component
// 			fgdg
// 		}
// 	}

// 	render() {
// 		return <h1>Hello, {this.props.name}</h1>;
// 	  }

// }

window.Rectangle = window.Rectangle || {}

window.Rectangle.createComponent = function CreateComponent(template, proptypes, controller) {
	if (this.constructor.name == "CreateComponent") throw new TypeError("Rectangle.createComponent is a factory function. It should not be called with `new`");
	if (proptypes) {

		if (!controller) {
			controller = proptypes;
			delete proptypes;
		} else if (!Array.isArray(proptypes)) {
			throw new TypeError("expected proptypes (2nd param) to be an `Array`. Got " + (typeof proptypes))
		}
	}
	if (!isFunction(controller)) {
		throw new TypeError("expected controller (last param) to be a `Function`. Got " + (typeof controller))
	}


	const context = generateContext();
	let lifecycle = {}
	controller.bind(lifecycle)

}
window.Rectangle.Singleton = {};
window.Rectangle.UI = preact;

// https://stackoverflow.com/a/7356528/2605574
function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}


function generateContext() {
	if(typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1){

		return new Proxy({}, {
			set(target, key, val) {
				if (isFunction(val)) target[key] = new Proxy(val, {
					apply(target, thisVal, params) {
						let result = target.call(thisVal, ...params);
						// set state;

					}
				})
			}
		})
	}
	else {
		return {}
	}
}