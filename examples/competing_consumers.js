#!/usr/bin/env node --harmony

var csp = require('../src/csp');

var workSize = 100;
var workers = 10;


function* worker(name, number, workChan, resultsChan) {
  while(true) {
    var element = yield csp.take(workChan);
    if (element === csp.CLOSED) {
      resultsChan.close();
      break
    }

    yield csp.put(resultsChan, {name: name, number: number});
  }
}

var resultsChan = csp.chan();

var workChan = csp.operations.fromColl(new Array(workSize));

csp.go(function*() {
  var workerResultsChans = [];
  for (var i = 0; i < workers; i++) {
    var workerResultsChan = csp.chan();
    csp.go(worker, ["worker: " + i, i, workChan, workerResultsChan]);
    workerResultsChans.push(workerResultsChan);
  }

  var mergedWorkerResultsChan = csp.operations.merge(workerResultsChans);

  csp.operations.pipe(mergedWorkerResultsChan, resultsChan);
});

csp.go(function*() {
  var result = yield csp.operations.into([], resultsChan);
  console.log(result);
  console.log(result.length);
});
