'use strict';

const Influx = require('influx');
const Promise = require('bluebird');
const configFile = require('./config.json');

const influx = new Influx.InfluxDB({
  host: configFile.host,
  database: configFile.dataBase,
  username: configFile.username,
  password: configFile.password
});

let i = 0;
const number = 30;
function createDataBase() {
  setTimeout(() => {
    influx.writePoints([{
        measurement: 'test',
        fields: {
          id: i, 
          mulVal: i*number,
          addVal: i+number,
        },
      },
    ])
    .then(() => {
      while(true) {
        i = i + 1;
        createDataBase();
      }
    })
    .catch((err) => {
      console.log(err);
    });
  }, 1);
}

influx.getDatabaseNames()
.then((names) => {
  if (!names.includes('test_influx')) {
    return influx.createDatabase('test_influx');
  }
})
.then(() => {
  createDataBase();
})
.catch((err) => {
  console.error('Error creating Influx dataBase!');
})

