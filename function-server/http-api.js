/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const server = require('./server')

const SYSTEM_ERROR = 'SystemError';

module.exports = (fun) => {
    const app = express();

    app.get('/healthz', (req, res) => {
        res.json({});
    });

    app.use(/.*/, bodyParser.json({strict: false}));

    app.post(/.*/, async (req, res) => {
        let output = null
        try {
            output = await fun(req.body)
        } catch (err) {
            if (err['type'] === server.INPUT_ERROR) {
                res.status = 400
            }
            if (err['type'] === server.FUNCTION_ERROR) {
                res.status = 502
            }
            output = err
        }

        res.json(output);
    });

    app.use(function errorHandler (err, req, res, next) {
      if (res.headersSent) {
        return next(err);
      }
      let stacktrace = err.stack.split(/\r?\n/);
      let e = {type: SYSTEM_ERROR, message: err.message, stacktrace: stacktrace};
      res.status(500);
      res.json(e);
    });

    return app;
};
