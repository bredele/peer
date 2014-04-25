
/**
 * Module dependencies.
 * @api private
 */

var Emitter = require('emitter');
var Queue = require('emitter-queue');

/**
 * Shim
 */

var PeerConnection = (window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection);
var Candidate = (RTCIceCandidate || mozRTCIceCandidate);

/**
 * Expose 'peer'
 */

module.exports = Peer;


/**
 * Create an initialize peer
 * connection,
 *
 * A peer automatically initialize a master session
 * until it creates an answer.
 *
 * Examples:
 *
 *   var foo = peer();
 *   var bar = peer(servers);
 *
 * @param {Array} servers
 * @api public
 */

function Peer(servers) {
	if(!(this instanceof Peer)) return new Peer(servers);
	var connection = this.connection = new PeerConnection(servers || null);
	connection.onicecandidate = function(event) {
		var candidate = event.candidate;
		if(candidate) {
			connection.addIceCandidate(new Candidate(candidate));
		}
	};
	// initialize every peer as master
	this.offer();
}


// inherit Emitter

Emitter(Peer.prototype);
Queue(Peer.prototype);


/**
 * Attach stream and create offer.
 * 
 * @param  {}
 * @api private
 */

Peer.prototype.attach = function(stream) {

	//attach stream
	this.offer();
};


/**
 * Set local session descriptor.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.local = function(session) {
	this.connection.setLocalDescription(session);
};


/**
 * Set remote session descriptor.
 * 
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.remote = function(session) {
	this.connection.setRemoteDescription(session);
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
 * @api public
 * 
 * @see  http://github.com/bredele/emitter-queue
 */

Peer.prototype.offer = function() {
	var _this = this;
	this.connection.createOffer(function(offer) {
		_this.connection.setLocalDescription(offer);
		_this.queue('offer', offer);
	},function(e) {
		_this.emit('error', e);
	});
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
 * @api public
 *
 * @see  http://github.com/bredele/emitter-queue
 */

Peer.prototype.answer = function() {
	var _this = this;
	this.connection.createAnswer(function(offer) {
		_this.connection.setLocalDescription(offer);
		_this.queue('answer', offer);
	},function(e) {
		_this.emit('error', e);
	});
};


/**
 * Extend peer with plugins.
 *
 * Examples:
 *
 *   var peer = peer();
 *   peer.use(signal('room'));
 *   
 * @param  {Function} fn 
 * @return {this}
 * @api public
 */

Peer.prototype.use = function(fn) {
	var args = [].slice.call(arguments, 1);
	fn.apply(this, [this].concat(args));
	return this;
};