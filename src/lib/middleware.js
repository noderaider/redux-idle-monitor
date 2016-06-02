import createContext from './context'
import { IS_DEV, IDLESTATUS_ACTIVE, ROOT_STATE_KEY, NEXT_IDLE_STATUS_BLUEPRINT, LAST_IDLE_STATUS_BLUEPRINT, START_BLUEPRINT, STOP_BLUEPRINT, ACTIVITY_BLUEPRINT } from './constants'
import { bisectStore } from 'redux-mux'
import { publicBlueprints, nextIdleStatusBlueprint, lastIdleStatusBlueprint } from './blueprints'
import { createDetection, setLocalActive, setLocalInit, setLocalIdle  } from './actions'
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


  const idleStatuses = [IDLESTATUS_ACTIVE, ...IDLE_STATUSES]
  const getNextIdleStatus = getNextIdleStatusIn(idleStatuses)
  const IDLESTATUS_FIRST = getNextIdleStatus(IDLESTATUS_ACTIVE)
  const IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0]

  let nextTimeoutID = null
  let startDetectionID = null
  let isStarted = false
  return store => {
    const idleStore = bisectStore(ROOT_STATE_KEY)(store)
    const { startActivityDetection, stopActivityDetection, startLocalSync, stopLocalSync } = createDetection(context)(store)
    if(IS_DEV) {
      should.exist(startActivityDetection, 'createDetection should return startActivityDetection')
      should.exist(stopActivityDetection, 'createDetection should return stopActivityDetection')
      should.exist(startLocalSync, 'createDetection should return startLocalSync')
      should.exist(stopLocalSync, 'createDetection should return stopLocalSync')
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
        //log.trace(`Scheduling next idle status '${idleStatus}' in ${delay} MS, then '${nextIdleStatus}'`)
        nextTimeoutID = setTimeout(() => {
          //log.trace(nextMessage)
          next(action)
          dispatch(idleStatusAction(idleStatus))
          if(nextIdleStatus) {
            dispatch(nextIdleStatusAction(nextIdleStatus))
          } else {
            //log.info('No more actions to schedule, setting local state to idle')
            setLocalIdle()
          }
        }, delay)
        return function cancel() {
          clearTimeout(nextTimeoutID)
          //log.trace(nextCancelMessage(new Date().toTimeString()))
        }
      }

      if(type === START) {
        if(!isStarted) {
          setLocalInit()
          startActivityDetection()
          startLocalSync()
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
          stopLocalSync()
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
          stopLocalSync()
          stopActivityDetection()
          startDetectionID = setTimeout(() => {
            startActivityDetection()
            startLocalSync()
          }, thresholds.phaseOffMS)
        }

        let result = next(action)
        if(payload.type !== 'local') {
          log.info('Setting local tab to active')
          setLocalActive()
        }
        if(payload.isTransition) {
          //log.trace('Transition activity occurred, triggering user active action.')
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
