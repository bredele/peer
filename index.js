
/**
 * Module dependencies.
 * @api private
 */

var Queue = require('emitter-queue');
var Store = require('datastore');
var wedge = require('wedge');
var deus = require('deus');


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
 * Create an initialize peer
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
	};
	this.connection.onicecandidate = function(event) {
		var candidate = event.candidate;
		if(candidate) _this.emit('candidate', candidate, event);
	};
	this.emit('create', data);
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
};


/**
 * Set ice candidate.
 * 
 * @param  {candidate} candidate
 * @api private
 */

Peer.prototype.ice = function(candidate) {
	this.connection.addIceCandidate(new Candidate(candidate));
};


/**
 * Set local session descriptor.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.local = function(session) {
	this.connection.setLocalDescription(new Session(session));
};


/**
 * Set remote session descriptor.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.remote = function(session) {
	this.connection.setRemoteDescription(new Session(session));
};


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

Peer.prototype.offer = deus('function', 'object', function(fn, opts) {
	var _this = this;
	// NOTE we should also pass constraints
	this.connection.createOffer(function(offer) {
		_this.connection.setLocalDescription(offer);
		if(fn) fn(offer);
		_this.queue('offer', offer);
	},function(e) {
		_this.emit('error', e);
	}, opts);
});


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

Peer.prototype.answer = deus('function', 'object', function(fn, opts) {
	var _this = this;
	this.connection.createAnswer(function(offer) {
		_this.connection.setLocalDescription(offer);
		if(fn) fn(offer);
		_this.queue('answer', offer);
	},function(e) {
		_this.emit('error', e);
	}, opts);
});


/**
 * Set peer codes.
 *
 * @param {Function} fn
 * @api public
 */

Peer.prototype.codec = Peer.prototype.use;
