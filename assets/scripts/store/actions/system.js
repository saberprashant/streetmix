import { WINDOW_RESIZE } from './index'

export function windowResize (viewportWidth, viewportHeight) {
  return {
    type: WINDOW_RESIZE,
    viewportWidth,
    viewportHeight
  }
}

