
const Main = Rectangle.createComponent(window.mainTemplate,['a','b','c', /*propTypes*/],(context) => {

	// `this` is the react `lifecycle` object, on which all the lifecycle events are defined.
	// `context` is the state,props combined. It is the only stuff available in template. 
	// All props are Object.assign()'ed in the context. these are mutable and triggeres update when mutated.
	// 
	
})