import { assert } from 'chai'
import { createAction } from 'redux-actions'
import  { ROOT_STATE_KEY
        , ACTIVITY
        , ACTIVITY_DETECTION
        } from './constants'
import { createActions, createStart, createReset, createStop } from './actions'


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

export default function createDispatcher(context) {
  return (dispatch, getState) => {
    const stores = createStoresDispatcher(context)(dispatch, getState)
    //const timeout = createTimeoutDispatcher(context, { stores })(dispatch, getState)
    const detection = createDetectionDispatcher(context, { stores /* timeout */ })(dispatch, getState)
    const action = createActionDispatcher(context, { /* timeout, */ stores, detection })(dispatch, getState)
    return { stores, /*timeout, */ detection, action }
  }
}

const createStoresDispatcher = context => (dispatch, getState) => {
  const { log, getAction, getTimeoutMS, useFastState, useLocalState, initialLastEvent } = context

  const fastStateKeys = ['lastActive', 'lastEvent', 'timeoutID', 'isDetectionRunning']
  const localStateKeys = ['lastActive']
  const reduxStateKeys = ['actionName', 'isIdle', 'isPaused', 'lastActive', 'lastEvent', 'timeoutID', 'isDetectionRunning']

  const _shouldSetState = (newState, stateKeys) => Object.keys(newState).some(x => fastStateKeys.includes(x) && typeof newState[x] !== 'undefined')

  const _shouldSetFastState = newState => useFastState && _shouldSetState(newState, fastStateKeys)
  const _shouldSetLocalState = newState => useLocalState && _shouldSetState(newState, localStateKeys)
  const _shouldSetReduxState = newState => _shouldSetState(newState, reduxStateKeys)


  const _filterState = (newState, stateKeys) => {
    return Object.keys(newState).reduce((state, key) => {
      if(stateKeys.includes(key))
        state[key] = newState[key]
      return state
    }, {})
  }

/*
  const createFastState = ( { lastEvent = initialLastEvent
                            , timeoutID } = {}) => ({ lastActive: +new Date()
                                                    , lastEvent
                                                    , timeoutID
                                                    , isDetectionRunning: false
                                                    })
                                                    */
  let fastState = useFastState ? new MemoryStore(fastStateKeys, { lastActive: +new Date(), lastEvent: { x: 0, y: 0}, isDetectionRunning: false }) : noop()
  /*
  const setFastState = newState => {
    Object.keys(_filterState(newState, fastStateKeys)).forEach(stateKey => fastState[stateKey] = newState[stateKey])

    //fastState = Object.assign({}, fastState, _filterState(newState, fastStateKeys), { lastActive: +new Date() })
    if(process.env.NODE_ENV !== 'production')
      log.debug({ fastState }, 'fastState set')
  }
  const _stateGetter = (stateStore, stateKeys) => {
    return stateKeys.reduce((stateAccessor, key) => {
      Object.defineProperty(stateAccessor, key, { get: () => stateStore[key] })
      return stateAccessor
    }, {})
  }
  */

  //const fastStateGetter = _stateGetter(fastState, fastStateKeys)

  const createLocalState = ({} = {}) => ({ lastActive: +new Date() })
  /*
  if(useLocalState)
    localStorage[IDLEMONITOR_ACTIVITY] = createLocalState()
  */
  const getLocalState = () => {
    /*
    return localStateKeys.reduce((state, key) => {
      state[key] = localStorage[`${IDLEMONITOR_ACTIVITY}_${key}`]
      return state
    }, {})
    */
  }
  const setLocalState = (newState) => {
    /*
    localStorage[`${IDLEMONITOR_ACTIVITY}_lastActive`] = +new Date()
    Object.keys(newState).filter(key => localStateKeys.includes(key)).forEach((key) => localStorage[`${IDLEMONITOR_ACTIVITY}_${key}`] = newState[key])
    //localStorage[IDLEMONITOR_ACTIVITY] = Object.assign({}, localStorage[IDLEMONITOR_ACTIVITY], _filterState(newState, localStateKeys), { lastActive: +new Date() })
    if(process.env.NODE_ENV !== 'production')
      log.trace({ localState: getLocalState() }, 'localState set')
    */
  }

  /** GETS THIS LIBS SLICE OF TOP LEVEL STATE FROM REDUX (supports immutable) */
  const getLibState = () => {
    const state = getState()
    return state.isMap && state.isMap() ? state.get(ROOT_STATE_KEY) : state[ROOT_STATE_KEY]
  }

  /** ABSTRACTS ACCESS TO STATE VIA GETTERS */
  const getLibStateAccessor = libState => {
    const fast = useFastState ? fastState.getState() : null

              /** The current state name */
    return  { get actionName() { return libState.actionName }
              /** Is in idle state (no more states to progress to) */
            , get isIdle() { return libState.isIdle }
              /** State can be paused manually or via action dispatch or returning null/undefined from timeoutMS function */
            , get isPaused() { return libState.isPaused }
              /** The epoch MS that the user was last active */
            , get lastActive() { return useFastState ? fast.lastActive : libState.lastActive }
              /** Event information captured on the last recorded user action */
            , get lastEvent() { return useFastState ? fast.lastEvent : libState.lastEvent }
              /** The timeoutID for the current scheduled next event if it exists */
            , get timeoutID() { return useFastState ? fast.timeoutID : libState.timeoutID }
              /** The timeoutID for the current scheduled next event if it exists */
            , get isDetectionRunning() { return useFastState ? fast.isDetectionRunning : libState.isDetectionRunning }
            }
  }

  const getReduxState = () => {
    const state = getLibStateAccessor(getLibState())

    return  { ...state
            , get next() {
                const events = context.actionNames
                const nextIndex = events.indexOf(state.actionName) + 1
                return events[nextIndex] /** MAY BE UNDEFINED */
              }
            , get action() { return getAction(state.actionName) }
            , get timeoutMS() { return getTimeoutMS(state.actionName) }
            , get remainingMS() {
                if(state.isIdle)
                  return 0
                const remainingMS = getTimeoutMS(state.actionName) - (+new Date() - state.lastActive)
                return remainingMS > 0 ? remainingMS : 0
              }
            }
  }


  return  { get redux() { return getReduxState() }
            /** Without some way to track fast state (mousemove events), redux gets spammed with actions */
          , get fast() { return useFastState ? fastState.getState() : getReduxState() }
            /** Things that need to be synced across tabs (lastActive, lastEvent) */
          , get local() { return {} }
            /** All state update actions flow through this, has ability to bypass redux for fast state operations or dispatch to it */
          , setState: (actionName, newState) => {
              if(_shouldSetLocalState)
                setLocalState(newState)
              if(_shouldSetFastState(newState)) {
                fastState.setState(newState)
                //setFastState(newState)
                //if(!_shouldSetReduxState(newState))
                  //return log.debug('bypassing redux state update')
              }
              log.debug({ newState }, 'updating redux state')
              return dispatch(createAction(actionName)(newState))
            }
          }
}

