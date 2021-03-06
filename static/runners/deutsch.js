/*
 * Deutsch's Algorithm.
 * Determine the value of (f(0) + f(1)) mod 2 with a single invocation of f (where f is a single bit function)
 */

function deutsch(f) {
   return new Q('|01>').hadamard(Q.ALL).applyFunction(1, 0, f).hadamard(Q.ALL).measure(1).result;
};


var f = promptForFunction("Enter a function that maps {0,1} to {0,1}", "function(x) {return (x + 1) % 2;}");

console.log("(f(0) + f(1)) mod 2 = " + deutsch(f));