const jsc = require('jsverify')
const exec = require('child_process').exec

const NETWORK_OUTLET = 1
const SENSO_OUTLET = 2

const PLAY_VM = 'dividat-play-client'
const PLAY_VM_USR = 'IEUser'
const PLAY_VM_PWD = 'Passw0rd!'

const initialSystem =
  { isSensoOn: false,
    isNetworkConnected: false,
    isClientOn: false,
    isDriverRunning: false
  }

const gen$deviceEvent = jsc.oneof([
  jsc.constant({ type: 'toggle-senso' }),
  jsc.constant({ type: 'toggle-network' }),
  jsc.constant({ type: 'toggle-client' }),
  jsc.constant({ type: 'toggle-driver' }),
  jsc.nat(30).smap(n => ({ type: 'wait', seconds: n }), event => event.seconds)
])

const gen$systemRun = jsc.array(gen$deviceEvent)

function set (key, prop, object) {
  let clone = Object.assign({}, object)
  clone[key] = prop
  return clone
}

function toggle (key, object) {
  return set(key, !object[key], object)
}

function stepSim (system, event) {
  switch (event.type) {
    case 'toggle-senso':
      return toggle('isSensoOn', system)

    case 'toggle-network':
      return toggle('isNetworkConnected', system)

    case 'toggle-client':
      return toggle('isClientOn', system)

    case 'toggle-driver':
      return system.isClientOn ? toggle('isDriverRunning', system) : null

    case 'wait':
      return system

    default:
      return null
  }
}

function sim (events) {
  let finalSystem = events.reduce((system, event) => system == null ? null : stepSim(system, event), initialSystem)
  finalSystem.isConnected =
    finalSystem.isSensoOn
      && finalSystem.isNetworkConnected
      && finalSystem.isClientOn
      && finalSystem.isDriverRunning

  return finalSystem
}

function promisedSystem (system) {
  return {
    isSensoOn: Promise.resolve(system.isSensoOn),
    isNetworkConnected: Promise.resolve(system.isNetworkConnected),
    isClientOn: Promise.resolve(system.isClientOn),
    isDriverRunning: Promise.resolve(system.isDriverRunning)
  }
}

async function stepExec (system, event) {
  switch (event.type) {
    case 'toggle-senso':
      return Promise.resolve(
        set(
          'isSensoOn',
          system.isSensoOn.then(flipSwitch(SENSO_OUTLET)),
          system
        )
      )

    case 'toggle-network':
      return Promise.resolve(
        set(
          'isNetworkConnected',
          system.isNetworkConnected.then(flipSwitch(NETWORK_OUTLET)),
          system
        )
      )

    case 'toggle-client':
      return Promise.resolve(
        set(
          'isClientOn',
          system.isClientOn.then(toggleClient),
          system
        )
      )

    case 'toggle-driver':
      return Promise.resolve(
        set(
          'isDriverRunning',
          Promise.all(system.isClientOn, system.isDriverRunning).then(toggleDriver),
          system
        )
      )

    case 'wait':
      return sleep(event.seconds).then(() => system)

    default:
      return Promise.reject('Unknown event: ' + event.type)
  }
}

async function sleep (seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), seconds * 1000)
  })
}

async function toggleClient (isOn) {
  if (isOn) {
    return pexec(`VBoxManage controlvm ${PLAY_VM} poweroff`, _ => false)
  } else {
    return pexec(`VBoxManage startvm ${PLAY_VM}`, x => x).then(_ =>
      pexec(vmcmd('run', 'cmd.exe', '"/c" exit'), _ => true)
    )
  }
}

function vmcmd (verb, exe, args) {
  return `VBoxManage guestcontrol "${PLAY_VM}" ${verb} "${exe}" --username "${PLAY_VM_USR}" --password '${PLAY_VM_PWD}' -- ${args}`
}

async function toggleDriver (isOn) {
  if (isOn) {
    vmcmd('run', 'cmd.exe', '/c TaskKill /F /IM "Dividat Driver.exe"', _ => false)
  } else {
    pexec(vmcmd('start', 'C:\\Users\\IEUser\\AppData\\Local\\dividat\\Dividat Driver.exe', ''), _ => true)
  }
}

async function flipSwitch (outletId) {
  return (isOn) => setOutletState(outletId, !isOn)
}

async function pexec (command, processResult) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => err != null ? reject(err) : resolve(processResult(stdout)))
  })
}

async function setOutletState (outletId, shouldBeOn) {
  pexec(`sispmctl ${shouldBeOn ? '-o' : '-f'} ${outletId}`, _ => shouldBeOn)
}

jsc.sampler(gen$systemRun)(5).forEach(events => console.log(events, sim(events)))