const createTimeoutDispatcher = (context, { stores }) => (dispatch, getState) => {
  /*
  const { log, activeEvents, initialActionName, initialAction, thresholds, getActionType, getFastState, getTimeoutMS } = context
  const { setState } = stores

  const ACTIVITY_ACTION = getActionType(ACTIVITY)

  const clear = () => {
    //const timeoutID = stores.fast.timeoutID
    console.warn(`CLEARING TIMEOUTID => ${window.lastTimeoutID}`)
    clearTimeout(window.lastTimeoutID)
  }
  const schedule = (action, ms) => {
    clear()
    window.lastAction = action
    window.lastMS = ms
    window.lastTimeoutID = setTimeout(() => action(), ms)
    console.warn('NEW TIMEOUT SCHEDULED')
    //setState(ACTIVITY_ACTION, { timeoutID })
  }
  const reschedule = () => {
    schedule(window.lastAction, window.lastMS)
  }
  return  { clear
          , timeoutMS: actionName => {
              let result = getTimeoutMS(actionName)
              return typeof result === 'function' ? result(dispatch, getState, _getChildContext(context)) : result
            }
          , schedule
          , reschedule
          }
          */
}

const createDetectionDispatcher = (context, { stores }) => (dispatch, getState) => {
  const { log, activeEvents, initialActionName, initialAction, thresholds, getActionType } = context
  const { setState } = stores

  const ACTIVITY_ACTION = getActionType(ACTIVITY)
  const ACTIVITY_DETECTION_ACTION = getActionType(ACTIVITY_DETECTION)


  /** Detects whether the activity should trigger a redux update */
  const _shouldActivityUpdate = ({ type, pageX, pageY }) => {
    if(type !== 'mousemove') return true

    const { lastActive, lastEvent: { x, y } } = stores.fast
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

  const _shouldRestart = () => stores.redux.actionName !== initialActionName

  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!_shouldActivityUpdate(e))
      return
    if(_shouldRestart()) {
      console.warn('NO SKIP RESTART', stores.redux.actionName, initialActionName)
      return dispatch(createReset(context))
    }
    console.warn('SKIP RESTART', stores.redux.actionName, initialActionName)
    //timeout.reschedule()
    /** THIS WILL BE ROUTED TO FAST OR LOCAL STATE IF ENABLED */
    setState(ACTIVITY_ACTION, { lastActive: +new Date(), lastEvent: { x: e.pageX, y: e.pageY } })
  }

  const activityDetectionType = getActionType(ACTIVITY_DETECTION)

  return  { get isRunning() { return stores.redux.isDetectionRunning }
          , start: () => {
              log.warn('activity detection starting...')
              if(process.env.NODE_ENV !== 'production')
                assert(stores.redux.isDetectionRunning === false, 'activity detection is already running')
              activeEvents.forEach(x => document.addEventListener(x, onActivity))
              setState(ACTIVITY_DETECTION_ACTION, { isDetectionRunning: true })
            }
          , stop: () => {
              log.warn('activity detection terminating...')
              if(process.env.NODE_ENV !== 'production')
                assert(stores.redux.isDetectionRunning === true, 'activity detection is not running')
              activeEvents.forEach(x => document.removeEventListener(x, onActivity))
              setState(ACTIVITY_DETECTION_ACTION, { isDetectionRunning: false })
            }
          }

}


