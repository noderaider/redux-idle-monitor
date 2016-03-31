
import Immutable from 'immutable'
import { assert } from 'chai'

import  { LIB_NAME
        , CURRENT_KEY
        , LAST_ACTIVE_KEY
        , LAST_EVENT_KEY
        , CURRENT_EVENT_KEY
        , IS_IDLE_KEY
        , IDLE_STATE
        } from './constants'

/** Select our slice of the state (supports immutable Map and non-immutable object root state) */
const selectState = rootState => rootState.isMap && rootState.isMap() ? rootState.get('idle') : rootState.idle

const defaults =  { defs: [ [ 'ACTIVE', { action: context => { context.debug('USER ACTIVE') }
                                        , timeoutMS: 0
                                        }
                            ]
                          , [ 'IDLE', { action: context => { context.debug('USER IDLE') }
                                      , timeoutMS: 1000 * 60 * 20
                                      }
                          ] ]
                  , listenEvents: [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]
                  }


const transitionEvent = (prevState, nextState) => {
  const next = nextState.get(CURRENT_KEY)
  return next === prevState.get(CURRENT_KEY) ? null : next
}




const getContext = ({ log, def, getState }) => ({ log, def, getState })

const getListenEventHandler = context => e => {
  const { log, def, getState } = context
  const state = stateAccessor(getState())
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
  const { log, def, getState } = context
  log.debug('start')
  def.listenEvents.forEach(x => document.addEventListener(x, e => _handleEvent(e, context)))
}

const stop = context => {
  const { log, def, getState } = context
  log.debug('stop')
  def.timeoutIDs.forEach(x => clearTimeout(x))
  def.listenEvents.forEach(x => document.removeEventListener(x, e => _handleEvent(e, context)))
}


const reset = context => {
  const { log, def, getState } = context
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
  const { log, def, getState } = context
  // this isn't paused yet
  if (this.state.remaining === null)
    return

  // start timer and clear remaining
  if (!this.state.idle)
    this.setState({ timeoutId: setTimeout(this._toggleIdleState, this.state.remaining), remaining: null })
}


/** How much time has elapsed */
//const getElapsedTime = () => (+new Date()) - this.state.oldDate


const configure = (config = { defs = defaults.defs
                            , listenEvents = defaults.listenEvents
                            } = defaults ) => {

  if(process.env.NODE_ENV !== 'production')
    validateConfig(config)

  const log = getLog()
  const opts = getOptsAccessor(opts)
  const stateSelector = getStateAccessor(opts)

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

/*
const noop = () => {}
const timeoutShape = PropTypes.shape( { name: PropTypes.string.isRequired
                                      , timeout: PropTypes.number.isRequired
                                      , timeoutID: PropTypes.number
                                      })
                                      */

/**
 * Redux Activity Monitor
 * Thanks to the work done by Randy Lebeau on react-idle-timer which got this started.
 */
 /*
class ReduxActivityMonitor extends Component {
  static propTypes =  { timeouts: PropTypes.arrayOf(timeoutShape).isRequired   // Timeout events to bind
                      , events: PropTypes.arrayOf(PropTypes.string).isRequired // Activity events to bind
                      , element: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired // Element ref to watch activity on
                      , activityState: PropTypes.string.isRequired
                      , nextActivityState: PropTypes.string
                      // DEFINED IN THE SUBSCRIPTION ELEMENT
                      //, idleAction: PropTypes.func // Action to call when user becomes inactive
                      //, activeAction: PropTypes.func // Action to call when user becomes active
                      };

  // Default has a single timeout event occurring in 20 minutes of inactivity
  static defaultProps = { timeouts: [{ name: 'idle', timeout: 1000 * 60 * 20 }] // 20 minutes
                        , events: ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove']
                        , element: document
                        };

  componentWillMount() {
    const { timeouts, events, element } = this.props
    // VALIDATE
    var lastTimeout = 0
    timeouts.forEach(x => {
      assert(x.timeout >= lastTimeout, `timeout '${x.name}' timeout value of ${x.timeout} must be larger than the previous timeout value of ${lastTimeout}`)
    })
    events.forEach(x => element.addEventListener(x, this._handleEvent))
  }

  componentWillUnmount() {
    const { timeouts, events, element } = this.props
    // Clear timeout to prevent delayed state changes
    timeouts.forEach(x => clearTimeout(x.timeoutID))
    events.forEach(x => element.removeEventListener(x, this._handleEvent))
  }

  render() {
    const { children } = this.props
    return children ? children : <div className="no-redux-activity-monitor-children" />
  }

  _nextActivityState = () => {
    const { nextActivityState } = this.props
    if(nextActivityState)
      dispatch(setActivityState)


  }

  _toggleIdleState = () => {
    const { dispatch, isIdle, idleAction, activeAction } = this.props
    let newIsIdle = !isIdle
    // Set the state
    dispatch(setIdleState(newIsIdle))

    // Fire the appropriate action
    // TODO: THIS NOW WILL BE HANDLED IN SUBSCRIPTION EVENT
    if (newIsIdle)
      idleAction()
    else
      activeAction()
  };

  _handleEvent = (e) => {
    const { isIdle, remaining, pageX, pageY, oldDate, timeoutId } = this.props
    // Already idle, ignore events
    if (remaining)
      return

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

    this.setState({ lastActive: +new Date() // store when user was last active
                  , pageX: e.pageX // update mouse coord
                  , pageY: e.pageY
                  , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout) // set a new timeout
                  })
  };

  reset = () => {
    // reset timers
    clearTimeout(this.props.timeoutId)

    // reset settings
    this.setState({ idle: false
                  , oldDate: +new Date()
                  , lastActive: this.state.oldDate
                  , remaining: null
                  , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout)
                  })
  };

  pause = () => {
    // this is already paused
    if (this.state.remaining !== null)
      return

    // clear any existing timeout
    clearTimeout(this.state.timeoutId)

    // define how much is left on the timer
    this.setState({ remaining: this.props.timeout - ((+new Date()) - this.state.oldDate) })
  };

  resume = () => {
    // this isn't paused yet
    if (this.state.remaining === null)
      return

    // start timer and clear remaining
    if (!this.state.idle)
      this.setState({ timeoutId: setTimeout(this._toggleIdleState, this.state.remaining), remaining: null })
  };

  getRemainingTime = () => {
    // If idle there is no time remaining
    if (this.state.idle)
      return 0

    // If its paused just return that
    if (this.state.remaining != null)
      return this.state.remaining

    // Determine remaining, if negative idle didn't finish flipping, just return 0
    let remaining = this.props.timeout - ((+new Date()) - this.state.lastActive)
    if (remaining < 0)
      remaining = 0

    // If this is paused return that number, else return current remaining
    return remaining
  };

  getElapsedTime = () => (+new Date()) - this.state.oldDate;

  getLastActiveTime = () => {
    return this.props.lastActive
  };

  isIdle = () => this.props.isIdle;
}
*/

function mapStateToProps(state) {
  const { isIdle
        , timeoutId
        , oldDate = +new Date()
        , lastActive = +new Date()
        , remaining
        , pageX
        , pageY
        } = state.activity

  /*
  const state = {
    idle: false,
    oldDate: +new Date(),
    lastActive: +new Date(),
    remaining: null,
    tId: null,
    pageX: null,
    pageY: null
  }
  */
  return  { isIdle
          , timeoutId
          , oldDate
          , lastActive
          , remaining
          , pageX
          , pageY
          }
}

//export default connect(mapStateToProps)(ReduxIdleTimer)
