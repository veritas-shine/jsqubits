/*
 * Super Dense Coding.
 * If Alice and Bob share a pair of entangled qubits, then Alice can encode two classical bits into her one entangled qubit,
 * send it to Bob, and Bob can decode it with the help of his entangled qubit.
 */

function superDense(input) {
    var state = new Q('|00>').add(new Q('|11>')).normalize();

    log("Initial Bell State: " + state);

//            Alice prepares her qbit
    var alice = 1;
    if (input.charAt(0) === '1') {
        state = state.z(alice);
    }
    if (input.charAt(1) === '1') {
        state = state.x(alice);
    }

    log("State after Alice prepares her qubit (the first one): " + state);
//            Alice sends her qbit to Bob
    var bob = 0;
    state = state.cnot(alice, bob).hadamard(alice);

    log("State after Bob receives Alice's qubit and 'decodes' it: " + state);
    return state.measure(Q.ALL).asBitString();
};

var input = prompt("Two bit string to send", "10");
var result = superDense(input);
Q.log("Decoded string is: " + result);