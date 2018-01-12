/**
 * MiscHTMLStuff.jsx
 *
 * Temporary: Renders all the non-React HTML.
 *
 * @module MiscHTMLStuff
 */
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { TILE_SIZE } from '../segments/view'
import { BUILDING_SPACE } from '../segments/buildings'
import { app } from '../preinit/app_settings'

class MiscHTMLStuff extends React.Component {
  static propTypes = {
    system: PropTypes.object,
    streetWidth: PropTypes.any
  }

  constructor (props) {
    super(props)

    this.state = {
      streetSectionTop: 0,
      streetSectionSkyTop: 0,
      scrollTop: 0,
      streetSectionDirtPos: 0,
      skyTop: 0,
      streetSectionCanvasLeft: 0,
      editableWidth: 0
    }
  }

  componentDidMount () {
    let streetSectionTop = null
    let streetSectionHeight = this.refs.street_section_inner.offsetHeight

    if (this.props.system.viewportHeight - streetSectionHeight > 450) {
      streetSectionTop = ((this.props.system.viewportHeight - streetSectionHeight - 450) / 2) + 450 + 80
    } else {
      streetSectionTop = this.props.system.viewportHeight - streetSectionHeight + 70
    }

    if (app.readOnly) {
      streetSectionTop += 80
    }

    let streetSectionSkyTop = ((streetSectionTop * 0.8) - 255)
    let scrollTop = (streetSectionTop + streetSectionHeight)
    let streetSectionDirtPos = this.props.system.viewportHeight - streetSectionTop - 400 + 180

    let skyTop = streetSectionTop
    if (skyTop < 0) {
      skyTop = 0
    }

    let streetSectionCanvasLeft = 0
    if (this.props.streetWidth) {
      streetSectionCanvasLeft = ((this.props.system.viewportWidth - (this.props.streetWidth * TILE_SIZE)) / 2) - BUILDING_SPACE
    }
    if (streetSectionCanvasLeft < 0) {
      streetSectionCanvasLeft = 0
    }
    const editableWidth = this.props.streetWidth * TILE_SIZE

    this.setState({
      streetSectionTop,
      streetSectionHeight,
      streetSectionSkyTop,
      scrollTop,
      streetSectionDirtPos,
      skyTop,
      streetSectionCanvasLeft,
      editableWidth
    })
  }

  render () {
    return (
      <React.Fragment>
        <section id="street-section-outer">
          <section ref="street_section_inner" id="street-section-inner" style={{top: this.state.streetSectionTop}}>
            <section id="street-section-canvas" style={{left: this.state.streetSectionCanvasLeft}}>
              <section id="street-section-left-building" className="street-section-building">
                <div className="hover-bk" />
              </section>
              <section id="street-section-right-building" className="street-section-building">
                <div className="hover-bk" />
              </section>
              <div id="street-section-editable" />
              <div id="street-section-left-empty-space" className="segment empty" />
              <div id="street-section-right-empty-space" className="segment empty" />
              <section id="street-section-dirt" style={{height: this.state.streetSectionDirtPos}} />
            </section>
          </section>
        </section>
        <section id="street-section-sky" style={{
          top: this.state.streetSectionSkyTop,
          paddingTop: this.state.skyTop,
          marginTop: (-1 * this.state.skyTop)
        }}>
          <div className="rear-clouds" />
          <div className="front-clouds" />
        </section>
        <div id="street-scroll-indicator-left" style={{top: this.state.scrollTop}} />
        <div id="street-scroll-indicator-right" style={{top: this.state.scrollTop}} />
      </React.Fragment>
    )
  }
}

function mapStateToProps (state) {
  return {
    system: state.system,
    streetWidth: state.street.width
  }
}

export default connect(mapStateToProps)(MiscHTMLStuff)
