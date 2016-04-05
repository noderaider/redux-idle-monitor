import createContext from './context'
import createDispatcher from './dispatcher'
import { configureAction, configureDispatcherAction, actionDefinition } from 'redux-addons/actions'
import { ACTIVITY, ACTIVITY_DETECTION } from './constants'


/** Creates an action that starts idle monitor when dispatched */
//export const createStart = context => configureDispatcherAction((dispatcher, ctx) => {
export const createStartDispatcher = context => dispatcher => configureDispatcherAction(context)(dispatcher)((dispatcher, context) => {
  const { detection, action } = dispatcher
  const { log, initialActionName } = context
  //** MOVE DETECTION FURTHER IN, POSSIBLY MIDDLEWARE
  console.warn('STARTING IDLE MONITOR')
  log.info('idle monitor started')
  detection.start()
  return action.execute(initialActionName)
//}, createDispatcher(context))
})

/** Creates an action that stops idle monitor when dispatched */
//export const createStop = context => configureDispatcherAction((dispatcher, ctx) => {
export const createStopDispatcher = context => dispatcher => configureDispatcherAction(context)(dispatcher)((dispatcher, context) => {
  const { detection } = dispatcher
  const { log, activeEvents } = context
  log.info('idle monitor stopped')
  //timeout.clear()
  //detection.stop()
//}, createDispatcher(context))
})

/** Creates an action that resets idle monitor when dispatched */
//export const createReset = context => configureDispatcherAction((dispatcher, ctx) => {
export const createResetDispatcher = context => dispatcher => configureDispatcherAction(context)(dispatcher)((dispatcher, context) => {
  const { /*timeout,*/ detection, action } = dispatcher
  const { log, initialActionName } = context
  log.info('idle monitor resetting...')
  //timeout.clear()
  return action.execute(initialActionName)
//}, createDispatcher(context))
})
//})

/** Allows end user to define an idle state transition action */
export const defineAction = (actionName, action, timeoutMS) => actionDefinition(actionName, { action, timeoutMS, isIdleTransition: true })

/** Creates actions from a preconfigured context */
export const createActions = context => {
  const dispatcher = createDispatcher(context)
  return { start: createStartDispatcher(context)(dispatcher), stop: createStopDispatcher(context)(dispatcher), reset: createResetDispatcher(context)(dispatcher) }
}

export const activityAction = actionDefinition(ACTIVITY, { })
export const activityDetectionAction = actionDefinition(ACTIVITY_DETECTION, { })

/** Creates context and actions from raw opts that are validated in development */
export default function configureActions(opts) { return createActions(createContext(opts)) }

