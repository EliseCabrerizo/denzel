const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Ecabreri:Esilv2019@cluster0-ov6v7.mongodb.net/test?retryWrites=true";
const Express = require("express");
const BodyParser = require("body-parser");



var app = Express();
var database;
var collection;

app.listen(3000, () => {
  MongoClient.connect(uri, { useNewUrlParser: true }, (error, client) => {
      if(error) {
          throw error;
      }
      database = client.db("DenzelFilm");
      collection = database.collection("Films");
      console.log("Connected to DenzelFilm/Films !");
  });
});

app.get('/', (req, res) => {

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Denzel API !</h1>');
  res.end();
});
app.get("/movies/populate", async (request, response) => {
  try {
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies);
    result = {
      "total":movies.length
    }
    response.send(result);
    
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

});
app.get("/movies", (request, response) => {
  collection.find({"metascore" : {$gte :70}}).toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result[Math.floor(Math.random()*result.length)]);
  });
});
app.get("/movies/:id", (request, response) => {
  collection.findOne({ "id": (request.params.id) }, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result);
  });
});
app.get("/movies/search", (request, response) => {
  var limit = (request.query.limit === undefined ? 5 : parseInt(request.query.limit));
  var metascore = (request.query.metascore === undefined ? 0 : parseInt(request.query.metascore));
  collection.find({"metascore": {$gte: metascore}}).limit(limit).toArray((error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.send(result);
  });
});

//curl -X POST -H "Content-Type: application/json" http://localhost:3000/movies/5c868533e72b629f0433421c
app.post("/movies/:id", (request, response) => {
  if(request.body.review === undefined || request.body.date === undefined) {
      return response.status(400).send("You have to specify review and date");
  }
  collection.update({"id": request.params.id}, {$set: {"date": request.body.date, "review": request.body.review}}, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
  });
  collection.findOne({"id": request.params.id}, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      result = {
        "_id": result._id
      };
      response.send(result);
  });
});


app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
