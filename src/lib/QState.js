/**
 * Created by isaac on 10/05/2017.
 */
import {
  validateArgs,
  parseBitString,
  sparseAssign,
  convertBitQualifierToBitArray,
  createBitMask,
  validateControlAndTargetBitsDontOverlap,
  convertBitQualifierToBitRange,
  chooseRandomBasisState
} from './utils';
import Complex from './Complex';
import AmplitudeState from './AmplitudeState';
import Measurement from './Measurement';
import Q from './Q';

function validateTargetBitRangesDontOverlap(controlBits, targetBits) {
  if ((controlBits.to >= targetBits.from) && (targetBits.to >= controlBits.from)) {
    throw new Error('control and target bits must not be the same nor overlap');
  }
}

// for `toString`
//
function formatAmplitude(amplitude, formatFlags) {
  const amplitudeString = amplitude.format(formatFlags);
  return amplitudeString === '1' ? '' : `${amplitudeString} `;
}

function compareStatesWithAmplitudes(a, b) {
  return a.asNumber() - b.asNumber();
}

function sortedNonZeroStates(qState) {
  const nonZeroStates = [];
  qState.each((stateWithAmplitude) => {
    nonZeroStates.push(stateWithAmplitude);
  });
  nonZeroStates.sort(compareStatesWithAmplitudes);
  return nonZeroStates;
}

//        Note this could actually be implemented as controlledR(controlBits, targetBits, PI/4)
const expPiOn4 = new Complex(Math.SQRT1_2, Math.SQRT1_2);

export default class QState {

  constructor(numBits, amplitudes) {
    validateArgs(arguments, 1, 'new QState() must be supplied with number of bits (optionally with amplitudes as well)');
    amplitudes = amplitudes || [Complex.ONE];
    this._nb = numBits;
    this._amplitudes = amplitudes;
  }

  numBits() {
    return this._nb;
  }

  amplitude(basisState) {
    validateArgs(arguments, 1, 1, 'Must supply an index to amplitude()');
    const numericIndex = (typeof basisState === 'string') ? parseBitString(basisState).value : basisState;
    return this._amplitudes[numericIndex] || Complex.ZERO;
  }

  each(callBack) {
    validateArgs(arguments, 1, 1, 'Must supply a callback function to each()');
    for (const index in this._amplitudes) {
      if (this._amplitudes.hasOwnProperty(index)) {
        const returnValue = callBack(new AmplitudeState(this._nb, index, this._amplitudes[index]));
        // NOTE: Want to continue on void and null returns!
        if (returnValue === false) break;
      }
    }
  }

  multiply(amount) {
    if (typeof amount === 'number') {
      amount = Complex.real(amount);
    }
    const amplitudes = {};
    this.each((oldAmplitude) => {
      amplitudes[oldAmplitude.index] = oldAmplitude.amplitude.multiply(amount);
    });
    return new QState(this.numBits(), amplitudes);
  }

  add(otherState) {
    const amplitudes = {};
    this.each((stateWithAmplitude) => {
      amplitudes[stateWithAmplitude.index] = stateWithAmplitude.amplitude;
    });
    otherState.each((stateWithAmplitude) => {
      const existingValue = amplitudes[stateWithAmplitude.index] || Complex.ZERO;
      amplitudes[stateWithAmplitude.index] = stateWithAmplitude.amplitude.add(existingValue);
    });
    return new QState(this.numBits(), amplitudes);
  }

  subtract(otherState) {
    return this.add(otherState.multiply(-1));
  }

  tensorProduct(otherState) {
    const amplitudes = {};
    this.each((basisWithAmplitudeA) => {
      otherState.each((otherBasisWithAmplitude) => {
        const newBasisState = (basisWithAmplitudeA.asNumber() << otherState.numBits()) + otherBasisWithAmplitude.asNumber();
        const newAmplitude = basisWithAmplitudeA.amplitude.multiply(otherBasisWithAmplitude.amplitude);
        amplitudes[newBasisState] = newAmplitude;
      });
    });
    return new QState(this.numBits() + otherState.numBits(), amplitudes);
  }

