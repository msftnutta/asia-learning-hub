'use strict';

function ok(data) {
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, ...data }),
  };
}

function created(data) {
  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, ...data }),
  };
}

function badRequest(message) {
  return {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: 'BAD_REQUEST', message }),
  };
}

function notFound(message) {
  return {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: 'NOT_FOUND', message }),
  };
}

function unprocessable(message) {
  return {
    status: 422,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: 'UNPROCESSABLE', message }),
  };
}

module.exports = { ok, created, badRequest, notFound, unprocessable };
