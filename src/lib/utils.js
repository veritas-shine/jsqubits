/**
 * Created by isaac on 10/05/2017.
 */
import {roundToZero, ALL} from './constants';

export function validateArgs(args, minimum) {
  let maximum = 10000;
  let message = `Must supply at least ${minimum} parameters.`;
  if (arguments.length > 4) throw new Error('Internal error: too many arguments to validateArgs');
  if (arguments.length === 4) {
    maximum = arguments[2];
    message = arguments[3];
  } else if (arguments.length === 3) {
    message = arguments[2];
  }
  if (args.length < minimum || args.length > maximum) {
    throw message;
  }
}

export function parseBitString(bitString) {
  // Strip optional 'ket' characters to support |0101>
  bitString = bitString.replace(/^\|/, '').replace(/>$/, '');
  return {value: parseInt(bitString, 2), length: bitString.length};
}

export function sparseAssign(array, index, value) {
  // Try to avoid assigning values and try to make zero exactly zero.
  if (value.magnitude() > roundToZero) {
    array[index] = value;
  }
}


export function convertBitQualifierToBitRange(bits, numBits) {
  if (bits === null) {
    throw new Error('bit qualification must be supplied');
  } else if (bits === ALL) {
    return {from: 0, to: numBits - 1};
  } else if (typeof bits === 'number') {
    return {from: bits, to: bits};
  } else if (bits.from !== null && bits.to !== null) {
    if (bits.from > bits.to) {
      throw new Error('bit range must have \'from\' being less than or equal to \'to\'');
    }
    return bits;
  } else {
    throw new Error('bit qualification must be either: a number, Q.ALL, or {from: n, to: m}');
  }
}


export function validateControlAndTargetBitsDontOverlap(controlBits, targetBits) {
  // TODO: Find out if it would sometimes be faster to put one of the bit collections into a hash-set first.
  // Also consider allowing validation to be disabled.
  for (let i = 0; i < controlBits.length; i++) {
    const controlBit = controlBits[i];
    for (let j = 0; j < targetBits.length; j++) {
      if (controlBit === targetBits[j]) {
        throw new Error('control and target bits must not be the same nor overlap');
      }
    }
  }
}

export function chooseRandomBasisState(qState) {
  const randomNumber = qState.random();
  let randomStateString = '';
  let accumulativeSquareAmplitudeMagnitude = 0;
  qState.each((stateWithAmplitude) => {
    const magnitude = stateWithAmplitude.amplitude.magnitude();
    accumulativeSquareAmplitudeMagnitude += magnitude * magnitude;
    randomStateString = stateWithAmplitude.index;
    if (accumulativeSquareAmplitudeMagnitude > randomNumber) {
      return false;
    }
    return true;
  });
  return parseInt(randomStateString, 10);
}

export function bitRangeAsArray(low, high) {
  if (low > high) {
    throw new Error('bit range must have \'from\' being less than or equal to \'to\'');
  }
  const result = [];
  for (let i = low; i <= high; i++) {
    result.push(i);
  }
  return result;
}

export function convertBitQualifierToBitArray(bits, numBits) {
  if (bits === null) {
    throw new Error('bit qualification must be supplied');
  }
  if (bits instanceof Array) {
    return bits;
  }
  if (typeof bits === 'number') {
    return [bits];
  }
  if (bits === ALL) {
    return bitRangeAsArray(0, numBits - 1);
  }
  if (bits.from !== null && bits.to !== null) {
    return bitRangeAsArray(bits.from, bits.to);
  }
  throw new Error('bit qualification must be either: a number, an array of numbers, Q.ALL, or {from: n, to: m}');
}

export function createBitMask(bits) {
  let mask = null;
  if (bits) {
    mask = 0;
    for (let i = 0; i < bits.length; i++) {
      mask += (1 << bits[i]);
    }
  }
  return mask;
}

export function padState(state, numBits) {
  const paddingLength = numBits - state.length;
  for (let i = 0; i < paddingLength; i++) {
    state = `0${state}`;
  }
  return state;
}
