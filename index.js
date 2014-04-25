
/**
 * Shim
 */

var PeerConnection = (window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection);


/**
 * Expose 'peer'
 */

module.exports = peer;


/**
 * peer constructor.
 * @api public
 */

function peer(servers) {
	var connection = new PeerConnection(servers || null);
	connection.createOffer(function(offer) {
		console.log(offer);
	},function() {
		console.log('error');
	});
}
