// Translate declaration of Senso signals to binary stream fit for replayer

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')

const declarationFile = argv['_'].pop()
if (declarationFile == null) {
  console.log("Expected declaration file as parameter.")
  process.exit(1)
}

// { at: ms, duration: ms, values : { up-a: int, up-b: int, ... }, ease: boolean }
const declarations = fs.readFileSync(declarationFile, 'utf-8').split('\n').filter(str => str !== "").map(JSON.parse)
const duration = declarations.reduce((currentMax, decl) => Math.max(currentMax, decl.at + decl.duration), 0)
const delay = 20
const directions = ['center', 'up', 'right', 'down', 'left']
const sensorNames = ['a', 'b', 'c', 'd']
const zero = add ({}, {})

for (let ms = 0; ms <= duration; ms += delay) {
  const values = declarations
    .filter(decl => decl.at <= ms && (decl.at + decl.duration) >= ms)
    .map(decl => toValues(ms, decl))
    .reduce(add, zero)
  console.log(encode(delay, values))
}


function add(valuesA, valuesB) {
  const added = {}
  for (let dir of directions) {
    for (let sensor of sensorNames) {
      const name = dir + '-' + sensor
      added[name] = (valuesA[name] || 0) + (valuesB[name] || 0)
    }
  }
  return added
}

function toValues(currentTime, decl) {
  const values = {}
  const easeFrames = 15
  let easeFactor = 1
  if (decl.ease !== false && (easeFrames * delay >= currentTime - decl.at)) {
    easeFactor = (currentTime - decl.at) / (easeFrames * delay)
  } else if (decl.ease !== false && (easeFrames * delay >= decl.at + decl.duration - currentTime)) {
    easeFactor = (decl.at + decl.duration - currentTime) / (easeFrames * delay)
  }
  for (let key in decl.values) {
    values[key] = decl.values[key] * easeFactor
  }
  return values
}

function toBuffer(values) {
  const buff = Buffer.alloc(56)
  buff.writeUInt8(1, 0) // Protocol version
  buff.writeUInt8(1, 1) // Packet count
  buff.writeUInt8(0, 2) // Empty
  buff.writeUInt8(0, 3) // Empty
  buff.writeUInt8(0, 4) // Empty
  buff.writeUInt8(0, 5) // Empty
  buff.writeUInt8(0, 6) // Empty
  buff.writeUInt8(0, 7) // Empty
  buff.writeUInt16LE(44, 8) // Block length
  buff.writeUInt8(0x80, 10) // Type
  buff.writeUInt8(0, 11) // Reserved
  buff.writeUInt32LE(0, 12) // Timestamp, not used here
  let offset = 16
  for (let dir of directions) {
    for (let sensor of sensorNames) {
      buff.writeUInt16LE(values[dir + "-" + sensor], offset)
      offset += 2  
    }
  }
  return buff
}

function encode(time, values) {
  return [
    String(time),
    ",",
    toBuffer(values).toString('base64')
  ].join("")
}

