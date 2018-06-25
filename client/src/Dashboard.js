import React from "react"
import $ from "jquery"
import './dash.css'; 
class Dashboard extends React.Component{

    constructor(props)
    {
        super(props);
        this.state = {firstName:"FN", headline:"Title",pictureUrl:"picture"};
		console.log("hello");
    }

    componentDidMount(){
        var o = this;
        var uid = this.props.params.uid;
		console.log(uid);
        $.ajax("/profiledata?uid="+ uid).done(function (data) {
           // console.log("data  ", data);
            o.setState(data);
            
        })
    }

    render(){

        return (
           <html>
			<head></head>
			<body className="bo">
			<div className="topnav">
  <a href="#">Home</a>
  <a href="#">About</a>
  <a href="#">Contact Us</a>
</div>
            <div className="cen">
			<img className="imge" src={this.state.pictureUrl} />

                <h1 className="text">Welcome {this.state.firstName} {this.state.lastName}</h1>

                <h2 className="text">{this.state.headline}</h2>

            </div>
			</body>
			</html>
        )
    }
}



export default Dashboard