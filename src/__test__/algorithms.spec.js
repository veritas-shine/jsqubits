/**
 * Created by isaac on 10/05/2017.
 */
import Q from '../lib/Q';
var jsqubitsJasmineMatchers = require('./matchers');

describe('Complex', function() {

  beforeEach(function() {
    jasmine.addMatchers(jsqubitsJasmineMatchers);
  });

  describe('#deutsch', function() {
    it ('should ', function() {
      var f = function(x) {
        return (x + 1) % 2;
      };
      console.log("(f(0) + f(1)) mod 2 = " + Q.deutsch(f));
      expect(Q.deutsch(f)).toEqual(1);
    });
  });
});
