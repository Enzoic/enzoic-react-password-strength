import './style.css';

import React, {Component} from 'react';
import {zxcvbn, isZxcvbnLoaded} from './zxcvbn';
import PropTypes from 'prop-types';
import strings from './strings/enzoic_strings';
import sha1 from './hashes/sha1';
import sha256 from './hashes/sha256';
import md5 from './hashes/md5';
import warning from '../assets/warning.svg';
import info from '../assets/info.svg';
import eye from '../assets/eye.svg';
import eyeOff from '../assets/eye-off.svg';
import ReactTooltip from 'react-tooltip';

export default class Enzoic extends Component {
    static propTypes = {
        changeCallback: PropTypes.func,
        className: PropTypes.string,
        defaultValue: PropTypes.string,
        inputProps: PropTypes.object,
        minLength: PropTypes.number,
        minScore: PropTypes.number,
        scoreWords: PropTypes.array,
        style: PropTypes.object,
        tooShortWord: PropTypes.string,
        userInputs: PropTypes.array,
        language: PropTypes.string,
        showPasswordRevealButton: PropTypes.bool,
        highlightStrengthBubble: PropTypes.bool,
        inputComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
        inputStyles: PropTypes.object,
        strengthBarStyle: PropTypes.object,
        scoreContainerOffset: PropTypes.number,
    };

    static defaultProps = {
        changeCallback: null,
        className: '',
        defaultValue: '',
        minLength: 8,
        minScore: 4,
        userInputs: [],
        requireSymbol: false,
        requireUppercase: false,
        requireNumber: false,
        language: 'en',
        showPasswordRevealButton: true,
        highlightStrengthBubble: true,
        scoreContainerOffset: 0
    };

    state = {
        score: 1,
        zxcvbnScore: 1,
        zxcvbnResult: null,
        isValid: false,
        password: '',
        hackedPassword: false,
        breachedPassword: false,
        loading: false,
        showPassword: false,
    };

    constructor(props) {
        super(props);

        this.clear = this.clear.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.checkPasswordWhenReady = this.checkPasswordWhenReady.bind(this);
        this.checkPassword = this.checkPassword.bind(this);
        this.checkPasswordAgainstEnzoic = this.checkPasswordAgainstEnzoic.bind(this);
        this.isTooShort = this.isTooShort.bind(this);
        this.getStrings = this.getStrings.bind(this);
        this.getTooShortWord = this.getTooShortWord.bind(this);
        this.getScoreWord = this.getScoreWord.bind(this);
        this.getScoreTooltip = this.getScoreTooltip.bind(this);

        this.apiURL = 'https://api.enzoic.com';
        this.rootDomain = Enzoic.getRootDomain(window.location.hostname);
    }

    componentDidMount() {
        const {defaultValue} = this.props;

        if (defaultValue.length > 0) {
            this.setState({password: defaultValue},
                this.handleChange.bind(this, {target: {value: defaultValue}}));
        }
    }

    clear() {
        const {changeCallback} = this.props;

        this.setState({
            score: 1,
            breachedPassword: false,
            zxcvbnScore: 1,
            isValid: false,
            password: '',
            loading: false,
        }, () => {
            if (changeCallback !== null) {
                changeCallback(this.state);
            }
        });
    }

    handleChange(event) {
        const {changeCallback, minScore} = this.props;
        const password = event.target.value;

        this.setState({
            password
        });

        if (this.isTooShort(password) === false) {
            this.checkPasswordWhenReady(password);
        }
        else {
            // if password is too, short set a score of 1
            const score = 1;

            this.setState({
                isValid: score >= minScore,
                score,
                breachedPassword: false,
                zxcvbnScore: 1,
                zxcvbnResult: null,
                loading: false
            }, () => {
                if (changeCallback !== null) {
                    changeCallback(this.state, null);
                }
            });
        }
    }

    checkPasswordWhenReady(passwordToCheck) {
        // wait for zxcvbn to be loaded
        if (isZxcvbnLoaded() === true) {
            this.checkPassword(passwordToCheck);
        }
        else {
            setTimeout(this.checkPasswordWhenReady.bind(this, passwordToCheck), 500);

            this.setState({
                loading: true,
            });
        }
    }

    checkPassword(passwordToCheck) {
        if (this.checkTimer) {
            clearTimeout(this.checkTimer);
        }
        this.checkTimer = setTimeout(this.checkPasswordAgainstEnzoic.bind(this, passwordToCheck), 500);

        const zxcvbnResult = zxcvbn(passwordToCheck, this.props.userInputs, this.props.language);
        let zxcvbnScore = zxcvbnResult.score + 1;

        // add on - check for all numbers
        if (zxcvbnScore > 1 && /^[0-9]+$/.test(passwordToCheck)) {
            zxcvbnScore = 1;
            zxcvbnResult.feedback.warning = this.getStrings().suggestions.allNumbers;
            zxcvbnResult.feedback.suggestions = [];
        }

        // store zxcvbn results and set state to loading while Enzoic check is processing
        this.setState({
            isValid: this.state.score >= this.props.minScore,
            score: this.state.score,
            breachedPassword: false,
            zxcvbnScore,
            zxcvbnResult,
            loading: true
        });
    }

