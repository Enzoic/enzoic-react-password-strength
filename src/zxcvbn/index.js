/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const matching = require('./matching');
const scoring = require('./scoring');
const time_estimates = require('./time_estimates');
const feedback = require('./feedback');

const time = () => (new Date()).getTime();

const isZxcvbnLoaded = function () {
    return matching.dictionariesLoaded;
};

const zxcvbn = function (password, user_inputs, language = "en") {
    if (user_inputs == null) {
        user_inputs = [];
    }
    const start = time();
    // reset the user inputs matcher on a per-request basis to keep things stateless
    const sanitized_inputs = [];
    for (let arg of Array.from(user_inputs)) {
        if (["string", "number", "boolean"].includes(typeof arg)) {
            sanitized_inputs.push(arg.toString().toLowerCase());
        }
    }
    matching.set_user_input_dictionary(sanitized_inputs);
    const matches = matching.omnimatch(password);
    const result = scoring.most_guessable_match_sequence(password, matches);
    result.calc_time = time() - start;
    const attack_times = time_estimates.estimate_attack_times(result.guesses);
    for (let prop in attack_times) {
        const val = attack_times[prop];
        result[prop] = val;
    }
    result.feedback = feedback.get_feedback(result.score, result.sequence, language);
    return result;
};

module.exports = { zxcvbn, isZxcvbnLoaded };
