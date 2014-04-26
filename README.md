peer
====

  webrtc peer connection based on **[media](http://github.com/bredele/media)**

## Installation

with [component](http://github.com/component/component):

	$ component install bredele/peer


## Usage
 
  create a local peer connection:

```js
var peer = require('peer');
var master = peer();
```

  create a local peer connection and **[attach](http://github.com/bredele/attach)** it to a media:

```js
var master = peer(null, '.video');
```


## API

  The following API is entirely private and should only be access through [plugins](#use). Here's an example with the plugin **[connect](http://github.com/bredele/peer-connect)**:

```js
var master = peer(null, '#master');
var slave = peer();

master.use(connect(slave, '#slave'))
```

  connect create a local peer-to-peer connection.

### offer

  create an offer (initialize a master session description)

```js
master.offer();
```

 A `master` peer connection is a client which shares a media.
  

### anwer

  create an answer to a remote session description.

```js
var slave = peer();
slave.answer();
```

 A `slave` peer connection is a client (remote or local) which reads
 a shared media.

### ice

  set ice candidate

```js
master.ice(candidate);
```

### use

  public interface to create plugins.

```js
master.use(connect(slave, '#id'));
```

Here's a list of available plugins:
  - **[connect](http://github.com/bredele/peer-connect)**
    connect two local peer connection
  - **[signal](http://github.com/bredele/signal)**
    connect two remote peer connection

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