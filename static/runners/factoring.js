/*
 * Shor's factoring algorithm.
 * See https://cs.uwaterloo.ca/~watrous/lecture-notes/519/11.pdf
 */

function computeOrder(a, n, numOutBits, callback) {
    var numInBits = 2 * numOutBits;
    var inputRange = Math.pow(2,numInBits);
    var outputRange = Math.pow(2,numOutBits);
    var accuracyRequiredForContinuedFraction = 1/(2 * outputRange * outputRange);
    var outBits = {from: 0, to: numOutBits - 1};
    var inputBits = {from: numOutBits, to: numOutBits + numInBits - 1};
    var attempts = 0;
    var bestSoFar = 1;
    var f = function(x) { return Q.powerMod(a, x, n); }
    var f0 = f(0);

    // This function contains the actual quantum computation part of the algorithm.
    // It returns either the frequency of the function f or some integer multiple (where "frequency" is the number of times the period of f will fit into 2^numInputBits)
    function determineFrequency(f) {
        var qstate = new Q.QState(numInBits + numOutBits).hadamard(inputBits);
        qstate = qstate.applyFunction(inputBits, outBits, f);
        // We do not need to measure the outBits, but it does speed up the simulation.
        qstate = qstate.measure(outBits).newState;
        return qstate.qft(inputBits).measure(inputBits).result;
    }

    // Determine the period of f (i.e. find r such that f(x) = f(x+r).
    function findPeriod() {

        // NOTE: Here we take advantage of the fact that, for Shor's algorithm, we know that f(x) = f(x+i) ONLY when i is an integer multiple of the rank r.
        if (f(bestSoFar) === f0) {
            Q.log("The period of " + a + "^x mod " + n + " is " + bestSoFar);
            callback(bestSoFar);
            return;
        }

        if (attempts === 2 * numOutBits) {
            Q.log("Giving up trying to find rank of " + a);
            callback("failed");
            return;
        }

        var sample = determineFrequency(f);

        // Each "sample" has a high probability of being approximately equal to some integer multiple of (inputRange/r) rounded to the nearest integer.
        // So we use a continued fraction function to find r (or a divisor of r).
        var continuedFraction = Q.continuedFraction(sample/inputRange, accuracyRequiredForContinuedFraction);
        // The denominator is a "candidate" for being r or a divisor of r (hence we need to find the least common multiple of several of these).
        var candidate = continuedFraction.denominator;
        Q.log("Candidate period from quantum fourier transform: " + candidate);
        // Reduce the chances of getting the wrong answer by ignoring obviously wrong results!
        if (candidate <= 1 || candidate > outputRange) {
            Q.log("Ignoring as candidate is out of range.");
        } else if (f(candidate) === f0) {
            bestSoFar = candidate;
        } else {
            var lcm = Q.lcm(candidate, bestSoFar);
            Q.log("Least common multiple of new candidate and best LCM so far: " + lcm);
            if (lcm > outputRange) {
                Q.log("Ignoring this candidate as the LCM is too large!")
            } else {
                bestSoFar = lcm;
            }
        }
        attempts++;
        Q.log("Least common multiple so far: " + bestSoFar + ". Attempts: " + attempts);
        // Yield control to give the browser a chance to log to the console.
        setTimeout(findPeriod, 50);
    }

    Q.log("Step 2: compute the period of " + a + "^x mod " + n);
    findPeriod();
}

function factor(n, callback) {

    var attempt = 0;
    var numOutBits = Math.ceil(Math.log(n)/Math.log(2));

    function attemptFactor() {
        if (attempt++ === 8) {
            callback("failed");
            return;
        }
        var randomChoice = 2 + Math.floor(Math.random() * (n - 2));
        Q.log("Step 1: chose random number between 2 and " + n + ".  Chosen: "  + randomChoice);
        var gcd = Q.gcd(randomChoice, n);
        if(gcd > 1) {
            Q.log("Lucky guess.  " + n + " and randomly chosen " + randomChoice + " have a common factor = " + gcd);
            callback(gcd);
            return;
        }

        computeOrder(randomChoice, n, numOutBits, function(r) {
            if (r !== "failed" && r % 2 !== 0) {
                Q.log('Need a period with an even number.  Sadly, ' + r + ' is not even.');
            } else if (r !== "failed" && r % 2 === 0) {
                var powerMod = Q.powerMod(randomChoice, r/2, n);
                var candidateFactor = Q.gcd(powerMod - 1, n);
                Q.log("Candidate Factor computed from period = " + candidateFactor);
                if(candidateFactor > 1 && n % candidateFactor === 0) {
                    callback(candidateFactor);
                    return;
                }
                Q.log(candidateFactor  + " is not really a factor.");
            }
            Q.log("Try again. (Attempts so far: " + attempt + ")");
            // Yield control to give the browser a chance to log to the console.
            setTimeout(function(){attemptFactor();}, 30)
        });
    }

    if (n % 2 === 0) {
        Q.log("Is even.  No need for any quantum computing!")
        callback(2);
        return;
    }

    var powerFactor = Q.powerFactor(n);
    if (powerFactor > 1) {
        Q.log("Is a power factor.  No need for anything quantum!")
        callback(powerFactor);
        return;
    }

    attemptFactor();
}

var n = prompt("Enter a product of two distinct primes: ", 35);

var startTime = new Date();
factor(n, function(result) {
    Q.log("One of the factors of " + n + " is " + result);
    Q.log("Time taken in seconds: " + ((new Date().getTime()) - startTime.getTime()) / 1000);
});