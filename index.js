
/**
 * Module dependencies.
 * @api private
 */

var Queue = require('emitter-queue');
var Media = require('media');
var attach = require('attach');


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
 * @param {String | Element} node 
 * @param {Object} options 
 * @api public
 */

function Peer(servers, node) {
	if(!(this instanceof Peer)) return new Peer(servers, node);
	Media.call(this);
	var _this = this;
	this.connection = new PeerConnection(servers || null);
	this.connection.onaddstream = function(event) {
		_this.emit('remote stream', event.stream);
	};
	this.connection.onicecandidate = function(event) {
		var candidate = event.candidate;
		if(candidate) _this.emit('candidate', candidate);
	};
	this.once('stream', function(data, stream, url) {
		_this.connection.addStream(stream);
		_this.queue('local stream', stream);
	});
	if(node) this.attach(node);
}


// Peer is also a media

Peer.prototype = Media.prototype;
Queue(Peer.prototype);


/**
 * Attach stream and create offer.
 * 
 * @param  {}
 * @api private
 */

Peer.prototype.attach = function(node) {
	attach(this, node);
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
 * @api private
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
 * @api private
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
