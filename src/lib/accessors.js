import  { CURRENT_KEY
        , LAST_ACTIVE_KEY
        , LAST_EVENT_KEY
        , CURRENT_EVENT_KEY
        , IS_IDLE_KEY
        } from './constants'

export const getOptsRawAccessor = optsRaw => {
  const { defs, listenEvents } = optsRaw
  const defMap = Map(defs)
  return  { get eventNames() { return Array.from(defMap.keys()) }
          , get listenEvents() { return listenEvents }
          , get timeoutIDs() { return Array.from(defMap.values()).map(x => x.timeoutID) }
          , getEventAction: eventName => defMap.getIn([eventName], 'action')
          , getEventTimeoutMS: eventName => defMap.getIn([eventName], 'timeoutMS')
          , getEventTimeoutID: eventName => defMap.getIn([eventName], 'timeoutID')
          }
}

const getEventAccessor = opts => eventName => ( { action: opts.getEventAction(eventName)
                                                , timeoutMS: opts.getEventTimeoutMS(eventName)
                                                , timeoutID: opts.getEventTimeoutID(eventName)
                                                } )

const getStateRawAccessor = stateRaw => (
  { get current() { return stateRaw.get(CURRENT_KEY) }
  , get lastActive() { return stateRaw.get(LAST_ACTIVE_KEY) }
  , get lastEvent() { return stateRaw.get(LAST_EVENT_KEY) }
  , get currentEvent() { return stateRaw.get(CURRENT_EVENT_KEY) }
  , get isIdle() { return stateRaw.get(IS_IDLE_KEY) }
  }
)


export const getStateAccessor = opts => stateRaw => {
  const state = getStateRawAccessor(stateRaw)
  return  { ...state
          , get next() {
              const events = opts.eventNames
              const nextIndex = events.indexOf(state.current) + 1
              return events[nextIndex] /** MAY BE UNDEFINED */
            }
          , get action() { return event(state.current).action }
          , get timeoutMS() { return event(state.current).timeoutMS }
          , get timeoutID() { return event(state.current).timeoutID }
          , get remainingMS() {
              if(state.isIdle)
                return 0
              const remainingMS = event(state.current).timeoutMS - (+new Date() - state.lastActive)
              return remainingMS > 0 ? remainingMS : 0
            }
          }
}


