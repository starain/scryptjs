goog.provide('starain.crypt.Scrypt');

goog.require('goog.crypt.pbkdf2');

/**
 * Max int.
 * @const
 */
var MAX_INT = 2147483647;

/**
 * @constructor
 */
starain.crypt.Scrypt = function() {
};

/**
 * Derives a key from the password, salt, and cost parameters, returning
 * an number array of length keyLen that can be used as cryptographic key.
 * 
 * @param{!Array.<number>|string} password Password.
 * @param{!Array.<number>|string} salt Salt.
 * @param{number} N General work factor, iteration count.
 * @param{number} r Blocksize in use for underlying hash; fine-tunes the relative memory-cost.
 * @param{number} p Parallelization factor; fine-tunes the relative cpu-cost.
 * @param{number} keyLen Key len in bit.
 * @return{Array.<number>} Derived Key in byte array.
 */
starain.crypt.Scrypt.prototype.GenerateDerivedKey =
    function(password, salt, N, r, p, keyLen) {
  if (N <= 1 || N & (N - 1) != 0) {
    throw Error('scrypt: N must be > 1 and a power of 2');
  }

  if (r * p >= 1<<30 || r > MAX_INT / 128 / p || r > MAX_INT / 256 || N > MAX_INT / 128 / r) {
    throw Error('scrypt: parameters are too large');
  }

  /**
   * @type{!Array.<number>}
   */
  var source = [];
  if (goog.isString(password)) {
    for (var i = 0, len = password.length; i < len; i++) {
      source.push(password[i].charCodeAt(0));
    }
  } else {
    source = password;
  }

  /**
   * @type{!Array.<number>}
   */
  var s = [];
  if (goog.isString(salt)) {
  for (var i = 0, len = salt.length; i < len; i++) {
      s.push(salt[i].charCodeAt(0));
    }
  } else {
    s = salt;
  }

  /**
   * @type{!Array.<number>}
   */
  var b = goog.crypt.pbkdf2.deriveKeySha256(source, s, 1, p * r * 128 * 8);

  /**
   * @type{Array.<number>}
   */
  var b32 = [];

  // Convert to 32 bit array. Operate on 32 bit is significantly faster than 8 bit.
  this.Convert8BitTo32Bit_(b, b32);

  /**
   * @type{Array.<number>}
   */
  var v = [];
  for (var i = 0; i < p; i++) {
    this.Smix_(b32, i * 32 * r, r, N, v);
  }

  // Convert back to 8 bit array.
  this.Convert32BitTo8Bit_(b32, b);

  return goog.crypt.pbkdf2.deriveKeySha256(source, b, 1, keyLen);
};

/**
 * Converts 8 bit array to 32 bit array.
 * @private
 * 
 * @param{Array.<number>} src 8 bit array.
 * @param{Array.<number>} dst 32 bit array.
 */
starain.crypt.Scrypt.prototype.Convert8BitTo32Bit_ = function(src, dst) {
  var dstIndex = 0;
  for (var i = 0, len = src.length; i < len; i += 4) {
    dst[dstIndex++]  = (src[i] & 0xff) | (src[i + 1] & 0xff) << 8 |
                       (src[i + 2] & 0xff) << 16 | (src[i + 3] & 0xff) << 24;
  }
};

/**
 * Converts 32 bit array to 8 bit array.
 * @private
 * 
 * @param{Array.<number>} src 32 bit array.
 * @param{Array.<number>} dst 8 bit array.
 */
starain.crypt.Scrypt.prototype.Convert32BitTo8Bit_ = function(src, dst) {
  var dstIndex = 0;
  for (var i = 0, len = src.length; i < len; i++) {
    var tmp = src[i];
    dst[dstIndex++] = tmp & 0xff;
    tmp >>= 8;
    dst[dstIndex++] = tmp & 0xff;
    tmp >>= 8;
    dst[dstIndex++] = tmp & 0xff;
    tmp >>= 8;
    dst[dstIndex++] = tmp & 0xff;
  }
};

/**
 * Copy data from src to dst.
 * @private
 * 
 * @param{Array.<number>} src Source array.
 * @param{number} srcPos Position for source array.
 * @param{Array.<number>} dest Destination array.
 * @param{number} destPos Position for Destination array.
 * @param{number} length Length of data to copy.
 */
starain.crypt.Scrypt.prototype.BlockCopy_ =
    function(src, srcPos, dest, destPos, length) {
  while (length--) {
    dest[destPos++] = src[srcPos++];
  }
};

/**
 * smix process
 * @private
 * 
 * @param{Array.<number>} b data.
 * @param{number} bIndex index for b.
 * @param{number} r r param.
 * @param{number} N N param.
 * @param{Array.<number>} v v.
 */
