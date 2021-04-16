import React from 'react';
import ReactPasswordStrength from '@enzoic/enzoic-react-password-strength';

export default class App extends React.Component {
  state = { passLength: 0 }

  changeCallback = state => {
      this.setState({passLength: state.password.length});
      console.log(state);
  };

  clear = () => this.ReactPasswordStrength.clear();

  render() {
    const inputProps = {
      placeholder: "Try a password...",
      autoFocus: true,
      className: 'another-input-prop-class-name',
    };

    return (
      <div id="example">
        <h1>React Password Strength Tool</h1>
        <p>
          Powered by
          {' '}
          <a
            href="https://github.com/dropbox/zxcvbn"
            target="_blank"
            rel="noopener noreferrer"
          >
            zxcvbn
          </a>
        </p>

        <ReactPasswordStrength
          ref={ref => this.ReactPasswordStrength = ref}
          minLength={6}
          inputProps={{ ...inputProps, id: 'inputPassword1' }}
          changeCallback={this.changeCallback}
        />

        <button onClick={this.clear} disabled={this.state.passLength === 0}>
          Clear
        </button>

        <h3>Password Input with Default Value</h3>

        <ReactPasswordStrength
          minLength={6}
          inputProps={{ ...inputProps, id: 'inputPassword2' }}
          defaultValue="defaultValue"
        />
      </div>
    );
  }
}
