import './style.css';

import React, {Component} from 'react';
import {zxcvbn, isZxcvbnLoaded} from './zxcvbn';
import PropTypes from 'prop-types';
import strings from './strings/passwordping_strings';
import sha1 from './hashes/sha1';
import sha256 from './hashes/sha256';
import md5 from './hashes/md5';
import warning from '../assets/warning.png';
import info from '../assets/info.png';
import ReactTooltip from 'react-tooltip';

export default class PasswordPing extends Component {
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
    };

    static defaultProps = {
        changeCallback: null,
        className: '',
        defaultValue: '',
        minLength: 8,
        minScore: 4,
        scoreWords: [
            (<span><img src={warning} style={{display: 'inline-block'}}/> {strings.strengthRatings[0]} <img
                src={warning} style={{display: 'inline-block'}}/></span>),
            (<span><img src={info} style={{display: 'inline-block'}}/> {strings.strengthRatings[1]}</span>),
            (<span><img src={info} style={{display: 'inline-block'}}/> {strings.strengthRatings[2]}</span>),
            (<span><img src={info} style={{display: 'inline-block'}}/> {strings.strengthRatings[3]}</span>),
            strings.strengthRatings[4],
            strings.strengthRatings[5]
        ],
        tooShortWord: 'Too Short',
        userInputs: [],
        requireSymbol: false,
        requireUppercase: false,
        requireNumber: false
    };

    state = {
        score: 1,
        zxcvbnScore: 1,
        zxcvbnResult: null,
        isValid: false,
        password: '',
        hackedPassword: false,
        breachedPassword: false,
        loading: false
    };

    constructor(props) {
        super(props);

        this.clear = this.clear.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.checkPasswordWhenReady = this.checkPasswordWhenReady.bind(this);
        this.checkPassword = this.checkPassword.bind(this);
        this.checkPasswordAgainstPasswordPing = this.checkPasswordAgainstPasswordPing.bind(this);
        this.isTooShort = this.isTooShort.bind(this);

        this.apiURL = 'https://api.passwordping.com';
        this.rootDomain = PasswordPing.getRootDomain(window.location.hostname);
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
        this.checkTimer = setTimeout(this.checkPasswordAgainstPasswordPing.bind(this, passwordToCheck), 500);

        const zxcvbnResult = zxcvbn(passwordToCheck, this.props.userInputs);
        const zxcvbnScore = zxcvbnResult.score + 1;

        // store zxcvbn results and set state to loading while PasswordPing check is processing
        this.setState({
            isValid: this.state.score >= this.props.minScore,
            score: this.state.score,
            zxcvbnScore,
            zxcvbnResult,
            loading: true
        });
    }

    checkPasswordAgainstPasswordPing(passwordToCheck) {
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
                            isValid: this.state.zxcvbnScore >= this.props.minScore
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

    static getMessageFromZXCVBNResult(zxcvbnresult) {
        let message = '';

        if (zxcvbnresult && zxcvbnresult.feedback) {
            message = '<br/>';
            if (zxcvbnresult.feedback.warning) {
                message = '<br/>' + zxcvbnresult.feedback.warning + '<br/><br/>';
            }

            if (zxcvbnresult.feedback.suggestions.length > 0) {
                message += strings.suggestion + ":<ul>";
                for (let i = 0; i < zxcvbnresult.feedback.suggestions.length; i++) {
                    message += "<li>" + zxcvbnresult.feedback.suggestions[i] + "</li>";
                }
                message += "</ul>";
            }
        }

        return message;
    }

    static getScoreTooltip(score, zxcvbnresult) {
        if (score === 0) {
            return strings.breachedPasswordMessage;
        }
        else if (score < 4) {
            return PasswordPing.getMessageFromZXCVBNResult(zxcvbnresult);
        }
        return '';
    }

    isTooShort(password) {
        return password.length < this.props.minLength;
    }

    render() {
        const {score, password, isValid, loading} = this.state;

        const {
            scoreWords,
            inputProps,
            className,
            style,
            tooShortWord
        } = this.props;

        const inputClasses = ['PasswordPing-input'];
        const wrapperClasses = [
            'PasswordPing',
            className ? className : '',
            password.length > 0 && loading === false ? `is-strength-${score}` : '',
            loading ? 'loading' : ''
        ];

        const strengthDesc = (
            loading === true
                ? (<div className="PasswordPing-spinner"></div>)//(<img src={loader} style={{display: 'inline-block'}}/>)
                : this.isTooShort(password)
                    ? tooShortWord
                    : scoreWords[score]
        );

        const tooltip = (
            PasswordPing.getScoreTooltip(score, this.state.zxcvbnResult)
        );

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
                <input
                    type="password"
                    {...inputProps}
                    className={inputClasses.join(' ')}
                    onChange={this.handleChange}
                    value={password}
                />
                <div className="PasswordPing-strength-bar"/>
                <span data-tip={tooltip} data-html={true} data-border={true}
                      className="PasswordPing-strength-desc">{strengthDesc}</span>
                <ReactTooltip/>
            </div>
        );
    }
}



