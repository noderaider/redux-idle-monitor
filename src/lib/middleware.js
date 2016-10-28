import createContext from './context'
import { IS_DEV, IDLESTATUS_ACTIVE, ROOT_STATE_KEY, NEXT_IDLE_STATUS_BLUEPRINT, LAST_IDLE_STATUS_BLUEPRINT, START_BLUEPRINT, STOP_BLUEPRINT, ACTIVITY_BLUEPRINT } from './constants'
import { bisectStore } from 'redux-mux'
import { publicBlueprints, nextIdleStatusBlueprint, lastIdleStatusBlueprint } from './blueprints'
import { createDetection } from './actions'
import { getNextIdleStatusIn } from './states'
const should = require('chai').should()


/** When context has already been created, it can be shared to middleware component. */
export const createMiddleware = context => {
  const { log, activeStatusAction, idleStatusAction, translateBlueprintTypes, translateBlueprints, IDLE_STATUSES, idleStatusDelay, thresholds } = context
  const { start, stop } = translateBlueprints(publicBlueprints)
  const { nextIdleStatusAction
        , lastIdleStatusAction
        } = translateBlueprints({ nextIdleStatusAction: nextIdleStatusBlueprint
                                , lastIdleStatusAction: lastIdleStatusBlueprint
                                })


  const { START
        , STOP
        , NEXT_IDLE_STATUS
        , LAST_IDLE_STATUS
        , ACTIVITY
        } = translateBlueprintTypes({ START: START_BLUEPRINT
                                    , STOP: STOP_BLUEPRINT
                                    , NEXT_IDLE_STATUS: NEXT_IDLE_STATUS_BLUEPRINT
                                    , LAST_IDLE_STATUS: LAST_IDLE_STATUS_BLUEPRINT
                                    , ACTIVITY: ACTIVITY_BLUEPRINT
                                    })


  const idleStatuses = [ IDLESTATUS_ACTIVE, ...IDLE_STATUSES ]
  const getNextIdleStatus = getNextIdleStatusIn(idleStatuses)
  const IDLESTATUS_FIRST = getNextIdleStatus(IDLESTATUS_ACTIVE)
  const IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0]

  let nextTimeoutID = null
  let startDetectionID = null
  let isStarted = false
  return store => {
    const idleStore = bisectStore(ROOT_STATE_KEY)(store)
    const { startActivityDetection, stopActivityDetection, localSync } = createDetection(context)(store)
    if(IS_DEV) {
      should.exist(startActivityDetection, 'createDetection should return startActivityDetection')
      should.exist(stopActivityDetection, 'createDetection should return stopActivityDetection')
      should.exist(localSync, 'localSync should exist')
    }
    return next => action => {
      const { dispatch, getState } = store

      if(!action.type)
        return next(action)
      const { type, payload } = action

      const scheduleTransition = idleStatus => {
        clearTimeout(nextTimeoutID)
        let delay = dispatch(idleStatusDelay(idleStatus))
        should.exist(delay, `must return an idle status delay for idleStatus === '${idleStatus}'`)
        delay.should.be.a('number', `idle status delay must be a number type for idleStatus === '${idleStatus}'`)

        let lastActive = new Date().toTimeString()
        let nextMessage = `${NEXT_IDLE_STATUS} action continuing after ${delay} MS delay, lastActive: ${new Date().toTimeString()}`
        let nextCancelMessage = cancelledAt => `${NEXT_IDLE_STATUS} action cancelled before ${delay} MS delay by dispatcher, lastActive: ${new Date().toTimeString()}, cancelledAt: ${cancelledAt}`
        let nextIdleStatus = getNextIdleStatus(idleStatus)
        nextTimeoutID = setTimeout(() => {
          next(action)
          dispatch(idleStatusAction(idleStatus))
          if(nextIdleStatus) {
            dispatch(nextIdleStatusAction(nextIdleStatus))
          } else {
            localSync.trigger(false)
          }
        }, delay)
        return function cancel() {
          clearTimeout(nextTimeoutID)
        }
      }

      if(type === START) {
        if(!isStarted) {
          startActivityDetection()
          localSync.start()
          isStarted = true
        }
        let result = next(action)
        dispatch(nextIdleStatusAction(IDLESTATUS_FIRST))
        return result
      }

      if(type === STOP) {
        clearTimeout(nextTimeoutID)
        clearTimeout(startDetectionID)
        if(isStarted) {
          localSync.stop()
          stopActivityDetection()
          isStarted = false
        }
      }

      if(type === NEXT_IDLE_STATUS) {
        return scheduleTransition(payload.nextIdleStatus)
      }

      if(type === LAST_IDLE_STATUS) {
        clearTimeout(nextTimeoutID)
        dispatch(idleStatusAction(IDLESTATUS_LAST))
      }

      if(type === ACTIVITY) {
        if(thresholds.phaseOffMS) {
          localSync.stop()
          stopActivityDetection()
          startDetectionID = setTimeout(() => {
            startActivityDetection()
            localSync.start()
          }, thresholds.phaseOffMS)
        }

        let result = next(action)
        if(payload.type !== 'local') {
          log.info('Setting local tab to active')
          localSync.trigger(true)
        }
        if(payload.isTransition) {
          dispatch(activeStatusAction)
        }
        dispatch(nextIdleStatusAction(IDLESTATUS_FIRST))
        return result
      }
      return next(action)
    }
  }
}

/** Creates middleware from opts including validation in development */
export default function configureMiddleware(opts) { return createMiddleware(createContext(opts)) }
