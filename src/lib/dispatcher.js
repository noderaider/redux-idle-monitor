import { assert } from 'chai'
import { createStore } from 'redux'
import { createAction } from 'redux-actions'
import  { ROOT_STATE_KEY
        , ACTIVITY
        , ACTIVITY_DETECTION
        } from './constants'
import { createActionDispatchers, startHandler, resetHandler, stopHandler } from './actions'

import { createNoopStore, createLocalStore, bisectStore, configureReducer, createMergingReducer, createStoreMultiplexer, createActionMultiplexer } from 'redux-addons/lib/store'


const createDispatcher = context => (dispatch, getState) => {
  /**
   * Multiplexer for calling dispatch and getState across all stores or individually.
   * @type {StoreMultiplexer}
   */
  const stores = createStoresDispatcher(context)(dispatch, getState)
  const detection = createDetectionDispatcher(context, { stores })(dispatch, getState)
  const action = createActionDispatcher(context, { stores, detection })(dispatch, getState)
  return { stores, detection, action }
}
export default createDispatcher


const createStoresDispatcher = context => (dispatch, getState) => {
  const { appActionNames, log, getAction, getActionType, getTimeoutMS, useFastStore, useLocalStore, initialActionName, getActionContextByName } = context

  const getPayloadCreator = actionName => getActionContextByName(actionName)
  const actionMapping = [ [ACTIVITY, { type: getActionType(ACTIVITY), payloadCreator: getPayloadCreator(ACTIVITY) }]
                        , [ACTIVITY_DETECTION, { type: getActionType(ACTIVITY_DETECTION),  payloadCreator: getPayloadCreator(ACTIVITY_DETECTION) }]
                        , ...appActionNames.map(x => [x, { type: getActionType(x), payloadCreator: getPayloadCreator(x) }])
                        ]

  const actionMultiplexer = createActionMultiplexer(actionMapping)


  const libStore = bisectStore({ dispatch, getState }, 'idle')
  let storesMapping = [ [ 'lib', libStore ] ]

  const createInitialFastState = () => ({ lastActive: +new Date(), lastEvent: { x: -1, y: -1 } })
  const createFastReducer = () => createMergingReducer(ACTIVITY)
  if(useFastStore)
    storesMapping.push([ 'fast', createStore(createFastReducer(), createInitialFastState()) ])

  const createInitialLocalState = () => ({ lastActive: +new Date() })
  const createLocalReducer = () => configureReducer(action => { lastActive: action.payload.lastActive }, false)(ACTIVITY)
  if(useLocalStore)
    storesMapping.push([ 'local', createLocalStore(createLocalReducer(), createInitialLocalState()) ])

  const stores = createStoreMultiplexer(storesMapping, actionMultiplexer)
  return stores
}

const createDetectionDispatcher = (context, { stores }) => (dispatch, getState) => {
  const { log, activeEvents, initialActionName, initialAction, thresholds, getActionType } = context
  const { dispatchAction } = stores


  /** Detects whether the activity should trigger a redux update */
  const _shouldActivityUpdate = ({ type, pageX, pageY }) => {
    if(type !== 'mousemove') return true

    const { lastActive, lastEvent: { x, y } } = stores.selectFirst('fast', 'lib').getState()

    if (typeof pageX === 'undefined' || typeof pageY === 'undefined')
      return false
    if(Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
      return false

    // SKIP UPDATE IF ITS UNDER THE THRESHOLD MS FROM THE LAST UPDATE
    let elapsedMS = (+new Date()) - lastActive
    if (elapsedMS < thresholds.elapsedMS)
      return false
    if(process.env.NODE_ENV !== 'production')
      log.trace(`_shouldActivityUpdate: elapsed vs threshold => E[${elapsedMS}] >= T[${thresholds.elapsedMS}], lastActive => ${lastActive}`)
    return true
  }


  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!_shouldActivityUpdate(e))
      return
    /*
    const { actionName } = stores.lib.getState()
    if(actionName !== initialActionName) {
      dispatchAction(initialActionName, { dispatch, getState, context })
      console.warn('RESET', actionName, initialActionName)
      //return dispatch(actions.reset)
    }
    */
    //console.warn('SKIP RESTART', actionName, initialActionName)
    dispatchAction(ACTIVITY, { })
    //stores.dispatch(actions.userActivity, { x: e.pageX, y: e.pageY})
    /** THIS WILL BE ROUTED TO FAST OR LOCAL STATE IF ENABLED */
  }

  const activityDetectionType = getActionType(ACTIVITY_DETECTION)

  return  { get isRunning() { return stores.lib.getState().isDetectionRunning }
          , start: () => {
              log.warn('activity detection starting...')
              if(process.env.NODE_ENV !== 'production')
                assert.ok(!stores.lib.getState().isDetectionRunning, 'activity detection is already running')
              activeEvents.forEach(x => document.addEventListener(x, onActivity))
              dispatchAction(ACTIVITY_DETECTION, { isDetectionRunning: true })

              //setState(ACTIVITY_DETECTION_ACTION, { isDetectionRunning: true })
            }
          , stop: () => {
              log.warn('activity detection terminating...')
              if(process.env.NODE_ENV !== 'production')
                assert(stores.lib.getState().isDetectionRunning === true, 'activity detection is not running')
              activeEvents.forEach(x => document.removeEventListener(x, onActivity))
              dispatchAction(ACTIVITY_DETECTION, { isDetectionRunning: false })
              //setState(ACTIVITY_DETECTION_ACTION, { isDetectionRunning: false })
            }
          }

}


