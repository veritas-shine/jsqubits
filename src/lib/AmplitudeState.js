/**
 * Created by isaac on 10/05/2017.
 */

import {padState} from './utils';

export default class AmplitudeState {
  constructor(numBits, index, amplitude) {
    this.numBits = numBits;
    this.index = index;
    this.amplitude = amplitude;
  }

  asNumber() {
    return parseInt(this.index, 10);
  }

  asBitString() {
    return padState(parseInt(this.index, 10).toString(2), this.numBits);
  }
}
