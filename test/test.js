/**
 * Test dependencies.
 */

var peer = require('..');

// master
var master = peer(null);
var slave = peer(null);

master.use(connect(slave));

function connect(other, node) {

  return function(ctx) {

    ctx.on('candidate', function(candidate) {
      console.log('master', 'created candidate ans transmit to slave peer')
      other.ice(candidate);
    });

    other.on('candidate', function(candidate) {
      console.log('slave', 'created candidate ans transmit to master peer')
      ctx.ice(candidate);
    });

    other.on('answer', function(offer) {
      console.log('slave', 'got offer from master')
      ctx.remote(offer);
    });

    ctx.on('offer', function(offer) {
      console.log('slave', 'got answer from slave')
      other.remote(offer);
      other.answer();
    });

    other.on('remote stream', function(stream) {
      document.querySelector('#slave').src = window.URL.createObjectURL(stream);
    });

  ctx.create();
  other.create();
  ctx.offer();
  };
}
