import { IDLE_STATE } from './constants'

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
