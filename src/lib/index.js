import Immutable from 'immutable'
import { assert } from 'chai'
import { createAction } from 'redux-actions'

/** Redux Constants */
export const IDLE_STATE = 'IDLE_STATE'


/** Redux Action Creators */
export const setIdleState = createAction(IDLE_STATE, idleState => ({ idleState }))


/** Redux Subscription */
const selectState = state => state.idle || null
const selectIdleName = idle => idle ? idle.get('current') : null


const defaultDefinitions =  [ [ 'ACTIVE', { action: () => { console.warn('ReduxActivityMonitor: USER ACTIVE') }
                                          , timeout: 0
                                          }
                              ]
                            , [ 'IDLE', { action: () => { console.warn('ReduxActivityMonitor: USER IDLE') }
                                        , timeout: 1000 * 60 * 20
                                        }
                            ] ]

const defaultEvents = [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]


export const configure = ({ definitions = defaultDefinitions
                          , events = defaultEvents
                          }) => {

  //** BULLETPROOF ASSERTIONS */
  if(process.env.NODE_ENV !== 'production') {
    assert.ok(store, 'store must exist')
    assert.ok(definitions, 'definitions must exist')
    assert.ok(events, 'events must exist')
    assert(Array.isArray(definitions), 'definitions must be an array')
    assert(definitions.every(x => Array.isArray(x)), 'definitions must be an array of an array')
    assert(definitions.every(x => x.length === 2), 'every definition must have length 2')
    assert(definitions.every(x => typeof x[0] === 'string'), 'every definition must have first ordinal type string event name')
    assert(definitions.every(x => typeof x[1] === 'object'), 'every definition must have second ordinal type object')
    assert(definitions.every(x => typeof x[1].action !== 'undefined'), 'every definition must have second ordinal action function defined')
    assert(definitions.every(x => typeof x[1].timeout === 'number'), 'every definition must have second ordinal timeout number defined')
  }

  const subscribe = store => {
    const definitionMap = new Map(definitions)
    let current = null
    store.subscribe(() => {
      let state = selectState(store.getState())
      let previous = current
      current = selectIdleName(state)
      if(current !== previous) {
        let { action } = definitionMap.get(current)
        if(action)
          return action(state)
      }
    })
  }

  const _handleEvent = e => {
    const { currentActivity, nextActivity /*expiresIn,  remaining, pageX, pageY, oldDate, timeoutId */ } = selectState(store.getState())
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

    this.setState({ lastActive: +new Date() // store when user was last active
                  , pageX: e.pageX // update mouse coord
                  , pageY: e.pageY
                  , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout) // set a new timeout
                  })
  }

  const start = () => {
    console.warn('ReduxActivityMonitor: start')
    events.forEach(x => element.addEventListener(x, this._handleEvent))
  }
  const stop = () => {
    console.warn('ReduxActivityMonitor: stop')
    for(let definition of definitionMap.values())
      clearTimeout(definition.timeoutID)
    events.forEach(x => element.removeEventListener(x, this._handleEvent))
  }
  const reset = () => {
    // reset timers
    clearTimeout(this.props.timeoutId)

    // reset settings
    this.setState({ idle: false
                  , oldDate: +new Date()
                  , lastActive: this.state.oldDate
                  , remaining: null
                  , timeoutId: setTimeout(this._toggleIdleState, this.props.timeout)
                  })
  }

  /** Resumes a stopped timer */
  const resume = () => {
    // this isn't paused yet
    if (this.state.remaining === null)
      return

    // start timer and clear remaining
    if (!this.state.idle)
      this.setState({ timeoutId: setTimeout(this._toggleIdleState, this.state.remaining), remaining: null })
  }

  /**
   * Time remaining before idle
   * @return {Number} Milliseconds remaining
   */
  const getRemainingTime = () => {
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
  }

  /** How much time has elapsed */
  const getElapsedTime = () => (+new Date()) - this.state.oldDate

  /** Last time the user was active */
  const getLastActiveTime = () => this.props.lastActive

  /** Is the user idle */
  const isIdle = () => this.props.isIdle

  return { subscribe, reducer, start, stop, reset, resume, getRemainingTime, getElapsedTime, getLastActiveTime, isIdle }
}
