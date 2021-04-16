import './style.css';

import React, {Component} from 'react';
import {zxcvbn, isZxcvbnLoaded} from './zxcvbn';
import PropTypes from 'prop-types';
import strings from './strings/enzoic_strings';
import sha1 from './hashes/sha1';
import sha256 from './hashes/sha256';
import md5 from './hashes/md5';
import warning from '../assets/warning.png';
import info from '../assets/info.png';
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
        language: 'en'
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
        this.checkPasswordAgainstEnzoic = this.checkPasswordAgainstEnzoic.bind(this);
        this.isTooShort = this.isTooShort.bind(this);
        this.getStrings = this.getStrings.bind(this);
        this.getTooShortWord = this.getTooShortWord.bind(this);
        this.getScoreWord = this.getScoreWord.bind(this);
        this.getMessageFromZXCVBNResult = this.getMessageFromZXCVBNResult.bind(this);
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
        this.checkTimer = setTimeout(this.checkPasswordAgainstEnzoic.bind(this, passwordToCheck), 500);

        const zxcvbnResult = zxcvbn(passwordToCheck, this.props.userInputs);
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

    getMessageFromZXCVBNResult(zxcvbnresult) {
        let message = '';

        if (zxcvbnresult && zxcvbnresult.feedback) {
            message = '<br/>';
            if (zxcvbnresult.feedback.warning) {
                message = '<br/>' + zxcvbnresult.feedback.warning + '<br/><br/>';
            }

            if (zxcvbnresult.feedback.suggestions.length > 0) {
                message += this.getStrings().suggestion + ":<ul>";
                for (let i = 0; i < zxcvbnresult.feedback.suggestions.length; i++) {
                    message += "<li>" + zxcvbnresult.feedback.suggestions[i] + "</li>";
                }
                message += "</ul>";
            }
        }

        return message;
    }

    getScoreTooltip(score, zxcvbnresult) {
        if (score === 0) {
            return this.getStrings().breachedPasswordMessage;
        }
        else if (score < 4) {
            return this.getMessageFromZXCVBNResult(zxcvbnresult);
        }
        return '';
    }

    isTooShort(password) {
        return password.length < this.props.minLength;
    }

    getStrings() {
        return strings[this.props.language] || strings['en'];
    }

    getScoreWord(score) {
        let scoreWord = this.getStrings().strengthRatings[score];
        if (this.props.scoreWords && this.props.scoreWords.length === 6) {
            scoreWord = this.props.scoreWords[score]
        }

        switch (score) {
            case 0:
                return <span>
                    <img src={warning} style={{display: 'inline-block', position: 'relative', top: "-2px"}}/> {scoreWord} <img src={warning} style={{display: 'inline-block', position: 'relative', top: "-2px"}}/>
                </span>;
            case 1:
            case 2:
            case 3:
                return <span>
                    <img src={info} style={{display: 'inline-block'}}/> {scoreWord}
                </span>;
            default:
                return scoreWord;
        }
    }

    getTooShortWord() {
        return this.props.tooShortWord || this.getStrings().tooShort;
    }

    render() {
        const {score, password, isValid, loading} = this.state;

        const {
            inputProps,
            className,
            style,
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
                : this.getScoreWord(score)
        );

        const tooltip = (
            this.getScoreTooltip(score, this.state.zxcvbnResult)
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
                <div className="Enzoic-strength-bar"/>
                <span data-tip={tooltip} data-html={true} data-border={true}
                      className="Enzoic-strength-desc">{strengthDesc}</span>
                <ReactTooltip/>
            </div>
        );
    }
}



