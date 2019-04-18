const rpc = require('./')

const sharedKey = Buffer.from('f1fa2364b0d5ba54c7405ba2c5d1b4dcc2314b2e6dfb4d8124050c738c0c43a9', 'hex')
const socket = rpc.connect(3000, {
  sharedKey,
  capabilities: [
    'read'
  ]
})

socket.on('connect', () => console.log('connect'))
socket.on('connection', () => console.log('connection'))
socket.on('manifest', async (manifest) => {
  console.log(manifest);
  console.log(await socket.echo('hello'))
  console.log(await socket.can(require('secret-handshake-over-hypercore').capability('read'))) // true or false
  //console.log(socket.auth);
  //await socket.auth({})
})
