import React from 'react'

class AdminForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      dob: ''
    }
  }

  /*  I even tried to render this small component so that I can understand how a basic component
    will be served on a route on streetmix
  */
  render () {
    return (
      <div>
        <h3>Admin Form</h3>
      </div>
    )
  }
}

export default AdminForm
