var expect = require('chai').expect;

let WatchO = require('../index');

describe("WatchO()", function () {
	let baseObj = {
		foo: 1,
		invoke: fn => fn(),
		// get drake() { return "ramoray "+this.foo}
	}

	let a = WatchO(baseObj)

	it("Should return a pseudo Object that behaves same as the base class.", () => {
		expect(a).to.be.instanceof(WatchO)
		expect(a.foo).to.equal(baseObj.foo)

		//more tests needed
	})

	it("Should should return same WatchO instance when repeatedly called with same baseObject", () => {

		let base = {};
		let watchable1 = WatchO(base);
		let watchable2 = WatchO(base);

		expect(watchable1).equals(watchable2);
	})

	it("Should throw type error if base class " +
		"has non-configurable propertyDescriptor " +
		"with getters or setters",
		() => {
			let baseObjWithNonConfigurableSetter = {};
			Object.defineProperty(baseObjWithNonConfigurableSetter, 'foo', {
				get: () => 55,
				set: () => { },
				configurable: false,
				enumerable: true
			})

			expect(WatchO.bind(null, baseObjWithNonConfigurableSetter)).to.throw(TypeError);

			baseObjWithNonConfigurableSetter = {}
			Object.defineProperty(baseObjWithNonConfigurableSetter, 'quaz', {
				get: () => 55,
				set: () => { },
				configurable: false,
				enumerable: false
			})

			expect(WatchO.bind(null, baseObjWithNonConfigurableSetter)).to.throw(TypeError);
		})
});



describe("WatchO {object}", function () {
	baseObj = {
		foo: 1,
		quak: 2,
		invoke: fn => fn(),
		// get drake() { return "ramoray "+this.foo}
	}
	let a = WatchO(baseObj)

	it("Should return the base class when an eventListener is registered.", () => {
		let cb = () => { }
		z = a._attachListener(cb);
		expect(z).to.equal(baseObj);
		a._detachListener(cb);
	})


	it("Should update values on set operation and call listeners.", () => {
		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)
		let newValue = 35;
		a.foo = newValue;


		expect(listenerCallCounter, "listner to be called on value changes").to.equal(1);
		expect(a.foo, "get operation a.foo should return the newly inserted value").to.equal(newValue)
		expect(a.foo, "get operation basecalss.foo should return newly inserted value").to.equal(newValue)

		a.invoke(() => { a.foo = 3; a.quak = 8 }) //normally this will call listeners twice.

		expect(listenerCallCounter, "invoking member functions should buffer despatches until it returns").greaterThan(1);
		expect(listenerCallCounter, "invoking member functions should group all despatches until it returns").not.greaterThan(2);

		a._detachListener(cb);
	})

	it("Can have new properties added from member functions and get listeners called in response .", () => {
		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		let newValue = { baz: 1, qux: 2 };

		a.car = "newCar";
		expect(
			listenerCallCounter,
			"listner not to be called when new property is added to a watchable object"
		).to.equal(0);

		a._nudge();
		expect(listenerCallCounter, "new property in the watchable object should be added during nudge call").to.equal(1)

		a.invoke(() => { a.bar = newValue })
		expect(
			listenerCallCounter,
			"new fields inserted from member functions should trigger listener calls"
		).to.equal(2)
		expect(a.bar, "A child object should be converted to WatchO")
			.to.be.instanceof(WatchO)

		listenerCallCounter = 0;
		a.bar = { baz: 1, qux: 2 };
		expect(listenerCallCounter, "listner to be called on value changes on a newly added field").to.equal(1);
		expect(a.bar, "A child object should be converted to WatchO").to.be.instanceof(WatchO)

		a.bar.baz++;
		expect(listenerCallCounter, "listner to be called on value changes on a child watchable").to.equal(2);

		a._detachListener(cb);
	})



	it("Should handle getters/setters in baseObj", () => {

		baseObj = {
			foo: 1,
			quak: 2,
			invoke: fn => fn(),
			get drake() { this.quake = 3; return "ramoray " + this.foo },
			set drake(value) { this.foo = value; }
		}

		let a = WatchO(baseObj)

		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		let temp = a.drake;
		expect(listenerCallCounter, "modifying a property in a getter in baseObj should call listener").to.equal(1);
		a.drake = 54;
		expect(listenerCallCounter, "modifying a property in a setter in baseObj should call listener").to.equal(3);
		expect(baseObj.foo, "modifying a property in a setter in baseObj should correctly modify properties in baseObj").to.equal(54);

		a._detachListener(cb);
	})


	it("Should handle non-enumerable own properties in baseObj", () => {


		let baseObjWithNonEnumerableProps = {};
		Object.defineProperty(baseObjWithNonEnumerableProps, 'foo', {
			value: 10,
			writable: true,
			configurable: false,
			enumerable: false
		})
		Object.defineProperty(baseObjWithNonEnumerableProps, 'bar', {
			value: 10,
			writable: false,
			configurable: false,
			enumerable: false
		})
		Object.defineProperty(baseObjWithNonEnumerableProps, 'baz', {
			get: () => 55,
			set: () => { },
			configurable: true,
			enumerable: false
		})


		let a = WatchO(baseObjWithNonEnumerableProps)

		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		a.foo = "new";
		expect(listenerCallCounter,
			"Should call listener when setting a value on non-enumerable field"
		).to.equal(1);


		a.baz = "new";
		expect(listenerCallCounter,
			"Should call listener when setting a value through setter on non-enumerable field"
		).to.equal(2);


		let temp = a.baz;
		expect(listenerCallCounter,
			"Should call listener when getting a value through getter on non-enumerable field"
		).to.equal(2);


		a._detachListener(cb);
	})



	it("Should handle non-writable properties in base object", () => {
		let baseObjWithNonWritableProps = {};

		Object.defineProperty(baseObjWithNonWritableProps, 'bar', {
			value: 10,
			writable: false,
			configurable: false,
			enumerable: false
		})
		Object.defineProperty(baseObjWithNonWritableProps, 'car', {
			value: 10,
		})

		let a = WatchO(baseObjWithNonWritableProps)

		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		expect(a.bar, "non writable properties should be readable").to.equal(10)
		a.bar = "new";
		expect(listenerCallCounter,
			"Should not call listener when setting a value on non-enumerable non-editable field"
		).to.equal(0);
		expect(a.bar, "non writable properties should not change value after set operation").to.equal(10)


		expect(a.car, "non writable properties should be readable").to.equal(10)
		a.car = "new";
		expect(listenerCallCounter,
			"Should not call listener when setting a value on non-enumerable non-editable field"
		).to.equal(0);
		expect(a.car, "non writable properties should not change value after set operation").to.equal(10)


	})

})


// #1  Handle non-enumerable immediate-child properties too.