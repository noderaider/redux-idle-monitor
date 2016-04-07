import createContext from './context'
import createDispatcher from './dispatcher'
import { configureActionDispatcher, createActionBlueprint } from 'redux-addons/lib/actions'
import { ACTIVITY, ACTIVITY_DETECTION } from './constants'

/** Creates an action that starts idle monitor when dispatched */
//export const createStart = context => configureDispatcherAction((dispatcher, ctx) => {
//export const createStartDispatcher = actionDispatcher => actionDispatcher((dispatcher, context) => {
export const startHandler = (dispatcher, context) => {
  const { detection } = dispatcher
  const { log, initialActionName } = context
  //** MOVE DETECTION FURTHER IN, POSSIBLY MIDDLEWARE
  console.warn('STARTING IDLE MONITOR')
  log.info('idle monitor started')
  //detection.start()
  return action.execute(initialActionName)
}

/** Creates an action that stops idle monitor when dispatched */
//export const createStop = context => configureDispatcherAction((dispatcher, ctx) => {
//export const createStopDispatcher = actionDispatcher => actionDispatcher((dispatcher, context) => {
export const stopHandler = (dispatcher, context) => {
  const { detection } = dispatcher
  const { log, activeEvents } = context
  log.info('idle monitor stopped')
  //timeout.clear()
  //detection.stop()
}

/** Creates an action that resets idle monitor when dispatched */
//export const createReset = context => configureDispatcherAction((dispatcher, ctx) => {
export const resetHandler = (dispatcher, context) => {
  const { /*timeout,*/ detection, action } = dispatcher
  const { log, initialActionName } = context
  log.info('idle monitor resetting...')
  //timeout.clear()
  return action.execute(initialActionName)
}




/** Creates actions from a preconfigured context */
export const createActionDispatchers = context => {
  const dispatcher = createDispatcher(context)
  const actionDispatcher = configureActionDispatcher(context)(dispatcher)
  return { start: actionDispatcher(startHandler), stop: actionDispatcher(startHandler), reset: actionDispatcher(resetHandler) }
}



/** Creates context and actions from raw opts that are validated in development */
export default function configureActionDispatchers(opts) { return createActionDispatchers(createContext(opts)) }

