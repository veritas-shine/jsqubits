/**
 * Grover's search algorithm.
 * See http://en.wikipedia.org/wiki/Grover's_algorithm
 */

var numBits = 8;
var range = 1 << numBits;
var inputBits = {from: 1, to: numBits};
var requiredNumberOfAmplifications = Math.floor(Math.sqrt(range) * Math.PI / 4);
var attempts = 0;

function search(f, callBack) {
    if (attempts === 6) {
        Q.log("Giving up after " + attempts + " attempts");
        callBack("failed");
        return;
    }
    attempts++;

    var qstate = new Q.QState(numBits).tensorProduct(new Q("|1>")).hadamard(Q.ALL);
    var amplications = 0;

    function amplify() {
        if (amplications++ === requiredNumberOfAmplifications ) {
            var result = qstate.measure(inputBits).result;
            if (f(result) === 1) {
                callBack(result);
                return;
            }
            Q.log("Failed result: " + result);
            search(f, callBack);
            return;
        }
        // Phase flip the target.
        qstate = qstate.applyFunction(inputBits, 0, f);
        // Reflect about the mean
        qstate = qstate.hadamard(inputBits).applyFunction(inputBits, 0, function(x){return x === 0 ? 1 : 0;}).hadamard(inputBits);
        Q.log("Amplified " + amplications + " times.");
        setTimeout(amplify, 50);
    }

    amplify();
}

var f = promptForFunction("Enter a function: f(x) = 1 for only one x less than " + range + " and f(x) = 0 otherwise",
            "function(x) {return x === 97 ? 1 : 0;}");

var startTime = new Date();
search(f, function(result) {
    Q.log("The desired value is " + result);
    Q.log("Time taken in seconds: " + ((new Date().getTime()) - startTime.getTime()) / 1000);
});