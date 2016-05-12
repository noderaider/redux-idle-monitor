import { assert } from 'chai'
import createContext from './context'
import { IS_DEV, IDLESTATUS_ACTIVE, ROOT_STATE_KEY, NEXT_IDLE_STATUS_BLUEPRINT, LAST_IDLE_STATUS_BLUEPRINT, START_BLUEPRINT, STOP_BLUEPRINT, RESET_BLUEPRINT, ACTIVITY_BLUEPRINT } from './constants'
import { bisectStore } from 'redux-mux'
import { publicBlueprints, nextIdleStatusBlueprint, lastIdleStatusBlueprint } from './blueprints'
import { createStartDetection } from './actions'
import { getNextIdleStatusIn } from './states'
import { setLocalActive, setLocalInit, setLocalIdle } from './detection'


/** When context has already been created, it can be shared to middleware component. */
export const createMiddleware = context => {
  const { log, activeStatusAction, idleStatusAction, translateBlueprintTypes, translateBlueprints, IDLE_STATUSES, idleStatusDelay, thresholds } = context
  const { start, stop, reset } = translateBlueprints(publicBlueprints)
  const { nextIdleStatusAction
        , lastIdleStatusAction
        } = translateBlueprints({ nextIdleStatusAction: nextIdleStatusBlueprint
                                , lastIdleStatusAction: lastIdleStatusBlueprint
                                })
  const startDetection = createStartDetection(context)

  const { START
        , RESET
        , STOP
        , NEXT_IDLE_STATUS
        , LAST_IDLE_STATUS
        , ACTIVITY
        } = translateBlueprintTypes({ START: START_BLUEPRINT
                                    , RESET: RESET_BLUEPRINT
                                    , STOP: STOP_BLUEPRINT
                                    , NEXT_IDLE_STATUS: NEXT_IDLE_STATUS_BLUEPRINT
                                    , LAST_IDLE_STATUS: LAST_IDLE_STATUS_BLUEPRINT
                                    , ACTIVITY: ACTIVITY_BLUEPRINT
                                    })


  const idleStatuses = [IDLESTATUS_ACTIVE, ...IDLE_STATUSES]
  const getNextIdleStatus = getNextIdleStatusIn(idleStatuses)
  const IDLESTATUS_FIRST = getNextIdleStatus(IDLESTATUS_ACTIVE)
  const IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0]

  let stopDetection = null
  let nextTimeoutID = null
  let startDetectionID = null
  return store => {
    const idleStore = bisectStore(ROOT_STATE_KEY)(store)

    return next => action => {
      const { dispatch, getState } = store

      if(!action.type)
        return next(action)
      const { type, payload } = action

      const scheduleTransition = idleStatus => {
        clearTimeout(nextTimeoutID)
        let delay = dispatch(idleStatusDelay(idleStatus))
        assert.ok(delay, `must return an idle status delay for idleStatus === '${idleStatus}'`)
        assert.ok(typeof delay === 'number', `idle status delay must be a number type for idleStatus === '${idleStatus}'`)

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
        setLocalInit()
        stopDetection = dispatch(startDetection)
        let result = next(action)
        dispatch(nextIdleStatusAction(IDLESTATUS_FIRST))
        return result
      }

      if(type === RESET) {
        dispatch(stop())
        dispatch(start())
      }

      if(type === STOP) {
        clearTimeout(nextTimeoutID)
        clearTimeout(startDetectionID)
        if(stopDetection)
          dispatch(stopDetection)
      }

      if(type === NEXT_IDLE_STATUS) {
        return scheduleTransition(payload.nextIdleStatus)
      }

      if(type === LAST_IDLE_STATUS) {
        console.warn('LAST IDLE STATUS TRIGGERED')
        clearTimeout(nextTimeoutID)
        //dispatch(lastIdleStatusAction(IDLESTATUS_LAST))
        dispatch(idleStatusAction(IDLESTATUS_LAST))
      }

      if(type === ACTIVITY) {
        if(stopDetection && thresholds.phaseOffMS) {
          dispatch(stopDetection)
          stopDetection = null
          startDetectionID = setTimeout(() => {
            stopDetection = dispatch(startDetection)
          }, thresholds.phaseOffMS)
        }

        let result = next(action)
        if(payload.type !== 'local') {
          //log.info('Setting local tab to active')
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
