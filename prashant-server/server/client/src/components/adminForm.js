import React from 'react'
import axios from 'axios'
import { FormGroup, Button, FormControl, Alert } from 'react-bootstrap'

import '../styles/adminForm.css'

class AdminForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      dob: '',
      showError: false,
      showSuccess: false
    }

    // defaults for name, email and dob validation. Later, they will be used to make 'Submit' button active and disable.
    this.nameSuccess = false
    this.emailSuccess = false
    this.dobSuccess = false
  }

  // to validate the name while typing on client-side
  validateName () {
    const nameLen = this.state.name.length
    if (nameLen > 2) {
      this.nameSuccess = true
      return 'success'
    } else if (nameLen > 0) {
      this.nameSuccess = false
      return 'error'
    }
    return null
  }

  // to validate email on client-side
  validateEmail () {
    const email = this.state.email
    const emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
    const check = emailRegex.test(email)
    if (check) {
      this.emailSuccess = true
      return 'success'
    } else if (!check && email.length > 1) {
      this.emailSuccess = false
      return 'error'
    }
    return null
  }

  // to validate DOB on client-side
  validateDOB () {
    const dob = this.state.dob
    if (dob) {
      this.dobSuccess = true
      return 'success'
    } else { this.dobSuccess = false }
  }

  // set state of user's full name while input changes
  setNameState = (e) => {
    this.setState({ name: e.target.value })
  }

  // set state of user's email while input changes
  setEmailState = (e) => {
    this.setState({ email: e.target.value })
  }

  // set state of users' DOB while input changes
  setDOBState = (e) => {
    this.setState({ dob: e.target.value })
  }

  // submit user data to '/api/v1/admin'
  submitUser = () => {
    let userData = {
      name: this.state.name,
      email: this.state.email,
      dob: this.state.dob
    }

    axios.post('/api/v1/admin', { userData })
      .then(res => {
        if (res.status === 200) {
          // console.log(res);
          console.log(res.data)
          console.log('request success')
          this.setState({ showSuccess: true })
        }
      }
      )
      .catch(error => {
        console.log(error.response)
        console.log('request failed')
        this.setState({ showError: true })
      })
  }

  /*
  FormGroup, FormControl, Alert are the react-Bootstrap methods for UI
  so that they can be handled easily.
  I tried to write validations for each input, so that no bad input can go to our api.
  I tried to keep the code as simple as possible, that is why I've written all validation functions separately
  from the HTML, so that anyone can understand it clearly and easily.
  */
  render () {
    return (
      <div>
        <h3>Admin Form</h3>
        <br /><br />
        <form noValidate>
          <h4 style={{ textAlign: 'left' }}><b>Name</b></h4>
          <FormGroup
            controlId="formName"
            validationState={this.validateName()}
          >
            <FormControl
              type="text"
              value={this.state.name}
              placeholder="Enter your full name"
              onChange={this.setNameState}
            />
            <FormControl.Feedback />
          </FormGroup>

          <h4 style={{ textAlign: 'left' }}><b>Email Address</b></h4>
          <FormGroup
            controlId="formEmail"
            validationState={this.validateEmail()}
          >
            <FormControl
              type="email"
              value={this.state.email}
              placeholder="Enter your email"
              onChange={this.setEmailState}
            />
            <FormControl.Feedback />
          </FormGroup>

          <h4 style={{ textAlign: 'left' }}><b>Date of Birth</b></h4>
          <FormGroup
            controlId="formDOB"
            validationState={this.validateDOB()}
          >
            <FormControl
              type="date"
              value={this.state.dob}
              onChange={this.setDOBState}
            />
            <FormControl.Feedback />
          </FormGroup>

          {/* disable submit button till all input fields are verified */}
          <Button type="button" onClick={this.submitUser} disabled={!(this.nameSuccess && this.emailSuccess && this.dobSuccess)}
            bsStyle="primary">Submit</Button> &nbsp;
          <Button type="submit" bsStyle="warning">Refresh</Button>
          <br /><br />

          {/* to display success or failure result */}
          {(this.state.showError) ? <Alert bsStyle="danger">
            <strong>Oh man!</strong>   Submission failed. Make sure you enter all details correctly.
          </Alert> : null
          }
          {(this.state.showSuccess) ? <Alert bsStyle="success">
            <strong>Great!</strong>  Your data submitted successfully.
          </Alert> : null
          }

        </form>

      </div>
    )
  }
}

export default AdminForm
