import { defineAction } from './actions'
const getTimeStamp = () => {
  return new Date().toTimeString()
}
const defaultActiveAction = () => defineAction('ACTIVE', (dispatch, getState, { log }) => log.info(`USER ACTIVE AT ${getTimeStamp()}`), 0)
const defaultInactiveAction = () => defineAction('INACTIVE', (dispatch, getState, { log }) => log.info(`USER INACTIVE AT ${getTimeStamp()}`), 5000)
const defaultIdleAction = () => defineAction('IDLE', (dispatch, getState, { log }) => log.info(`USER IDLE AT ${getTimeStamp()}`), 5000)
const defaultExpiredAction = () => defineAction('EXPIRED', (dispatch, getState, { log }) => {
  log.info(`USER EXPIRED AT ${getTimeStamp()}`)
}, 15000)

export const getActions = () => [ defaultActiveAction()
                                , defaultInactiveAction()
                                , defaultIdleAction()
                                , defaultExpiredAction()
                                ]

export const getActiveEvents = () => [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]

export const getUseFastState = () => true
export const getUseLocalState = () => true
export const getUseWebRTCState = () => true
export const getUseWebSocketsState = () => true

export const getThresholds = ({ mouse = 10, elapsedMS = 1000 } = { mouse: 10, elapsedMS: 1000 }) => ({ mouse, elapsedMS })

export const getLevel = () => 'debug'