const createActionDispatcher = (context, { stores, detection }) => (dispatch, getState) => {
  const { log, getTimeoutMS, getAction, getActionType, getNextActionName, useFastStore, setFastState } = context
  const _isPauseTriggered = timeoutMS => timeoutMS === null || timeoutMS === false || typeof timeoutMS === 'undefined'
  const { dispatchAction } = stores

  /** Responsible for clearing old timeout and scheduling new one or immediately executing, returns new timeoutID or undefined */
  /*
  const scheduleObsolete = actionName => {
    timeout.clear()
    const delay = timeout.timeoutMS(actionName)
    log.info({ actionName, timeoutMS }, 'schedule')
    const meta = { delay: delay > 0 ? delay : noop() }
    const args = { actionName, isPaused: _isPauseTriggered(timeoutMS), meta }

    if(timeoutMS > 0) {

      //timeout.schedule(() => execute(args), timeoutMS)
      //return setTimeout(() => execute(args), timeoutMS)
    }

    execute(args)
  }
  */
  const getDelay = actionName => {
    let result = getTimeoutMS(actionName)
    return typeof result === 'function' ? result(dispatch, getState, _getChildContext(context)) : result
  }
  //const executeIn = createAction('EXECUTE_IN', (actionName, delay) => ({ actionName }), (actionName, delay) => ({ delay }))

  /** Responsible for executing an action */
  const execute = ( actionName /*isPaused, meta*/ ) => {
    const ACTION_TYPE = getActionType(actionName)

    //const delay = getDelay(actionName)
    /*
    const isPaused = _isPauseTriggered(delay)
    const meta = { delay: delay > 0 ? delay : (() => {})() }
    //const nextActionName = getNextActionName(actionName)
    //const nextDelay = nextActionName ? getDelay(nextActionName) : null
    */
    /*
    const libState = stores.lib.getState()
    const wasPaused = libState.isPaused
    const isDetectionRunning = libState.isDetectionRunning
    */

    /** SCHEDULE THE NEXT ACTION IF IT EXISTS */
    //const isLastAction = nextActionName === null || typeof nextActionName === 'undefined'

    //log.info({ actionName, ACTION_TYPE, isPaused, wasPaused, isDetectionRunning, nextActionName }, 'execute')
    /** TODO: CHECK LOCAL STATE HERE AND IF ITS BEEN ACTIVE, POSTPONE THE ACTION ABOUT TO BE EXECUTED */

/*
    if((isLastAction || isPaused) && isDetectionRunning) {
      detection.stop()
    }
    if(!(isLastAction || isPaused) && !isDetectionRunning) {
      detection.start()
    }
    */




        /** UPDATE THE STATE OF THE APP */
        //console.warn('DISPATCHING NEXT IN ', nextDelay)
    //let timeoutID = !isLastAction && !isPaused && nextDelay ? dispatchAction(nextActionName, { dispatch, getState, context }, { delay: nextDelay }) : null
    //const next = nextActionName => nextActionName ? dispatchAction(nextActionName, {}, { delay: getDelay(nextActionName) }) : detection.stop
    /*
    if(!isPaused && !isDetectionRunning)
      detection.start()
    */
    /*
    if((!next || isPaused) && isDetectionRunning) {
      detection.stop()
    }
    if(next && !isPaused && !isDetectionRunning) {
      detection.start()
    }
    */
    /*
    return dispatch(createAction(ACTION_TYPE), { actionName: actionName
                          , isIdle: typeof nextActionName === 'undefined'
                          , isPaused
                          , meta
                          //, meta: { idle: true, delay: 4000 }
                          //, timeoutID
                          }())
                          */
    dispatchAction(actionName,  { actionName: actionName
                                //, isIdle: typeof next === 'undefined'
                                //, isPaused
                                //, meta: { idle: true, delay: 4000 }
                                //, timeoutID
                                })
    /** EXECUTE THE USER DEFINED ACTION WITH REDUX THUNK ARGS + CONTEXT (LOG, START/STOP/RESET DISPATCHABLE ACTIONS) */
   // const { next, delay } =
    getAction(actionName)(dispatch, getState, _getChildContext(context))
    /*
    if(next)
      dispatchAction(next, {}, { delay })
    else
      detection.stop()
    */
  }
  return { execute }
}

const _getChildContext = context => ({ ...context, actions: createActionDispatchers(context) })











/*

class MemoryStore {
  constructor(stateKeys, initialState) {
    this._stateKeys = stateKeys
    this._state = initialState
    this._stateAccessor = this._stateKeys.reduce((stateAccessor, key) => {
      Object.defineProperty(stateAccessor, key, { get: () => this._state[key] })
      return stateAccessor
    }, {})
  }

  _shouldSetState = newState => Object.keys(newState).some(x => this._stateKeys.includes(x) && typeof newState[x] !== 'undefined');

  _filterState = newState => {
    return Object.keys(newState).reduce((state, key) => {
      if(this._stateKeys.includes(key))
        state[key] = newState[key]
      return state
    }, {})
  };

  getState = () => {
    return this._stateAccessor
  };
  setState = (newState) => {
    if(!this._shouldSetState(newState))
      return
    console.warn(`SETTING FAST STATE => ${JSON.stringify(newState)}`)
    Object.keys(this._filterState(newState)).forEach(stateKey => this._state[stateKey] = newState[stateKey])
  };
}

*/
