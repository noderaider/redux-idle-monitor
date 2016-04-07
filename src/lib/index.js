import createContext from './context'

import { createReducer } from './reducer'
import { publicBlueprints } from './actionBlueprints'
import { createMiddleware } from './middleware'

import { configureStoreMultiplexer } from './multiplexer'
import { configureStartDetection } from './detection'

export default function configure(appOpts) {
  const context = createContext({...appOpts, initialIdleActionName: 'INACTIVE_USER', finalIdleActionName: 'EXPIRED_USER', onFinalIdleAction: () => { console.warn('HIT FINAL STATE')} })
  const { translateBlueprints } = context


  return  { reducer: createReducer(context)
          , middleware: createMiddleware(context)
          }
}
