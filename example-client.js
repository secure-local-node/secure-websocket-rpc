const rpc = require('./')

const sharedKey = Buffer.from('f1fa2364b0d5ba54c7405ba2c5d1b4dcc2314b2e6dfb4d8124050c738c0c43a9', 'hex')
const socket = rpc.connect(3000, { sharedKey })

socket.on('manifest', async () => {
  for (let i = 0; i < 10000; i++) {
    console.log(await socket.echo('hello'))
  }
})
