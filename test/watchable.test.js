var expect = require('chai').expect;

let WatchO = require('../index');

describe("WatchO Objects", () => {
	it("should call listener functions when a value changes", (done) => {
		let watcho = WatchO({foo:1});
		watcho._attachListener(function (){
			watcho._detachListener(arguments.callee);
			done();
		})

		watcho.foo++;
	})

	it("should be identical to base object", (done) => {
		let baseObj = {
			foo: 1,
			bar: "string",
			baz: true,
			qabb: {
				dab: 22,
				melon: "pie"
			}
		}
		let obj1 = WatchO(baseObj);
		obj1._attachListener(function () {

			obj1._detachListener(arguments.callee);
			expect(obj1, "watcho object is not tracking the base object used for creation").not.deep.equals(baseObj);


			let obj2 = WatchO(baseObj);
			expect(obj2, "WatchO called on same object always return same watcho Object").equals(obj1)
			expect(obj2, "WatchO called on same object return same watcho Object after applying all changes in baseobject").deep.equals(baseObj);

			baseObj.tostring = function () {
				return this.foo + this.bar + this.qabb.dab
			}
			obj2 = WatchO(baseObj);
			expect(obj2.tostring()).equals(baseObj.tostring())
			done();
		})
		expect(obj1).deep.equals(baseObj);
		obj1.foo = 27;
		expect(obj1.foo,"get and set should work").equals(27);
		
		baseObj.newField = 333;
		delete baseObj.baz;
		obj1._nudge()

	})
})