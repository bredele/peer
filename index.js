
/**
 * Module dependencies.
 * @api private
 */

var Queue = require('emitter-queue');
var Store = require('datastore');
var wedge = require('wedge');
var deus = require('deus');
var trace = require('trace')('peer');


/**
 * Shim
 */

var PeerConnection = (window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection);
var Candidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
var Session = window.RTCSessionDescription || window.mozRTCSessionDescription;
var constraints = {
  optional: [],
  mandatory: []
};


/**
 * Expose 'peer'
 */

module.exports = Peer;


/**
 * Create and initialize peer
 * connection,
 *
 *
 * Examples:
 *
 *   var foo = peer();
 *   var bar = peer(servers);
 *
 * @param {Array} servers optional
 * @param {Object} options 
 * @api public
 */

function Peer(servers) {
  if(!(this instanceof Peer)) return new Peer(servers);
  Store.call(this);
  this.connection = null;
  this.set('servers', servers);
  this.set(constraints);
  this.codecs = [];
}


// Peer is a datastore

Peer.prototype = Store.prototype;
Queue(Peer.prototype);


/**
 * Create and initialize peer
 * connection.
 *
 * Should be call before offer or answer.
 * 
 * @api private
 */

Peer.prototype.create = function() {
  var _this = this;
  var data = wedge(this.data, 'optional', 'mandatory');
  // should may be format some constraints
  this.connection = new PeerConnection(this.get('servers') || null, data);
  this.connection.onaddstream = function(event) {
    _this.emit('remote stream', event.stream);
    trace('add remote stream');
  };
  this.connection.onicecandidate = function(event) {
    var candidate = event.candidate;
    if(candidate) _this.emit('candidate', candidate, event);
    else _this.queue('ready');
    trace('ice candidate');
  };
  this.connection.ongatheringchange =  function(event) {
    var target = event.currentTarget;
    if (target && target.iceGatheringState === 'complete') {
      _this.queue('ready');
    }
  };
  this.emit('create', data);
  trace('create');
};


/**
 * Add local stream to peer connection.
 * 
 * @param  {MediaStream} stream
 * @api private
 */

Peer.prototype.stream = function(stream) {
  this.connection.addStream(stream);
  this.queue('local stream', stream);
  trace('add local stream');
};


/**
 * Set ice candidate.
 * 
 * @param  {candidate} candidate
 * @api private
 */

Peer.prototype.ice = function(candidate) {
  this.connection.addIceCandidate(new Candidate(candidate));
  trace('add ice candidate');
};


/**
 * Set local session descriptor.
 *
 * If exists, apply codecs on the session
 * description string.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.local = function(session) {
  var sdp = session.sdp;
  for(var i = 0, l = this.codecs.length; i < l; i++) {
    sdp = this.codecs[i](sdp);
  }
  session.sdp = sdp;
  this.connection.setLocalDescription(new Session(session));
  trace('set local description');
};


/**
 * Set remote session descriptor.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.remote = function(session) {
  this.connection.setRemoteDescription(new Session(session));
  trace('set remote description');
};


/**
 * Create offer or answer
 * session description.
 * 
 * @param  {Function} fn
 * @param  {Object}   constraints
 * @param  {String}   type=
 * @api private
 */

Peer.prototype.session = deus('function', 'object', function(fn, opts, type) {
  var _this = this;
  var handler = (type === 'offer') ? 'createOffer' : 'createAnswer';
  this.emit('before ' + type);
  this.connection[handler](function(offer) {
    trace('set session ' + type);
    _this.local(offer);
    if(fn) fn(offer);
    _this.queue(type, offer);
  },function(e) {
    _this.emit('error', e);
  }, opts);
});


/**
 * Initialize master peer connection
 * and create offer.
 *
 * Emit and queue offer event.
 *
 * Examples:
 *
 *   var master = peer();
 *   master.on('offer', function(offer) {
 *     // do something with offer
 *   });
 *
 * @param {Object} constraints optional
 * @api private
 * 
 * @see  http://github.com/bredele/emitter-queue
 */

Peer.prototype.offer = function(fn, opts) {
  this.session(fn, opts, 'offer');
};


/**
 * Initialize slave peer connection
 * and create answer.
 *
 * Emit and queue answer event.
 *
 * Examples:
 *
 *   var slave = peer();
 *   slave.on('answer', function(offer) {
 *     // do something with offer
 *   });
 *   
 * @param {Object} constraints optional
 * @api private
 *
 * @see  http://github.com/bredele/emitter-queue
 */

Peer.prototype.answer = function(fn, opts) {
  this.session(fn, opts, 'answer');
};


/**
 * Set peer codecs.
 *
 * A codec is a function which
 * modifies the session description
 * and return a new one.
 *
 * Examples:
 *
 *   peer.codec(function(session) {
 *     // do something 
 *   });
 *
 * @param {Function} fn
 * @api public
 */

Peer.prototype.codec = function(fn) {
  this.codecs.push(fn);
};
