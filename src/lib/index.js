
import Immutable from 'immutable'
import { assert } from 'chai'
import { createAction } from 'redux-actions'


/** Lib Constants */
const LIB_NAME = 'redux-idle-monitor'
const CURRENT_KEY = 'current'
const LAST_ACTIVE_KEY = 'last-active'
const LAST_EVENT_KEY = 'last-event'
const CURRENT_EVENT_KEY = 'current-event'
const IS_IDLE_KEY = 'is-idle'

/** Redux Constants */
const IDLE_STATE = 'IDLE_STATE'

/** Redux Action Creators */
const setIdleState = createAction(IDLE_STATE)

/** Select our slice of the state (supports immutable Map and non-immutable object root state) */
const selectState = rootState => rootState.isMap && rootState.isMap() ? rootState.get('idle') : rootState.idle


const validateOpts = ({ defs, listenEvents }) => {
  assert.ok(defs, 'defs must exist')
  assert(Array.isArray(defs), 'defs must be an array')
  assert(defs.every(x => Array.isArray(x)), 'defs must be an array of an array')
  assert(defs.every(x => x.length === 2), 'every def must have length 2')
  assert(defs.every(x => typeof x[0] === 'string'), 'every def must have first ordinal type string event name')
  assert(defs.every(x => typeof x[1] === 'object'), 'every def must have second ordinal type object')
  assert(defs.every(x => typeof x[1].action !== 'undefined'), 'every def must have second ordinal action function defined')
  assert(defs.every(x => typeof x[1].timeoutMS === 'number'), 'every def must have second ordinal timeoutMS number defined')
  assert.ok(listenEvents, 'listen events must exist')
}

const defaults =  { defs: [ [ 'ACTIVE', { action: state => { console.warn('ReduxActivityMonitor: USER ACTIVE') }
                                        , timeoutMS: 0
                                        }
                            ]
                          , [ 'IDLE', { action: () => { console.warn('ReduxActivityMonitor: USER IDLE') }
                                      , timeoutMS: 1000 * 60 * 20
                                      }
                          ] ]
                  , listenEvents: [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]
                  }

const _formatMessage = ({ message, obj }) => obj ? `message: '${message}', obj: ${obj.toJSON()}`  : `message: '${message}'`
const _formatError = ({ message, err }) => err ? `error: '${message}', inner: ${err.toString()}`  : `error: '${message.toString()}'`

const _formatLog = ({ message, obj, err }) =>`${LIB_NAME} | ${err ? _formatError({ message, err }) : _formatMessage({ message, obj })}`
const getLog = () => ({ debug: (message, obj) => console.warn(_formatLog(message, obj))
                      , error: (message, err) => console.error(_formatLog(message, err))
                      })


const transitionEvent = (prevState, nextState) => {
  const next = nextState.get(CURRENT_KEY)
  return next === prevState.get(CURRENT_KEY) ? null : next
}

const configureMiddleware = opts => store => next => action => {
  if(action.type !== IDLE_STATE)
    return next(action)

  /** IDLE STATE ACTION INITIATED */
  const prevState = selectState(store.getState())
  const result = next(action)
  const nextState = selectState(store.getState())
  const transEvent = transitionEvent(prevState, nextState)
  if(transEvent)
    selectAction(transEvent)(nextState)
  return result
}


const getPrimitiveStateSelector = state => ({ get current() { return state.get(CURRENT_KEY) }
                                            , get lastActive() { return state.get(LAST_ACTIVE_KEY) }
                                            , get lastEvent() { return state.get(LAST_EVENT_KEY) }
                                            , get currentEvent() { return state.get(CURRENT_EVENT_KEY) }
                                            , get isIdle() { return state.get(IS_IDLE_KEY) }
                                            })


const wrapState = selector => state => {
  const _state = getPrimitiveStateSelector(state)
  const _event = selector.event

  return  { ..._state
          , get next() {
              const eventNames = selector.events
              const nextIndex = eventNames.indexOf(_state.current) + 1
              return eventNames[nextIndex] /** MAY BE UNDEFINED */
            }
          , get action() { return _event(_state.current).action }
          , get timeoutMS() { return _event(_state.current).timeoutMS }
          , get timeoutID() { return _event(_state.current).timeoutID }
          , get remainingMS() {
              if(_state.isIdle)
                return 0
              const remainingMS = _event(_state.current).timeoutMS - (+new Date() - _state.lastActive)
              return remainingMS > 0 ? remainingMS : 0
            }
          }
}

