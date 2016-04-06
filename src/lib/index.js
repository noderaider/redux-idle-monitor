import createContext from './context'

import { createReducer } from './reducer'
import { createActionDispatchers, defineAction } from './actions'
import { createMiddleware } from './middleware'

export { defineAction }

export default function configure(appOpts) {
  const context = createContext(appOpts)
  return  { reducer: createReducer(context)
          , actions: createActionDispatchers(context)
          , middleware: createMiddleware(context)
          }
}
