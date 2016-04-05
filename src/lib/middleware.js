import createContext from './context'
import configureDispatcher from './dispatcher'
import { forgetTokens } from 'state/actions/identity'
//import { createStart, createStop } from './actions'
import { PERSISTED_TOKENS, FORGOTTEN_TOKENS } from 'state/constants'
import swal from 'sweetalert'
import { actions as idleActions, middleware as idleMiddleware } from 'state/components/redux-idle-monitor'
import { createStartDispatcher, createStopDispatcher, createResetDispatcher } from './actions'

/** When context has already been created, it can be shared to middleware component. */
export const createMiddleware = context => {
  const { getActionByName } = context
  const dispatcher = configureDispatcher(context)
  const dynamicActionMiddleware = createDynamicActionMiddleware(context)
  const start = createStartDispatcher(context)(dispatcher)
  const stop = createStopDispatcher(context)(dispatcher)
  return store => next => action => {
    console.warn('MIDDDDDLE')
    switch(action.type) {
      case PERSISTED_TOKENS:
        console.warn('STARTING')
        dispatch(start)
        break
      case FORGOTTEN_TOKENS:
        console.warn('STOPPING')
        dispatch(stop)
        break
      case 'EXECUTE_IN':
        console.warn('RESPONDING TO EXECUTE_IN', action)
        dispatcher.action.execute(action.payload.actionName)
        break

      default:
        if(actionTypes.includes(action.type))
          return dynamicActionMiddleware(store)(next)(action)
    }
    return next(action)
  }
}

const createDynamicActionMiddleware = context => {
  const { actionTypes } = context
  const createDispatcher = configureDispatcher(context)
  const createDidStateChange = configureDidStateChange(context)
  const createOnStateChange = configureOnStateChange(context)
  return store => {
    const { dispatch, getState } = store
    const dispatcher = createDispatcher(dispatch, getState)
    const didStateChange = createDidStateChange(dispatch, getState)
    const onStateChange = createOnStateChange(dispatch, getState)
    return next => action => {
      const { type, payload } = action
      switch(type) {
        default:
          const preState = getState()['idle']
          const result = next(action)
          const postState = getState()['idle']

          if(didStateChange && onStateChange) {
            if(didStateChange(preState, postState))
              onStateChange(preState, postState)
          }

          return result
      }
    }
  }
}

const configureDidStateChange = context => (dispatch, getState) => (preState, postState) => preState.actionName !== postState.actionName

const configureOnStateChange = context => (dispatch, getState) => (preState, postState) => {
  const { log } = context
  log.info(postState.actionName, 'onStateChange')
  /*
  let swalTimeout = null
  if(postState.actionName === 'INACTIVE') {
    log.info('SWAL ACTIVE => SHOW')
    swal( { title: 'Still There?'
          , text: 'You will be logged out due to inactivity shortly.'
          , animation: 'slide-from-top'
          , showConfirmButton: false
          , html: true
          , type: 'warning'
          })
  } else if(postState.actionName === 'EXPIRED') {
    log.info('SWAL EXPIRED => HIDE IN 2 SECONDS')
    dispatch(forgetTokens())
    swalTimeout = setTimeout(() => swal.close(), 2000)
  } else {
    log.info('SWAL ELSE => HIDE NOW')
    clearTimeout(swalTimeout)
    swal.close()
  }

*/
}

/** Creates middleware from opts including validation in development */
export default function configureMiddleware(opts) { return createMiddleware(createContext(opts)) }