  controlledHadamard(controlBits, targetBits) {
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to controlledHadamard()');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      const newAmplitudeOf0 = amplitudeOf0.add(amplitudeOf1).multiply(Complex.SQRT1_2);
      const newAmplitudeOf1 = amplitudeOf0.subtract(amplitudeOf1).multiply(Complex.SQRT1_2);
      return {amplitudeOf0: newAmplitudeOf0, amplitudeOf1: newAmplitudeOf1};
    });
  }

  hadamard(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to hadamard() as either a single index or a range.');
    return this.controlledHadamard(null, targetBits);
  }

  controlledXRotation(controlBits, targetBits, angle) {
    validateArgs(arguments, 3, 3, 'Must supply control bits, target bits, and an angle, to controlledXRotation()');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      const halfAngle = angle / 2;
      const cos = Complex.real(Math.cos(halfAngle));
      const nisin = new Complex(0, -Math.sin(halfAngle));
      const newAmplitudeOf0 = amplitudeOf0.multiply(cos).add(amplitudeOf1.multiply(nisin));
      const newAmplitudeOf1 = amplitudeOf0.multiply(nisin).add(amplitudeOf1.multiply(cos));
      return {amplitudeOf0: newAmplitudeOf0, amplitudeOf1: newAmplitudeOf1};
    });
  }

  rotateX(targetBits, angle) {
    validateArgs(arguments, 2, 2, 'Must supply target bits and angle to rotateX.');
    return this.controlledXRotation(null, targetBits, angle);
  }

  controlledYRotation(controlBits, targetBits, angle) {
    validateArgs(arguments, 3, 3, 'Must supply control bits, target bits, and an angle, to controlledYRotation()');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      const halfAngle = angle / 2;
      const cos = Complex.real(Math.cos(halfAngle));
      const sin = Complex.real(Math.sin(halfAngle));
      const newAmplitudeOf0 = amplitudeOf0.multiply(cos).add(amplitudeOf1.multiply(sin.negate()));
      const newAmplitudeOf1 = amplitudeOf0.multiply(sin).add(amplitudeOf1.multiply(cos));
      return {amplitudeOf0: newAmplitudeOf0, amplitudeOf1: newAmplitudeOf1};
    });
  }

  rotateY(targetBits, angle) {
    validateArgs(arguments, 2, 2, 'Must supply target bits and angle to rotateY.');
    return this.controlledYRotation(null, targetBits, angle);
  }

  controlledZRotation(controlBits, targetBits, angle) {
    validateArgs(arguments, 3, 3, 'Must supply control bits, target bits, and an angle to controlledZRotation()');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      const halfAngle = angle / 2;
      const cos = Complex.real(Math.cos(halfAngle));
      const isin = new Complex(0, Math.sin(halfAngle));
      const newAmplitudeOf0 = amplitudeOf0.multiply(cos.subtract(isin));
      const newAmplitudeOf1 = amplitudeOf1.multiply(cos.add(isin));
      return {amplitudeOf0: newAmplitudeOf0, amplitudeOf1: newAmplitudeOf1};
    });
  }

  rotateZ(targetBits, angle) {
    validateArgs(arguments, 2, 2, 'Must supply target bits and angle to rotateZ.');
    return this.controlledZRotation(null, targetBits, angle);
  }

  controlledR(controlBits, targetBits, angle) {
    validateArgs(arguments, 3, 3, 'Must supply control and target bits, and an angle to controlledR().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      const cos = Complex.real(Math.cos(angle));
      const isin = new Complex(0, Math.sin(angle));
      const newAmplitudeOf0 = amplitudeOf0;
      const newAmplitudeOf1 = amplitudeOf1.multiply(cos.add(isin));
      return {amplitudeOf0: newAmplitudeOf0, amplitudeOf1: newAmplitudeOf1};
    });
  }

  r(targetBits, angle) {
    validateArgs(arguments, 2, 2, 'Must supply target bits and angle to r().');
    return this.controlledR(null, targetBits, angle);
  }

  controlledX(controlBits, targetBits) {
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to cnot() / controlledX().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      return {amplitudeOf0: amplitudeOf1, amplitudeOf1: amplitudeOf0};
    });
  }

  x(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to x() / not().');
    return this.controlledX(null, targetBits);
  }

  controlledY(controlBits, targetBits) {
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to controlledY().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      return {
        amplitudeOf0: amplitudeOf1.multiply(new Complex(0, -1)),
        amplitudeOf1: amplitudeOf0.multiply(new Complex(0, 1))
      };
    });
  }

  y(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to y().');
    return this.controlledY(null, targetBits);
  }

  controlledZ(controlBits, targetBits) {
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to controlledZ().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      return {amplitudeOf0, amplitudeOf1: amplitudeOf1.negate()};
    });
  }

  z(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to z().');
    return this.controlledZ(null, targetBits);
  }

  controlledS(controlBits, targetBits) {
//        Note this could actually be implemented as controlledR(controlBits, targetBits, PI/2)
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to controlledS().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      return {amplitudeOf0, amplitudeOf1: amplitudeOf1.multiply(new Complex(0, 1))};
    });
  }

  s(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to s().');
    return this.controlledS(null, targetBits);
  }

  controlledT(controlBits, targetBits) {
    validateArgs(arguments, 2, 2, 'Must supply control and target bits to controlledT().');
    return this.controlledApplicatinOfqBitOperator(controlBits, targetBits, (amplitudeOf0, amplitudeOf1) => {
      return {amplitudeOf0, amplitudeOf1: amplitudeOf1.multiply(expPiOn4)};
    });
  }

  t(targetBits) {
    validateArgs(arguments, 1, 1, 'Must supply target bits to t().');
    return this.controlledT(null, targetBits);
  }

  controlledSwap(controlBits, targetBit1, targetBit2) {
    validateArgs(arguments, 3, 3, 'Must supply controlBits, targetBit1, and targetBit2 to controlledSwap()');
    const newAmplitudes = {};
    if (controlBits !== null) {
      controlBits = convertBitQualifierToBitArray(controlBits, this.numBits());
    }
//        TODO: make sure targetBit1 and targetBit2 are not contained in controlBits.
    const controlBitMask = createBitMask(controlBits);
    const bit1Mask = 1 << targetBit1;
    const bit2Mask = 1 << targetBit2;
    this.each((stateWithAmplitude) => {
      const state = stateWithAmplitude.asNumber();
      let newState = state;
      if (controlBits === null || ((state & controlBitMask) === controlBitMask)) {
        const newBit2 = ((state & bit1Mask) >> targetBit1) << targetBit2;
        const newBit1 = ((state & bit2Mask) >> targetBit2) << targetBit1;
        newState = (state & ~bit1Mask & ~bit2Mask) | newBit1 | newBit2;
      }
      newAmplitudes[newState] = stateWithAmplitude.amplitude;
    });
    return new QState(this.numBits(), newAmplitudes);
  }

  swap(targetBit1, targetBit2) {
    validateArgs(arguments, 2, 2, 'Must supply targetBit1 and targetBit2 to swap()');
    return this.controlledSwap(null, targetBit1, targetBit2);
  }


  /**
   * Toffoli takes one or more control bits (conventionally two) and one target bit.
   */
  toffoli(/* controlBit, controlBit, ..., targetBit */) {
    validateArgs(arguments, 2, 'At least one control bit and a target bit must be supplied to calls to toffoli()');
    const targetBit = arguments[arguments.length - 1];
    const controlBits = [];
    for (let i = 0; i < arguments.length - 1; i++) {
      controlBits.push(arguments[i]);
    }
    return this.controlledX(controlBits, targetBit);
  }

  static _applyToOneBit = (controlBits, targetBit, qbitFunction, qState) => {
    const newAmplitudes = {};
    const statesThatCanBeSkipped = {};
    const targetBitMask = 1 << targetBit;
    const controlBitMask = createBitMask(controlBits);
    qState.each(stateWithAmplitude => {
      const state = stateWithAmplitude.asNumber();
      if (statesThatCanBeSkipped[stateWithAmplitude.index]) return;
      statesThatCanBeSkipped[state ^ targetBitMask] = true;
      const indexOf1 = state | targetBitMask;
      const indexOf0 = indexOf1 - targetBitMask;
      if (controlBits === null || ((state & controlBitMask) === controlBitMask)) {
        const result = qbitFunction(qState.amplitude(indexOf0), qState.amplitude(indexOf1));
        sparseAssign(newAmplitudes, indexOf0, result.amplitudeOf0);
        sparseAssign(newAmplitudes, indexOf1, result.amplitudeOf1);
      } else {
        sparseAssign(newAmplitudes, indexOf0, qState.amplitude(indexOf0));
        sparseAssign(newAmplitudes, indexOf1, qState.amplitude(indexOf1));
      }
    });

    return new QState(qState.numBits(), newAmplitudes);
  };

  controlledApplicatinOfqBitOperator(controlBits, targetBits, qbitFunction) {
    validateArgs(arguments, 3, 3, 'Must supply control bits, target bits, and qbitFunction to controlledApplicatinOfqBitOperator().');
    const targetBitArray = convertBitQualifierToBitArray(targetBits, this.numBits());
    if (Q.DEBUG) {
      console.log(335, targetBitArray);
    }
    let controlBitArray = null;
    if (controlBits !== null) {
      controlBitArray = convertBitQualifierToBitArray(controlBits, this.numBits());
      validateControlAndTargetBitsDontOverlap(controlBitArray, targetBitArray);
    }
    let result = this;
    for (let i = 0; i < targetBitArray.length; i++) {
      const targetBit = targetBitArray[i];
      result = QState._applyToOneBit(controlBitArray, targetBit, qbitFunction, result);
    }
    return result;
  }

  applyFunction(inputBits, targetBits, functionToApply) {
    validateArgs(arguments, 3, 3, 'Must supply control bits, target bits, and functionToApply to applyFunction().');
    const qState = this;
    const inputBitRange = convertBitQualifierToBitRange(inputBits, this.numBits());
    const targetBitRange = convertBitQualifierToBitRange(targetBits, this.numBits());
    validateTargetBitRangesDontOverlap(inputBitRange, targetBitRange);
    const newAmplitudes = {};
    const statesThatCanBeSkipped = {};
    const highBitMask = (1 << (inputBitRange.to + 1)) - 1;
    const targetBitMask = ((1 << (1 + targetBitRange.to - targetBitRange.from)) - 1) << targetBitRange.from;

    this.each((stateWithAmplitude) => {
      const state = stateWithAmplitude.asNumber();
      if (statesThatCanBeSkipped[stateWithAmplitude.index]) return;
      const input = (state & highBitMask) >> inputBitRange.from;
      const result = (functionToApply(input) << targetBitRange.from) & targetBitMask;
      const resultingState = state ^ result;
      if (resultingState === state) {
        sparseAssign(newAmplitudes, state, stateWithAmplitude.amplitude);
      } else {
        statesThatCanBeSkipped[resultingState] = true;
        sparseAssign(newAmplitudes, state, qState.amplitude(resultingState));
        sparseAssign(newAmplitudes, resultingState, stateWithAmplitude.amplitude);
      }
    });

    return new QState(this.numBits(), newAmplitudes);
  }

  normalize() {
    const amplitudes = {};
    let sumOfMagnitudeSqaures = 0;
    this.each((stateWithAmplitude) => {
      const magnitude = stateWithAmplitude.amplitude.magnitude();
      sumOfMagnitudeSqaures += magnitude * magnitude;
    });
    const scale = Complex.real(1 / Math.sqrt(sumOfMagnitudeSqaures));
    this.each((stateWithAmplitude) => {
      amplitudes[stateWithAmplitude.index] = stateWithAmplitude.amplitude.multiply(scale);
    });
    return new QState(this.numBits(), amplitudes);
  }

  measure(bits) {
    validateArgs(arguments, 1, 1, 'Must supply bits to be measured to measure().');
    const numBits = this.numBits();
    const bitArray = convertBitQualifierToBitArray(bits, numBits);
    const chosenState = chooseRandomBasisState(this);
    const bitMask = createBitMask(bitArray);
    const maskedChosenState = chosenState & bitMask;

    const newAmplitudes = {};
    this.each((stateWithAmplitude) => {
      const state = stateWithAmplitude.asNumber();
      if ((state & bitMask) === maskedChosenState) {
        newAmplitudes[state] = stateWithAmplitude.amplitude;
      }
    });

    // Measurement outcome is the 'value' of the measured bits.
    // It probably only makes sense when the bits make an adjacent block.
    let measurementOutcome = 0;
    for (let bitIndex = numBits - 1; bitIndex >= 0; bitIndex--) {
      if (bitArray.indexOf(bitIndex) >= 0) {
        measurementOutcome = measurementOutcome << 1;
        if (chosenState & (1 << bitIndex)) {
          measurementOutcome += 1;
        }
      }
    }

    const newState = new QState(this.numBits(), newAmplitudes).normalize();
    return new Measurement(bitArray.length, measurementOutcome, newState);
  }

  qft(targetBits1) {
    function qftfunc(qstate, targetBits) {
      const bitIndex = targetBits[0];
      if (targetBits.length > 1) {
        qstate = qftfunc(qstate, targetBits.slice(1));
        for (let index = 1; index < targetBits.length; index++) {
          const otherBitIndex = targetBits[index];
          const angle = 2 * Math.PI / (1 << (index + 1));
          qstate = qstate.controlledR(bitIndex, otherBitIndex, angle);
        }
      }
      return qstate.hadamard(bitIndex);
    }

    function reverseBits(qstate, targetBits) {
      while (targetBits.length > 1) {
        qstate = qstate.swap(targetBits[0], targetBits[targetBits.length - 1]);
        targetBits = targetBits.slice(1, targetBits.length - 1);
      }
      return qstate;
    }

    validateArgs(arguments, 1, 1, 'Must supply bits to be measured to qft().');
    const targetBitArray = convertBitQualifierToBitArray(targetBits1, this.numBits());
    const newState = qftfunc(this, targetBitArray);
    return reverseBits(newState, targetBitArray);
  }

  eql(other) {
    function lhsAmplitudesHaveMatchingRhsAmplitudes(lhs, rhs) {
      let result = true;
      lhs.each((stateWithAmplitude) => {
        if (!stateWithAmplitude.amplitude.eql(rhs.amplitude(stateWithAmplitude.asNumber()))) {
          result = false;
          return false;
        }
        return true;
      });
      return result;
    }

    if (!other) return false;
    if (!(other instanceof QState)) return false;
    if (this.numBits() !== other.numBits()) return false;
    return lhsAmplitudesHaveMatchingRhsAmplitudes(this, other) &&
      lhsAmplitudesHaveMatchingRhsAmplitudes(other, this);
  }

  toString() {
    let result = '';
    const formatFlags = {decimalPlaces: 4};
    const nonZeroStates = sortedNonZeroStates(this);
    let stateWithAmplitude = null;
    for (let i = 0; i < nonZeroStates.length; i++) {
      if (result !== '') formatFlags.spacedSign = true;
      stateWithAmplitude = nonZeroStates[i];
      result = `${result}${formatAmplitude(stateWithAmplitude.amplitude, formatFlags)}|${stateWithAmplitude.asBitString()}>`;
    }
    return result;
  }
}

QState.fromBits = (bitString) => {
  if (!bitString) {
    throw new Error('Must supply a bit string');
  }
  if (typeof bitString !== 'string') {
    bitString = bitString.toString();
  }
  const parsedBitString = parseBitString(bitString);
  const amplitudes = {};
  amplitudes[parsedBitString.value] = Complex.ONE;
  return new QState(parsedBitString.length, amplitudes);
};

// alias
//
QState.prototype.cnot = QState.prototype.controlledX;
QState.prototype.not = QState.prototype.x;
QState.prototype.X = QState.prototype.x;
QState.prototype.Y = QState.prototype.y;
QState.prototype.Z = QState.prototype.z;

QState.prototype.R = QState.prototype.r;
QState.prototype.S = QState.prototype.s;
QState.prototype.T = QState.prototype.t;
QState.prototype.kron = QState.prototype.tensorProduct;
QState.prototype.random = Math.random;
