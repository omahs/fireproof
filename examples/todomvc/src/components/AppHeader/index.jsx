import React from 'react'
import './AppHeader.css' // eslint-disable-line
/**
 * AppHeader component
 * @param {Object} props
 * @returns {React.Component}
 */
const AppHeader = (props) => {
  return (
    <header className='app-header'>
      <div className='app-title-wrapper'>
        <div className='app-title-wrapper'>
          <div className='app-left-nav'>
            <div className='app-title-text'>
              <h1 className='app-title'>TodoMVC</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