const createActionDispatcher = (context, { stores, detection }) => (dispatch, getState) => {
  const { log, getTimeoutMS, getAction, getActionType, getNextActionName, useFastState, setFastState } = context
  const { setState } = stores
  const _isPauseTriggered = timeoutMS => timeoutMS === null || timeoutMS === false || typeof timeoutMS === 'undefined'

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
  const executeIn = createAction('EXECUTE_IN', (actionName, delay) => ({ actionName }), (actionName, delay) => ({ delay }))

  /** Responsible for executing an action */
  const execute = ( actionName /*isPaused, meta*/ ) => {
    const ACTION_TYPE = getActionType(actionName)

    const delay = getDelay(actionName)
    const isPaused = _isPauseTriggered(delay)
    const meta = { delay: delay > 0 ? delay : (() => {})() }
    const nextActionName = getNextActionName(actionName)
    const nextDelay = nextActionName ? getDelay(nextActionName) : null
    const reduxStore = stores.redux
    const wasPaused = reduxStore.isPaused
    const isDetectionRunning = reduxStore.isDetectionRunning

    /** SCHEDULE THE NEXT ACTION IF IT EXISTS */
    const isLastAction = nextActionName === null || typeof nextActionName === 'undefined'

    log.info({ actionName, ACTION_TYPE, isPaused, wasPaused, isDetectionRunning, nextActionName }, 'execute')
    /** TODO: CHECK LOCAL STATE HERE AND IF ITS BEEN ACTIVE, POSTPONE THE ACTION ABOUT TO BE EXECUTED */

    if((isLastAction || isPaused) && isDetectionRunning) {
      detection.stop()
    }
    if(!(isLastAction || isPaused) && !isDetectionRunning) {
      detection.start()
    }




        /** UPDATE THE STATE OF THE APP */
        console.warn('DISPATCHING NEXT IN ', nextDelay)
    let timeoutID = !isLastAction && !isPaused && nextDelay ? dispatch(executeIn(nextActionName, nextDelay)) : null
    /*
    return dispatch(createAction(ACTION_TYPE), { actionName: actionName
                          , isIdle: typeof nextActionName === 'undefined'
                          , isPaused
                          , meta
                          //, meta: { idle: true, delay: 4000 }
                          //, timeoutID
                          }())
                          */
    setState(ACTION_TYPE, { actionName: actionName
                          , isIdle: typeof nextActionName === 'undefined'
                          , isPaused
                          //, meta: { idle: true, delay: 4000 }
                          //, timeoutID
                          })
    /** EXECUTE THE USER DEFINED ACTION WITH REDUX THUNK ARGS + CONTEXT (LOG, START/STOP/RESET DISPATCHABLE ACTIONS) */
    getAction(actionName)(dispatch, getState, _getChildContext(context))
  }
  return { execute }
}

const _getChildContext = context => ({ ...context, actions: createActions(context) })
