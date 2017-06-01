const request = require('request')

const driverUrl = 'https://localhost.dividat.com:8380'

describe('Server', () => {
  it(`should accept connections at ${driverUrl}`, (done) => {
    request.get({url: driverUrl, timeout: 2000})
      .on('response', () => done())
      .on('error', done)
  })
})
