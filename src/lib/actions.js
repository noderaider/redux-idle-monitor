import { startBlueprint, stopBlueprint } from './actionBlueprints'
import { configureStartDetection } from './detection'
import { configureStoreMultiplexer } from './multiplexer'

export const createStartIdleMonitor = context => (dispatch, getState) => {
  const { translateBlueprints, actionBlueprints, initialIdleActionName } = context
  const { startAction, stopAction } = translateBlueprints({ startAction: startBlueprint, stopAction: stopBlueprint})
  const userActions = translateBlueprints(actionBlueprints)

  dispatch(startAction())



  const stores = configureStoreMultiplexer(context)({ dispatch, getState })
  const startDetection = configureStartDetection(context)(stores)
  const endDetection = dispatch(startDetection)

  dispatch(userActions[initialIdleActionName]())

  return (dispatch, getState) => {
    dispatch(endDetection)
    dispatch(stopAction())
  }
}
