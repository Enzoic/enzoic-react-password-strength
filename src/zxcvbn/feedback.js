/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const scoring = require('./scoring');
import strings from '../strings/passwordping_strings';

var feedback = {
    default_feedback: {
        warning: '',
        suggestions: [
            strings.suggestions.defaultFeedback,
            strings.suggestions.defaultFeedback2
        ]
    },

    get_feedback(score, sequence) {
        // starting feedback
        if (sequence.length === 0) {
            return this.default_feedback;
        }

        // no feedback if score is good or great.
        if (score > 2) {
            return {
                warning: '',
                suggestions: []
            };
        }

        // tie feedback to the longest match for longer sequences
        let longest_match = sequence[0];
        for (let match of Array.from(sequence.slice(1))) {
            if (match.token.length > longest_match.token.length) {
                longest_match = match;
            }
        }
        feedback = this.get_match_feedback(longest_match, sequence.length === 1);
        const extra_feedback = strings.suggestions.addWord;
        if (feedback != null) {
            feedback.suggestions.unshift(extra_feedback);
            if (feedback.warning == null) {
                feedback.warning = '';
            }
        } else {
            feedback = {
                warning: '',
                suggestions: [extra_feedback]
            };
        }
        return feedback;
    },

    get_match_feedback(match, is_sole_match) {
        switch (match.pattern) {
            case 'dictionary':
                return this.get_dictionary_match_feedback(match, is_sole_match);

            case 'spatial':
                var layout = match.graph.toUpperCase();
                var warning = match.turns === 1
                    ? strings.suggestions.rowsOfKeys
                    : strings.suggestions.shortKeyboardPatterns;
                return {
                    warning,
                    suggestions: [
                        strings.suggestions.longerKeyboardPattern
                    ]
                };

            case 'repeat':
                warning = match.base_token.length === 1
                    ? strings.suggestions.shortRepeats
                    : strings.suggestions.longRepeats;
                return {
                    warning,
                    suggestions: [
                        strings.suggestions.avoidRepeatedWords
                    ]
                };

            case 'sequence':
                return {
                    warning: strings.suggestions.avoidSequences,
                    suggestions: [
                        strings.suggestions.avoidSequences2
                    ]
                };

            case 'regex':
                if (match.regex_name === 'recent_year') {
                    return {
                        warning: strings.suggestions.recentYears,
                        suggestions: [
                            strings.suggestions.avoidRecentYears,
                            strings.suggestions.avoidAssociatedYears
                        ]
                    };
                }
                break;

            case 'date':
                return {
                    warning: strings.suggestions.datesAreEasy,
                    suggestions: [
                        strings.suggestions.avoidAssociatedDates
                    ]
                };
        }
    },

    get_dictionary_match_feedback(match, is_sole_match) {
        const warning = (() => {
            if (match.dictionary_name === 'passwords') {
                if (is_sole_match && !match.l33t && !match.reversed) {
                    if (match.rank <= 10) {
                        return strings.suggestions.topTenPassword;
                    } else if (match.rank <= 100) {
                        return strings.suggestions.top100Password;
                    } else {
                        return strings.suggestions.veryCommonPassword;
                    }
                } else if (match.guesses_log10 <= 4) {
                    return strings.suggestions.similarToCommon;
                }
            } else if (match.dictionary_name === 'english_wikipedia') {
                if (is_sole_match) {
                    return strings.suggestions.wordByItself;
                }
            } else if (['surnames', 'male_names', 'female_names'].includes(match.dictionary_name)) {
                if (is_sole_match) {
                    return strings.suggestions.namesByThemselves;
                } else {
                    return strings.suggestions.commonNamesAndSurnames;
                }
            } else {
                return '';
            }
        })();

        const suggestions = [];
        const word = match.token;
        if (word.match(scoring.START_UPPER)) {
            suggestions.push(strings.suggestions.capitalization);
        } else if (word.match(scoring.ALL_UPPER) && (word.toLowerCase() !== word)) {
            suggestions.push(strings.suggestions.allUpperCase);
        }

        if (match.reversed && (match.token.length >= 4)) {
            suggestions.push(strings.suggestions.reversedWords);
        }
        if (match.l33t) {
            suggestions.push(strings.suggestions.predictableSubs);
        }

        const result = {
            warning,
            suggestions
        };
        return result;
    }
};

module.exports = feedback;
