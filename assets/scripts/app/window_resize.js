import { infoBubble } from '../info_bubble/info_bubble'
import { system } from '../preinit/system_capabilities'
import {
  BUILDING_SPACE,
  updateBuildingPosition,
  createBuildings
} from '../segments/buildings'
import store from '../store'
import {
  windowResize
} from '../store/actions/system'

let streetSectionCanvasLeft

export function getStreetSectionCanvasLeft () {
  return streetSectionCanvasLeft
}

let streetSectionTop

export function getStreetSectionTop () {
  return streetSectionTop
}

export function onResize () {

  store.dispatch(windowResize(window.innerWidth, window.innerHeight))

  //TODO remove global system and rely on Redux 
  system.viewportWidth = window.innerWidth
  system.viewportHeight = window.innerHeight

  infoBubble.show(true)

  updateBuildingPosition()
  // TODO hack
  createBuildings()
}
