// TODO: use mocha - that will allow more flexible testing and output can be directly used for medtech documentation
const request = require('request')

const driverUrl = 'https://localhost.dividat.com:8380'

request.get({url: driverUrl, timeout: 2000})
  .on('response', (response) => {
    console.log(`Established connection to driver on ${driverUrl}.`)
    process.exit(0)
  })
  .on('error', (err) => {
    console.error(err)
    process.exit(1)
  })
