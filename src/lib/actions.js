import { startBlueprint, stopBlueprint, resetIdleStatusBlueprint } from './blueprints'
import { configureStartDetection } from './detection'
import { configureStoreMultiplexer } from './multiplexer'
import { IS_DEV, USER_ACTIVE, NEXT_IDLE_STATUS, RESET_IDLE_STATUS } from './constants'

export const createStartDetection = context => (dispatch, getState) => {
  const { log } = context
  const stores = configureStoreMultiplexer(context)({ dispatch, getState })
  const startDetection = configureStartDetection(context)(stores)

  const endDetection = dispatch(startDetection)
  return (dispatch, getState) => {
    log.debug('STOP DETECTION SIGNALED')
    dispatch(endDetection)
  }
}
