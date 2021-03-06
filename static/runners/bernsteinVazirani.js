/*
 * Bernstein-Vazirani Algorithm:
 * Given f: f(x) = x.u, determine u.
 */

function bernsteinVazirani(f, numbits) {
//    Create a |-> state as the target qubit.
    var targetQubit = new Q("|0>").subtract(new Q("|1>")).normalize();
    var inputQubits = new Q.QState(numbits);
    var initialState = inputQubits.tensorProduct(targetQubit);

    var inputBits = {from: 1, to: numbits};
    var targetBit = 0;
    return initialState
        .hadamard(inputBits)
        .applyFunction(inputBits, targetBit, f)
        .hadamard(inputBits)
        .measure(inputBits)
        .asBitString();
}

function createHiddenStringFunction(hiddenString) {
    var hiddenStringAsNumber = parseInt(hiddenString, 2);
    return function(x) {
        var product = x & hiddenStringAsNumber;
        var result = 0;
        while (product > 0) {
            if (product % 2 === 1) result++;
            product = product >> 1;
        }
        return result;
    }
}

var f = createHiddenStringFunction("01101");
console.log("Hidden string is: " + bernsteinVazirani(f, 5));
