// this sets up the server using express
const express = require('express');
// this defines the varible app that initials the server with the express varible
const app = express();

const bodyParser = require('body-parser');
// this sets the enviroment pf the code, either it will be the process.env.NODE_ENV, which could be for production or testing or it is a default to the 'development' enviroment
const enviroment = process.env.NODE_ENV || 'development';
// based on the enviroment we will configuration  the database from knexfile.js with the enviroment 
const configuration = require('./knexfile')[enviroment];
// we conncent the database to the knex with the confuguration of the knexfile
const database = require('knex')(configuration);

// sets the app the have a varible of port that is either the devlopement port or  3000 by defualt
app.set('port', process.env.PORT || 3000);

// creates a gobal varible for the app with name of titile the is called 'palette picker'
app.locals.title = 'Palette Picker';

// allows server to get parsed json from the body 
app.use(bodyParser.json());

// allow the base url to use the public assests page, to see the css and website at the '/'
app.use(express.static('public'));

// sets up the base url for the database where all the public information
app.get('/', (request, response) => {

});

// sets up the api endpoint, verson 1 for all of the projects
app.get('/api/v1/projects', (request, response) => {
  // gets into the database and selects all of the the projects at this endpoint
  database('projects').select()
  // after it selects all the projects 
    .then(projects => {
    // it sends a resopnse object with the status of 200, telling the user it was sucessful and sendinging all the projects in a json object
      response.status(200).json(projects);
    })
    // if something goes wrong in the resonse, it is placed in the catch 
    .catch(error => {
      // the response object sends a 500 error letting the user know that something went wrong with the server and sends the whole message in a json object
      response.status(500).json({error})
    });
});

// app end point uses the verb of post for creating a new endpoint at the api/verson 1/ to all the projects
app.post('/api/v1/projects', (request, response) => {
  // the projec that is sent in the request body is pulled out and saved as a varible
  const project = request.body;
  // this checks to see if project object sent was sent with the right parms of name in the object
  if (!project.name) {
    return response
    // if it is sent without this information the response object sends a 422 status, letting the user know that they made a mistake in the request
      .status(422)
      // it also sends in the response object the error object that tells the user what they were missing
      .send({error:`Expected fromat: {name: <string>}. You're missing a name property`});
  }

  // the project object is inserted into the database of all projects and the 'id' tells the database to create an new id for the porject
  database('projects').insert(project, 'id')
    // after the project is inserted to the database the project object is returned
    .then(project => {
      // the response object sends a status of 201 letting the user know if was sucessfully added to the database
      response.status(201).json({
       // with a json object that holds the property of name and the id it was given
        name: project.name,
        id: project[0]
      })
    })
    // if something goes wrong with the server
    .catch(error => {
      // an response obeject is sent with 500 letting the user know that something went wrong with the server and sends and json object with an error 
      response.status(500).json({error});
    });
});

// sets us an endpoint in the api for all the palettes
app.get('/api/v1/palettes', (request, response) => {
  // it gets in the database and selects all of the palettes
  database('palettes').select()
    // once it gets all of the palettes
    .then(palettes => {
      // it sends back a resonse object with an sucess status of 200 and all the palettes in an json object
      response.status(200).json(palettes)
    })
    // if something goes wrong with the server it sends a status of 500 and a json object with the error message
    .catch(error => {
      response.status(500).json({error})
    })
});

// creates an endpoint in the api for palettes with specfic ids
app.get('api/v1/palettes/:id', (request, response) => {
  // it looks into the database at all of the palettes and finds the id that was passed in the request params the match an id in the database and selects it
  database('palettes').where('id', request.params.id).select()
  // it sends back any array with the palette
    .then(palette => {
      // if the palettes array has length, meaning it found it
      if (palette.length) {
        // send back a status of 200 and the json object of the palette that was requested
        request.status(200).json(palette)
      } else {
        // if it does not have length meaning that the palette did not exist it sends a 404 letting the user know that the id passed in did not match the ids in the database with an error message
        request.status(404).json({
          error: `Could not find palette with id ${request.params.id}`
        })
      }
    })
    // if something goes wrong with the server sends back an error object and a status of 500 letting the user know something happpend on the server side.
    .catch(error => {
      request.status(500).json({error})
    })
});


// end point for removing an specfic palettes with a specfic id
app.delete('/api/v1/palettes/:id', (request, response) => {
  // looks in the all the palettes database and finds the palette that matches the id to the id that was passed into the request object and deletes it
  database('palettes').where('id', request.params.id).del()
    .then(id => {
      // if the id was a match the resonse object was sent with a status of 204 and sent with the json object with the id
      if (id) {
        response.status(204).json({ id })
      } else {
        // if the database could not find a id that matches it sends a 404 message with the error
        response.status(404).json({
          error: `Could not find palette with id ${request.params.id}`
        })
      }
    })
    // if something goes wrong with the server if send a response with the status of 500 and the json error object
    .catch(error => {
      response.status(500).json({ error });
    })
})

// create a endpoint to post new palettes to the database
app.post('/api/v1/palettes', (request, response) => {
  // from the request object that was sent it gets the  body object
  const usersData = request.body;
  
  for (let requiredParameter of ['name', 'colors', 'project_id']) {
    // it sets a varible of requires params from the body object that needs to be sent with the resonse
    if(!usersData[requiredParameter]) {
      // if it is missing a required param
      return response
      // sends a 422 status letting the user that they forgot to send something
        .status(422)
        // with an error object letting the user know what the excepted format was and what was missing
        .send({error: `Expected format: { name: <String>, project_id: <number>, colors: <array> }. You're missing a "${requiredParameter}" property.`
      });
    }
  }

  // it gets the varibles from the resonse object
  const { name, colors, project_id } = usersData;
  // creates an new object with theses varbles for the layout of the database
  const palette = {
    name,
    color1:colors[0],
    color2:colors[1],
    color3:colors[2],
    color4:colors[3],
    color5:colors[4],
    project_id  
  }

  // in the database of palettes it inserts the new palette object and lets the database know that it needs a specfic id
  database('palettes').insert(palette, 'id')
    .then(palette => {
      // it sends back the palette object and sends the 201 success added to database and the id back
      response.status(201).json({id: palette[0]})
    })
    // if something goes worng with the server and 500 status is sent with the error object
    .catch(error => {
      response.status(500).json({error})
    });
})

// tells the app to listen and get all of the information for the dynamtic port eiter on the defualt of 3000 or the enviroment
app.listen(app.get('port'), () => {
  // puts a console log to let user know it is runnning
  console.log(`${app.locals.title} is running on ${app.get('port')}.`)
})

module.exports = app