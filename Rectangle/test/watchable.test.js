var expect = require('chai').expect;

let Watchable = require('../watchable');

describe("Watchable", function() {
	baseclass= {foo:1}
	a=Watchable(baseclass)
	
	it("Should return a pseudo Object that behaves same as the base class.", () => {
		expect(a).to.be.instanceof(Watchable)
		expect(a.foo).to.equal(baseclass.foo)
	})
	it("Should return the base class when an eventListener is registered.", () => {
		let cb = ()=>{}
		z=a._attachListener(cb);
		expect(z).to.equal(baseclass);
		a._detachListener(cb);
	})


	it("Should update values on set operation and call listeners.", () => {
		let flag = false;
		let cb = () => flag = true;
		a._attachListener(cb)
		let newValue = 35;
		a.foo = newValue;
		expect(flag, "listner to be called on value changes").to.be.true;
		expect(a.foo, "get operation a.foo should return the newly inserted value").to.equal(newValue)
		expect(a.foo, "get operation basecalss.foo should return newly inserted value").to.equal(newValue)
	})
})
