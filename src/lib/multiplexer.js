import { assert } from 'chai'
import { createStoreMultiplexer, bisectStore } from 'redux-mux'
import { createStore } from 'redux'
import  { IS_DEV
        , ROOT_STATE_KEY
        , ACTIVITY
        , ACTIVITY_DETECTION
        } from './constants'
import { createNoopStore, createLocalStore, configureReducer, createMergingReducer } from 'redux-addons/lib/store'

export const configureStoreMultiplexer = ({ useFastStore, useLocalStore }) => store => {
  const libStore = bisectStore(ROOT_STATE_KEY)(store)
  let storesMapping = [ [ 'lib', libStore ] ]

  /*
  const createInitialFastState = () => ({ lastActive: +new Date(), lastEvent: { x: -1, y: -1 } })
  const createFastReducer = () => createMergingReducer(ACTIVITY)
  if(useFastStore)
    storesMapping.push([ 'fast', createStore(createFastReducer(), createInitialFastState()) ])

  const createInitialLocalState = () => ({ lastActive: +new Date() })
  const createLocalReducer = () => configureReducer(action => { lastActive: action.payload.lastActive }, false)(ACTIVITY)
  if(useLocalStore)
    storesMapping.push([ 'local', createLocalStore(createLocalReducer(), createInitialLocalState()) ])
  */

  return createStoreMultiplexer(storesMapping)
}
