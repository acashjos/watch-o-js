
var expect = require('chai').expect;

let WatchO = require('../index');

let asyncify = function(watchO) {
	let resolver;
	return new Promise((res,rej) => {
		resolver = (diff,orig) => {
			res({diff,orig});
			watchO._detachListener(resolver);
		}
		watchO._attachListener(resolver)
	})
}
describe("WatchO Objects", () => {
	it("should call listener functions when a value changes", async () => {
		let watcho = WatchO({ foo: 1 });

		watcho.foo++;

		let {diff,orig} = await asyncify(watcho);
	})

	it("should be identical to base object", async () => {
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

		expect(obj1).deep.equals(baseObj);
		obj1.foo = 27;
		expect(obj1.foo, "get and set should work").equals(27);

		baseObj.newField = 333;
		delete baseObj.baz;
		obj1._nudge()

		let {diff,orig} = await asyncify(obj1);
		obj1._detachListener(arguments.callee);

		expect(obj1, "watcho object is not tracking the base object used for creation").not.deep.equals(baseObj);
		expect(obj1.newField, "... but changes to base object are still accessable").equals(baseObj.newField);


		let obj2 = WatchO(baseObj);
		expect(obj2, "WatchO called on same object always return same watcho Object").equals(obj1)

	})
})

describe("WatchO Listener callback", () => {
	it("should be called with a diff", async () => {
		let baseObj = {
			foo: 1,
			qabb: {
				dab: 22
			},
			maq: true,
			arr: [1,2,3]
		}

		let srcDiff = {
			foo: 2,
			qabb: {
				dab: 23
			}
		}

		let obj1 = WatchO(baseObj);
		let {diff,orig} = await asyncify(obj1);
		expect(obj1.arr,'unsupported Native types should not be modified').equals(baseObj.arr);
		Object.assign(obj1, srcDiff);
		({diff,orig} = await asyncify(obj1));

		obj1._detachListener(arguments.callee);
		expect(diff, "callback diff should match the applied change").deep.equals(srcDiff);
		expect(orig, "2nd param in callback shuld be the original watchable object").equals(obj1);

	})
})




describe("WatchO Arrays", () => {
	it("should pass Array.isArray", () => {
		let arr = []

		let obj1 = WatchO(arr);

		expect(Array.isArray(obj1)).to.be.true;

	})
})