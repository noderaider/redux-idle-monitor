import { assert } from 'chai'
import { createStore } from 'redux'
import  { IS_DEV
        , ROOT_STATE_KEY
        , ACTIVITY
        , ACTIVITY_DETECTION
        } from './constants'
import { createNoopStore, createLocalStore, bisectStore, configureReducer, createMergingReducer, createStoreMultiplexer, createActionMultiplexer } from 'redux-addons/lib/store'


export const configureStoreMultiplexer = ({ useFastStore, useLocalStore }) => store => {
  const libStore = bisectStore(store, 'idle')
  let storesMapping = [ [ 'lib', libStore ] ]

  const createInitialFastState = () => ({ lastActive: +new Date(), lastEvent: { x: -1, y: -1 } })
  const createFastReducer = () => createMergingReducer(ACTIVITY)
  if(useFastStore)
    storesMapping.push([ 'fast', createStore(createFastReducer(), createInitialFastState()) ])

  const createInitialLocalState = () => ({ lastActive: +new Date() })
  const createLocalReducer = () => configureReducer(action => { lastActive: action.payload.lastActive }, false)(ACTIVITY)
  if(useLocalStore)
    storesMapping.push([ 'local', createLocalStore(createLocalReducer(), createInitialLocalState()) ])

  return createStoreMultiplexer(storesMapping)
}

/*



const configureActionMultiplexer = context => store => {
  const actionMapping = [ [ACTIVITY, { type: createActionType(ACTIVITY), payloadCreator: getPayloadCreator(ACTIVITY) }]
                        , [ACTIVITY_DETECTION, { type: createActionType(ACTIVITY_DETECTION),  payloadCreator: getPayloadCreator(ACTIVITY_DETECTION) }]
                        , ...actionBlueprints.map(x => [x, { type: createActionType(x), payloadCreator: getPayloadCreator(x) }])
                        ]

  const actionMultiplexer = createActionMultiplexer(actionMapping)
}
*/