const getEventSelector = defMap => eventName => ( { action: defMap.getIn([eventName], 'action')
                                                  , timeoutMS: defMap.getIn([eventName], 'timeoutMS')
                                                  , timeoutID: defMap.getIn([eventName, 'timeoutID'])
                                                  } )

const getSelector = ({ defs, listenEvents }) => {
  const defMap = Map(defs)
  return  { get events() { return Array.from(defMap.keys()) }
          , get listenEvents() { return listenEvents }
          , get timeoutIDs() { return Array.from(defMap.values()).map(x => x.timeoutID) }
          , event: getEventSelector(defMap)
          }
}

const getContext = ({ log, selector, getState }) => ({ log, selector, getState })

const getListenEventHandler = context => e => {
  const { log, selector, getState } = context
  const state = stateSelector(getState())
  const { pageX, pageY } = state.lastEvent
  /*
  // Already idle, ignore events
  if (remaining)
    return
  */


  // Mousemove event
  if (e.type === 'mousemove') {
    // if coord are same, it didn't move
    if (e.pageX === pageX && e.pageY === pageY)
      return
      // if coord don't exist how could it move
    if (typeof e.pageX === 'undefined' && typeof e.pageY === 'undefined')
      return
      // under 200 ms is hard to do, and you would have to stop, as continuous activity will bypass this
    let elapsed = (+new Date()) - oldDate
    if (elapsed < 200)
      return
  }

  // clear any existing timeout
  if(timeoutId)
    clearTimeout(timeoutId)

  // if the idle timer is enabled, flip
  if (isIdle)
    this._toggleIdleState()

  setIdleState( { lastActive: +new Date() // store when user was last active
                , coordinates: { pageX: e.pageX, pageY: e.pageY } // update mouse coord
                // NEEDS MORE REFACTOR
                // ;
                , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout) // set a new timeout
                })
}

const start = context => {
  const { log, selector, getState } = context
  log.debug('start')
  selector.listenEvents.forEach(x => document.addEventListener(x, e => _handleEvent(e, context)))
}

const stop = context => {
  const { log, selector, getState } = context
  log.debug('stop')
  selector.timeoutIDs.forEach(x => clearTimeout(x))
  selector.listenEvents.forEach(x => document.removeEventListener(x, e => _handleEvent(e, context)))
}


const reset = context => {
  const { log, selector, getState } = context
  const state = getState()
  clearTimeout(state.timeoutID)

  // reset settings
  this.setState({ idle: false
                , oldDate: +new Date()
                , lastActive: this.state.oldDate
                , remaining: null
                , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout)
                })
}


const resume = context => {
  const { log, selector, getState } = context
  // this isn't paused yet
  if (this.state.remaining === null)
    return

  // start timer and clear remaining
  if (!this.state.idle)
    this.setState({ timeoutId: setTimeout(this._toggleIdleState, this.state.remaining), remaining: null })
}


/** How much time has elapsed */
//const getElapsedTime = () => (+new Date()) - this.state.oldDate


const configure = (opts = { defs = defaults.defs
                          , listenEvents = defaults.listenEvents
                          } = defaults ) => {

  if(process.env.NODE_ENV !== 'production')
    validateOpts(opts)

  const log = getLog()
  const selector = getSelector(opts)
  const stateSelector = wrapState(selector)

  const _handleListenEvent = selector => getState => e => {
    const state = stateSelector(getState())
    const { pageX, pageY } = state.lastEvent
    /*
    // Already idle, ignore events
    if (remaining)
      return
    */


    // Mousemove event
    if (e.type === 'mousemove') {
      // if coord are same, it didn't move
      if (e.pageX === pageX && e.pageY === pageY)
        return
        // if coord don't exist how could it move
      if (typeof e.pageX === 'undefined' && typeof e.pageY === 'undefined')
        return
        // under 200 ms is hard to do, and you would have to stop, as continuous activity will bypass this
      let elapsed = (+new Date()) - oldDate
      if (elapsed < 200)
        return
    }

    // clear any existing timeout
    if(timeoutId)
      clearTimeout(timeoutId)

    // if the idle timer is enabled, flip
    if (isIdle)
      this._toggleIdleState()

    setIdleState( { lastActive: +new Date() // store when user was last active
                  , coordinates: { pageX: e.pageX, pageY: e.pageY } // update mouse coord
                  // NEEDS MORE REFACTOR
                  // ;
                  , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout) // set a new timeout
                  })
  }

  return { subscribe, reducer, start, stop, reset, resume, getRemainingTime, getElapsedTime, getLastActiveTime, isIdle }
}
