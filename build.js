(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Module dependencies.
 * @api private
 */

var constraints = require('constraints');
var Emitter = require('emitter');
var Queue = require('emitter-queue');
var channel = require('./lib/channel');
// var trace = require('trace')('peer');


/**
 * Shim
 */

var PeerConnection = (window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection);
var Candidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
var Session = window.RTCSessionDescription || window.mozRTCSessionDescription;


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
 * @param {Array} options
 * @param {Object} options
 * @api public
 */

function Peer(options) {
  if(!(this instanceof Peer)) return new Peer(options);
  this.connection = null;
  // we should extend default with options
  this.constraints = constraints({
    optional: [],
    mandatory: [],
    channel: true
  });
  this.codecs = [];
}


Emitter(Peer.prototype);
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
  var that = this;
  this.connection = new PeerConnection(this.constraints.servers());
  this.connection.onaddstream = function(event) {
    that.emit('remote stream', event.stream);
    //trace('add remote stream');
  };
  this.connection.onicecandidate = function(event) {
    var candidate = event.candidate;
    if(candidate) that.emit('candidate', candidate, event);
    else that.queue('ready');
    //trace('ice candidate');
  };
  this.connection.ongatheringchange =  function(event) {
    var target = event.currentTarget;
    if (target && target.iceGatheringState === 'complete') {
      that.queue('ready');
    }
  };
  this.emit('create');
  //trace('create');
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
  //trace('add local stream');
};


/**
 * Set ice candidate.
 *
 * @param  {candidate} candidate
 * @api private
 */

Peer.prototype.ice = function(candidate) {
  if(candidate) this.connection.addIceCandidate(new Candidate(candidate));
  //trace('add ice candidate');
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
  //trace('set local description');
};


/**
 * Set remote session descriptor.
 *
 * @param  {RTCSessionDescription} session
 * @api private
 */

Peer.prototype.remote = function(session) {
  this.connection.setRemoteDescription(new Session(session));
  //trace('set remote description');
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

Peer.prototype.session = function(fn, opts, type) {
  var that = this;
  var handler = (type === 'offer') ? 'createOffer' : 'createAnswer';
  this.emit('before ' + type);
  this.connection[handler](function(offer) {
    //trace('set session ' + type);
    that.local(offer);
    if(fn) fn(offer);
    that.queue(type, offer);
  },function(e) {
    that.emit('error', e);
  }, opts);
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

Peer.prototype.offer = function(fn, constraints) {
  this.channel = channel(this.connection.createDataChannel('master'), this);
  this.session(fn, constraints, 'offer');
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

Peer.prototype.answer = function(fn, constraints) {
  var that = this;
  this.connection.ondatachannel = function(event) {
    that.channel = channel(event.channel, that);
  };
  this.session(fn, constraints, 'answer');
};


/**
 * Return peer connection state.
 *
 * @return {String}
 * @api public
 */

Peer.prototype.state = function() {
  return this.connection.signalingState;
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
  return this;
};



/**
 * Send message.
 *
 * A message will be sent through a data channel only
 * if a channel has been openned through the constraints.
 *
 * Examples:
 *
 *  peer.send('hello');
 *
 * @return {this}
 * @api public
 */

Peer.prototype.send = function(msg) {
  this.queue('channel message', msg);
  return this;
};


/**
 * Use middlewares to extend peer.
 *
 * Examples:
 *
 *   peer.use(plugin, 'something');
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

},{"./lib/channel":2,"constraints":3,"emitter":4,"emitter-queue":5}],2:[function(require,module,exports){


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

},{}],3:[function(require,module,exports){


/**
 * Expose 'constraints'
 *
 * @api public
 */

module.exports = function(options) {

  var that = {}

  that.audio = function() {

  }

  that.video = function() {

  }

  that.servers = function() {

  }

  that.channel =  function() {

  }

  that.channel = function() {
    return options.channel != null && options.channel === true
  }

  that.peer = function() {

  }

  that.session = function() {

  }

  // will return new constraints object
  that.select = function() {

  }

  return that
}

},{}],4:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],5:[function(require,module,exports){

/**
 * Expose 'Queue'
 */

module.exports = Queue;


/**
 * Queue events on emitter-like objects.
 * 
 * @param {Emitter} emitter 
 * @see  http://github.com/component/emitter
 * @api public
 */

function Queue(emitter) {


  /**
   * Cache emitter on.
   * @api private
   */
  var cache = emitter.on;


  /**
   * Emit event and store it if no
   * defined callbacks.
   * example:
   *
   *   .queue('message', 'hi');
   *
   * @param {String} event
   * @api public
   */
  
  emitter.queue = function(topic) {
    this._queue = this._queue || {};
    this._callbacks = this._callbacks || {};
    if(this._callbacks[topic]) {
      this.emit.apply(this, arguments);
    } else {
      (this._queue[topic] = this._queue[topic] || [])
        .push([].slice.call(arguments, 1));
    }
  };


  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */
  
  emitter.on = emitter.addEventListener = function(topic, fn) {
    this._queue = this._queue || {};
    var topics = this._queue[topic];
    cache.apply(this, arguments);
    if(topics) {
      for(var i = 0, l = topics.length; i < l; i++) {
        fn.apply(this, topics[i]);
      }
      delete this._queue[topic];
    }
  };


}

},{}],6:[function(require,module,exports){
/**
 * Test dependencies.
 */

var peer = require('..');

// master
master = peer(null);
slave = peer(null);
master.on('message', function() {
  console.log('master message');
});
slave.on('message', function() {
  console.log('slave message');
});

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

},{"..":1}]},{},[6]);
