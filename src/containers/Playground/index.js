/**
 * Created by isaac on 09/05/2017.
 */
import React, {Component} from 'react';
import superagent from 'superagent';
import {Container, Header, Button} from 'semantic-ui-react';
import Q from 'lib/Q';

let codeMirror = null;
if (__CLIENT__) {
  codeMirror = require('codemirror');
  require('codemirror/mode/javascript/javascript');
}

export default
class extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      code: '',
      result: ''
    };

    // const qstate = new Q('|0>').hadamard(0).T(0);
    // console.log(24, qstate.toString(), Q.powerMod(234, 756, 15).toString());
  }

  componentDidMount() {
    window.Q = Q;
    Q.log = console.log;
    window.promptForFunction = (message, example) => {
      const input = prompt(message, example);
      let f;
      eval(`f = ${input}`);
      return f;
    };

    const area = document.getElementById('q-code');
    this.codemirror = codeMirror.fromTextArea(area, {
      lineNumbers: true,
      mode: 'javascript'
    });
  }

  _onChange = (event) => {
    const {value} = event.target;
    const req = superagent.get(`/runners/${value}.js`);
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
      overflow: 'scroll'
    };
    const {result} = this.state;
    return (<Container style={{height: '100%'}}>
      <Header className="examples">
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
        <div>
          <Button primary onClick={this._runCode}>Run</Button>
          <Button secondary onClick={this._clearCode}>Clear</Button>
        </div>
      </Header>
      <textarea id="q-code" />
      <div style={style}>
        <div className="result">
          <div id="result" dangerouslySetInnerHTML={{__html: result}}></div>
        </div>
      </div>
    </Container>);
  }
}
