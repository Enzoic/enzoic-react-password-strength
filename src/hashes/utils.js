export default {
    /**
     * Rotates right (circular right shift) value x by n positions [§3.2.4].
     * @private
     */
    ROTR: function(n, x) {
        return (x >>> n) | (x << (32-n));
    },

    /**
     * Rotates left (circular left shift) value x by n positions [§3.2.5].
     * @private
     */
    ROTL: function(x, n) {
        return (x<<n) | (x>>>(32-n));
    },

    /**
     * Hexadecimal representation of a number.
     * @private
     */
    toHexStr: function(n) {
        // note can't use toString(16) as it is implementation-dependant,
        // and in IE returns signed numbers when used on full words
        var s="", v;
        for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
        return s;
    }

};
