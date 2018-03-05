'use strict';

const Influx = require('influx');
const Promise = require('bluebird');
const configFile = require('./config.json');

const influx = new Influx.InfluxDB({
  host: configFile.host,
  database: configFile.dataBase,
});

const t0 = process.hrtime();
let i = 0;
const number = 30;

function createMeasurements() {
  const array = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < 200; i++) {
      const fields = {
        measurement: `test${i}`,
        fields: {
          id: i,
          mulVal: i + 1,
          addVal: i * 1,
        },
      };
      array.push(fields);
    }
    resolve(array);
  })
}

function createDataBase(res) {
  influx.writePoints(res)
    .then(() => {
      const args = [];
      for (let j = 0; j < 100000; j++) {
        const fields = {
          id: (i + 1) * (j + 1),
          mulVal: (i + 1) * (j + 1) * number,
          addVal: (i + 1) * (j + 1) + number,
        }
        args.push(fields);
      }
      console.log(args);
      Promise.map(args, (arg) => {
        res.forEach(element => {
          element.fields.id = arg.id;
          element.fields.mulVal = arg.mulVal;
          element.fields.addVal = arg.addVal;
        });
        return influx.writePoints(res);
      }, { concurrency: 100 })
        .then(() => {
          const end = process.hrtime(t0);
          console.log('Adding took: %ds %dms', end[0], end[1] / 1e6);
        });
    })
    .catch((err) => {
      console.log(err);
    });
}

function readFromDataBase() {
  let queryConstruct = 'test,';

  for (let i = 0; i < 100; i++) {
    if (i !== 99) {
      queryConstruct += `test${i},`
    } else {
      queryConstruct += `test${i}`
    }
  }
  influx.query(`select * from ${queryConstruct}`)
    .then((res) => {
      const end = process.hrtime(t0);
      console.log('Adding took: %ds %dms', end[0], end[1] / 1e6);
    })
}

influx.getDatabaseNames()
  .then(() => {
    readFromDataBase();
    //return createMeasurements();
  })
  .then((res) => {
    //console.log(res);
    //createDataBase(res);
  })
  .catch((err) => {
    console.error('Error creating Influx dataBase!');
  })

