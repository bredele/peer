peer
====

  composable and clean webrtc peer connection based on **[datastore](http://github.com/bredele/datastore)**.

## Installation

with [component](http://github.com/component/component):

	$ component install bredele/peer


## Usage
 
  initialize a local peer connection with an optional list of servers:

```js
var peer = require('peer');
var master = peer(servers);
```

  set peer constraints (see [datastore](http://github.com/bredele/datastore)):

```js
master.set('servers', servers);
master.set('optional', options);
```

  create peer connection:

```js
master.create();
```

<!-- say about hooks -->

## API

The following API is entirely private and should only be access through [plugins](#use) or [codecs](#codec).

Here's a list of available plugins:
  - **[connect](http://github.com/bredele/connect)** creates local peer-to-peer connection
  - **[channel](http://github.com/bredele/channel)** send data through a peer connection
  - **[signal](http://github.com/bredele/signal)** creates remote peer-to-peer connection
  - **[video](http://github.com/bredele/video)** attach video stream to a peer-to-peer connection

Here's a list of available codecs:
  - **[rate](http://github.com/bredele/rate)** changes data channel speed/rate limitation
  - **[opus](http://github.com/bredele/opus)** set opus as preferred audio codec


> a plugin can add codecs as well
  
### create

  create a peer connection

```js
master.create();
```
  

<!-- to give more flexibility and set constraints -->

### offer

  create an offer (initialize a master session description) and
  set local session description.

```js
master.offer();
```

 A `master` peer connection is a client which shares a media.
  

### anwer

  create an answer (initialize a slave session description) and set
  local session description.

```js
var slave = peer();
slave.answer();
```

 A `slave` peer connection is a client (remote or local) which reads
 a shared media.

### local

  set local session description

```js
master.local(sdp);
```

### remote

  set remote session description

```js
master.local(sdp);
```

### ice

  set ice (network) candidate

```js
master.ice(candidate);
```

### stream

  add peer local stream

```js
master.stream(stream);
```

### codec

  public interface to set codec on the peer session description.

```js
master.codec(function(sdp) {
  // do something on sdp and return result
});
```

  codecs are session descriptions filters so make sure your codec return the session description.

### use

  public interface to create plugins.

```js
master.use(function(peer) {
  // do something
});
```

## Concepts

### plugins

  There is some good webrtc librairies outhere but none of them allow you to compose a peer-to-peer connection. They usually are an abstraction to the entire webrtc API which ironically make them hard to reuse.

  Peer is not a framework, think of it as the minimum amount of glue necessary to create a peer to peer connection. The beauty part is that it provides a mechanism to compose other modules aka plugins. A plugin is trivial and do one thing but do it well. At the end you can compose your webrtc application, reuse some plugins or create your own and get what you really want.

  Oh, and it makes developping a webrtc ridiculously simple. For example, with [channel](http://github.com/bredele/channel) and [video](http://github.com/bredele/video) you can create a skype-like application in 2 lines:

  ```js
  var skype = peer();
  skype.use(video('#id'));
  skype.use(channel('chat'));
  ```

  Peer has been developped to let flourish an [ecosystem](#api) of plugins.

### codecs

  A session description (SDP) contains all the information needed to initialize a peer connection. It contains for example the types of media to be exchanged (such as audio, video, data), the network topology, the bandwidth information and other metadata.

  A `codec` in peer is a piece of JavaScript which modifies the session description and therfore the parameters of a peer-to-peer communication. You can for example set [opus](http://github.com/bredele/opus) as the preferred type of audio stream or change the speed limitation or a data channel with [rate](http://github.com/bredele/rate).


## License

The MIT License (MIT)

Copyright (c) 2014 Olivier Wietrich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
