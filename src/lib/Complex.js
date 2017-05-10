/**
 * Created by isaac on 10/05/2017.
 */

import {validateArgs} from './utils';

export default class Complex {

  constructor(real, imaginary) {
    validateArgs(arguments, 1, 2, 'Must supply a real, and optionally an imaginary, argument to Complex()');
    imaginary = imaginary || 0;
    this.r = real;
    this.i = imaginary;
  }

  real() {
    return this.r;
  }

  imaginary() {
    return this.i;
  }

  add(other) {
    validateArgs(arguments, 1, 1, 'Must supply 1 parameter to add()');
    if (typeof other === 'number') {
      return new Complex(this.r + other, this.i);
    }
    return new Complex(this.r + other.real(), this.i + other.imaginary());
  }

  multiply(other) {
    validateArgs(arguments, 1, 1, 'Must supply 1 parameter to multiply()');
    if (typeof other === 'number') {
      return new Complex(this.r * other, this.i * other);
    }
    return new Complex(this.r * other.real() - this.i * other.imaginary(),
      this.r * other.imaginary() + this.i * other.real());
  }

  conjugate() {
    return new Complex(this.r, -this.i);
  }

  toString() {
    if (this.i === 0) return "" + this.r;
    let imaginaryString;
    if (this.i === 1) {
      imaginaryString = 'i';
    } else if (this.i === -1) {
      imaginaryString = '-i';
    } else {
      imaginaryString = this.i + 'i';
    }
    if (this.r === 0) return imaginaryString;
    let sign = (this.i < 0) ? "" : "+";
    return this.r + sign + imaginaryString;
  }

  format(options) {
    let realValue = this.r;
    let imaginaryValue = this.i;
    if (options && options.decimalPlaces !== null) {
      const roundingMagnitude = Math.pow(10, options.decimalPlaces);
      realValue = Math.round(realValue * roundingMagnitude) / roundingMagnitude;
      imaginaryValue = Math.round(imaginaryValue * roundingMagnitude) / roundingMagnitude;
    }
    let objectToFormat = new Complex(realValue, imaginaryValue);
    let prefix = '';
    if (options && options.spacedSign) {
      if (objectToFormat.real() > 0) {
        prefix = ' + ';
      } else if (objectToFormat.real() < 0) {
        prefix = ' - ';
        objectToFormat = objectToFormat.negate();
      } else if (objectToFormat.imaginary() >= 0) {
        prefix = ' + ';
      } else {
        prefix = ' - ';
        objectToFormat = objectToFormat.negate();
      }
    }
    return prefix + (objectToFormat.toString());
  }

  negate() {
    return new Complex(-this.r, -this.i);
  }

  magnitude() {
    return Math.sqrt(this.r * this.r + this.i * this.i);
  }

  phase() {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
    return Math.atan2(this.i, this.r);
  }

  subtract(other) {
    validateArgs(arguments, 1, 1, 'Must supply 1 parameter to subtract()');
    if (typeof other === 'number') {
      return new Complex(this.r - other, this.i);
    }
    return new Complex(this.r - other.real(), this.i - other.imaginary());
  }

  eql(other) {
    if (!(other instanceof Complex)) return false;
    return this.r === other.real() && this.i === other.imaginary();
  }
}

Complex.complex = (real, imaginary) => new Complex(real, imaginary);

Complex.real = (real) => new Complex(real, 0);

Complex.ZERO = Complex.complex(0, 0);
Complex.ONE = Complex.complex(1, 0);
Complex.SQRT2 = Complex.real(Math.SQRT2);
Complex.SQRT1_2 = Complex.real(Math.SQRT1_2);
