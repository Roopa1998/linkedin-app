import React, { Component } from 'react';
import './App.css';

class App extends Component {
    render() {
		
        const authurl = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=7834exk3mi0k5b&redirect_uri=https://linkedin-app2.herokuapp.com/auth/linkedin/redirect&state=2522abcde12345&scope=r_basicprofile";
        return (
            <div className="App">
                <a className="imag" href={authurl}><img className="image" src="signin.png" alt="Sign in with Linkedin"/></a>
            </div>
        );
    }
}

export default App;
