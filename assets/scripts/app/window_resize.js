import { infoBubble } from '../info_bubble/info_bubble'
import { system } from '../preinit/system_capabilities'
import {
  updateBuildingPosition,
  createBuildings
} from '../segments/buildings'
import store from '../store'
import {
  windowResize
} from '../store/actions/system'

// TODO move this to Redux
let streetSectionCanvasLeft

export function getStreetSectionCanvasLeft () {
  return streetSectionCanvasLeft
}

// TODO move this to Redux
let streetSectionTop

export function getStreetSectionTop () {
  return streetSectionTop
}

export function onResize () {
  store.dispatch(windowResize(window.innerWidth, window.innerHeight))

  // TODO remove global system and rely on Redux
  system.viewportWidth = window.innerWidth
  system.viewportHeight = window.innerHeight

  infoBubble.show(true)

  updateBuildingPosition()
  // TODO hack
  createBuildings()
}
