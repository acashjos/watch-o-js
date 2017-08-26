//let utils = require('./utils')

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

window.Rectangle.createComponent = function CreateComponent(template, proptypes, controller, lifecycleEvents) {
	({ template, proptypes, controller, lifecycleEvents } = verifyParams(this, arguments))

	let updateState = (state) => {
		// do something
	}

	function callInsideComponentConstructor(props,ctx) {
		const context = utils.hasNativeFeature(Proxy)
		? utils.generateProxyContext(updateState,props,ctx)
		: utils.generatePOJOContext(props,ctx);
		controller.bind(context)(context);

		sealContext(context)
	}

}

function expandProptypes(proptypes) {
	return {};
}

function sanitizeLifecycleEvts(lyfEvts) {
	return {};
}

function sealContext(context,updateState){
	if(!context._hasNoProxy) return; // Proxy will handle the rest.
	Object.keys(context).forEach( item => {
		if(utils.isFunction(context[item]) && !context[item]._isSealed){
			context[item] = (...args) => {
				let result = context[item].call(null,...args);
				updateState(context);
				return result;
			}
			Object.defineProperty(context[item],"_isSealed", {value:true})
		}
	})
}

function verifyParams(_this, args) {
	if (_this.constructor.name == "CreateComponent")
		throw new TypeError("Rectangle.createComponent is a factory function. It should not be called with `new`");

	if (args.length < 2)
		throw new TypeError("Rectangle.createComponent Expects atleast two parameters, 1: template, 2: controller");
	[template, proptypes, controller, lifecycleEvents] = args;

	if (args.length < 4 && utils.isFunction(proptypes)) {
		controller = proptypes;
		delete proptypes;
	} else {

	}

	if (!utils.isFunction(controller)) {
		throw new TypeError("Rectangle.createComponent expects a controller `Function` as 2nd parameter ( 3rd parameter if proptypes are included ). Got " + (typeof controller))
	}

	proptypes = expandProptypes(proptypes);
	lifecycleEvents = sanitizeLifecycleEvts(lifecycleEvents)
	// if (!expandedProps) {
	// 	throw new TypeError("expected proptypes (2nd param) to be an `Array`. Got " + (typeof proptypes))
	// }


	return {
		template, proptypes, controller, lifecycleEvents
	};
}

window.Rectangle.UI = preact;