    checkPasswordAgainstEnzoic(passwordToCheck) {
        // if we already had an outstanding request in progress, cancel
        if (this.ppCurrentRequest) {
            this.ppCurrentRequest.abort();
            this.ppCurrentRequest = undefined;
        }

        if (passwordToCheck) {
            const sha2hash = sha256.hash(passwordToCheck);
            const sha1hash = sha1.hash(passwordToCheck);
            const md5hash = md5(passwordToCheck);
            const sha2partial = sha2hash.substr(0, 10);
            const sha1partial = sha1hash.substr(0, 10);
            const md5partial = md5hash.substr(0, 10);

            this.ppCurrentRequest = new XMLHttpRequest();
            this.ppCurrentRequest.onreadystatechange = () => {
                if (this.ppCurrentRequest && this.ppCurrentRequest.readyState === 4) {
                    let found = false;

                    if (this.ppCurrentRequest.status === 200) {
                        try {
                            // loop through and see if we have a match
                            const result = JSON.parse(this.ppCurrentRequest.response);
                            if (result.candidates) {
                                for (let i = 0; i < result.candidates.length; i++) {
                                    if (result.candidates[i].md5 === md5hash ||
                                        result.candidates[i].sha1 === sha1hash ||
                                        result.candidates[i].sha256 === sha2hash) {
                                        this.setState({
                                            score: 0,
                                            breachedPassword: result.candidates[i].revealedInExposure === true,
                                            isValid: false,
                                            loading: false
                                        }, () => {
                                            if (this.props.changeCallback !== null) {
                                                this.props.changeCallback(this.state, this.state.zxcvbnResult);
                                            }
                                        });
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }
                        catch (err) {
                            console.error('Unexpected response from PP API: ' + err);
                        }
                    }

                    if (found === false) {
                        this.setState({
                            loading: false,
                            score: this.state.zxcvbnScore,
                            breachedPassword: false,
                            isValid: this.state.zxcvbnScore >= this.props.minScore
                        }, () => {
                            if (this.props.changeCallback !== null) {
                                this.props.changeCallback(this.state, this.state.zxcvbnResult);
                            }
                        });
                    }
                    this.ppCurrentRequest = undefined;
                }
            };

            this.ppCurrentRequest.open('GET',
                `${this.apiURL}/passwords?partial_sha2=${sha2partial}&partial_sha1=${sha1partial}&partial_md5=${md5partial}`,
                true);
            this.ppCurrentRequest.setRequestHeader('Orgin', this.rootDomain);
            this.ppCurrentRequest.timeout = 1500;
            this.ppCurrentRequest.send();
        }
        else {
            this.setState({loading: false});
        }
    }

    static getRootDomain(pageHost) {
        let domain = pageHost;
        if (pageHost.indexOf('.') > 0) {
            let tldn = domain.substring(domain.lastIndexOf('.') + 1);

            if (isNaN(tldn)) { // check for IP address
                let temp = domain.substring(0, domain.lastIndexOf('.'));
                if (temp.indexOf('.')) {
                    temp = temp.substring(temp.lastIndexOf('.') + 1);
                }

                domain = temp + '.' + tldn;
            }
        }

        // strip off port, if present
        if (domain.indexOf(':') > 0) {
            domain = domain.substring(0, domain.indexOf(':'));
        }

        return domain;
    }

    getScoreTooltip(score, zxcvbnresult) {
        if (!zxcvbnresult) return null;

        if (score === 0) {
            return this.formatTooltipContent({
                title: this.getStrings().hackedPasswordTitle,
                message: this.state.breachedPassword === true ? this.getStrings().breachedPasswordMessage : this.getStrings().hackedPasswordMessage
            });
        }
        else if (score < 4) {
            return this.formatTooltipContent({
                title: this.getStrings().passwordStrength + ": " + this.getScoreWord(score),
                message: zxcvbnresult.feedback.warning,
                suggestions: zxcvbnresult.feedback.suggestions
            });
        }

        return null;
    }

    formatTooltipContent({title, message, suggestions}) {
        let result = "<div class='Enzoic-tooltip is-strength-" + this.state.score + "'>" +
            "<div class='Enzoic-tooltip-title'>" +
            title +
            "</div>" +
            "<div class='Enzoic-tooltip-body'>" +
            "<div>" + message + "</div>";

        if (suggestions && suggestions.length) {
            result += "<div class='Enzoic-tooltip-subtitle'>" +
                this.getStrings().suggestion + ":" +
                "</div>";


            result += "<ul>";
            for (let i = 0; i < suggestions.length; i++) {
                result += "<li>" + suggestions[i] + "</li>";
            }
            result += "</ul>";
        }

        result += "</div></div>";

        return result;
    }

    isTooShort(password) {
        return password.length < this.props.minLength;
    }

    getStrings() {
        return strings[this.props.language] || strings['en'];
    }

    getScoreContainerContent(score) {
        const scoreWord = this.getScoreWord(score);

        switch (score) {
            case 0:
                return <span>
                    <img src={warning} className="Enzoic-warning-icon"/>
                    <span className="Enzoic-strength-desc-inner">{scoreWord}</span>
                    <img src={warning} className="Enzoic-warning-icon"/>
                </span>;
            case 1:
            case 2:
            case 3:
                return <span>
                    <img src={info} className="Enzoic-info-icon"/>
                    <span className="Enzoic-strength-desc-inner">{scoreWord}</span>
                </span>;
            default:
                return <span className="Enzoic-strength-desc-inner">{scoreWord}</span>;
        }
    }

    getScoreWord(score) {
        let scoreWord = this.getStrings().strengthRatings[score];
        if (this.props.scoreWords && this.props.scoreWords.length === 6) {
            scoreWord = this.props.scoreWords[score]
        }
        return scoreWord;
    }

    getTooShortWord() {
        return <span className="Enzoic-strength-desc-inner"
                     style={{marginLeft: "8px"}}>{this.props.tooShortWord || this.getStrings().tooShort}</span>;
    }

    renderInputComponent(InputComponentOverride, showPassword, password, inputClasses, inputProps) {
        if (InputComponentOverride) {
            return <InputComponentOverride
                type={showPassword ? "text" : "password"}
                {...inputProps}
                className={inputClasses.join(' ')}
                onChange={this.handleChange}
                value={password}
            />;
        }
        else {
            return <input
                type={showPassword ? "text" : "password"}
                {...inputProps}
                className={inputClasses.join(' ')}
                onChange={this.handleChange}
                value={password}
            />;
        }
    }

    render() {
        const {score, password, isValid, loading, showPassword} = this.state;
        const {
            inputProps, className, style, showPasswordRevealButton, highlightStrengthBubble, inputComponent,
            strengthBarStyle, scoreContainerOffset
        } = this.props;

        const inputClasses = ['Enzoic-input'];
        const wrapperClasses = [
            'Enzoic',
            className ? className : '',
            password.length > 0 && loading === false ? `is-strength-${score}` : '',
            loading ? 'loading' : ''
        ];

        const strengthDesc = (
            loading === true
                ? (<div className="Enzoic-spinner"></div>)
                : this.isTooShort(password)
                ? this.getTooShortWord()
                : this.getScoreContainerContent(score)
        );

        const tooltip = this.getScoreTooltip(score, this.state.zxcvbnResult);

        if (isValid === true) {
            inputClasses.push('is-password-valid');
        }
        else if (password.length > 0) {
            inputClasses.push('is-password-invalid');
        }

        if (inputProps && inputProps.className) {
            inputClasses.push(inputProps.className);
        }

        return (
            <div className={wrapperClasses.join(' ')} style={style}>
                {this.renderInputComponent(inputComponent, showPassword, password, inputClasses, inputProps)}
                <div className="Enzoic-strength-bar" style={strengthBarStyle}/>
                {password &&
                <div className="Enzoic-strength-desc-container"
                     style={{right: showPasswordRevealButton ? "34px" : "0px", marginTop: scoreContainerOffset + "px"}}>
                    {highlightStrengthBubble && <div className="Enzoic-pulse-strength-desc"/>}
                    <div data-html={true} data-border={true}
                         data-class={"Enzoic-tooltip-root"}
                         data-effect={"solid"}
                         data-type={"light"}
                         data-tip={tooltip ? tooltip : ""}
                         className="Enzoic-strength-desc">
                        {strengthDesc}
                    </div>
                </div>}
                {!loading && password && <ReactTooltip/>}
                {password && showPasswordRevealButton &&
                <div onClick={() => this.setState({showPassword: !showPassword})}
                     className="Enzoic-show-password-container"
                    style={{marginTop: scoreContainerOffset + "px"}}>
                    {!!password && showPassword && <img src={eyeOff} className="Enzoic-show-password-icon"/>}
                    {!!password && !showPassword && <img src={eye} className="Enzoic-show-password-icon"/>}
                </div>
                }
            </div>
        );
    }
}



