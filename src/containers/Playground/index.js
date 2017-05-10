/**
 * Created by isaac on 09/05/2017.
 */
import React, {Component} from 'react';
import superagent from 'superagent';

let codeMirror = null;
if (__CLIENT__) {
  codeMirror = require('codemirror');
  require('codemirror/mode/javascript/javascript');
  require('../../../lib/jsqubits');
  require('../../../lib/jsqubitsmath');
}

export default
class extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      code: '',
      result: ''
    };
  }

  componentDidMount() {
    const area = document.getElementById('q-code');
    this.codemirror = codeMirror.fromTextArea(area, {
      lineNumbers: true,
      mode: 'javascript'
    });
  }

  _onChange = (event) => {
    const {value} = event.target;
    const req = superagent.get(`/runners/${value}.js.example`);
    req.end((error, {text}) => {
      this.codemirror.setValue(text);
    });
  };
  _runCode = () => {
    let result = '';
    try {
      result = eval(this.codemirror.getValue());
      if ((typeof result === 'object') && result.toString) {
        result = result.toString();
      } else if (typeof result === 'number') {
        result = result.toString();
      }
    } catch (e) {
      result = e.message ? e.message : e;
    }
    this.setState({result});
  };
  _clearCode = () => {
    this.codemirror.setValue('');
  };

  render() {
    const style = {
      overflow: 'scroll',
      height: '100%'
    };
    const {result} = this.state;
    return (<div style={style}>
      <textarea id="q-code" />
      <div>
        <div className="buttons">
          <button onClick={this._runCode}>Run</button>
          <button onClick={this._clearCode}>Clear</button>
        </div>
        <div className="examples">
          <span>Load example: </span>
          <select id="example" onChange={this._onChange}>
            <option value="none">Please Select...</option>
            <option value="bernsteinVazirani">Bernstein Vazirani Algorithm</option>
            <option value="deutsch">Deutsch's Algorithm</option>
            <option value="deutschJozsa">Deutsch-Jozsa Algorithm</option>
            <option value="quantumTeleportation">Quantum Teleportation</option>
            <option value="simonsAlg">Simon's Algorithm</option>
            <option value="simpleSearch">Simple search algorithm</option>
            <option value="superDenseCoding">Super Dense Coding</option>
            <option value="groverSearch">Grover's search algorithm</option>
            <option value="specialPeriodFinding">Period Finding (special case)</option>
            <option value="generalPeriodFinding">Period Finding (general case)</option>
            <option value="factoring">Shor's factoring algorithm</option>
          </select>
        </div>
      </div>
      <div className="result">
        <div id="result" dangerouslySetInnerHTML={{__html: result}}></div>
        <div id="console"></div>
      </div>

      <h3>jsqubits methods</h3>
      <div className="commandlistblock clearfix">
        <div className="commandlist first">
          <div className="row">
            <div className="method">jsqubits(bitstring)</div>
            <div className="desc">Create a QState object</div>
          </div>
          <div className="row">
            <div className="method">new QState(numbits, amplitudes)</div>
            <div className="desc">Create a QState object</div>
          </div>
          <div className="row">
            <div className="method">add(otherState)</div>
            <div className="desc">Add another state</div>
          </div>
          <div className="row">
            <div className="method">subtract(otherState)</div>
            <div className="desc">Subtract another state</div>
          </div>
          <div className="row">
            <div className="method">multiply(value)</div>
            <div className="desc">Multiply by a global phase</div>
          </div>
          <div className="row">
            <div className="method">normalize()</div>
            <div className="desc">Normalize the amplitudes</div>
          </div>
          <div className="row">
            <div className="method">x(targetBits)</div>
            <div className="desc">Pauli X</div>
          </div>
          <div className="row">
            <div className="method">y(targetBits)</div>
            <div className="desc">Pauli Y</div>
          </div>
          <div className="row">
            <div className="method">z(targetBits)</div>
            <div className="desc">Pauli Z</div>
          </div>
          <div className="row">
            <div className="method">r(targetBits, angle)</div>
            <div className="desc">Phase shift gate</div>
          </div>
          <div className="row">
            <div className="method">s(targetBits)</div>
            <div className="desc">Phase gate: r(&pi;/2)</div>
          </div>
          <div className="row">
            <div className="method">t(targetBits)</div>
            <div className="desc">T gate: r(&pi;/4)</div>
          </div>
          <div className="row">
            <div className="method">hadamard(targetBits)</div>
            <div className="desc">Hadamard</div>
          </div>
          <div className="row">
            <div className="method">not(targetBits)</div>
            <div className="desc">Not</div>
          </div>
          <div className="row">
            <div className="method">swap(bit1, bit2)</div>
            <div className="desc">Swap two bits</div>
          </div>
        </div>
        <div className="commandlist second">
          <div className="row">
            <div className="method">rotateX(targetBits, angle)</div>
            <div className="desc">Rotate about X</div>
          </div>
          <div className="row">
            <div className="method">rotateY(targetBits, angle)</div>
            <div className="desc">Rotate about Y</div>
          </div>
          <div className="row">
            <div className="method">rotateZ(targetBits, angle)</div>
            <div className="desc">Rotate about Z</div>
          </div>
          <div className="row">
            <div className="method">controlledHadamard(controlBits, targetBits))</div>
            <div className="desc">Controlled Hadamard</div>
          </div>
          <div className="row">
            <div className="method">cnot(controlBits, targetBits)</div>
            <div className="desc">Controlled Not</div>
          </div>
          <div className="row">
            <div className="method">controlledX(controlBits, targetBits)</div>
            <div className="desc">Controlled Pauli X</div>
          </div>
          <div className="row">
            <div className="method">controlledXRotation(ctrlBits, trgtBits, angle)</div>
            <div className="desc">Controlled rotation about X</div>
          </div>
          <div className="row">
            <div className="method">toffoli(controlBit, controlBit, ..., targetBit)</div>
            <div className="desc">Toffoli</div>
          </div>
          <div className="row">
            <div className="method">applyFunction(inputBits, targetBits, function)</div>
            <div className="desc">Apply a function</div>
          </div>
          <div className="row">
            <div className="method">tensorProduct(otherQState)</div>
            <div className="desc">Tensor product</div>
          </div>
          <div className="row">
            <div className="method">qft(targetBits)</div>
            <div className="desc">Quantum Fourier Transform</div>
          </div>
          <div className="row">
            <div className="method">amplitude(basisState)</div>
            <div className="desc">Get an amplitude</div>
          </div>
          <div className="row">
            <div className="method">measure(targetBits)</div>
            <div className="desc">Make a measurement</div>
          </div>
          <div className="row">
            <div className="method">jsqubits.complex(real, imaginary)</div>
            <div className="desc">Create a complex number</div>
          </div>
          <div className="row">
            <div className="method">jsqubits.Complex.add,subtract,multiply,negate</div>
            <div className="desc">Some Complex methods</div>
          </div>
        </div>
      </div>

      <h4>Note:</h4>
      <ul>
        <li>
          There are "controlled" versions of many operators such as controlledSwap, controlledX, controlledY, etc.
          For all of these, the controlBits must be specified before the target bits.
          (There is presently no controlled version of qft).
        </li>
        <li>
          Most of the bit specifiers can be single numbers (0 being least significant),
          arrays of numbers,
          bit ranges (e.g. <code>from: 5, to:15</code>,
          or the constant <code>jsqubits.ALL</code>.
          Cuurently, the exception to this is <code>applyFunction</code> as this cannot take arrays.
          Also, while the <code>controlledSwap</code> method is
          able to take the various types of bit specifiers as control bits,
          it (and the
          <swap>swap</swap>
          ) operator can only take single numbers for the two bits to be swapped.
        </li>
      </ul>
    </div>);
  }
}
