const rpc = require('./')
const fs = require('fs')

const sharedKey = Buffer.from('f1fa2364b0d5ba54c7405ba2c5d1b4dcc2314b2e6dfb4d8124050c738c0c43a9', 'hex')
const server = rpc.createServer({
  sharedKey,
  commands: {
    echo(value) {
      return value
    }
  }
})

server.listen(3000, () => {
  console.log('listening on', server.address())
})

server.on('connection', (socket) => {
  console.log('onconnection')
})
