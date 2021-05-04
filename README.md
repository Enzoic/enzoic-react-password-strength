# Enzoic React Password Strength Meter 

The [Enzoic](https://www.enzoic.com) React Password Strength Meter replaces existing password strength meters for signup and password change forms.
 It not only provides a typical, algorithmic strength estimation, based on the [zxcvbn](https://github.com/dropbox/zxcvbn) library, 
 but also verifies that the password is not known to be compromised by checking it against Enzoic's Passwords API.
 
The password strength meter is free to use for up to 100,000 requests per month against the Enzoic API.  After that, the meter will 
fallback to zxcvbn checks only.  

## Install in your project

`npm install --save enzoic-react-password-strength`

_Note: react/react-dom is a peer dependency. You should be using this in a React project._

## Using the tool

```
<Enzoic
  className="customClass"
  style={{ display: 'none' }}
  minLength={5}
  minScore={2}
  scoreWords={['hacked', 'weak', 'okay', 'good', 'strong', 'stronger']}
  changeCallback={onchange}
  inputProps={{ autoComplete: "off", className: "form-control" }}
/>
```

### Importing

If using ES6 imports:
`import Enzoic from 'enzoic-react-password-strength';`

Using CommonJS require:
`var ReactPasswordStrength = require('enzoic-react-password-strength');`

Using in a __Universal JS App__ (server-side rendering):
- Import component from `enzoic-react-password-strength/dist/universal`
- Include default style from `enzoic-react-password-strength/dist/style.css`.

### Props

#### changeCallback

- Callback after input has changed (and score was recomputed)
- React Password Strength passes two objects to the callback function:
    - current app state (`score`, `password`, `isValid`)
    - full result produced by [zxcvbn](https://github.com/dropbox/zxcvbn) including `feedback` (see docs for more properties)

#### className

- ClassName to render with default container classes

#### defaultValue

- A default value to set for the password field. If a non-empty string is provided the `changeCallback` will be called in `componentDidMount`.

#### highlightStrengthBubble

- When true, pulses the strength bubble whenever it is clickable to better call attention to it from the user.  CLicking the strength bubble provides more information when a password is weak or compromised.

#### inputComponent

- Optionally provide a different input component than the React Native default TextInput to use.

#### inputProps

- Props to pass down to the `input` element of the component. Things like `name`, `id`, etc
- Protected props: `className`, `onChange`, `value`
    - Passing in `className` will append to the existing classes
    - The remaining props will be ignored

#### language (Default: en)

- An ISO 639-1 language code for which language to display strings in.  Currently supported: English (en), French (fr), Spanish (es), German (de), Portuguese (pt), and Italian (it).

#### minLength (Default: 8)

- Minimum password length acceptable for password to be considered valid

#### minScore (Default: 4)

- Minimum score acceptable for password to be considered valid
- Scale from 0 - 5.  The score values are as follows:
    - 0: Hacked indicates the password is known by Enzoic to be compromised
    - 1: Very Weak - equivalent to zxcvbn score of 0
    - 2: Weak - equivalent to zxcvbn score of 1
    - 3: Medium - equivalent to zxcvbn score of 2
    - 4: Strong - equivalent to zxcvbn score of 3
    - 5: Very Strong - equivalent to zxcvbn score of 4
- See [zxcvbn](https://github.com/dropbox/zxcvbn) docs for explanations of scores
- Scores of 0-3 will have a hover popup available indicating reasons for the score and suggestions to improve it.
- Scores 4-5 (Strong, Very Strong) will not have a popup value

#### scoreContainerOffset

- By default the score container (e.g. Strong, Weak, etc.) is vertically centered in the input element.  You can provide a positive or negative offset value to move it up or down.

#### scoreWords (Default: ['Hacked', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'])

- An array denoting the words used to describe respective score values in the UI

#### showPasswordRevealButton

- Boolean indicating whether to show the eye icon on the right side of the field which allows the user to show/hide the plaintext version of the password.  

#### strengthBarStyle

- Style object to customize the color coded strength bar which appears at the bottom of the input

#### style

- Style object to customize container

#### tooShortWord (Default: 'Too Short')

- A string to describe when password is too short (based on minLength prop).

#### userInputs

- An array of strings that zxcvbn will treat as an extra dictionary.  You can add your product name, company name into this list 
to prevent these from being used as part of user passwords.

### Classes

_All styling is applied with CSS classes to allow custom styling and overriding._
- `Enzoic` - namespace class and component wrapper
- `is-strength-{0-5}` - modifier class indicating password strength
- `Enzoic-input` - password input field
- `is-password-valid` - modifier class indicating valid password
- `is-password-invalid` - modifier class indicating invalid password (only applies if password length > 0)
- `Enzoic-strength-bar` - color bar indicating password strength
- `Enzoic-strength-desc` - text indicating password strength

### Acknowledgements

This library is based heavily on the [react-password-strength library](https://github.com/mmw/react-password-strength)
 by Mateusz Wijas.  