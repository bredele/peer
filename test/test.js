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
      other.ice(candidate);
    });

    other.on('candidate', function(candidate) {
      ctx.ice(candidate);
    });

    other.on('answer', function(offer) {
      ctx.remote(offer);
    });

    ctx.on('offer', function(offer) {
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
