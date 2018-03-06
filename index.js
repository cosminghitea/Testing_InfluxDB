'use strict';

const Influx = require('influx');
const Promise = require('bluebird');
const configFile = require('./config.json');

const influx = new Influx.InfluxDB({
  host: configFile.host,
  database: configFile.dataBase,
  username: configFile.username,
  password: configFile.password,
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
      for (let j = 0; j < 1; j++) {
        const fields = {
          id: (i + 1) * (j + 1),
          mulVal: (i + 1) * (j + 1) * number,
          addVal: (i + 1) * (j + 1) + number,
        }
        args.push(fields);
      }
      Promise.map(args, (arg) => {
        res.forEach(element => {
          element.fields.id = arg.id;
          element.fields.mulVal = arg.mulVal;
          element.fields.addVal = arg.addVal;
        });
        return influx.writePoints(res);
      }, { concurrency: 4 })
        .then(() => {
          return new Promise((resolve) => {
            if (someValue < 1000000) {
              setTimeout(() => {
                createDataBase(res);
                resolve();
              }, 10000);
            }
          });
        })
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

function deleteDataBase() {
  let queryConstruct = 'test,';

  for (let i = 0; i < 200; i++) {
    influx.dropMeasurement(`test${i}`)
  }

}

let someValue = 0;

function addValueMeasurePulse() {
  const res = {
    measurement: `test`,
    fields: {
      id: 1,
      mulVal: 1 + 1,
      addVal: 1 * 1,
    },
  }
  influx.writePoints([res])
    .then(() => {
      const args = [];
      for (let j = 0; j < 10; j++) {
        const fields = {
          id: (i + 1) * (j + 1),
          mulVal: (i + 1) * (j + 1) * number,
          addVal: (i + 1) * (j + 1) + number,
        }
        args.push(fields);
      }
      Promise.map(args, (arg) => {
        res.fields.id = arg.id;
        res.fields.mulVal = arg.mulVal;
        res.fields.addVal = arg.addVal;
        return influx.writePoints([res]);
      }, { concurrency: 10 })
        .then(() => {
          return new Promise((resolve) => {
            if (someValue < 1000000) {
              setTimeout(() => {
                addValueMeasurePulse();
                resolve();
              }, 1000);
            }
          });
        })
        .then(() => {
          const end = process.hrtime(t0);
          console.log('Adding took: %ds %dms', end[0], end[1] / 1e6);
        });
    })
    .catch((err) => {
      console.log(err);
    });
}

function createMeasureWith200Fields(value) {
  const res = {
    measurement: '200Fields',
    fields: {},
  };

  for (let i = 0; i < 200; i++) {
    res.fields[`field${i}`] = i + value;
  }

  influx.writePoints([res])
    .then(() => {
      return new Promise((resolve) => {
        if (someValue < 1000000) {
          setTimeout(() => {
            createMeasureWith200Fields(value = value + 1);
            resolve();
          }, 1000);
        }
      });
    })
    .then(() => {
      const end = process.hrtime(t0);
      console.log('Adding took: %ds %dms', end[0], end[1] / 1e6);
    });
}


influx.getDatabaseNames()
  .then(() => {
    createMeasureWith200Fields(10);
    //addValueMeasurePulse();
    //deleteDataBase();
    //readFromDataBase();
    //return createMeasurements();
  })
  .then((res) => {
    //console.log(res);
    //createDataBase(res);
  })
  .catch((err) => {
    console.log(err);
    console.error('Error creating Influx dataBase!');
  })

