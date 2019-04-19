# secure-websocket-rpc

A server and client network interface for issuing secure RPC commands over websockets built on top of [secure-wsnet](https://github.com/secure-local-node/secure-wsnet). See also: [secret-handshake-over-hypercore](https://github.com/secure-local-node/secret-handshake-over-hypercore) and [rpc-protocol](https://github.com/secure-local-node/rpc-protocol)

## Installation

```sh
$ npm install secure-websocket-rpc
```

## Usage

```js
const rpc = require('secure-websocket-rpc')
const sharedKey = Buffer.from('f1fa2364b0d5ba54c7405ba2c5d1b4dcc2314b2e6dfb4d8124050c738c0c43a9', 'hex')

const server = rpc.createServer({
  sharedKey,
  commands: {
    echo(value) {
      return value
    }
  }
}).listen(3000)

const socket = rpc.connect(3000, { sharedKey })
socket.on('manifest', async (manifest) => {
  console.log(await socket.echo('hello'))
})
```

## API

### `server = rpc.createServer(opts[, oncommand, onextension, onconnection])`

Creates a websocket server for executing RPC commands.

* `opts.commands` is an object containing supported commands on the server
* `oncommand` is a callback function called when the `command` event is emitted
* `onextension` is a callback function called when the `extension` event is emitted
* `onconnection` is a callback function called when the `connection` event is emitted

The rest of `opts` is passed directly to [secure-wsnet][secure-wsnet]

```js
const server = rpc.createServer(opts)
```

### `socket = rpc.connect(port[, host[, opts, cb]])`

Connect to a host specified by `port` and `host` where `port`, `host`, and `opts` are passed directly to [secure-wsnet][secure-wsnet] and `cb(stream)` is called when the `manifest` event is emitted.

```js
const socket = rpc.connect(3000, 'localhost', opts)
```

### `rpc.compareCapability(left, right)`

Static method for comparing two capabilities (converting each to a `Buffer` if necessary). Returns 0 if `left` and `right` are equal, 1 if `right` should come before `left` when sorted, and -1 if `right` should come after `left` when sorted.

```js
const left = 'hello'
const right = 'hello'

rpc.compareCapability(left, right) // = 0
```

### `rpc.containsCapability(capabilities, capability)`

Static method for checking if `capability` is in `capabilities`.

```js
const capabilities = [ 'hello', 'world' ]
const capability = 'world'

rpc.containsCapability(capabilities, capability) // = true
```

## License

MIT

[secure-wsnet]: https://github.com/secure-local-node/secure-wsnet