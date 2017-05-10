/**
 * Created by isaac on 10/05/2017.
 */

import {padState} from './utils';

export default class Measurement {
  constructor(numBits, result, newState) {
    this.numBits = numBits;
    this.result = result;
    this.newState = newState;
  }

  toString() {
    return `{result: ${this.result}, newState: ${this.newState}}`;
  }

  asBitString() {
    return padState(this.result.toString(2), this.numBits);
  }
}
