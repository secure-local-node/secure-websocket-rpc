const { capability } = require('secret-handshake-over-hypercore')
const protocol = require('rpc-protocol')
const messages = require('./messages')
const wsnet = require('secure-wsnet')
const pify = require('pify')

const MANIFEST = 0xe

function createServer(opts, oncommand, onextension, onconnection) {
  if (!opts || 'object' !== typeof opts) {
    opts = {}
  }

  const server = new wsnet.Server(opts, onconnection)
  server.on('connection', (stream) => {
    const rpc = protocol(Object.assign({ stream }, opts))
    let auth = null

    if ('function' === typeof oncommand) {
      rpc.on('command', oncommand)
    }

    if ('function' === typeof onextension) {
      rpc.on('extension', onextension)
    }

    rpc.on('command', (...args) => server.emit('command', ...args))
    rpc.on('extension', (...args) => server.emit('extension', ...args))

    const manifest =  {
      commands: Object.keys(opts.commands || {}).filter((key) => {
        return 'function' === typeof opts.commands[key]
      })
    }

    rpc.extension(MANIFEST, messages.Manifest)

    stream.on('auth', (info) => {
      auth = info
    })

    stream.on('handshake', (...args) => {
      rpc.send(MANIFEST, manifest)
    })

    for (const key of manifest.commands) {
      rpc.command(key, (req, reply) => {
        req.auth = auth
        const args = req.arguments.concat(reply, req)
        if (0 === req.arguments.length) {
          args.unshift(undefined)
        }
        return opts.commands[key](...args)
      })
    }
  })

  return server
}

function connect(port, host, opts, cb) {
  const stream = wsnet.connect(port, host, opts)
  let rpc = null

  stream.once('handshake', onhandshake)
  stream.on('manifest', onmanifest)

  if ('function' === typeof cb) {
    stream.once('manifest', () => cb(stream))
  }

  stream.createReadStream = (...args) => {
    return rpc.createReadStream(...args)
  }

  return stream

  function onhandshake() {
    rpc = protocol(Object.assign({ stream }, opts))
    rpc.extension(MANIFEST, messages.Manifest)
    rpc.on('command', (...args) => stream.emit('command', ...args))
    rpc.on('extension', (...args) => stream.emit('extension', ...args))
    rpc.on('extension', (ext, type, buf, reply) => {
      if (MANIFEST === type) {
        process.nextTick(() => stream.emit('manifest', ext))
      }
    })
  }

  function onmanifest(manifest) {
    if (!manifest && !Array.isArray(manifest.commands)) {
      return
    }

    stream.emit('rpc', rpc)

    for (const key of manifest.commands) {
      if (key in stream) {
        continue
      }

      Object.assign(stream, {
        [key](...args) {
          let cb = undefined

          if ('function' === typeof args[args.length - 1]) {
            cb = args.pop()
          }

          return pify(call)()

          function call(done) {
            return rpc.call(key, args, callback(done, cb))
          }

          function callback(done, cb) {
            return (err, res) => {
              if ('function' === typeof cb) {
                try {
                  cb(err, res)
                } catch (err) {
                  return done(err)
                }
              }

              done(err, res)
            }
          }
        }
      })
    }
  }
}

function compareCapability(left, right) {
  if ('string' === typeof left) {
    left = capability(left)
  }

  if ('string' === typeof right) {
    right = capability(right)
  }

  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

function containsCapability(capabilities, capability) {
  for (const cap of capabilities) {
    if (0 === compareCapability(cap, capability)) {
      return true
    }
  }

  return false
}

module.exports = {
  containsCapability,
  compareCapability,
  createServer,
  connect
}
