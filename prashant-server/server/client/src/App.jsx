import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Route, Redirect } from 'react-router-dom'

import AdminForm from './components/adminForm'
// import AdminForm from './components/testComp';
import Home from './components/home'
import './styles/App.css'

class App extends Component {
  render () {
    return (
      <Router>
        <div className="App">
          <nav>
            <li>
              <Link exact to="/home">Home</Link>
            </li>
            <li>
              <Link exact to="/admin">Admin</Link>
            </li>
          </nav>
          <Route exact path="/" render={() => (
            <Redirect to="/home" />
          )} />

          <Route path="/home" component={Home} />
          <Route path="/admin" component={AdminForm} />
        </div>
      </Router>
    )
  }
}

export default App
