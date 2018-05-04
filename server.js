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

app.set('port', process.env.PORT || 3000);
app.locals.title = 'Palette Picker';

// allows server to get parsed json from the body 
app.use(bodyParser.json());


app.use(express.static('public'));

app.get('/', (request, response) => {

});


app.get('/api/v1/projects', (request, response) => {
  database('projects').select()
    .then(projects => {
      response.status(200).json(projects);
    })
    .catch(error => {
      response.status(500).json({error})
    });
});

app.post('/api/v1/projects', (request, response) => {
  const project = request.body;
  if (!project.name) {
    return response
      .status(422)
      .send({error:`Expected fromat: {name: <string>}. You're missing a name property`});
  }

  database('projects').insert(project, 'id')
    .then(project => {
      response.status(201).json({ 
        name: project.name,
        id: project[0]
      })
    })
    .catch(error => {
      response.status(500).json({error});
    });
});

app.get('/api/v1/palettes', (request, response) => {
  database('palettes').select()
    .then(palettes => {
      response.status(200).json(palettes)
    })
    .catch(error => {
      response.status(500).json({error})
    })
});

app.get('api/v1/palettes/:id', (request, response) => {
  database('palettes').where('id', request.params.id).select()
    .then(palette => {
      if (palette.length) {
        request.status(200).json(palette)
      } else {
        request.status(404).json({
          error: `Could not find palette with id ${request.params.id}`
        })
      }
    })
    .catch(error => {
      request.status(500).json({error})
    })
});

app.delete('/api/v1/palettes/:id', (request, response) => {
  database('palettes').where('id', request.params.id).del()
    .then(id => {
      if (id) {
        response.status(204).json({ id })
      } else {
        response.status(404).json({
          error: `Could not find palette with id ${request.params.id}`
        })
      }
    })
    .catch(error => {
      response.status(500).json({ error });
    })
})

app.post('/api/v1/palettes', (request, response) => {
  const usersData = request.body;
  
  for (let requiredParameter of ['name', 'colors', 'project_id']) {
    if(!usersData[requiredParameter]) {
      return response
        .status(422)
        .send({error: `Expected format: { name: <String>, project_id: <number>, colors: <array> }. You're missing a "${requiredParameter}" property.`
      });
    }
  }
  const { name, colors, project_id } = usersData;
  const palette = {
    name,
    color1:colors[0],
    color2:colors[1],
    color3:colors[2],
    color4:colors[3],
    color5:colors[4],
    project_id  
  }

  database('palettes').insert(palette, 'id')
    .then(palette => {
      response.status(201).json({id: palette[0]})
    })
    .catch(error => {
      response.status(500).json({error})
    });
})

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`)
})

module.exports = app