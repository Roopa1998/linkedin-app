var express = require('express')
var app = express()
var fs = require('fs');
var ejs=require('ejs');
var http = require('https');
const path = require("path");
var querystring = require('querystring');
var OauthParams = require('./OauthParams');
var Mongodb = require("mongodb");
var MongoClient = Mongodb.MongoClient
    , assert = require('assert');

var port = process.env.PORT || 5000;
// DB Connection URL
var url = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';

/**
 * Routes handling
 *
 */
/**
 * Handshake with linkedin API once the redirect URI is called by linkedin to provide the client secret and other required details
 * @param code
 * @param ores
 */
function handshake(code, ores) {

    //required post parameters
    var data = querystring.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: OauthParams.redirect_uri,//the same as in Linkedin application setup
        client_id: OauthParams.client_id,
        client_secret: OauthParams.client_secret
    });

    var options = {
        host: 'www.linkedin.com',
        path: '/oauth/v2/accessToken',
        protocol: 'https:',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    console.log(options);
    var req = http.request(options, function (res) {
         var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;

        });
        res.on('end', function () {
            //once the access token is received store in DB
            insertTodb(JSON.parse(data), function (id) {
				console.log("handshake");
				console.log(id);
				var rd='/dashboard/'+id;
                ores.redirect(rd);
            });
        });
        req.on('error', function (e) {
            console.log("problem with request: " + e.message);
        });

    });
    req.write(data);
    req.end();


}
/**
 *
 * Get data from linkedin api for the access token
 *
 * @param uid
 * @param callback
 */
function getData(uid, callback) {

    findfromdb(uid, function (obj) {
        var options = {
            host: 'api.linkedin.com',
            path: '/v1/people/~:(id,first-name,last-name,headline,picture-url,location,industry,current-share,num-connections,summary,specialties,positions)?format=json',
            protocol: 'https:',
            method: 'GET',
            headers: {
                "Authorization": 'Bearer ' + obj.access_token

            }
        };
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                console.log('PROFILE DATA  ', chunk);
                data += chunk;


            });
            res.on('end', function () {
                callback(JSON.parse(data));
                console.log('No more data in response.');
            });
            req.on('error', function (e) {
                console.log("problem with request: " + e.message);
            });

        });
        req.end();


    });


}


/**
 *
 * Insert the token received from linkedin API to DB and return the unique identifier for this record
 * @param token
 * @param callback
 */
function insertTodb(token, callback) {
    console.log("token", token)
    MongoClient.connect(url, function (err, db) {
        var collection = db.collection('documents');
        collection.insertOne(
            token
            , function (err, result) {
                 console.log("Inserted " +  result.result.n + " documents into the collection ", result.ops[0]._id);
                callback(result.ops[0]._id);

            });

    });
}
/**
 * Find the access token from the DB for the id
 * @param uid
 * @param callback
 */
function findfromdb(uid, callback) {

    MongoClient.connect(url, function (err, db) {

        db.collection('documents').find({_id: Mongodb.ObjectID(uid)}).toArray(function (err, result) {

            var record = result[0];
            console.log("Record  ", record);
            callback(record);
        });
    });
}


app.get('/profiledata', function (req, res) {
    console.log("profiledata ", req.query);
    getData(req.query.uid, function (record) {
        res.send(record);
    });

})


app.get('/auth/linkedin/redirect', function (req, res) {
    // This is the redirect URI which linkedin will call to and provide state and code to verify
    /**
     *
     * Attached to the redirect_uri will be two important URL arguments that you need to read from the request:
     code — The OAuth 2.0 authorization code.
     state — A value used to test for possible CSRF attacks.
     */
	 
    console.log("auth route - Request object received from Linkedin", req.query);

    var error = req.query.error;
    var error_description = req.query.error_description;
    var state = req.query.state;
    var code = req.query.code;
    if (error) {
        next(new Error(error));
    }
    /**
     *
     * The code is a value that you will exchange with LinkedIn for an actual OAuth 2.0 access
     * token in the next step of the authentcation process.  For security reasons, the authorization code
     * has a very short lifespan and must be used within moments of receiving it - before it expires and
     * you need to repeat all of the previous steps to request another.
     */
    //once the code is received handshake back with linkedin to send over the secret key
    handshake(req.query.code, res);
})


app.use(function (err, req, res, next) {
    res.status(401).send(err);

});

  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
  // Handle React routing, return all requests to React app
 app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

app.listen(port, function () {
    console.log('Example app listening on '+port)
})