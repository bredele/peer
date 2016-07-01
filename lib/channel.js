

/**
 * Listen channel.
 *
 * @note this handler will be replaced by
 * the module bredele/channel
 *
 * @param {RTCDataChannel} channel
 * @param {Peer} peer
 * @api private
 */

module.exports = function(channel, peer) {

  if(peer.constraints.channel()) {
    peer.on('channel message', function(msg) {
      channel.send(msg);
    });  
  }

  channel.onmessage = function (event) {
    peer.emit('message', event.data)
  }
  channel.onopen = function () {
    peer.emit('channel open', name)
  }
  channel.onclose = function () {
    peer.emit('channel close', name)
  }
  return channel;
};