starain.crypt.Scrypt.prototype.Smix_ = function(b, bIndex, r, N, v) {
  var yIndex = 32 * r;

  // The fastest way for array copy.
  var xy = b.slice(bIndex, bIndex + yIndex);
  for (var i = 0; i < N; i++) {
    this.BlockCopy_(xy, 0, v, i * yIndex, yIndex);
    this.BlockMix_(xy, yIndex, r);
  }

  for (var i = 0; i < N; i++) {
    var offset = (2 * r - 1) * 16;
    var j = xy[offset] & (N - 1);
    this.BlockXor_(v, j * yIndex, xy, 0, yIndex);
    this.BlockMix_(xy, yIndex, r);
  }

  this.BlockCopy_(xy, 0, b, bIndex, yIndex);
};

/**
 * Block mix process
 * @private
 * 
 * @param{Array.<number>} xy xy data.
 * @param{number} yIndex index for y.
 * @param{number} r r param.
 */
starain.crypt.Scrypt.prototype.BlockMix_ = function(xy, yIndex, r) {
  var xIndex = (2 * r - 1) * 16;
  // The fastest way for array copy.
  var tmp = xy.slice(xIndex, xIndex + 16);

  for (var i = 0; i < 2 * r; i++) {
    this.BlockXor_(xy, i * 16, tmp, 0, 16);
    this.Salsa_(tmp);
    this.BlockCopy_(tmp, 0, xy, yIndex + (i * 16), 16);
  }

  for (var i = 0; i < r; i++) {
    this.BlockCopy_(xy, yIndex + (i * 2) * 16, xy, (i * 16), 16);
  }

  for (var i = 0; i < r; i++) {
    this.BlockCopy_(xy, yIndex + (i * 2 + 1) * 16, xy, (i + r) * 16, 16);
  }
};

/**
 * Helper function for Salsa.
 *
 * @param{number} a a number.
 * @param{number} b a number.
 * @return{number} a number.
 */
function R(a, b) {
  return (a << b) | (a >>> (32 - b));
}

/**
 * Salsa process.
 * @private
 * @param{Array.<number>} b 32 bit array for salsa process.
 */
starain.crypt.Scrypt.prototype.Salsa_ = function(b) {
  // The fastest way for array copy.
  /**
   * @type{Array.<number>}
   */
  var x = b.slice();
  for (var i = 8; i > 0; i -= 2) {
    x[ 4] ^= R(x[ 0]+x[12], 7);  x[ 8] ^= R(x[ 4]+x[ 0], 9)
    x[12] ^= R(x[ 8]+x[ 4],13);  x[ 0] ^= R(x[12]+x[ 8],18)
    x[ 9] ^= R(x[ 5]+x[ 1], 7);  x[13] ^= R(x[ 9]+x[ 5], 9)
    x[ 1] ^= R(x[13]+x[ 9],13);  x[ 5] ^= R(x[ 1]+x[13],18)
    x[14] ^= R(x[10]+x[ 6], 7);  x[ 2] ^= R(x[14]+x[10], 9)
    x[ 6] ^= R(x[ 2]+x[14],13);  x[10] ^= R(x[ 6]+x[ 2],18)
    x[ 3] ^= R(x[15]+x[11], 7);  x[ 7] ^= R(x[ 3]+x[15], 9)
    x[11] ^= R(x[ 7]+x[ 3],13);  x[15] ^= R(x[11]+x[ 7],18)
    x[ 1] ^= R(x[ 0]+x[ 3], 7);  x[ 2] ^= R(x[ 1]+x[ 0], 9)
    x[ 3] ^= R(x[ 2]+x[ 1],13);  x[ 0] ^= R(x[ 3]+x[ 2],18)
    x[ 6] ^= R(x[ 5]+x[ 4], 7);  x[ 7] ^= R(x[ 6]+x[ 5], 9)
    x[ 4] ^= R(x[ 7]+x[ 6],13);  x[ 5] ^= R(x[ 4]+x[ 7],18)
    x[11] ^= R(x[10]+x[ 9], 7);  x[ 8] ^= R(x[11]+x[10], 9)
    x[ 9] ^= R(x[ 8]+x[11],13);  x[10] ^= R(x[ 9]+x[ 8],18)
    x[12] ^= R(x[15]+x[14], 7);  x[13] ^= R(x[12]+x[15], 9)
    x[14] ^= R(x[13]+x[12],13);  x[15] ^= R(x[14]+x[13],18)
  }

  for (var i = 0; i < 16; ++i) {
    b[i] = (x[i] + b[i]) & 0xffffffff;
  }
};

/**
 * Block XOR. Each element in dst will do a XOR with element in src.
 * @private
 *
 * @param{Array.<number>} src Source array.
 * @param{number} srcIndex Index for source array.
 * @param{Array.<number>} dst Destination array.
 * @param{number} dstIndex Index for Destination array.
 * @param{number} len Number of data for XOR.
 */
starain.crypt.Scrypt.prototype.BlockXor_ =
    function(src, srcIndex, dst, dstIndex, len) {
  while (len--) {
    dst[dstIndex++] ^= src[srcIndex++];
  }
};
