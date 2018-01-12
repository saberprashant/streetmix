import { SET_SYSTEM_FLAGS, WINDOW_RESIZE } from '../actions'

const initialState = {
  touch: false,
  phone: false,
  safari: false,
  windows: false,
  noInternet: false,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  hiDpi: 1.0,
  cssTransform: false,
  pageVisibility: false,
  hiddenProperty: false,
  visibilityState: false,
  visibilityChange: false
}

const system = (state = initialState, action) => {
  switch (action.type) {
    case SET_SYSTEM_FLAGS:
      const obj = Object.assign({}, state, action)
      delete obj.type // Do not save action type.
      return obj
    case WINDOW_RESIZE:
      return {
        ...state,
        viewportWidth: action.viewportWidth,
        viewportHeight: action.viewportHeight
      }

    default:
      return state
  }
}

export default system
