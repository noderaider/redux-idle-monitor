import createContext from './context'

import { createReducer } from './reducer'
import { publicBlueprints } from './blueprints'
import { createMiddleware } from './middleware'

import { configureStoreMultiplexer } from './multiplexer'
import { configureStartDetection } from './detection'

export default function configure(appOpts) {
  const context = createContext(appOpts)
  const { translateBlueprints } = context
  const actions = translateBlueprints(publicBlueprints)
  return  { reducer: createReducer(context)
          , middleware: createMiddleware(context)
          , actions
          }
}
